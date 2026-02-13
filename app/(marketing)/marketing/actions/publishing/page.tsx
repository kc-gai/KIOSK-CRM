'use client'

import { useState, useEffect } from 'react'
import { Calendar, FileText, TrendingUp, BarChart2, ExternalLink, PenTool, Info, List, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useTranslation } from '@/lib/translations'

type MonthlyData = {
  month: string
  count: number
  target: number
}

type BlogPost = {
  url: string
  lastmod: string | null
}

type YearSummary = {
  year: number
  total: number
  target: number
}

type PublishingData = {
  year: number
  total: number
  target: number
  monthlyData: MonthlyData[]
  posts: BlogPost[]
  allYears: YearSummary[]
  totalPosts: number
}

export default function PublishingPage() {
  const { t, locale } = useTranslation()
  const [selectedYear, setSelectedYear] = useState(2026)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PublishingData | null>(null)
  const availableYears = [2024, 2025, 2026]

  // API에서 데이터 가져오기
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/publishing?year=${selectedYear}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  // 연간 달성률
  const yearlyAchievementRate = data ? Math.round((data.total / data.target) * 100) : 0

  // 월 평균
  const monthsWithData = data?.monthlyData?.filter(m => m.count > 0).length || 1
  const monthlyAverage = data ? (data.total / Math.max(monthsWithData, 1)).toFixed(1) : '0'

  // URL에서 제목 추출
  const extractTitleFromUrl = (url: string) => {
    const parts = url.split('/')
    const slug = parts[parts.length - 1] || parts[parts.length - 2]
    return slug
      .replace(/-/g, ' ')
      .replace(/\.(html|htm)$/, '')
      .trim()
  }

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900 d-flex align-items-center gap-2">
            <PenTool size={24} className="text-primary" />
            {locale === 'ja' ? 'コンテンツ発行' : '콘텐츠 발행'}
            <span className="text-sm fw-normal text-gray-400 ms-1">
              {locale === 'ja' ? '(旧サイト: ブログ + ニュース)' : '(구 사이트: 블로그 + 뉴스)'}
            </span>
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'ja'
              ? 'サイトマップ基準 (2026年からサイトマップ基準で自動抽出)'
              : '사이트맵 기준 (2026년부터 사이트맵 기준 자동 추출)'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* 연도 선택기 */}
          <div className="position-relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-select form-select-sm"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}{locale === 'ja' ? '年' : '년'}
                </option>
              ))}
            </select>
          </div>
          {/* 새로고침 버튼 */}
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

      {loading && !data ? (
        <div className="d-flex align-items-center justify-content-center" style={{ height: '16rem' }}>
          <RefreshCw size={32} className="animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="btn btn-danger mt-3"
          >
            {locale === 'ja' ? '再試行' : '다시 시도'}
          </button>
        </div>
      ) : data ? (
        <>
          {/* Stats Cards */}
          <div className="row g-3">
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center gap-2">
                  <FileText size={20} className="text-gray-400" />
                  <p className="stat-label">{selectedYear}{locale === 'ja' ? '年 発行合計' : '년 발행 합계'}</p>
                </div>
                <p className="stat-value">{data.total}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'ja' ? `目標 ${data.target}件` : `목표 ${data.target}건`}
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={20} className="text-blue-400" />
                  <p className="stat-label">{locale === 'ja' ? '月平均' : '월 평균'}</p>
                </div>
                <p className="stat-value text-blue-500">{monthlyAverage}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'ja' ? `目標 10件/月` : `목표 10건/월`}
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center gap-2">
                  <TrendingUp size={20} className="text-green-400" />
                  <p className="stat-label">{locale === 'ja' ? '年間目標' : '연간 목표'}</p>
                </div>
                <p className="stat-value text-green-500">{data.target}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'ja' ? '10件 × 12ヶ月' : '10건 × 12개월'}
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center gap-2">
                  <BarChart2 size={20} className="text-purple-400" />
                  <p className="stat-label">{locale === 'ja' ? '年間達成率' : '연간 달성률'}</p>
                </div>
                <p className={`stat-value ${yearlyAchievementRate >= 50 ? 'text-green-500' : 'text-orange-500'}`}>
                  {yearlyAchievementRate}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.total}/{data.target}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <BarChart2 size={20} className="text-primary" />
                {selectedYear}{locale === 'ja' ? '年 月別発行統計' : '년 월별 발행 통계'}
              </h3>
              <span className="badge badge-info">
                {locale === 'ja' ? `合計 ${data.total}件` : `합계 ${data.total}건`}
              </span>
            </div>
            <div className="card-body">
              <div style={{ height: '18rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 12]} ticks={[0, 2, 4, 6, 8, 10, 12]} />
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => [
                        `${value ?? 0}${locale === 'ja' ? '件' : '건'}`,
                        name === 'count' ? (locale === 'ja' ? '発行数' : '발행 수') : (locale === 'ja' ? '目標' : '목표')
                      ]}
                    />
                    <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="5 5" label={{ value: locale === 'ja' ? '目標10件' : '목표10건', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                    <Bar dataKey="count" fill="#206bc4" name="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 d-flex align-items-center justify-content-center gap-4 text-sm">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary rounded" style={{ width: '0.75rem', height: '0.75rem' }} />
                  <span className="text-gray-600">{locale === 'ja' ? '発行実績' : '발행 실적'}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="border-2 border-green-500 border-dashed rounded" style={{ width: '0.75rem', height: '0.75rem' }} />
                  <span className="text-gray-600">{locale === 'ja' ? '月間目標 (10件)' : '월간 목표 (10건)'}</span>
                </div>
              </div>
              {/* 인사이트 */}
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong><TrendingUp size={16} className="d-inline me-1" />{locale === 'ja' ? 'インサイト' : '인사이트'}:</strong>{' '}
                  {data.total === 0
                    ? (locale === 'ja'
                        ? `${selectedYear}年はまだ発行実績がありません。目標達成には月10件ペースが必要です`
                        : `${selectedYear}년은 아직 발행 실적이 없습니다. 목표 달성에는 월 10건 페이스가 필요합니다`)
                    : (locale === 'ja'
                        ? `${selectedYear}年は${data.total}件発行。達成率${yearlyAchievementRate}%`
                        : `${selectedYear}년은 ${data.total}건 발행. 달성률 ${yearlyAchievementRate}%`)
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Year Comparison */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <Calendar size={20} className="text-primary" />
                {locale === 'ja' ? '年度別比較' : '연도별 비교'}
              </h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {data.allYears.map((yearData) => {
                  const rate = Math.round((yearData.total / yearData.target) * 100)
                  const isSelected = yearData.year === selectedYear
                  const prevYearData = data.allYears.find(y => y.year === yearData.year - 1)
                  const growth = prevYearData && prevYearData.total > 0
                    ? Math.round(((yearData.total - prevYearData.total) / prevYearData.total) * 100)
                    : null

                  return (
                    <div key={yearData.year} className="col-md-4">
                      <div
                        onClick={() => setSelectedYear(yearData.year)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        style={{ borderWidth: '2px' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className={`text-lg fw-bold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                            {yearData.year}{locale === 'ja' ? '年' : '년'}
                          </span>
                          {growth !== null && growth !== 0 && (
                            <span className={`text-xs px-2 rounded-full ${
                              growth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`} style={{ paddingTop: '0.125rem', paddingBottom: '0.125rem' }}>
                              {growth > 0 ? '+' : ''}{growth}%
                            </span>
                          )}
                        </div>
                        <div className="text-2xl fw-bold text-gray-900 mb-1">
                          {yearData.total}{locale === 'ja' ? '件' : '건'}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-fill" style={{ height: '0.5rem' }}>
                            <div
                              className={`progress-bar ${rate >= 50 ? 'bg-green-500' : 'bg-orange-400'}`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{rate}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 text-center text-sm text-gray-500">
                {locale === 'ja'
                  ? `累計発行数: ${data.totalPosts}件 (サイトマップ基準)`
                  : `누적 발행 수: ${data.totalPosts}건 (사이트맵 기준)`}
              </div>
            </div>
          </div>

          {/* Content List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <List size={20} className="text-primary" />
                {locale === 'ja' ? 'コンテンツ一覧' : '콘텐츠 목록'}
                <span className="text-sm fw-normal text-gray-500">
                  ({data.posts.length}{locale === 'ja' ? '件' : '건'})
                </span>
              </h3>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="text-start px-3 py-2 text-sm fw-medium text-gray-600">
                      {locale === 'ja' ? 'URL / タイトル' : 'URL / 제목'}
                    </th>
                    <th className="text-start px-3 py-2 text-sm fw-medium text-gray-600" style={{ width: '8rem' }}>
                      {locale === 'ja' ? '最終更新日' : '최종 수정일'}
                    </th>
                    <th className="text-start px-3 py-2 text-sm fw-medium text-gray-600" style={{ width: '6rem' }}>
                      {locale === 'ja' ? '操作' : '액션'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.posts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-5 text-center">
                        <div className="text-gray-400">
                          <FileText size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {locale === 'ja'
                              ? `${selectedYear}年に発行されたコンテンツがありません`
                              : `${selectedYear}년에 발행된 콘텐츠가 없습니다`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.posts.slice(0, 20).map((post, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <div className="fw-medium text-gray-900 truncate max-w-md">
                            {extractTitleFromUrl(post.url)}
                          </div>
                          <p className="text-xs text-gray-400 truncate max-w-md">
                            {post.url}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm text-gray-600">
                            {formatDate(post.lastmod)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary d-flex align-items-center gap-1 text-sm"
                          >
                            <ExternalLink size={16} />
                            {locale === 'ja' ? '表示' : '보기'}
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {data.posts.length > 20 && (
                <div className="px-3 py-2 text-center text-sm text-gray-500 border-top">
                  {locale === 'ja'
                    ? `他 ${data.posts.length - 20}件のコンテンツ`
                    : `외 ${data.posts.length - 20}개의 콘텐츠`}
                </div>
              )}
            </div>
          </div>

          {/* Data Source Info */}
          <div className="alert alert-info d-flex align-items-start gap-2">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-1" />
            <p className="text-sm text-blue-800 mb-0">
              <strong>{locale === 'ja' ? 'データソース' : '데이터 출처'}:</strong>{' '}
              {locale === 'ja'
                ? 'kaflixcloud.co.jp のサイトマップから自動取得。lastmod（最終更新日）を基準に集計しています。'
                : 'kaflixcloud.co.jp 사이트맵에서 자동 수집. lastmod(최종 수정일) 기준으로 집계합니다.'}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
