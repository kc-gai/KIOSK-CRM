'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { Mail, Search, Filter, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Clock, ShieldBan, Loader2, Eye } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type EmailLog = {
  id: string
  sentAt: string
  companyId: string
  companyName: string
  recipientEmail: string
  senderEmail: string
  subject: string
  bodyPreview: string | null
  bodyText: string | null
  contactRound: number
  status: 'SENT' | 'FAILED' | 'BOUNCED' | 'QUEUED'
  errorMessage: string | null
  sentBy: string | null
}

type EmailLogPanelProps = {
  onAddToBlacklist?: (companyId: string, companyName: string, email: string) => void
}

const STATUS_OPTIONS = ['all', 'SENT', 'FAILED', 'BOUNCED', 'QUEUED'] as const

function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export default function EmailLogPanel({ onAddToBlacklist }: EmailLogPanelProps) {
  const { t, locale } = useTranslation()

  const defaultRange = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const LIMIT = 50

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const currentPage = reset ? 0 : page
      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: String(LIMIT),
        offset: String(currentPage * LIMIT),
      })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/email-logs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      const fetchedLogs: EmailLog[] = json.data?.logs || []

      if (reset) {
        setLogs(fetchedLogs)
        setPage(1)
        setExpandedId(null)
      } else {
        setLogs((prev) => [...prev, ...fetchedLogs])
        setPage((prev) => prev + 1)
      }
      setHasMore(fetchedLogs.length === LIMIT)
    } catch {
      if (reset) setLogs([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, statusFilter, page])

  useEffect(() => {
    fetchLogs(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: EmailLog['status']) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            {t.sent}
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            {t.failed}
          </span>
        )
      case 'BOUNCED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <AlertTriangle className="w-3 h-3" />
            {t.bounced}
          </span>
        )
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3" />
            QUEUED
          </span>
        )
    }
  }

  const getRoundLabel = (round: number) => {
    const roundMap: Record<number, string> = {
      1: t.round1,
      2: t.round2,
      3: t.round3,
      4: t.round4,
    }
    return roundMap[round] || t.round5
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return t.sent
      case 'FAILED': return t.failed
      case 'BOUNCED': return t.bounced
      case 'QUEUED': return 'QUEUED'
      default: return t.all
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="card-title">{t.emailHistory}</h3>
            <span className="text-sm text-gray-500">
              ({logs.length}{t.emails})
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-1 pr-6 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'all' ? t.all : getStatusLabel(opt)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {locale === 'ja' ? '日時' : '일시'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {locale === 'ja' ? '企業名' : '업체명'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {locale === 'ja' ? '受信者' : '수신자'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t.mailSubject}
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  {t.contactRound}
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  {t.status}
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  {locale === 'ja' ? '操作' : '작업'}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Search className="w-8 h-8" />
                      <p className="text-sm">
                        {locale === 'ja'
                          ? '送信履歴がありません'
                          : '발송 이력이 없습니다'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                        log.status === 'BOUNCED' ? 'bg-orange-50/30' : ''
                      } ${expandedId === log.id ? 'bg-blue-50/30' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(log.sentAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {log.companyName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="truncate max-w-[200px] inline-block">
                          {log.recipientEmail}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="truncate max-w-[250px] inline-block">
                          {log.subject}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {getRoundLabel(log.contactRound)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(log.id) }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title={locale === 'ja' ? '詳細' : '상세'}
                          >
                            {expandedId === log.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          {log.status === 'BOUNCED' && onAddToBlacklist && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddToBlacklist(log.companyId, log.companyName, log.recipientEmail)
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors"
                              title={t.addToBlacklist}
                            >
                              <ShieldBan className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-gray-50/80">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-6 text-xs text-gray-500">
                              <div>
                                <span className="font-medium">{locale === 'ja' ? '発信者' : '발신자'}:</span>{' '}
                                {log.senderEmail}
                              </div>
                              <div>
                                <span className="font-medium">{locale === 'ja' ? '担当者' : '담당자'}:</span>{' '}
                                {log.sentBy || '-'}
                              </div>
                              {log.errorMessage && (
                                <div className="text-red-600">
                                  <span className="font-medium">{locale === 'ja' ? 'エラー' : '에러'}:</span>{' '}
                                  {log.errorMessage}
                                </div>
                              )}
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <h4 className="text-xs font-medium text-gray-500 mb-2">
                                {locale === 'ja' ? '本文' : '본문'}
                              </h4>
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-[300px] overflow-y-auto">
                                {log.bodyText || log.bodyPreview || (locale === 'ja' ? '本文データなし' : '본문 데이터 없음')}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="ml-2 text-sm text-gray-500">{t.loading}</span>
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <button
              onClick={() => fetchLogs(false)}
              className="px-4 py-2 text-sm font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {locale === 'ja' ? 'さらに読み込む' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
