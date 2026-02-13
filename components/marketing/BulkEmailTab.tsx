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
      <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
        {steps.map((s, i) => {
          const StepIcon = s.icon
          const isActive = step === s.num
          const isComplete = step > s.num
          return (
            <div key={s.num} className="d-flex align-items-center">
              {i > 0 && (
                <div
                  className={isComplete ? 'bg-blue-500' : 'bg-gray-200'}
                  style={{ width: '3rem', height: '2px', marginLeft: '0.5rem', marginRight: '0.5rem' }}
                />
              )}
              <div className="d-flex align-items-center gap-2">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center text-sm fw-medium ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isComplete
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={{ width: '2rem', height: '2rem' }}
                >
                  {isComplete ? (
                    <Check size={16} />
                  ) : (
                    <StepIcon size={16} />
                  )}
                </div>
                <span
                  className={`text-sm fw-medium d-none d-sm-inline ${
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
            <div className="d-flex align-items-center gap-2 mb-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm fw-medium text-gray-700">
                {locale === 'ja' ? 'フィルター' : '필터'}
              </span>
            </div>
            <div className="row g-2">
              {/* Search */}
              <div className="col-12 col-md position-relative">
                <Search size={16} className="text-gray-400 position-absolute" style={{ left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={locale === 'ja' ? '検索...' : '검색...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control form-control-sm"
                  style={{ paddingLeft: '2rem' }}
                />
              </div>

              {/* Status filter */}
              <div className="col-6 col-md">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="all">{t.status}: {t.all}</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]?.[locale] || s}
                  </option>
                ))}
              </select>
              </div>

              {/* Round filter */}
              <div className="col-6 col-md">
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="all">{t.contactRound}: {t.all}</option>
                <option value="0">0{locale === 'ja' ? '回' : '회'}</option>
                <option value="1">1{locale === 'ja' ? '回' : '회'}</option>
                <option value="2">2{locale === 'ja' ? '回' : '회'}</option>
                <option value="3">3{locale === 'ja' ? '回' : '회'}</option>
                <option value="4">4{locale === 'ja' ? '回' : '회'}</option>
                <option value="5+">5+{locale === 'ja' ? '回' : '회'}</option>
              </select>
              </div>

              {/* Region filter */}
              <div className="col-6 col-md">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="form-select form-select-sm"
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
              </div>

              {/* Email only toggle */}
              <div className="col-6 col-md">
              <label className="d-flex align-items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={emailOnlyFilter}
                  onChange={(e) => setEmailOnlyFilter(e.target.checked)}
                  className="form-check-input"
                />
                <Mail size={16} className="text-gray-400" />
                {t.emailOnly}
              </label>
              </div>
            </div>
          </div>
        </div>

        {/* Selection controls and stats */}
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={selectAll}
              className="btn btn-outline-primary btn-sm"
            >
              {t.selectAll}
            </button>
            <button
              onClick={deselectAll}
              className="btn btn-ghost-secondary btn-sm"
            >
              {t.deselectAll}
            </button>
            <span className="text-sm text-gray-500">
              {filteredCompanies.length}{t.companies}
              {locale === 'ja' ? '表示中' : ' 표시 중'}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-sm fw-medium text-blue-600">
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
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="table table-sm table-vcenter">
                <thead className="sticky-top bg-gray-50 border-bottom">
                  <tr>
                    <th className="px-2 py-2 text-center" style={{ width: '2.5rem' }}>
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
                        className="form-check-input"
                      />
                    </th>
                    <th className="text-left px-2 py-2 text-xs fw-medium text-gray-500 text-uppercase">
                      {locale === 'ja' ? '会社名' : '업체명'}
                    </th>
                    <th className="text-left px-2 py-2 text-xs fw-medium text-gray-500 text-uppercase">
                      {locale === 'ja' ? '連絡先' : '연락처'}
                    </th>
                    <th className="text-center px-2 py-2 text-xs fw-medium text-gray-500 text-uppercase">
                      {locale === 'ja' ? '地域' : '지역'}
                    </th>
                    <th className="text-center px-2 py-2 text-xs fw-medium text-gray-500 text-uppercase">
                      {t.status}
                    </th>
                    <th className="text-center px-2 py-2 text-xs fw-medium text-gray-500 text-uppercase">
                      {t.contactRound}
                    </th>
                  </tr>
                </thead>
                <tbody>
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
                            ? 'bg-red-50'
                            : !hasValidEmail
                            ? 'bg-gray-50'
                            : isSelected
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleSelect(company.id)}
                            className="form-check-input"
                            style={isDisabled ? { opacity: 0.4 } : undefined}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <div className="d-flex align-items-center gap-1">
                            <span
                              className={`text-sm fw-medium ${
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
                              <Ban size={14} className="text-red-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <span
                            className={`text-sm ${
                              hasValidEmail ? 'text-gray-700' : 'text-gray-400 italic'
                            }`}
                          >
                            {hasValidEmail ? (
                              <span className="d-flex align-items-center gap-1">
                                <Mail size={14} className="text-blue-400" />
                                {company.contactMethod}
                              </span>
                            ) : (
                              <span className="d-flex align-items-center gap-1">
                                <XCircle size={14} className="text-gray-300" />
                                {t.noEmail}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span className="text-xs text-gray-600">
                            {locale === 'ko' ? company.regionKo : company.region}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-circle bg-gray-100 text-gray-600">
                            {STATUS_LABELS[company.status]?.[locale] || company.status}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span
                            className={`text-xs fw-medium px-2 py-0.5 rounded-circle ${
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
                      <td colSpan={6} className="px-3 py-5 text-center text-sm text-gray-400">
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
        <div className="d-flex align-items-center justify-content-center py-5">
          <Loader2 size={24} className="text-blue-500 animate-spin" />
          <span className="ms-2 text-gray-500">{t.loading}</span>
        </div>
      )
    }

    const sampleCompany = selectedCompanies[0]

    return (
      <div className="space-y-4">
        {/* Round distribution summary */}
        <div className="card">
          <div className="card-body">
            <h4 className="text-sm fw-medium text-gray-700 mb-2">
              {locale === 'ja' ? '回次別送信内訳' : '회차별 발송 내역'}
            </h4>
            <div className="d-flex flex-wrap gap-2">
              {Object.entries(roundDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([round, count]) => (
                  <div
                    key={round}
                    className="d-flex align-items-center gap-2 px-2 py-1 bg-blue-50 rounded-lg"
                  >
                    <span className="text-sm fw-medium text-blue-700">
                      {getRoundLabel(Number(round), locale)}
                    </span>
                    <span className="text-sm text-blue-600 fw-bold">
                      {count}{t.companies}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Round tabs */}
        <div className="card">
          <div className="card-header border-bottom">
            <div className="d-flex align-items-center gap-1">
              {activeRounds.map((round) => (
                <button
                  key={round}
                  onClick={() => setActiveRoundTab(round)}
                  className={`px-3 py-1 text-sm fw-medium rounded-top transition-colors ${
                    activeRoundTab === round
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {getRoundLabel(round, locale)}
                  <span className="ms-1 text-xs" style={{ opacity: 0.75 }}>
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
                  <div className="text-center py-5">
                    <AlertTriangle size={32} className="text-amber-400 mx-auto mb-2" />
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
                  <div className="d-flex align-items-center justify-content-between">
                    <h4 className="text-sm fw-medium text-gray-700 d-flex align-items-center gap-2">
                      {isEditing ? (
                        <Edit2 size={16} className="text-blue-500" />
                      ) : (
                        <Eye size={16} className="text-gray-400" />
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
                      className={isEditing
                        ? 'btn btn-ghost-secondary btn-sm'
                        : 'btn btn-outline-primary btn-sm'
                      }
                    >
                      {isEditing
                        ? (locale === 'ja' ? 'プレビューに戻る' : '미리보기로 돌아가기')
                        : (locale === 'ja' ? '編集する' : '편집하기')}
                    </button>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs fw-medium text-gray-500 text-uppercase mb-1 d-block">
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
                        className="form-control form-control-sm"
                      />
                    ) : (
                      <div className="px-2 py-1 bg-gray-50 rounded-lg text-sm text-gray-800 fw-medium">
                        {sampleCompany ? replaceVars(currentSubject, sampleCompany) : currentSubject}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div>
                    <label className="text-xs fw-medium text-gray-500 text-uppercase mb-1 d-block">
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
                        className="form-control font-monospace"
                      />
                    ) : (
                      <div className="px-2 py-1 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap" style={{ maxHeight: '400px', overflowY: 'auto', lineHeight: 1.7 }}>
                        {sampleCompany ? replaceVars(currentBody, sampleCompany) : currentBody}
                      </div>
                    )}
                  </div>

                  {/* Variable guide */}
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs fw-medium text-amber-700 mb-1">
                      {t.variableGuide}
                    </p>
                    <div className="d-flex flex-wrap gap-2">
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
              <Loader2 size={40} className="text-blue-500 animate-spin mx-auto mb-3" />
              <h3 className="text-lg fw-semibold text-gray-900 mb-2">{t.sending}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {locale === 'ja'
                  ? 'メール送信処理中です。このページを閉じないでください。'
                  : '메일 발송 처리 중입니다. 이 페이지를 닫지 마세요.'}
              </p>
              {/* Progress bar */}
              <div className="mx-auto" style={{ maxWidth: '28rem' }}>
                <div className="progress" style={{ height: '0.5rem' }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${Math.min(sendProgress, 100)}%`, transition: 'width 0.5s' }}
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
            <h3 className="card-title d-flex align-items-center gap-2">
              <Send size={20} className="text-blue-500" />
              {t.confirmSend}
            </h3>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-4">
              {/* Total */}
              <div className="col-6 col-md-3">
              <div className="stat-card">
                <p className="stat-label">{locale === 'ja' ? '送信対象' : '발송 대상'}</p>
                <p className="stat-value text-blue-600">
                  {validSelected.length}
                  <span className="text-sm fw-normal text-gray-400 ms-1">{t.companies}</span>
                </p>
              </div>
              </div>

              {/* Remaining quota */}
              <div className="col-6 col-md-3">
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
                      <span className="text-sm fw-normal text-gray-400 ms-1">
                        / {stats.dailyLimit}{t.emails}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </p>
              </div>
              </div>

              {/* Estimated time */}
              <div className="col-6 col-md-3">
              <div className="stat-card">
                <p className="stat-label">{t.estimatedTime}</p>
                <p className="stat-value text-gray-700">
                  ~{estimatedMinutes}
                  <span className="text-sm fw-normal text-gray-400 ms-1">{t.minutes}</span>
                </p>
              </div>
              </div>

              {/* Blacklisted */}
              <div className="col-6 col-md-3">
              <div className="stat-card">
                <p className="stat-label">{t.blacklisted}</p>
                <p className="stat-value text-red-500">
                  {selectedCompanies.length - validSelected.length}
                  <span className="text-sm fw-normal text-gray-400 ms-1">{t.companies}</span>
                </p>
              </div>
              </div>
            </div>

            {/* Round breakdown */}
            <div className="border-top pt-3">
              <h4 className="text-sm fw-medium text-gray-700 mb-2">
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
                        className="d-flex align-items-center justify-content-between py-1 px-2 bg-gray-50 rounded-lg"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-sm fw-medium text-gray-700">
                            {getRoundLabel(Number(round), locale)}
                          </span>
                          <span className="text-sm text-blue-600 fw-bold">
                            {count}{t.companies}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {hasTemplate ? (
                            <span className="d-flex align-items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={14} />
                              {override
                                ? (locale === 'ja' ? 'カスタム' : '커스텀')
                                : t.emailTemplate}
                            </span>
                          ) : (
                            <span className="d-flex align-items-center gap-1 text-xs text-amber-500">
                              <AlertTriangle size={14} />
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
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg d-flex align-items-start gap-2">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  {locale === 'ja'
                    ? `本日の残り送信可能数(${stats.remainingToday}通)を超えています。${stats.remainingToday}通まで送信されます。`
                    : `오늘 잔여 발송 가능 수(${stats.remainingToday}통)를 초과합니다. ${stats.remainingToday}통까지 발송됩니다.`}
                </p>
              </div>
            )}

            {/* Send button */}
            <div className="mt-4 d-flex justify-content-center">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={validSelected.length === 0}
                className="btn btn-primary d-flex align-items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
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
            <h3 className="card-title d-flex align-items-center gap-2">
              {sendSummary.sent > 0 ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
              {t.sendResult}
            </h3>
          </div>
          <div className="card-body">
            {/* Result stats */}
            <div className="row g-2 mb-4">
              <div className="col-6 col-md">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-2xl fw-bold text-gray-700">{sendSummary.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === 'ja' ? '合計' : '합계'}
                </p>
              </div>
              </div>
              <div className="col-6 col-md">
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-2xl fw-bold text-green-600">{sendSummary.sent}</p>
                <p className="text-xs text-green-600 mt-1">{t.sent}</p>
              </div>
              </div>
              <div className="col-6 col-md">
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-2xl fw-bold text-red-600">{sendSummary.failed}</p>
                <p className="text-xs text-red-600 mt-1">{t.failed}</p>
              </div>
              </div>
              <div className="col-6 col-md">
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-2xl fw-bold text-amber-600">{sendSummary.bounced}</p>
                <p className="text-xs text-amber-600 mt-1">{t.bounced}</p>
              </div>
              </div>
              <div className="col-6 col-md">
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <p className="text-2xl fw-bold text-purple-600">
                  {sendSummary.skipped + sendSummary.blacklisted}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {locale === 'ja' ? 'スキップ' : '스킵'}
                </p>
              </div>
              </div>
            </div>

            {/* Detailed results */}
            {sendResults.length > 0 && (
              <div className="border rounded-lg" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-sm table-vcenter">
                  <thead className="sticky-top bg-gray-50">
                    <tr>
                      <th className="text-left px-2 py-1 text-xs fw-medium text-gray-500">
                        {locale === 'ja' ? '会社名' : '업체명'}
                      </th>
                      <th className="text-center px-2 py-1 text-xs fw-medium text-gray-500">
                        {t.status}
                      </th>
                      <th className="text-left px-2 py-1 text-xs fw-medium text-gray-500">
                        {locale === 'ja' ? '詳細' : '상세'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sendResults.map((result) => (
                      <tr key={result.companyId}>
                        <td className="px-2 py-1 text-sm text-gray-700">
                          {result.companyName}
                        </td>
                        <td className="px-2 py-1 text-center">
                          {result.status === 'SENT' && (
                            <span className="d-inline-flex align-items-center gap-1 text-xs px-2 py-0.5 rounded-circle bg-green-100 text-green-700">
                              <CheckCircle size={12} />
                              {t.sent}
                            </span>
                          )}
                          {result.status === 'FAILED' && (
                            <span className="d-inline-flex align-items-center gap-1 text-xs px-2 py-0.5 rounded-circle bg-red-100 text-red-700">
                              <XCircle size={12} />
                              {t.failed}
                            </span>
                          )}
                          {result.status === 'BOUNCED' && (
                            <span className="d-inline-flex align-items-center gap-1 text-xs px-2 py-0.5 rounded-circle bg-amber-100 text-amber-700">
                              <AlertTriangle size={12} />
                              {t.bounced}
                            </span>
                          )}
                          {result.status === 'NO_TEMPLATE' && (
                            <span className="d-inline-flex align-items-center gap-1 text-xs px-2 py-0.5 rounded-circle bg-gray-100 text-gray-600">
                              <FileText size={12} />
                              {t.noTemplate}
                            </span>
                          )}
                          {result.status === 'NO_EMAIL' && (
                            <span className="d-inline-flex align-items-center gap-1 text-xs px-2 py-0.5 rounded-circle bg-gray-100 text-gray-600">
                              <Mail size={12} />
                              {t.noEmail}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-500">
                          {result.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 d-flex justify-content-center gap-2">
              <button
                onClick={() => {
                  setStep(1)
                  setSelectedIds(new Set())
                  setSendResults(null)
                  setSendSummary(null)
                  setEditOverrides({})
                  setSendProgress(0)
                }}
                className="btn btn-ghost-secondary btn-sm"
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
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 50 }}>
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowConfirmModal(false)}
        />
        <div className="position-relative bg-white rounded-xl shadow-lg w-100 mx-3 p-4" style={{ maxWidth: '28rem' }}>
          <button
            onClick={() => setShowConfirmModal(false)}
            className="position-absolute text-gray-400" style={{ top: '1rem', right: '1rem' }}
          >
            <X size={20} />
          </button>
          <div className="text-center mb-4">
            <div className="bg-blue-100 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '3rem', height: '3rem' }}>
              <Send size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg fw-semibold text-gray-900">{t.confirmSend}</h3>
            <p className="text-sm text-gray-500 mt-2">{t.confirmSendMessage}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
            <div className="d-flex justify-content-between text-sm">
              <span className="text-gray-600">
                {locale === 'ja' ? '送信対象' : '발송 대상'}
              </span>
              <span className="fw-medium text-gray-900">
                {validCount}{t.companies}
              </span>
            </div>
            <div className="d-flex justify-content-between text-sm">
              <span className="text-gray-600">{t.estimatedTime}</span>
              <span className="fw-medium text-gray-900">~{estimatedMinutes}{t.minutes}</span>
            </div>
            {Object.entries(roundDistribution)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, count]) => (
                <div key={round} className="d-flex justify-content-between text-sm">
                  <span className="text-gray-600">{getRoundLabel(Number(round), locale)}</span>
                  <span className="fw-medium text-gray-900">{count}{t.companies}</span>
                </div>
              ))}
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="btn btn-ghost-secondary flex-fill"
            >
              {locale === 'ja' ? 'キャンセル' : '취소'}
            </button>
            <button
              onClick={handleSend}
              className="btn btn-primary flex-fill d-flex align-items-center justify-content-center gap-2"
            >
              <Send size={16} />
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
      <div className="d-flex align-items-center justify-content-between pt-3 border-top">
        <div>
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="btn btn-ghost-secondary btn-sm d-flex align-items-center gap-2"
            >
              <ChevronLeft size={16} />
              {locale === 'ja' ? '戻る' : '뒤로'}
            </button>
          )}
        </div>
        <div>
          {step < 3 && (
            <button
              onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
              disabled={step === 1 && validSelectedCount === 0}
              className="btn btn-primary btn-sm d-flex align-items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locale === 'ja' ? '次へ' : '다음'}
              <ChevronRight size={16} />
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
      <div className="d-flex align-items-center gap-2 mb-2">
        <Mail size={20} className="text-blue-500" />
        <h2 className="text-lg fw-semibold text-gray-900">{t.bulkEmail}</h2>
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
