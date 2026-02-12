'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Mail,
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  Users,
  FileText,
  Clock,
  Loader2,
  Ban,
  Eye,
  Edit2,
  X,
} from 'lucide-react'
import { useTranslation } from '@/lib/translations'

// =======================================
// Types
// =======================================
type BulkEmailTabProps = {
  companies: Array<{
    id: string
    companyName: string
    contactMethod: string
    phone: string
    region: string
    regionKo: string
    office: string
    status: string
    systemInUse: string
    contactHistory: Array<{ date: string; dateStr: string }>
  }>
  blacklist: Array<{ companyId: string; companyName: string; email: string }>
  onEmailSent: (sentCompanies: Array<{
    companyId: string
    companyName: string
    contactDate: string
    contactType: string
  }>) => void
  locale: 'ja' | 'ko'
}

type EmailTemplate = {
  id: string
  name: string
  contactRound: number
  subject: string
  bodyHtml: string
  bodyText: string
  isActive: boolean
}

type EmailStats = {
  today: number
  dailyLimit: number
  remainingToday: number
}

type SendResult = {
  companyId: string
  companyName: string
  status: 'SENT' | 'FAILED' | 'BOUNCED' | 'NO_TEMPLATE' | 'NO_EMAIL'
  error?: string
}

type SendSummary = {
  total: number
  sent: number
  failed: number
  bounced: number
  skipped: number
  blacklisted: number
}

// =======================================
// Helpers
// =======================================
const STATUS_LABELS: { [key: string]: { ja: string; ko: string } } = {
  '未交渉': { ja: '未交渉', ko: '미교섭' },
  '連絡中': { ja: '連絡中', ko: '연락 중' },
  '商談中': { ja: '商談中', ko: '상담 중' },
  '見積提出': { ja: '見積提出', ko: '견적 제출' },
  '成約': { ja: '成約', ko: '성약' },
  '失注': { ja: '失注', ko: '실주' },
  '保留': { ja: '保留', ko: '보류' },
  'unknown': { ja: '不明', ko: '불명' },
}

function hasEmail(contactMethod: string): boolean {
  return contactMethod.includes('@')
}

function getRound(historyLength: number): number {
  return Math.min(historyLength + 1, 5)
}

function getRoundLabel(round: number, locale: 'ja' | 'ko'): string {
  if (locale === 'ja') {
    return round >= 5 ? '5回目以上' : `${round}回目`
  }
  return round >= 5 ? '5회차 이상' : `${round}회차`
}

