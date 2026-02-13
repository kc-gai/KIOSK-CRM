'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  Inbox,
  Clock,
  ChevronDown,
  ChevronRight,
  Building2,
  Send,
  Search,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type EmailLog = {
  id: string
  recipientEmail: string
  recipientName: string | null
  companyId: string | null
  companyName: string | null
  subject: string
  status: string
  sentAt: string | null
  contactRound: number
}

type EmailReply = {
  id: string
  fromEmail: string
  fromName: string | null
  subject: string | null
  bodyPreview: string | null
  receivedAt: string
  isRead: boolean
  companyId: string | null
}

type CompanyTimeline = {
  companyName: string
  companyId: string | null
  events: Array<{
    type: 'sent' | 'reply'
    date: string
    subject: string
    status?: string
    preview?: string
    isRead?: boolean
    contactRound?: number
  }>
}

export default function EmailHistoryPanel() {
  const { locale } = useTranslation()
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(true)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, repliesRes] = await Promise.all([
        fetch('/api/email-logs?limit=500'),
        fetch('/api/email-replies?type=list'),
      ])

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setEmailLogs(logsData.logs || [])
      }

      if (repliesRes.ok) {
        const repliesData = await repliesRes.json()
        setEmailReplies(repliesData.replies || [])
      }
    } catch (e) {
      console.error('Failed to fetch email history', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isCollapsed) {
      fetchHistory()
    }
  }, [isCollapsed, fetchHistory])

  // Build timeline per company
  const companyTimelines: CompanyTimeline[] = (() => {
    const map = new Map<string, CompanyTimeline>()

    for (const log of emailLogs) {
      const key = log.companyName || log.recipientEmail
      if (!map.has(key)) {
        map.set(key, { companyName: key, companyId: log.companyId, events: [] })
      }
      map.get(key)!.events.push({
        type: 'sent',
        date: log.sentAt || '',
        subject: log.subject,
        status: log.status,
        contactRound: log.contactRound,
      })
    }

    for (const reply of emailReplies) {
      // Match by email address to find company
      const matchedLog = emailLogs.find(l => l.recipientEmail === reply.fromEmail)
      const key = matchedLog?.companyName || reply.fromName || reply.fromEmail
      if (!map.has(key)) {
        map.set(key, { companyName: key, companyId: reply.companyId, events: [] })
      }
      map.get(key)!.events.push({
        type: 'reply',
        date: reply.receivedAt,
        subject: reply.subject || '',
        preview: reply.bodyPreview || '',
        isRead: reply.isRead,
      })
    }

    // Sort events by date desc
    Array.from(map.values()).forEach(timeline => {
      timeline.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })

    // Sort companies by latest event
    return Array.from(map.values())
      .filter(t => t.events.length > 0)
      .sort((a, b) => {
        const aDate = a.events[0]?.date || ''
        const bDate = b.events[0]?.date || ''
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
  })()

  const filteredTimelines = searchQuery
    ? companyTimelines.filter(t =>
        t.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companyTimelines

  const toggleCompany = (name: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const sentCount = emailLogs.length
  const replyCount = emailReplies.length
  const companiesWithReplies = new Set(
    emailReplies.map(r => {
      const matched = emailLogs.find(l => l.recipientEmail === r.fromEmail)
      return matched?.companyName || r.fromEmail
    })
  ).size

  return (
    <div className="card">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-100 p-3 d-flex align-items-center justify-content-between hover:bg-gray-50 transition-colors"
      >
        <div className="d-flex align-items-center gap-2">
          <div className="bg-indigo-100 rounded-lg d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }}>
            <Clock size={16} className="text-indigo-600" />
          </div>
          <div className="text-start">
            <h3 className="fw-semibold text-gray-900 mb-0">
              {locale === 'ja' ? 'メール履歴（会社別タイムライン）' : '이메일 이력 (회사별 타임라인)'}
            </h3>
            <p className="text-xs text-gray-500 mb-0">
              {locale === 'ja'
                ? `送信: ${sentCount}件 / 返信: ${replyCount}件 / 返信あり企業: ${companiesWithReplies}社`
                : `발신: ${sentCount}건 / 회신: ${replyCount}건 / 회신 업체: ${companiesWithReplies}사`}
            </p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronRight size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="border-top">
          {/* Search + Refresh */}
          <div className="p-3 d-flex align-items-center gap-2">
            <div className="flex-fill position-relative">
              <Search size={16} className="position-absolute text-gray-400 pe-none" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={locale === 'ja' ? '会社名で検索...' : '업체명으로 검색...'}
                className="form-control form-control-sm"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="btn btn-ghost-secondary btn-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Timeline List */}
          <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
            {filteredTimelines.length === 0 && (
              <div className="p-5 text-center text-gray-500 text-sm">
                {loading
                  ? (locale === 'ja' ? '読み込み中...' : '로딩 중...')
                  : (locale === 'ja' ? 'メール履歴がありません' : '이메일 이력이 없습니다')}
              </div>
            )}

            {filteredTimelines.map(timeline => {
              const isExpanded = expandedCompanies.has(timeline.companyName)
              const latestEvent = timeline.events[0]
              const hasReply = timeline.events.some(e => e.type === 'reply')
              const sentEvents = timeline.events.filter(e => e.type === 'sent')
              const replyEvents = timeline.events.filter(e => e.type === 'reply')

              return (
                <div key={timeline.companyName} className="border-top">
                  <button
                    onClick={() => toggleCompany(timeline.companyName)}
                    className="w-100 px-3 py-2 d-flex align-items-center gap-2 hover:bg-gray-50 text-start"
                  >
                    <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-fill" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-medium text-sm text-gray-900 truncate">
                          {timeline.companyName}
                        </span>
                        {hasReply && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 py-0 rounded">
                            {locale === 'ja' ? '返信あり' : '회신 있음'}
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2 text-xs text-gray-500 mt-0">
                        <span className="d-flex align-items-center gap-1">
                          <Send size={12} /> {sentEvents.length}
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <Inbox size={12} /> {replyEvents.length}
                        </span>
                        <span>{formatDate(latestEvent?.date || '')}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-2 ms-4">
                      {timeline.events.map((event, idx) => (
                        <div
                          key={idx}
                          className={`d-flex align-items-start gap-2 py-1 ${
                            idx < timeline.events.length - 1 ? 'border-bottom' : ''
                          }`}
                        >
                          <div className={`mt-0 p-1 rounded ${
                            event.type === 'sent'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {event.type === 'sent' ? (
                              <Send size={12} />
                            ) : (
                              <Mail size={12} />
                            )}
                          </div>
                          <div className="flex-fill" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`text-xs fw-medium ${
                                event.type === 'sent' ? 'text-blue-700' : 'text-green-700'
                              }`}>
                                {event.type === 'sent'
                                  ? (locale === 'ja' ? '送信' : '발신')
                                  : (locale === 'ja' ? '返信' : '회신')}
                                {event.contactRound ? ` (${event.contactRound}回目)` : ''}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(event.date)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-0 mb-0">
                              {event.subject}
                            </p>
                            {event.preview && (
                              <p className="text-xs text-gray-400 truncate mt-0 mb-0">
                                {event.preview}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
