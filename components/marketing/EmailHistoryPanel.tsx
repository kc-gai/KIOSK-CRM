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
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              {locale === 'ja' ? 'メール履歴（会社別タイムライン）' : '이메일 이력 (회사별 타임라인)'}
            </h3>
            <p className="text-xs text-gray-500">
              {locale === 'ja'
                ? `送信: ${sentCount}件 / 返信: ${replyCount}件 / 返信あり企業: ${companiesWithReplies}社`
                : `발신: ${sentCount}건 / 회신: ${replyCount}건 / 회신 업체: ${companiesWithReplies}사`}
            </p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="border-t border-gray-200">
          {/* Search + Refresh */}
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={locale === 'ja' ? '会社名で検索...' : '업체명으로 검색...'}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Timeline List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredTimelines.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
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
                <div key={timeline.companyName} className="border-t border-gray-100">
                  <button
                    onClick={() => toggleCompany(timeline.companyName)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                  >
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {timeline.companyName}
                        </span>
                        {hasReply && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            {locale === 'ja' ? '返信あり' : '회신 있음'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" /> {sentEvents.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Inbox className="w-3 h-3" /> {replyEvents.length}
                        </span>
                        <span>{formatDate(latestEvent?.date || '')}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 ml-7">
                      {timeline.events.map((event, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 py-2 ${
                            idx < timeline.events.length - 1 ? 'border-b border-gray-50' : ''
                          }`}
                        >
                          <div className={`mt-0.5 p-1 rounded ${
                            event.type === 'sent'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {event.type === 'sent' ? (
                              <Send className="w-3 h-3" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${
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
                            <p className="text-xs text-gray-600 truncate mt-0.5">
                              {event.subject}
                            </p>
                            {event.preview && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">
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