// =======================================
// Component
// =======================================
export default function BulkEmailTab({
  companies,
  blacklist,
  onEmailSent,
  locale,
}: BulkEmailTabProps) {
  const { t } = useTranslation()

  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roundFilter, setRoundFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [emailOnlyFilter, setEmailOnlyFilter] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Step 2: Template state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [activeRoundTab, setActiveRoundTab] = useState(1)
  const [editOverrides, setEditOverrides] = useState<{
    [round: number]: { subject: string; bodyText: string }
  }>({})
  const [editingRound, setEditingRound] = useState<number | null>(null)

  // Step 3: Send state
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null)
  const [sendSummary, setSendSummary] = useState<SendSummary | null>(null)

  // Blacklist lookup
  const blacklistSet = useMemo(
    () => new Set(blacklist.map((b) => b.companyId)),
    [blacklist]
  )

  // Unique statuses and regions for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(companies.map((c) => c.status))
    return Array.from(statuses).sort()
  }, [companies])

  const uniqueRegions = useMemo(() => {
    const regions = new Map<string, string>()
    companies.forEach((c) => {
      if (!regions.has(c.region)) {
        regions.set(c.region, locale === 'ko' ? c.regionKo : c.region)
      }
    })
    return Array.from(regions.entries())
  }, [companies, locale])

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (roundFilter !== 'all') {
        const round = c.contactHistory.length
        if (roundFilter === '5+') {
          if (round < 5) return false
        } else {
          if (round !== parseInt(roundFilter)) return false
        }
      }
      if (regionFilter !== 'all' && c.region !== regionFilter) return false
      if (emailOnlyFilter && !hasEmail(c.contactMethod)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !c.companyName.toLowerCase().includes(q) &&
          !c.contactMethod.toLowerCase().includes(q) &&
          !c.region.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [companies, statusFilter, roundFilter, regionFilter, emailOnlyFilter, searchQuery])

  // Selected companies detail
  const selectedCompanies = useMemo(() => {
    return companies.filter((c) => selectedIds.has(c.id))
  }, [companies, selectedIds])

  // Round distribution of selected companies
  const roundDistribution = useMemo(() => {
    const dist: { [round: number]: number } = {}
    selectedCompanies.forEach((c) => {
      const round = getRound(c.contactHistory.length)
      dist[round] = (dist[round] || 0) + 1
    })
    return dist
  }, [selectedCompanies])

  // Rounds that have selected companies
  const activeRounds = useMemo(() => {
    return Object.keys(roundDistribution)
      .map(Number)
      .sort((a, b) => a - b)
  }, [roundDistribution])

  // Load templates when entering step 2
  useEffect(() => {
    if (step === 2) {
      loadTemplates()
    }
  }, [step])

  // Load stats when entering step 3
  useEffect(() => {
    if (step === 3) {
      loadStats()
    }
  }, [step])

  // Set initial active round tab when entering step 2
  useEffect(() => {
    if (step === 2 && activeRounds.length > 0) {
      setActiveRoundTab(activeRounds[0])
    }
  }, [step, activeRounds])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/email-templates')
      const data = await res.json()
      if (data.success) {
        setTemplates(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/email-logs?type=stats')
      const data = await res.json()
      if (data.success) {
        setStats({
          today: data.data.today,
          dailyLimit: data.data.dailyLimit,
          remainingToday: data.data.remainingToday,
        })
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const ids = filteredCompanies
      .filter((c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id))
      .map((c) => c.id)
    setSelectedIds(new Set(ids))
  }, [filteredCompanies, blacklistSet])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Get template for a round
  const getTemplateForRound = (round: number) => {
    return templates.find((t) => t.contactRound === round && t.isActive)
  }

  // Replace template variables with sample data
  const replaceVars = (text: string, company: typeof companies[0]) => {
    return text
      .replace(/\{\{会社名\}\}/g, company.companyName)
      .replace(/\{\{companyName\}\}/g, company.companyName)
      .replace(/\{\{地域\}\}/g, company.region)
      .replace(/\{\{region\}\}/g, company.region)
      .replace(/\{\{電話\}\}/g, company.phone)
      .replace(/\{\{phone\}\}/g, company.phone)
      .replace(/\{\{メール\}\}/g, company.contactMethod)
      .replace(/\{\{email\}\}/g, company.contactMethod)
      .replace(/\{\{システム\}\}/g, company.systemInUse)
      .replace(/\{\{systemInUse\}\}/g, company.systemInUse)
  }

  // Get override or template text for a round
  const getSubjectForRound = (round: number): string => {
    if (editOverrides[round]?.subject) return editOverrides[round].subject
    const tpl = getTemplateForRound(round)
    return tpl?.subject || ''
  }

  const getBodyForRound = (round: number): string => {
    if (editOverrides[round]?.bodyText) return editOverrides[round].bodyText
    const tpl = getTemplateForRound(round)
    return tpl?.bodyText || ''
  }

  // Handle send
  const handleSend = async () => {
    setShowConfirmModal(false)
    setIsSending(true)
    setSendProgress(0)
    setSendResults(null)
    setSendSummary(null)

    const companiesPayload = selectedCompanies
      .filter((c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id))
      .map((c) => ({
        companyId: c.id,
        companyName: c.companyName,
        recipientEmail: c.contactMethod,
        contactRound: getRound(c.contactHistory.length),
        region: c.region,
        office: c.office,
        phone: c.phone,
        systemInUse: c.systemInUse,
      }))

    // Build custom overrides from edits
    const customOverrides: { [round: number]: { subject?: string; bodyText?: string } } = {}
    Object.entries(editOverrides).forEach(([round, override]) => {
      if (override.subject || override.bodyText) {
        customOverrides[parseInt(round)] = override
      }
    })

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSendProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)

      const res = await fetch('/api/email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: companiesPayload,
          customOverrides: Object.keys(customOverrides).length > 0 ? customOverrides : undefined,
        }),
      })

      clearInterval(progressInterval)
      setSendProgress(100)

      const data = await res.json()

      if (data.success) {
        setSendResults(data.data.results)
        setSendSummary(data.data.summary)

        // Call parent callback with sent companies
        if (data.data.sentCompanies && data.data.sentCompanies.length > 0) {
          onEmailSent(data.data.sentCompanies)
        }
      } else {
        setSendResults([])
        setSendSummary({
          total: companiesPayload.length,
          sent: 0,
          failed: companiesPayload.length,
          bounced: 0,
          skipped: 0,
          blacklisted: 0,
        })
      }
    } catch (err) {
      console.error('Send error:', err)
      setSendResults([])
      setSendSummary({
        total: companiesPayload.length,
        sent: 0,
        failed: companiesPayload.length,
        bounced: 0,
        skipped: 0,
        blacklisted: 0,
      })
    } finally {
      setIsSending(false)
    }
  }

  // Calculate estimated send time
  const estimatedMinutes = useMemo(() => {
    const count = selectedCompanies.filter(
      (c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id)
    ).length
    // ~30 seconds per email average
    return Math.ceil((count * 30) / 60)
  }, [selectedCompanies, blacklistSet])

  // =======================================
  // Render: Step Indicator
  // =======================================
  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: t.selectRecipients, icon: Users },
      { num: 2, label: t.templatePreview, icon: FileText },
      { num: 3, label: t.confirmSend, icon: Send },
    ]

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => {
          const StepIcon = s.icon
          const isActive = step === s.num
          const isComplete = step > s.num
          return (
            <div key={s.num} className="flex items-center">
              {i > 0 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    isComplete ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isComplete
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:inline ${
                    isActive ? 'text-blue-600' : isComplete ? 'text-blue-500' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // =======================================
  // Render: Step 1 - Company Selection
  // =======================================
  const renderStep1 = () => {
    const validSelectedCount = selectedCompanies.filter(
      (c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id)
    ).length

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'ja' ? 'フィルター' : '필터'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative col-span-2 md:col-span-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={locale === 'ja' ? '検索...' : '검색...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">{t.status}: {t.all}</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]?.[locale] || s}
                  </option>
                ))}
              </select>

              {/* Round filter */}
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">{t.contactRound}: {t.all}</option>
                <option value="0">0{locale === 'ja' ? '回' : '회'}</option>
                <option value="1">1{locale === 'ja' ? '回' : '회'}</option>
                <option value="2">2{locale === 'ja' ? '回' : '회'}</option>
                <option value="3">3{locale === 'ja' ? '回' : '회'}</option>
                <option value="4">4{locale === 'ja' ? '回' : '회'}</option>
                <option value="5+">5+{locale === 'ja' ? '回' : '회'}</option>
              </select>

              {/* Region filter */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">
                  {locale === 'ja' ? '地域' : '지역'}: {t.all}
                </option>
                {uniqueRegions.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Email only toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={emailOnlyFilter}
                  onChange={(e) => setEmailOnlyFilter(e.target.checked)}
                  className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-gray-400" />
                {t.emailOnly}
              </label>
            </div>
          </div>
        </div>

        {/* Selection controls and stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-sm px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {t.selectAll}
            </button>
            <button
              onClick={deselectAll}
              className="text-sm px-3 py-1.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t.deselectAll}
            </button>
            <span className="text-sm text-gray-500">
              {filteredCompanies.length}{t.companies}
              {locale === 'ja' ? '表示中' : ' 표시 중'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-600">
              {t.selectedCompanies}: {validSelectedCount}{t.companies}
            </span>
            {validSelectedCount > 0 && (
              <span className="text-xs text-gray-500">
                ({Object.entries(roundDistribution)
                  .map(([r, c]) => `${getRoundLabel(Number(r), locale)}: ${c}${t.companies}`)
                  .join(', ')})
              </span>
            )}
          </div>
        </div>

        {/* Company list */}
        <div className="card">
          <div className="card-body p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredCompanies.length > 0 &&
                          filteredCompanies
                            .filter((c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id))
                            .every((c) => selectedIds.has(c.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) selectAll()
                          else deselectAll()
                        }}
                        className="w-4 h-4 text-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">
                      {locale === 'ja' ? '会社名' : '업체명'}
                    </th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">
                      {locale === 'ja' ? '連絡先' : '연락처'}
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">
                      {locale === 'ja' ? '地域' : '지역'}
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">
                      {t.status}
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">
                      {t.contactRound}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCompanies.map((company) => {
                    const isBlacklisted = blacklistSet.has(company.id)
                    const hasValidEmail = hasEmail(company.contactMethod)
                    const isDisabled = isBlacklisted || !hasValidEmail
                    const isSelected = selectedIds.has(company.id)
                    const contactCount = company.contactHistory.length

                    return (
                      <tr
                        key={company.id}
                        className={`transition-colors ${
                          isBlacklisted
                            ? 'bg-red-50/50'
                            : !hasValidEmail
                            ? 'bg-gray-50/50'
                            : isSelected
                            ? 'bg-blue-50/30'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleSelect(company.id)}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded disabled:opacity-40"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-sm font-medium ${
                                isBlacklisted
                                  ? 'text-red-500 line-through'
                                  : !hasValidEmail
                                  ? 'text-gray-400'
                                  : 'text-gray-900'
                              }`}
                            >
                              {company.companyName}
                            </span>
                            {isBlacklisted && (
                              <Ban className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-sm ${
                              hasValidEmail ? 'text-gray-700' : 'text-gray-400 italic'
                            }`}
                          >
                            {hasValidEmail ? (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-blue-400" />
                                {company.contactMethod}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-gray-300" />
                                {t.noEmail}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-xs text-gray-600">
                            {locale === 'ko' ? company.regionKo : company.region}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {STATUS_LABELS[company.status]?.[locale] || company.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              contactCount === 0
                                ? 'bg-green-50 text-green-600'
                                : contactCount <= 2
                                ? 'bg-blue-50 text-blue-600'
                                : contactCount <= 4
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {contactCount}{locale === 'ja' ? '回' : '회'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                        {locale === 'ja' ? '条件に一致する企業はありません' : '조건에 맞는 업체가 없습니다'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =======================================
  // Render: Step 2 - Template Preview
  // =======================================
  const renderStep2 = () => {
    if (templatesLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-500">{t.loading}</span>
        </div>
      )
    }

    const sampleCompany = selectedCompanies[0]

    return (
      <div className="space-y-4">
        {/* Round distribution summary */}
        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {locale === 'ja' ? '回次別送信内訳' : '회차별 발송 내역'}
            </h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(roundDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([round, count]) => (
                  <div
                    key={round}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-blue-700">
                      {getRoundLabel(Number(round), locale)}
                    </span>
                    <span className="text-sm text-blue-600 font-bold">
                      {count}{t.companies}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Round tabs */}
        <div className="card">
          <div className="card-header border-b border-gray-200">
            <div className="flex items-center gap-1">
              {activeRounds.map((round) => (
                <button
                  key={round}
                  onClick={() => setActiveRoundTab(round)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeRoundTab === round
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {getRoundLabel(round, locale)}
                  <span className="ml-1 text-xs opacity-75">
                    ({roundDistribution[round] || 0})
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {(() => {
              const template = getTemplateForRound(activeRoundTab)
              const override = editOverrides[activeRoundTab]
              const currentSubject = override?.subject || template?.subject || ''
              const currentBody = override?.bodyText || template?.bodyText || ''
              const isEditing = editingRound === activeRoundTab

              if (!template && !override) {
                return (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t.noTemplate}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {locale === 'ja'
                        ? `${getRoundLabel(activeRoundTab, locale)}のテンプレートが設定されていません`
                        : `${getRoundLabel(activeRoundTab, locale)} 템플릿이 설정되어 있지 않습니다`}
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {/* Header with edit toggle */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      {isEditing ? (
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                      {isEditing
                        ? (locale === 'ja' ? '編集モード (今回のみ)' : '편집 모드 (이번만)')
                        : (locale === 'ja' ? 'プレビュー' : '미리보기')}
                    </h4>
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingRound(null)
                        } else {
                          setEditingRound(activeRoundTab)
                        }
                      }}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        isEditing
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {isEditing
                        ? (locale === 'ja' ? 'プレビューに戻る' : '미리보기로 돌아가기')
                        : (locale === 'ja' ? '編集する' : '편집하기')}
                    </button>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                      {t.mailSubject}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentSubject}
                        onChange={(e) =>
                          setEditOverrides((prev) => ({
                            ...prev,
                            [activeRoundTab]: {
                              ...prev[activeRoundTab],
                              subject: e.target.value,
                              bodyText: prev[activeRoundTab]?.bodyText || template?.bodyText || '',
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-800 font-medium">
                        {sampleCompany ? replaceVars(currentSubject, sampleCompany) : currentSubject}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                      {t.mailBody}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={currentBody}
                        onChange={(e) =>
                          setEditOverrides((prev) => ({
                            ...prev,
                            [activeRoundTab]: {
                              ...prev[activeRoundTab],
                              subject: prev[activeRoundTab]?.subject || template?.subject || '',
                              bodyText: e.target.value,
                            },
                          }))
                        }
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed">
                        {sampleCompany ? replaceVars(currentBody, sampleCompany) : currentBody}
                      </div>
                    )}
                  </div>

                  {/* Variable guide */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 mb-1">
                      {t.variableGuide}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        '{{会社名}}',
                        '{{地域}}',
                        '{{電話}}',
                        '{{メール}}',
                        '{{システム}}',
                      ].map((v) => (
                        <code
                          key={v}
                          className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>

                  {sampleCompany && (
                    <p className="text-xs text-gray-400">
                      {locale === 'ja'
                        ? `※ プレビューは「${sampleCompany.companyName}」のデータで表示`
                        : `※ 미리보기는 "${sampleCompany.companyName}" 데이터로 표시`}
                    </p>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    )
  }

  // =======================================
  // Render: Step 3 - Send Confirmation
  // =======================================
  const renderStep3 = () => {
    const validSelected = selectedCompanies.filter(
      (c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id)
    )

    // If sending is complete, show results
    if (sendResults && sendSummary) {
      return renderSendResults()
    }

    // If currently sending
    if (isSending) {
      return (
        <div className="card">
          <div className="card-body py-12">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.sending}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {locale === 'ja'
                  ? 'メール送信処理中です。このページを閉じないでください。'
                  : '메일 발송 처리 중입니다. 이 페이지를 닫지 마세요.'}
              </p>
              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(sendProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {Math.round(sendProgress)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Send summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              {t.confirmSend}
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Total */}
              <div className="stat-card">
                <p className="stat-label">{locale === 'ja' ? '送信対象' : '발송 대상'}</p>
                <p className="stat-value text-blue-600">
                  {validSelected.length}
                  <span className="text-sm font-normal text-gray-400 ml-1">{t.companies}</span>
                </p>
              </div>

              {/* Remaining quota */}
              <div className="stat-card">
                <p className="stat-label">{t.remainingToday}</p>
                <p className={`stat-value ${
                  stats && stats.remainingToday < validSelected.length
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {statsLoading ? (
                    <span className="text-gray-400">--</span>
                  ) : stats ? (
                    <>
                      {stats.remainingToday}
                      <span className="text-sm font-normal text-gray-400 ml-1">
                        / {stats.dailyLimit}{t.emails}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </p>
              </div>

              {/* Estimated time */}
              <div className="stat-card">
                <p className="stat-label">{t.estimatedTime}</p>
                <p className="stat-value text-gray-700">
                  ~{estimatedMinutes}
                  <span className="text-sm font-normal text-gray-400 ml-1">{t.minutes}</span>
                </p>
              </div>

              {/* Blacklisted */}
              <div className="stat-card">
                <p className="stat-label">{t.blacklisted}</p>
                <p className="stat-value text-red-500">
                  {selectedCompanies.length - validSelected.length}
                  <span className="text-sm font-normal text-gray-400 ml-1">{t.companies}</span>
                </p>
              </div>
            </div>

            {/* Round breakdown */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {locale === 'ja' ? '回次別内訳' : '회차별 내역'}
              </h4>
              <div className="space-y-2">
                {Object.entries(roundDistribution)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([round, count]) => {
                    const tpl = getTemplateForRound(Number(round))
                    const override = editOverrides[Number(round)]
                    const hasTemplate = !!tpl || !!override

                    return (
                      <div
                        key={round}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            {getRoundLabel(Number(round), locale)}
                          </span>
                          <span className="text-sm text-blue-600 font-bold">
                            {count}{t.companies}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasTemplate ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {override
                                ? (locale === 'ja' ? 'カスタム' : '커스텀')
                                : t.emailTemplate}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-500">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t.noTemplate}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Warning if over quota */}
            {stats && stats.remainingToday < validSelected.length && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  {locale === 'ja'
                    ? `本日の残り送信可能数(${stats.remainingToday}通)を超えています。${stats.remainingToday}通まで送信されます。`
                    : `오늘 잔여 발송 가능 수(${stats.remainingToday}통)를 초과합니다. ${stats.remainingToday}통까지 발송됩니다.`}
                </p>
              </div>
            )}

            {/* Send button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={validSelected.length === 0}
                className="flex items-center gap-2 px-8 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-5 h-5" />
                {t.sendAll} ({validSelected.length}{t.emails})
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =======================================
  // Render: Send Results
  // =======================================
  const renderSendResults = () => {
    if (!sendSummary || !sendResults) return null

    return (
      <div className="space-y-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              {sendSummary.sent > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {t.sendResult}
            </h3>
          </div>
          <div className="card-body">
            {/* Result stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">{sendSummary.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === 'ja' ? '合計' : '합계'}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{sendSummary.sent}</p>
                <p className="text-xs text-green-600 mt-1">{t.sent}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{sendSummary.failed}</p>
                <p className="text-xs text-red-600 mt-1">{t.failed}</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{sendSummary.bounced}</p>
                <p className="text-xs text-amber-600 mt-1">{t.bounced}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {sendSummary.skipped + sendSummary.blacklisted}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {locale === 'ja' ? 'スキップ' : '스킵'}
                </p>
              </div>
            </div>

            {/* Detailed results */}
            {sendResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">
                        {locale === 'ja' ? '会社名' : '업체명'}
                      </th>
                      <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">
                        {t.status}
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">
                        {locale === 'ja' ? '詳細' : '상세'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sendResults.map((result) => (
                      <tr key={result.companyId}>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {result.companyName}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {result.status === 'SENT' && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              {t.sent}
                            </span>
                          )}
                          {result.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3" />
                              {t.failed}
                            </span>
                          )}
                          {result.status === 'BOUNCED' && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3" />
                              {t.bounced}
                            </span>
                          )}
                          {result.status === 'NO_TEMPLATE' && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              <FileText className="w-3 h-3" />
                              {t.noTemplate}
                            </span>
                          )}
                          {result.status === 'NO_EMAIL' && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              <Mail className="w-3 h-3" />
                              {t.noEmail}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {result.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setStep(1)
                  setSelectedIds(new Set())
                  setSendResults(null)
                  setSendSummary(null)
                  setEditOverrides({})
                  setSendProgress(0)
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {locale === 'ja' ? '最初から' : '처음부터'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =======================================
  // Render: Confirmation Modal
  // =======================================
  const renderConfirmModal = () => {
    if (!showConfirmModal) return null

    const validCount = selectedCompanies.filter(
      (c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id)
    ).length

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setShowConfirmModal(false)}
        />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t.confirmSend}</h3>
            <p className="text-sm text-gray-500 mt-2">{t.confirmSendMessage}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {locale === 'ja' ? '送信対象' : '발송 대상'}
              </span>
              <span className="font-medium text-gray-900">
                {validCount}{t.companies}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t.estimatedTime}</span>
              <span className="font-medium text-gray-900">~{estimatedMinutes}{t.minutes}</span>
            </div>
            {Object.entries(roundDistribution)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, count]) => (
                <div key={round} className="flex justify-between text-sm">
                  <span className="text-gray-600">{getRoundLabel(Number(round), locale)}</span>
                  <span className="font-medium text-gray-900">{count}{t.companies}</span>
                </div>
              ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {locale === 'ja' ? 'キャンセル' : '취소'}
            </button>
            <button
              onClick={handleSend}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t.sendAll}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =======================================
  // Navigation buttons
  // =======================================
  const renderNavigation = () => {
    // Hide navigation if showing results
    if (sendResults && sendSummary) return null
    if (isSending) return null

    const validSelectedCount = selectedCompanies.filter(
      (c) => hasEmail(c.contactMethod) && !blacklistSet.has(c.id)
    ).length

    return (
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {locale === 'ja' ? '戻る' : '뒤로'}
            </button>
          )}
        </div>
        <div>
          {step < 3 && (
            <button
              onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
              disabled={step === 1 && validSelectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locale === 'ja' ? '次へ' : '다음'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // =======================================
  // Main Render
  // =======================================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">{t.bulkEmail}</h2>
      </div>

      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Navigation */}
      {renderNavigation()}

      {/* Confirmation modal */}
      {renderConfirmModal()}
    </div>
  )
}
