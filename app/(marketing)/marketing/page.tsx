'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, MousePointer, Percent, TrendingUp, TrendingDown, Users, FileText, RefreshCw, Calendar, X } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

interface AnalyticsData {
  success: boolean
  period: {
    startDate: string
    endDate: string
  }
  gsc: {
    impressions: number
    impressionsTrend: number
    clicks: number
    clicksTrend: number
    ctr: number
    ctrTrend: number
    position: number
    positionTrend: number
  } | null
  ga4: {
    users: number
    usersTrend: number
    pageviews: number
    pageviewsTrend: number
  } | null
}

export default function AnalysisPage() {
  const { t, locale } = useTranslation()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('3m')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const datePickerRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `/api/analytics?period=${period}`
      if (period.startsWith('custom:')) {
        const [, startDate, endDate] = period.split(':')
        url = `/api/analytics?startDate=${startDate}&endDate=${endDate}`
      }
      const res = await fetch(url)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const TrendBadge = ({ value, invertColors = false }: { value: number, invertColors?: boolean }) => {
    const isPositive = invertColors ? value < 0 : value > 0
    const colorClass = isPositive ? 'bg-green-100 text-green-700' : value === 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
    const Icon = isPositive ? TrendingUp : value === 0 ? null : TrendingDown

    return (
      <span className={`d-inline-flex align-items-center gap-1 px-2 py-1 rounded-full text-xs fw-medium ${colorClass}`}>
        {Icon && <Icon size={12} />}
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    )
  }

  const StatCard = ({
    icon: Icon,
    title,
    value,
    unit,
    trend,
    invertTrend = false,
    color
  }: {
    icon: any
    title: string
    value: string | number
    unit?: string
    trend?: number
    invertTrend?: boolean
    color: string
  }) => (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
          {trend !== undefined && <TrendBadge value={trend} invertColors={invertTrend} />}
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl fw-bold text-gray-900 mt-1">
            {value}{unit && <span className="text-lg text-gray-500 ms-1">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  )

  const periodOptions = [
    { value: '7d', label: locale === 'ja' ? '過去7日間' : '지난 7일' },
    { value: '28d', label: locale === 'ja' ? '過去28日間' : '지난 28일' },
    { value: '1m', label: locale === 'ja' ? '過去1ヶ月' : '지난 1개월' },
    { value: '3m', label: locale === 'ja' ? '過去3ヶ月' : '지난 3개월' },
    { value: '6m', label: locale === 'ja' ? '過去6ヶ月' : '지난 6개월' },
    { value: '12m', label: locale === 'ja' ? '過去12ヶ月' : '지난 12개월' },
    { value: 'custom', label: locale === 'ja' ? 'カスタム' : '사용자 지정' },
  ]

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDatePicker(true)
    } else {
      setPeriod(value)
      setShowCustomDatePicker(false)
    }
  }

  const applyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setPeriod(`custom:${customStartDate}:${customEndDate}`)
      setShowCustomDatePicker(false)
    }
  }

  const isCustomPeriod = period.startsWith('custom:')
  const getDisplayPeriod = () => {
    if (isCustomPeriod) {
      return locale === 'ja' ? 'カスタム' : '사용자 지정'
    }
    return periodOptions.find(p => p.value === period)?.label || period
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900">📊 {locale === 'ja' ? '現況分析' : '현황분석'}</h1>
          <p className="text-gray-500 mt-1">
            {locale === 'ja' ? 'リアルタイムデータをAPIで取得' : '실시간 데이터를 API로 가져옵니다'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* Period Selector */}
          <div className="position-relative" ref={datePickerRef}>
            <select
              value={isCustomPeriod ? 'custom' : period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="form-select form-select-sm"
              style={{ minWidth: '140px' }}
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Custom Date Picker Modal */}
            {showCustomDatePicker && (
              <div className="position-absolute end-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-50" style={{ minWidth: '300px' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="fw-semibold text-gray-800 d-flex align-items-center gap-2">
                    <Calendar size={16} />
                    {locale === 'ja' ? 'カスタム期間' : '사용자 지정 기간'}
                  </h3>
                  <button
                    onClick={() => setShowCustomDatePicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="d-block text-sm text-gray-600 mb-1">
                      {locale === 'ja' ? '開始日' : '시작일'}
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div>
                    <label className="d-block text-sm text-gray-600 mb-1">
                      {locale === 'ja' ? '終了日' : '종료일'}
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <button
                    onClick={applyCustomDate}
                    disabled={!customStartDate || !customEndDate}
                    className="btn btn-primary w-100 mt-2 btn-sm"
                  >
                    {locale === 'ja' ? '適用' : '적용'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {locale === 'ja' ? '更新' : '새로고침'}
          </button>
        </div>
      </div>

      {/* Period Info */}
      {data?.period && (
        <div className="alert alert-info">
          <p className="text-sm text-blue-800">
            <strong>{locale === 'ja' ? '分析期間' : '분석기간'}:</strong> {data.period.startDate} ~ {data.period.endDate}
            <span className="ms-3 text-blue-600">
              {locale === 'ja' ? '📡 Google APIからリアルタイムで取得' : '📡 Google API에서 실시간 가져오기'}
            </span>
          </p>
        </div>
      )}

      {/* Search Console Section */}
      <div>
        <h2 className="text-lg fw-semibold text-gray-800 mb-3 d-flex align-items-center gap-2">
          🔍 Search Console
        </h2>
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-3">
            <StatCard
              icon={Eye}
              title={locale === 'ja' ? '表示回数' : '노출수'}
              value={loading ? '...' : formatNumber(data?.gsc?.impressions || 0)}
              trend={data?.gsc?.impressionsTrend}
              color="bg-blue-500"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <StatCard
              icon={MousePointer}
              title={locale === 'ja' ? 'クリック数' : '클릭수'}
              value={loading ? '...' : formatNumber(data?.gsc?.clicks || 0)}
              trend={data?.gsc?.clicksTrend}
              color="bg-green-500"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <StatCard
              icon={Percent}
              title="CTR"
              value={loading ? '...' : (data?.gsc?.ctr || 0).toFixed(2)}
              unit="%"
              trend={data?.gsc?.ctrTrend}
              color="bg-purple-500"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <StatCard
              icon={TrendingUp}
              title={locale === 'ja' ? '平均順位' : '평균순위'}
              value={loading ? '...' : (data?.gsc?.position || 0).toFixed(1)}
              unit={locale === 'ja' ? '位' : '위'}
              trend={data?.gsc?.positionTrend}
              invertTrend={true}
              color="bg-orange-500"
            />
          </div>
        </div>
      </div>

      {/* GA4 Section */}
      <div>
        <h2 className="text-lg fw-semibold text-gray-800 mb-3 d-flex align-items-center gap-2">
          📈 Google Analytics 4
        </h2>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <StatCard
              icon={Users}
              title={locale === 'ja' ? 'アクティブユーザー' : '활성 사용자'}
              value={loading ? '...' : formatNumber(data?.ga4?.users || 0)}
              trend={data?.ga4?.usersTrend}
              color="bg-indigo-500"
            />
          </div>
          <div className="col-12 col-md-6">
            <StatCard
              icon={FileText}
              title={locale === 'ja' ? 'ページビュー' : '페이지뷰'}
              value={loading ? '...' : formatNumber(data?.ga4?.pageviews || 0)}
              trend={data?.ga4?.pageviewsTrend}
              color="bg-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-gradient-dark rounded-xl p-4 text-white">
        <h3 className="text-lg fw-semibold mb-3">
          {locale === 'ja' ? '📋 サマリー' : '📋 요약'}
        </h3>
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <p className="text-gray-400 text-sm">{locale === 'ja' ? '検索露出' : '검색 노출'}</p>
            <p className="text-2xl fw-bold">
              {loading ? '...' : formatNumber(data?.gsc?.impressions || 0)}
              {data?.gsc?.impressionsTrend !== undefined && (
                <span className={`text-sm ms-2 ${data.gsc.impressionsTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.gsc.impressionsTrend >= 0 ? '↑' : '↓'} {Math.abs(data.gsc.impressionsTrend).toFixed(1)}%
                </span>
              )}
            </p>
          </div>
          <div className="col-12 col-md-4">
            <p className="text-gray-400 text-sm">{locale === 'ja' ? 'ユーザー数' : '사용자수'}</p>
            <p className="text-2xl fw-bold">
              {loading ? '...' : formatNumber(data?.ga4?.users || 0)}
              {data?.ga4?.usersTrend !== undefined && (
                <span className={`text-sm ms-2 ${data.ga4.usersTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.ga4.usersTrend >= 0 ? '↑' : '↓'} {Math.abs(data.ga4.usersTrend).toFixed(1)}%
                </span>
              )}
            </p>
          </div>
          <div className="col-12 col-md-4">
            <p className="text-gray-400 text-sm">{locale === 'ja' ? 'CTR改善必要' : 'CTR 개선 필요'}</p>
            <p className="text-2xl fw-bold">
              {loading ? '...' : (data?.gsc?.ctr || 0).toFixed(2)}%
              <span className="text-sm ms-2 text-yellow-400">
                {locale === 'ja' ? '目標: 1.3%' : '목표: 1.3%'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
