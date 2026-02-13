'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/translations'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Mail,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  BarChart3,
  Bell,
} from 'lucide-react'

type StatusBreakdown = {
  status: string
  count: number
}

type RoundBreakdown = {
  round: number
  count: number
}

type DailyTrend = {
  date: string
  count: number
}

type EmailStats = {
  today: number
  week: number
  month: number
  dailyLimit: number
  remainingToday: number
  statusBreakdown: StatusBreakdown[]
  roundBreakdown: RoundBreakdown[]
  dailyTrend: DailyTrend[]
}

type FollowUpCompany = {
  companyId: string
  companyName: string
  lastSentAt: string
  daysSince: number
  lastContactRound: number
  recipientEmail: string
  region: string
  office: string
}

type FollowUpData = {
  followUpDays: number
  count: number
  companies: FollowUpCompany[]
}

const ROUND_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

const STATUS_COLORS: Record<string, string> = {
  SENT: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  BOUNCED: 'bg-orange-100 text-orange-800',
}

const localText = {
  ja: {
    emailDashboardTitle: 'メール送信ダッシュボード',
    today: '本日',
    thisWeek: '今週',
    thisMonth: '今月',
    followUpNeeded: 'フォローアップ必要',
    roundDistribution: 'ラウンド別送信分布',
    dailyTrend: '日別送信推移（過去30日）',
    statusBreakdown: 'ステータス別内訳',
    followUpList: 'フォローアップ対象',
    company: '会社名',
    email: 'メール',
    lastSent: '最終送信日',
    daysSince: '経過日数',
    round: 'ラウンド',
    action: 'アクション',
    sendMail: 'メール送信',
    noFollowUp: 'フォローアップ対象はありません',
    days: '日',
    roundLabel: 'ラウンド',
    count: '件',
    loading: '読み込み中...',
    errorLoading: 'データの読み込みに失敗しました',
  },
  ko: {
    emailDashboardTitle: '메일 발송 대시보드',
    today: '오늘',
    thisWeek: '이번 주',
    thisMonth: '이번 달',
    followUpNeeded: '팔로업 필요',
    roundDistribution: '라운드별 발송 분포',
    dailyTrend: '일별 발송 추이 (최근 30일)',
    statusBreakdown: '상태별 내역',
    followUpList: '팔로업 대상',
    company: '회사명',
    email: '이메일',
    lastSent: '최종 발송일',
    daysSince: '경과 일수',
    round: '라운드',
    action: '액션',
    sendMail: '메일 발송',
    noFollowUp: '팔로업 대상이 없습니다',
    days: '일',
    roundLabel: '라운드',
    count: '건',
    loading: '로딩 중...',
    errorLoading: '데이터 로딩에 실패했습니다',
  },
}

