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
          <span className="d-inline-flex align-items-center gap-1 px-1 rounded-circle text-xs fw-medium bg-green-100 text-green-700" style={{ padding: '2px 8px', borderRadius: '9999px' }}>
            <CheckCircle size={12} />
            {t.sent}
          </span>
        )
      case 'FAILED':
        return (
          <span className="d-inline-flex align-items-center gap-1 px-1 rounded-circle text-xs fw-medium bg-red-100 text-red-700" style={{ padding: '2px 8px', borderRadius: '9999px' }}>
            <XCircle size={12} />
            {t.failed}
          </span>
        )
      case 'BOUNCED':
        return (
          <span className="d-inline-flex align-items-center gap-1 px-1 rounded-circle text-xs fw-medium bg-orange-100 text-orange-700" style={{ padding: '2px 8px', borderRadius: '9999px' }}>
            <AlertTriangle size={12} />
            {t.bounced}
          </span>
        )
      case 'QUEUED':
        return (
          <span className="d-inline-flex align-items-center gap-1 px-1 rounded-circle text-xs fw-medium bg-gray-100 text-gray-600" style={{ padding: '2px 8px', borderRadius: '9999px' }}>
            <Clock size={12} />
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
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Mail size={20} className="text-primary" />
            <h3 className="card-title">{t.emailHistory}</h3>
            <span className="text-sm text-gray-500">
              ({logs.length}{t.emails})
            </span>
          </div>

          {/* Filters */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Date Range */}
            <div className="d-flex align-items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control form-control-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="d-flex align-items-center gap-1">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select form-select-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? t.all : getStatusLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* Table */}
        <div className="overflow-auto">
          <table className="table table-sm table-vcenter">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 fw-medium text-gray-600">
                  {locale === 'ja' ? '日時' : '일시'}
                </th>
                <th className="px-3 py-2 fw-medium text-gray-600">
                  {locale === 'ja' ? '企業名' : '업체명'}
                </th>
                <th className="px-3 py-2 fw-medium text-gray-600">
                  {locale === 'ja' ? '受信者' : '수신자'}
                </th>
                <th className="px-3 py-2 fw-medium text-gray-600">
                  {t.mailSubject}
                </th>
                <th className="px-3 py-2 fw-medium text-gray-600 text-center">
                  {t.contactRound}
                </th>
                <th className="px-3 py-2 fw-medium text-gray-600 text-center">
                  {t.status}
                </th>
                <th className="px-3 py-2 fw-medium text-gray-600 text-center">
                  {locale === 'ja' ? '操作' : '작업'}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-5 text-center">
                    <div className="d-flex flex-column align-items-center gap-2 text-gray-400">
                      <Search size={32} />
                      <p className="text-sm mb-0">
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
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        log.status === 'BOUNCED' ? 'bg-orange-50' : ''
                      } ${expandedId === log.id ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {formatDate(log.sentAt)}
                      </td>
                      <td className="px-3 py-2 fw-medium text-gray-800">
                        {log.companyName}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        <span className="truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {log.recipientEmail}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <span className="truncate d-inline-block" style={{ maxWidth: '250px' }}>
                          {log.subject}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="d-inline-flex align-items-center px-1 text-xs fw-medium bg-blue-50 text-blue-700" style={{ padding: '2px 8px', borderRadius: '9999px' }}>
                          {getRoundLabel(log.contactRound)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(log.id) }}
                            className="btn btn-ghost-secondary btn-sm d-inline-flex align-items-center gap-1"
                            title={locale === 'ja' ? '詳細' : '상세'}
                          >
                            {expandedId === log.id ? (
                              <ChevronUp size={12} />
                            ) : (
                              <Eye size={12} />
                            )}
                          </button>
                          {log.status === 'BOUNCED' && onAddToBlacklist && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddToBlacklist(log.companyId, log.companyName, log.recipientEmail)
                              }}
                              className="btn btn-sm d-inline-flex align-items-center gap-1 text-orange-700 bg-orange-100 hover:bg-orange-200"
                              title={t.addToBlacklist}
                            >
                              <ShieldBan size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="d-flex align-items-start gap-4 text-xs text-gray-500">
                              <div>
                                <span className="fw-medium">{locale === 'ja' ? '発信者' : '발신자'}:</span>{' '}
                                {log.senderEmail}
                              </div>
                              <div>
                                <span className="fw-medium">{locale === 'ja' ? '担当者' : '담당자'}:</span>{' '}
                                {log.sentBy || '-'}
                              </div>
                              {log.errorMessage && (
                                <div className="text-red-600">
                                  <span className="fw-medium">{locale === 'ja' ? 'エラー' : '에러'}:</span>{' '}
                                  {log.errorMessage}
                                </div>
                              )}
                            </div>
                            <div className="card">
                              <div className="card-body p-3">
                                <h4 className="text-xs fw-medium text-gray-500 mb-1">
                                  {locale === 'ja' ? '本文' : '본문'}
                                </h4>
                                <pre className="text-sm text-gray-700 mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, maxHeight: '300px', overflowY: 'auto' }}>
                                  {log.bodyText || log.bodyPreview || (locale === 'ja' ? '本文データなし' : '본문 데이터 없음')}
                                </pre>
                              </div>
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
          <div className="d-flex align-items-center justify-content-center py-4">
            <Loader2 size={20} className="text-primary animate-spin" />
            <span className="ms-2 text-sm text-gray-500">{t.loading}</span>
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="d-flex justify-content-center py-3 border-top">
            <button
              onClick={() => fetchLogs(false)}
              className="btn btn-outline-primary btn-sm"
            >
              {locale === 'ja' ? 'さらに読み込む' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
