'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react'
import LookerEmbed from '@/components/marketing/LookerEmbed'
import { useTranslation } from '@/lib/translations'
import {
  getKPIDataByYear,
  AVAILABLE_YEARS,
  DEFAULT_YEAR,
  calculateAchievementRate,
  calculateDifference,
  getAchievementColor,
  KPIMetric
} from '@/lib/kpi-targets'

// Looker Studio URLs
const LOOKER_KPI_URL = 'https://lookerstudio.google.com/embed/reporting/109d0457-5196-442d-a5d2-6f2d00cf09a3/page/oPpTF'
const LOOKER_GSC_KPI_URL = 'https://lookerstudio.google.com/embed/reporting/c55f978e-b76b-4165-872a-605bec263e41/page/OScFF'

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// Slack KPI data type
type SlackKPIData = {
  demoCount: number
  inquiryCount: number
  totalLeads: number
  demoDetails: { date: string; company?: string; person?: string }[]
  inquiryDetails: { date: string; company?: string; person?: string }[]
}

export default function KPIPage() {
  const { t, locale } = useTranslation()
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    looker: true,
    monthly: true,
    slackDetails: true,
  })
  const [loading, setLoading] = useState(false)
  const [slackLoading, setSlackLoading] = useState(false)
  const [monthlyApiData, setMonthlyApiData] = useState<{ [month: number]: any }>({})
  const [slackData, setSlackData] = useState<{ [month: number]: SlackKPIData }>({})
  const [slackError, setSlackError] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Get KPI data for selected year
  const kpiTargets = getKPIDataByYear(selectedYear)

  // Fetch Slack KPI data for all months (2026년부터만)
  const fetchSlackData = async () => {
    // 2026년 이전 데이터는 Slack 연동 안함
    if (selectedYear < 2026) {
      setSlackData({})
      return
    }

    setSlackLoading(true)
    setSlackError(null)
    try {
      // 선택한 연도에 따라 fetch할 월 결정
      const maxMonth = selectedYear === currentYear ? currentMonth : 12
      const monthsToFetch = Array.from({ length: maxMonth }, (_, i) => ({
        year: selectedYear,
        month: i + 1
      }))

      const res = await fetch('/api/kpi/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: monthsToFetch }),
      })

      const response = await res.json()

      if (response.success && response.data) {
        const results: { [month: number]: SlackKPIData } = {}
        for (const item of response.data) {
          results[item.month] = {
            demoCount: item.demoCount,
            inquiryCount: item.inquiryCount,
            totalLeads: item.totalLeads,
            demoDetails: item.demoDetails,
            inquiryDetails: item.inquiryDetails,
          }
        }
        setSlackData(results)
      } else {
        setSlackError(response.error || 'Failed to fetch Slack data')
      }
    } catch (error) {
      console.error('Failed to fetch Slack data:', error)
      setSlackError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSlackLoading(false)
    }
  }

  // Fetch data for all months up to current month (only for current year)
  const fetchAllMonthsData = async () => {
    // Only fetch API data for current year
    if (selectedYear !== currentYear) {
      setMonthlyApiData({})
      return
    }

    setLoading(true)
    try {
      const monthsToFetch = Array.from({ length: currentMonth }, (_, i) => i + 1)
      const results: { [month: number]: any } = {}

      // Fetch all months in parallel
      await Promise.all(
        monthsToFetch.map(async (month) => {
          const startDate = `${selectedYear}-${String(month).padStart(2, '0')}-01`
          const lastDay = new Date(selectedYear, month, 0).getDate()
          const endDate = `${selectedYear}-${String(month).padStart(2, '0')}-${lastDay}`

          try {
            const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`)
            const data = await res.json()
            results[month] = data
          } catch (error) {
            console.error(`Failed to fetch data for month ${month}:`, error)
          }
        })
      )

      setMonthlyApiData(results)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllMonthsData()
    fetchSlackData()
  }, [selectedYear])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getMetricName = (metric: KPIMetric) => {
    return locale === 'ja' ? metric.nameJa : metric.nameKo
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '-'
    return num.toLocaleString()
  }

  const formatPercent = (num: number) => {
    return `${num}%`
  }

  // Get actual value for a metric and month
  const getActualValue = (metric: KPIMetric, month: number): number | undefined => {
    // For 2026 and later, use Slack data for conversion metrics
    if (selectedYear >= 2026 && month <= currentMonth) {
      const slackMonthData = slackData[month]
      if (slackMonthData && metric.category === 'conversion') {
        if (metric.id === 'demo_requests') {
          return slackMonthData.demoCount
        }
        if (metric.id === 'inquiries') {
          return slackMonthData.inquiryCount
        }
        if (metric.id === 'sales_leads') {
          return slackMonthData.totalLeads
        }
      }
    }

    // For current year and months with API data, try to get from API (GSC/GA4)
    const apiData = monthlyApiData[month]
    if (selectedYear === currentYear && month <= currentMonth && apiData) {
      if (metric.category === 'gsc' && apiData.gsc && metric.apiField) {
        return apiData.gsc[metric.apiField]
      }
      if (metric.category === 'ga4' && apiData.ga4 && metric.apiField) {
        return apiData.ga4[metric.apiField]
      }
    }
    // Otherwise use stored value
    return metric.months[month]?.actual
  }

  // Category labels
  const categories = {
    gsc: { label: locale === 'ja' ? 'Search Console' : 'Search Console', color: 'bg-blue-500' },
    ga4: { label: locale === 'ja' ? 'Google Analytics' : 'Google Analytics', color: 'bg-green-500' },
    conversion: { label: locale === 'ja' ? 'コンバージョン' : '전환', color: 'bg-purple-500' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900">📈 {locale === 'ja' ? 'KPI統計' : 'KPI통계'}</h1>
          <p className="text-gray-500 mt-1">
            {locale === 'ja' ? `${selectedYear}年 月別KPI追跡` : `${selectedYear}년 월별 KPI 추적`}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* Year Selector */}
          <div className="d-flex align-items-center gap-2 bg-white border rounded-lg px-2 py-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-select form-select-sm border-0 bg-transparent"
            >
              {AVAILABLE_YEARS.map(year => (
                <option key={year} value={year}>
                  {year}{locale === 'ja' ? '年' : '년'}
                </option>
              ))}
            </select>
          </div>
          {/* Refresh Button */}
          <button
            onClick={fetchAllMonthsData}
            disabled={loading || selectedYear !== currentYear}
            className="btn btn-primary d-flex align-items-center gap-2"
            title={selectedYear !== currentYear ? (locale === 'ja' ? '過去のデータは更新できません' : '과거 데이터는 새로고침할 수 없습니다') : ''}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {locale === 'ja' ? '更新' : '새로고침'}
          </button>
        </div>
      </div>

      {/* Year Info Banner */}
      {selectedYear !== currentYear && (
        <div className="alert alert-warning">
          <p className="text-sm text-yellow-800 mb-0">
            <strong>📅 {locale === 'ja' ? '過去データ' : '과거 데이터'}:</strong>{' '}
            {locale === 'ja'
              ? `${selectedYear}年の確定データを表示しています。リアルタイム更新は現在年度のみ対応しています。`
              : `${selectedYear}년의 확정 데이터를 표시하고 있습니다. 실시간 업데이트는 현재 연도만 지원됩니다.`
            }
          </p>
        </div>
      )}

      {/* Monthly KPI Tracking Table */}
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection('monthly')}
          className="w-100 px-4 py-3 d-flex align-items-center justify-content-between bg-light hover\:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg fw-semibold text-gray-900 d-flex align-items-center gap-2 mb-0">
            📊 {locale === 'ja' ? `${selectedYear}年 月別KPI追跡テーブル` : `${selectedYear}년 월별 KPI 추적 테이블`}
          </h2>
          {expandedSections.monthly ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.monthly && (
          <div className="overflow-x-auto">
            <table className="table table-sm w-100">
              <thead>
                <tr className="bg-gray-100">
                  <th className="position-sticky start-0 bg-gray-100 px-3 py-2 text-start fw-semibold text-gray-700" style={{ left: 0, minWidth: '200px' }}>
                    {locale === 'ja' ? '指標' : '지표'}
                  </th>
                  <th className="px-2 py-2 text-start fw-semibold text-gray-700" style={{ minWidth: '80px' }}>
                    {locale === 'ja' ? '項目' : '항목'}
                  </th>
                  {months.map(month => (
                    <th
                      key={month}
                      className={`px-2 py-2 text-center fw-semibold ${
                        selectedYear === currentYear && month === currentMonth ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                      }`}
                      style={{ minWidth: '80px' }}
                    >
                      {month}{locale === 'ja' ? '月' : '월'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpiTargets.map((metric, idx) => {
                  const categoryInfo = categories[metric.category]
                  const isFirstGoogleMetric = idx === 0
                  const isFirstConversionMetric = metric.category === 'conversion' && kpiTargets[idx - 1]?.category !== 'conversion'

                  return (
                    <React.Fragment key={metric.id}>
                      {/* Section Header for Google Metrics */}
                      {isFirstGoogleMetric && (
                        <tr>
                          <td colSpan={14} className="bg-blue-600 px-3 py-2">
                            <span className="text-white fw-semibold text-sm d-flex align-items-center gap-2">
                              🔍 Google {locale === 'ja' ? '指標' : '지표'} (Search Console / Analytics)
                            </span>
                          </td>
                        </tr>
                      )}
                      {/* Section Header for Conversion Metrics */}
                      {isFirstConversionMetric && (
                        <tr>
                          <td colSpan={14} className="bg-purple-600 px-3 py-2">
                            <span className="text-white fw-semibold text-sm d-flex align-items-center gap-2">
                              💼 KC{locale === 'ja' ? 'コーポレーションサイト' : ' 코퍼레이션 사이트'} ({locale === 'ja' ? 'デモ・問い合わせ・リード' : '데모·문의·리드'})
                            </span>
                          </td>
                        </tr>
                      )}
                      {/* Target Row */}
                      <tr key={`${metric.id}-target`} className="border-top">
                        <td rowSpan={4} className="position-sticky start-0 bg-white px-3 py-2 fw-medium text-gray-900 border-end" style={{ left: 0 }}>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`rounded-full ${categoryInfo.color}`} style={{ width: 8, height: 8, display: 'inline-block' }}></span>
                            {getMetricName(metric)}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-500 bg-gray-50">Target</td>
                        {months.map(month => (
                          <td key={month} className={`px-2 py-2 text-center ${selectedYear === currentYear && month === currentMonth ? 'bg-blue-50' : ''}`}>
                            {formatNumber(metric.months[month]?.target)}
                          </td>
                        ))}
                      </tr>
                      {/* Actual Row */}
                      <tr key={`${metric.id}-actual`} className="bg-white">
                        <td className="px-2 py-2 text-gray-500 bg-gray-50">Actual</td>
                        {months.map(month => {
                          const actual = getActualValue(metric, month)
                          const isCurrentMonth = selectedYear === currentYear && month === currentMonth
                          return (
                            <td key={month} className={`px-2 py-2 text-center fw-medium ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
                              {formatNumber(actual)}
                            </td>
                          )
                        })}
                      </tr>
                      {/* Achievement Rate Row */}
                      <tr key={`${metric.id}-rate`} className="bg-white">
                        <td className="px-2 py-2 text-gray-500 bg-gray-50">
                          {locale === 'ja' ? '達成率' : '달성률'}
                        </td>
                        {months.map(month => {
                          const actual = getActualValue(metric, month)
                          const target = metric.months[month]?.target || 0
                          const rate = calculateAchievementRate(actual, target)
                          const colorClass = actual ? getAchievementColor(rate) : ''
                          const isCurrentMonth = selectedYear === currentYear && month === currentMonth
                          return (
                            <td key={month} className={`px-2 py-2 text-center ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
                              {actual !== undefined ? (
                                <span className={`px-2 py-1 rounded text-xs fw-medium ${colorClass}`}>
                                  {formatPercent(rate)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                      {/* Difference Row */}
                      <tr key={`${metric.id}-diff`} className="bg-white border-bottom">
                        <td className="px-2 py-2 text-gray-500 bg-gray-50">
                          {locale === 'ja' ? '差異' : '차이'}
                        </td>
                        {months.map(month => {
                          const actual = getActualValue(metric, month)
                          const target = metric.months[month]?.target || 0
                          const diff = calculateDifference(actual, target)
                          const isPositive = diff >= 0
                          const isCurrentMonth = selectedYear === currentYear && month === currentMonth
                          return (
                            <td key={month} className={`px-2 py-2 text-center ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
                              {actual !== undefined ? (
                                <span className={`text-xs fw-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : ''}{formatNumber(diff)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="d-flex flex-wrap gap-3 text-sm">
        <div className="d-flex align-items-center gap-2">
          <span className="rounded-full bg-blue-500" style={{ width: 12, height: 12, display: 'inline-block' }}></span>
          <span>Search Console</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="rounded-full bg-green-500" style={{ width: 12, height: 12, display: 'inline-block' }}></span>
          <span>Google Analytics</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="rounded-full bg-purple-500" style={{ width: 12, height: 12, display: 'inline-block' }}></span>
          <span>{locale === 'ja' ? 'コンバージョン' : '전환'}</span>
        </div>
        <div className="d-flex align-items-center gap-2 ms-3">
          <span className="px-2 py-1 rounded text-xs bg-green-50 text-green-600">≥100%</span>
          <span className="px-2 py-1 rounded text-xs bg-yellow-50 text-yellow-600">≥80%</span>
          <span className="px-2 py-1 rounded text-xs bg-red-50 text-red-600">&lt;80%</span>
        </div>
      </div>

      {/* Slack Data Details Section (2026년부터만 표시) */}
      {selectedYear >= 2026 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => toggleSection('slackDetails')}
            className="w-100 px-4 py-3 d-flex align-items-center justify-content-between bg-purple-50 hover\:bg-purple-100 transition-colors"
          >
            <h2 className="text-lg fw-semibold text-gray-900 d-flex align-items-center gap-2 mb-0">
              💬 Slack {locale === 'ja' ? 'リード詳細' : '리드 상세'}
              {slackLoading && <RefreshCw size={16} className="animate-spin text-purple-600" />}
              <span title={locale === 'ja'
                ? 'カウント条件: Slackに新規投稿 + スレッド返信1件以上'
                : '카운트 조건: Slack에 신규 게시 + 스레드 댓글 1건 이상'}>
                <Info size={16} className="text-gray-400" style={{ cursor: 'help' }} />
              </span>
            </h2>
            <div className="d-flex align-items-center gap-2">
              {slackError ? (
                <span className="text-xs text-red-500">{locale === 'ja' ? '接続エラー' : '연결 오류'}</span>
              ) : Object.keys(slackData).length > 0 ? (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  {locale === 'ja' ? '接続済み' : '연결됨'}
                </span>
              ) : (
                <span className="text-xs text-gray-500">{locale === 'ja' ? '未設定' : '미설정'}</span>
              )}
              {expandedSections.slackDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {expandedSections.slackDetails && (
            <div className="p-4">
              {slackError ? (
                <div className="alert alert-danger">
                  <p className="text-sm text-red-800 mb-0">
                    <strong>⚠️ {locale === 'ja' ? 'エラー' : '오류'}:</strong> {slackError}
                  </p>
                  <p className="text-xs text-red-600 mt-2 mb-0">
                    {locale === 'ja'
                      ? '環境変数 SLACK_BOT_TOKEN, SLACK_DEMO_CHANNEL_ID, SLACK_INQUIRY_CHANNEL_ID を設定してください。'
                      : '환경변수 SLACK_BOT_TOKEN, SLACK_DEMO_CHANNEL_ID, SLACK_INQUIRY_CHANNEL_ID를 설정해주세요.'}
                  </p>
                </div>
              ) : Object.keys(slackData).length === 0 ? (
                <div className="alert alert-warning">
                  <p className="text-sm text-yellow-800 mb-0">
                    {locale === 'ja'
                      ? 'Slack連動が設定されていません。環境変数を設定してください。'
                      : 'Slack 연동이 설정되지 않았습니다. 환경변수를 설정해주세요.'}
                  </p>
                </div>
              ) : (
                <div className="row g-4">
                  {/* デモ申し込み Details */}
                  <div className="col-12 col-lg-6">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-blue-50 border-bottom">
                        <h3 className="fw-medium text-gray-900 d-flex align-items-center gap-2 mb-0">
                          📅 {locale === 'ja' ? 'デモ申し込み' : '데모 신청'}
                          <span className="text-blue-600">
                            ({slackData[currentMonth]?.demoCount || 0}{locale === 'ja' ? '件' : '건'})
                          </span>
                          <span title={locale === 'ja' ? 'TimeRexからの予定追加 + 返信1件以上' : 'TimeRex 예약 + 댓글 1건 이상'}>
                            <Info size={14} className="text-gray-400" style={{ cursor: 'help' }} />
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 mb-0">#07_デモ依頼</p>
                      </div>
                      <div style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                        {slackData[currentMonth]?.demoDetails?.length > 0 ? (
                          <ul className="list-unstyled divide-y mb-0">
                            {slackData[currentMonth].demoDetails.map((item, idx) => (
                              <li key={idx} className="px-3 py-2 text-sm">
                                <span className="text-gray-500">{item.date}</span>
                                {item.company && <span className="ms-2 fw-medium">{item.company}</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="px-3 py-4 text-center text-gray-400 text-sm mb-0">
                            {locale === 'ja' ? '今月のデータはありません' : '이번달 데이터가 없습니다'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* お問合せ Details */}
                  <div className="col-12 col-lg-6">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-green-50 border-bottom">
                        <h3 className="fw-medium text-gray-900 d-flex align-items-center gap-2 mb-0">
                          📧 {locale === 'ja' ? 'お問合せ' : '문의'}
                          <span className="text-green-600">
                            ({slackData[currentMonth]?.inquiryCount || 0}{locale === 'ja' ? '件' : '건'})
                          </span>
                          <span title={locale === 'ja' ? 'Jotformフォーム送信 + 返信1件以上' : 'Jotform 양식 제출 + 댓글 1건 이상'}>
                            <Info size={14} className="text-gray-400" style={{ cursor: 'help' }} />
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 mb-0">#08_お問い合わせ</p>
                      </div>
                      <div style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                        {slackData[currentMonth]?.inquiryDetails?.length > 0 ? (
                          <ul className="list-unstyled divide-y mb-0">
                            {slackData[currentMonth].inquiryDetails.map((item, idx) => (
                              <li key={idx} className="px-3 py-2 text-sm">
                                <span className="text-gray-500">{item.date}</span>
                                {item.person && <span className="ms-2 fw-medium">{item.person}</span>}
                                {item.company && <span className="ms-1 text-gray-400">({item.company})</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="px-3 py-4 text-center text-gray-400 text-sm mb-0">
                            {locale === 'ja' ? '今月のデータはありません' : '이번달 데이터가 없습니다'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Looker Studio Section (Collapsible) */}
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection('looker')}
          className="w-100 px-4 py-3 d-flex align-items-center justify-content-between bg-light hover\:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg fw-semibold text-gray-900 d-flex align-items-center gap-2 mb-0">
            📈 Looker Studio {locale === 'ja' ? '詳細レポート' : '상세 리포트'}
          </h2>
          {expandedSections.looker ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.looker && (
          <div className="p-4">
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <LookerEmbed
                  title={`📊 GA4 ${locale === 'ja' ? 'レポート' : '리포트'}`}
                  embedUrl={LOOKER_KPI_URL}
                  height={800}
                />
              </div>
              <div className="col-12 col-lg-6">
                <LookerEmbed
                  title={`🔍 Search Console ${locale === 'ja' ? 'レポート' : '리포트'}`}
                  embedUrl={LOOKER_GSC_KPI_URL}
                  height={800}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="alert alert-success space-y-2">
        <p className="text-sm text-green-800 mb-0">
          <strong>✅ {locale === 'ja' ? '自動連動' : '자동 연동'}:</strong>{' '}
          {locale === 'ja'
            ? '現在年度の指標はAPIから自動取得されます。月別目標は lib/kpi-targets.ts で管理できます。'
            : '현재 연도의 지표는 API에서 자동으로 가져옵니다. 월별 목표는 lib/kpi-targets.ts에서 관리할 수 있습니다.'
          }
        </p>
        {selectedYear >= 2026 && (
          <p className="text-sm text-purple-800 mb-0">
            <strong>💬 Slack {locale === 'ja' ? '連動' : '연동'}:</strong>{' '}
            {locale === 'ja'
              ? 'デモ申し込み・お問合せは Slack チャンネルから自動カウントされます（スレッド1件以上が条件）'
              : '데모 신청·문의는 Slack 채널에서 자동 카운트됩니다 (스레드 1개 이상이 조건)'
            }
          </p>
        )}
      </div>
    </div>
  )
}