export default function EmailDashboard() {
  const { locale } = useTranslation()
  const txt = localText[locale]

  const [stats, setStats] = useState<EmailStats | null>(null)
  const [followUp, setFollowUp] = useState<FollowUpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [statsRes, followUpRes] = await Promise.all([
          fetch('/api/email-logs?type=stats'),
          fetch('/api/email-logs?type=followup'),
        ])

        if (!statsRes.ok || !followUpRes.ok) {
          throw new Error('API request failed')
        }

        const statsJson = await statsRes.json()
        const followUpJson = await followUpRes.json()

        setStats(statsJson.data || null)
        setFollowUp(followUpJson.data || null)
      } catch {
        setError(txt.errorLoading)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [txt.errorLoading])

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Clock size={20} className="animate-spin me-2 text-gray-400" />
        <span className="text-gray-500">{txt.loading}</span>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 text-red-500">
        <AlertCircle size={20} className="me-2" />
        <span>{error || txt.errorLoading}</span>
      </div>
    )
  }

  const todayPercent = stats.dailyLimit > 0
    ? Math.round((stats.today / stats.dailyLimit) * 100)
    : 0

  const roundChartData = stats.roundBreakdown.map((r) => ({
    name: `${txt.roundLabel} ${r.round}`,
    value: r.count,
  }))

  const sortedFollowUps = followUp
    ? [...followUp.companies]
        .sort((a, b) => b.daysSince - a.daysSince)
        .slice(0, 20)
    : []

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="row g-3">
        {/* Today */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex align-items-start justify-content-between">
              <div className="flex-fill">
                <p className="stat-label">{txt.today}</p>
                <p className="stat-value mt-1">
                  {stats.today} / {stats.dailyLimit}
                </p>
                <div className="mt-2 progress" style={{ height: '0.5rem' }}>
                  <div
                    className={`progress-bar ${
                      todayPercent >= 90
                        ? 'bg-danger'
                        : todayPercent >= 70
                          ? 'bg-warning'
                          : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(todayPercent, 100)}%` }}
                  />
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 text-primary ms-2">
                <Mail size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <p className="stat-label">{txt.thisWeek}</p>
                <p className="stat-value mt-1">{stats.week}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50 text-success">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <p className="stat-label">{txt.thisMonth}</p>
                <p className="stat-value mt-1">{stats.month}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 text-purple">
                <Calendar size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up Needed */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <p className="stat-label">{txt.followUpNeeded}</p>
                <p className="stat-value mt-1 d-flex align-items-center gap-2">
                  {followUp?.count ?? 0}
                  {followUp && followUp.count > 0 && (
                    <span className="badge bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded">
                      {followUp.count}
                    </span>
                  )}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-50 text-warning">
                <Bell size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4">
        {/* Round Distribution PieChart */}
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <BarChart3 size={16} />
                {txt.roundDistribution}
              </h3>
            </div>
            <div className="card-body">
              <div style={{ height: '16rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roundChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roundChartData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROUND_COLORS[index % ROUND_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => [
                        `${value ?? 0} ${txt.count}`,
                        name ?? '',
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trend BarChart */}
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <TrendingUp size={16} />
                {txt.dailyTrend}
              </h3>
            </div>
            <div className="card-body">
              <div style={{ height: '16rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.dailyTrend}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val: string) => {
                        const d = new Date(val)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => {
                        const d = new Date(String(label))
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                      }}
                      formatter={(value: number | undefined) => [
                        `${value ?? 0} ${txt.count}`,
                        txt.today,
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      {stats.statusBreakdown.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title d-flex align-items-center gap-2">
              <AlertCircle size={16} />
              {txt.statusBreakdown}
            </h3>
          </div>
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              {stats.statusBreakdown.map((s) => (
                <span
                  key={s.status}
                  className={`badge d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                    STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {s.status}
                  <span className="fw-bold ms-1">{s.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title d-flex align-items-center gap-2">
            <Bell size={16} />
            {txt.followUpList}
            {followUp && followUp.count > 0 && (
              <span className="badge bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded ms-2">
                {followUp.count}
              </span>
            )}
          </h3>
        </div>
        <div className="card-body">
          {sortedFollowUps.length === 0 ? (
            <div className="text-center py-5 text-gray-400">
              <Mail size={40} className="mx-auto mb-2 opacity-30" />
              <p>{txt.noFollowUp}</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="table table-sm table-vcenter">
                <thead>
                  <tr>
                    <th>{txt.company}</th>
                    <th>{txt.email}</th>
                    <th>{txt.lastSent}</th>
                    <th>{txt.daysSince}</th>
                    <th>{txt.round}</th>
                    <th>{txt.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFollowUps.map((c) => (
                    <tr
                      key={c.companyId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="fw-medium text-gray-800">
                        {c.companyName}
                        {c.region && (
                          <span className="ms-1 text-xs text-gray-400">
                            ({c.region})
                          </span>
                        )}
                      </td>
                      <td className="text-gray-600 truncate" style={{ maxWidth: '200px' }}>
                        {c.recipientEmail}
                      </td>
                      <td className="text-gray-500">
                        {new Date(c.lastSentAt).toLocaleDateString(
                          locale === 'ja' ? 'ja-JP' : 'ko-KR'
                        )}
                      </td>
                      <td>
                        <span
                          className={`fw-medium ${
                            c.daysSince >= 14
                              ? 'text-red-600'
                              : c.daysSince >= 7
                                ? 'text-orange-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {c.daysSince} {txt.days}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          {txt.roundLabel} {c.lastContactRound}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm">
                          {txt.sendMail}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
