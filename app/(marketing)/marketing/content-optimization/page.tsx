'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Save, Trash2, ExternalLink, Check, Loader2, TrendingUp, TrendingDown, Minus, Info, FileText, Wand2, BookOpen, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

// 고노출+저CTR 페이지 데이터 타입
interface PageData {
  page: string
  title: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

type RewriteItem = {
  id: string
  articleTitle: string
  articleUrl: string
  category: string
  initialCtr: number | null
  initialImpr: number | null
  initialClicks: number | null
  currentCtr: number | null
  currentImpr: number | null
  currentClicks: number | null
  metricsUpdatedAt: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  changes: string
  startedAt: string | null
  completedAt: string | null
}

// 초기 샘플 데이터 (빈 상태로 시작 - AI분석 탭에서 추가)
const sampleRewriteItems: RewriteItem[] = []

/*
 * Before/After 기간 정의:
 * - Before: 개선 완료일(completedAt) 기준 1개월 전 데이터
 *   예) completedAt = 2026-02-15 → Before = 2026-01-15 ~ 2026-02-14
 * - After: 개선 완료일(completedAt) 기준 1개월 후 데이터
 *   예) completedAt = 2026-02-15 → After = 2026-02-15 ~ 2026-03-14
 *
 * 주의: After 데이터는 완료 후 1개월이 지나야 의미있는 비교가 가능
 */

type TabType = 'ai-impact' | 'rewrite-manage' | 'structure-guide'

export default function ContentOptimizationPage() {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('ai-impact')
  const [rewriteItems, setRewriteItems] = useState<RewriteItem[]>(sampleRewriteItems)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    articleTitle: '',
    articleUrl: '',
    category: 'CTR改善',
    initialCtr: '',
    initialImpr: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
  })

  // 고노출+저CTR 페이지 데이터 상태
  const [pageData, setPageData] = useState<PageData[]>([])
  const [pageDataLoading, setPageDataLoading] = useState(true) // 초기 로딩 true
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [filterMinImpr, setFilterMinImpr] = useState(1000)
  const [filterMaxCtr, setFilterMaxCtr] = useState(2)

  // 고노출+저CTR 데이터 가져오기
  const fetchPageData = useCallback(async () => {
    setPageDataLoading(true)
    try {
      const res = await fetch(`/api/gsc-pages?minImpressions=${filterMinImpr}&maxCtr=${filterMaxCtr}&limit=20`)
      const data = await res.json()
      // 배열인지 확인 후 설정
      const pages = Array.isArray(data.data) ? data.data : []
      setPageData(pages)
    } catch (error) {
      console.error('Failed to fetch page data:', error)
      setPageData([])
    } finally {
      setPageDataLoading(false)
    }
  }, [filterMinImpr, filterMaxCtr])

  // 초기 로드
  useEffect(() => {
    fetchPageData()
  }, [])

  // 선택한 페이지를 리라이팅 관리에 추가
  const addSelectedToRewrite = () => {
    const newItems: RewriteItem[] = []
    selectedPages.forEach(pageUrl => {
      const page = safePageData.find(p => p.page === pageUrl)
      if (page && !rewriteItems.some(item => item.articleUrl?.includes(page.page))) {
        newItems.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          articleTitle: page.title || page.page,
          articleUrl: `https://www.kaflixcloud.co.jp${page.page}`,
          category: 'CTR改善',
          initialCtr: page.ctr,
          initialImpr: page.impressions,
          initialClicks: page.clicks,
          currentCtr: null,
          currentImpr: null,
          currentClicks: null,
          metricsUpdatedAt: null,
          status: 'NOT_STARTED',
          priority: page.impressions > 10000 ? 'HIGH' : page.impressions > 5000 ? 'MEDIUM' : 'LOW',
          changes: '',
          startedAt: null,
          completedAt: null,
        })
      }
    })

    if (newItems.length > 0) {
      setRewriteItems(prev => [...prev, ...newItems])
      setSelectedPages(new Set())
      setActiveTab('rewrite-manage')
      setSaveStatus('idle')
    }
  }

  // 페이지 선택 토글
  const togglePageSelection = (pageUrl: string) => {
    setSelectedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageUrl)) {
        next.delete(pageUrl)
      } else {
        next.add(pageUrl)
      }
      return next
    })
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const pages = Array.isArray(pageData) ? pageData : []
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set())
    } else {
      setSelectedPages(new Set(pages.map(p => p.page)))
    }
  }

  // 안전한 배열 참조
  const safePageData = Array.isArray(pageData) ? pageData : []

  const tabs = [
    { id: 'ai-impact' as TabType, label: t.tabAiImpact, icon: TrendingDown },
    { id: 'rewrite-manage' as TabType, label: t.tabRewriteManage, icon: Wand2 },
    { id: 'structure-guide' as TabType, label: t.tabStructureGuide, icon: BookOpen },
  ]

  const statusConfig = {
    NOT_STARTED: {
      label: t.notStartedStatus,
      color: 'bg-gray-100 text-gray-700',
      icon: Minus
    },
    IN_PROGRESS: {
      label: t.inProgressStatus,
      color: 'bg-blue-100 text-blue-700',
      icon: Loader2
    },
    COMPLETED: {
      label: t.completedStatus,
      color: 'bg-green-100 text-green-700',
      icon: Check
    },
  }

  const priorityConfig = {
    HIGH: { label: locale === 'ja' ? '高' : '높음', color: 'bg-red-100 text-red-700' },
    MEDIUM: { label: locale === 'ja' ? '中' : '보통', color: 'bg-orange-100 text-orange-700' },
    LOW: { label: locale === 'ja' ? '低' : '낮음', color: 'bg-yellow-100 text-yellow-700' },
  }

  const updateItemStatus = (id: string, status: RewriteItem['status']) => {
    setRewriteItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const now = new Date().toISOString()
      return {
        ...item,
        status,
        startedAt: status === 'IN_PROGRESS' && !item.startedAt ? now : item.startedAt,
        completedAt: status === 'COMPLETED' ? now : null,
      }
    }))
    setSaveStatus('idle')
  }

  const updateItemCtr = (id: string, currentCtr: string) => {
    setRewriteItems(prev => prev.map(item => {
      if (item.id !== id) return item
      return { ...item, currentCtr: currentCtr ? parseFloat(currentCtr) : null }
    }))
    setSaveStatus('idle')
  }

  const updateItemChanges = (id: string, changes: string) => {
    setRewriteItems(prev => prev.map(item => {
      if (item.id !== id) return item
      return { ...item, changes }
    }))
    setSaveStatus('idle')
  }

  const deleteItem = (id: string) => {
    setRewriteItems(prev => prev.filter(item => item.id !== id))
    setSaveStatus('idle')
  }

  // 지표 업데이트 중인 아이템 ID
  const [updatingMetricsId, setUpdatingMetricsId] = useState<string | null>(null)

  // 특정 아이템의 현재 지표 업데이트 (API에서 가져오기)
  const refreshItemMetrics = async (id: string) => {
    const item = rewriteItems.find(i => i.id === id)
    if (!item || !item.articleUrl) return

    setUpdatingMetricsId(id)
    try {
      // URL에서 페이지 경로 추출
      const url = new URL(item.articleUrl)
      const pagePath = url.pathname

      // API에서 해당 페이지 데이터 가져오기
      const res = await fetch(`/api/gsc-pages?minImpressions=0&maxCtr=100&limit=100`)
      const data = await res.json()

      if (data.success && Array.isArray(data.data)) {
        const pageData = data.data.find((p: PageData) => p.page === pagePath)
        if (pageData) {
          setRewriteItems(prev => prev.map(i => {
            if (i.id !== id) return i
            return {
              ...i,
              currentImpr: pageData.impressions,
              currentClicks: pageData.clicks,
              currentCtr: pageData.ctr,
              metricsUpdatedAt: new Date().toISOString(),
            }
          }))
          setSaveStatus('idle')
        }
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
    } finally {
      setUpdatingMetricsId(null)
    }
  }

  const addNewItem = () => {
    if (!newItem.articleTitle) return

    const item: RewriteItem = {
      id: Date.now().toString(),
      articleTitle: newItem.articleTitle,
      articleUrl: newItem.articleUrl,
      category: newItem.category,
      initialCtr: newItem.initialCtr ? parseFloat(newItem.initialCtr) : null,
      initialImpr: newItem.initialImpr ? parseInt(newItem.initialImpr) : null,
      initialClicks: null,
      currentCtr: null,
      currentImpr: null,
      currentClicks: null,
      metricsUpdatedAt: null,
      status: 'NOT_STARTED',
      priority: newItem.priority,
      changes: '',
      startedAt: null,
      completedAt: null,
    }

    setRewriteItems(prev => [...prev, item])
    setNewItem({
      articleTitle: '',
      articleUrl: '',
      category: 'CTR改善',
      initialCtr: '',
      initialImpr: '',
      priority: 'MEDIUM',
    })
    setShowAddForm(false)
    setSaveStatus('idle')
  }

  const saveData = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save data
      await new Promise(resolve => setTimeout(resolve, 500))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const stats = {
    total: rewriteItems.length,
    notStarted: rewriteItems.filter(i => i.status === 'NOT_STARTED').length,
    inProgress: rewriteItems.filter(i => i.status === 'IN_PROGRESS').length,
    completed: rewriteItems.filter(i => i.status === 'COMPLETED').length,
  }

  const getCtrChange = (item: RewriteItem) => {
    if (item.initialCtr === null || item.currentCtr === null) return null
    return ((item.currentCtr - item.initialCtr) / item.initialCtr * 100).toFixed(1)
  }

  const getImprChange = (item: RewriteItem) => {
    if (item.initialImpr === null || item.currentImpr === null) return null
    return ((item.currentImpr - item.initialImpr) / item.initialImpr * 100).toFixed(1)
  }

  const getClicksChange = (item: RewriteItem) => {
    if (item.initialClicks === null || item.currentClicks === null) return null
    return ((item.currentClicks - item.initialClicks) / item.initialClicks * 100).toFixed(1)
  }

  // Before/After 기간 계산 헬퍼 함수
  const getBeforePeriod = (completedAt: string | null) => {
    if (!completedAt) return null
    const endDate = new Date(completedAt)
    endDate.setDate(endDate.getDate() - 1) // completedAt 전날까지
    const startDate = new Date(completedAt)
    startDate.setMonth(startDate.getMonth() - 1)
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  const getAfterPeriod = (completedAt: string | null) => {
    if (!completedAt) return null
    const startDate = new Date(completedAt)
    const endDate = new Date(completedAt)
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(endDate.getDate() - 1) // 1개월 후 전날까지
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  // After 기간 측정 가능 여부 (완료 후 1개월 경과)
  const isAfterPeriodReady = (completedAt: string | null) => {
    if (!completedAt) return false
    const completedDate = new Date(completedAt)
    const oneMonthAfter = new Date(completedAt)
    oneMonthAfter.setMonth(oneMonthAfter.getMonth() + 1)
    return new Date() >= oneMonthAfter
  }

  // 날짜 포맷 (M/D 형식)
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900">✨ {t.contentOptTitle}</h1>
          <p className="text-gray-500 mt-1">{t.contentOptSubtitle}</p>
        </div>
        <button
          onClick={saveData}
          disabled={isSaving}
          className={`d-flex align-items-center gap-2 btn ${
            saveStatus === 'success'
              ? 'btn-success'
              : 'btn-primary'
          }`}
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saveStatus === 'success' ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saveStatus === 'success' ? t.saved : t.save}
        </button>
      </div>

      {/* Tabs */}
      <nav className="nav nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-link d-flex align-items-center gap-2 ${
              activeTab === tab.id
                ? 'active'
                : ''
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === 'ai-impact' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="d-flex align-items-start gap-2">
              <AlertTriangle size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="fw-medium text-blue-800">{t.highImprLowCtr}</p>
                <p className="text-sm text-blue-600 mt-1">{t.aiImpactDesc}</p>
              </div>
            </div>
          </div>

          {/* Data Period Info */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="fw-semibold text-purple-800 mb-2">
              📅 {locale === 'ja' ? 'データ期間について' : '데이터 기간 안내'}
            </h4>
            <div className="text-sm text-purple-700 space-y-1">
              <p>
                <strong>{locale === 'ja' ? '分析期間:' : '분석 기간:'}</strong>{' '}
                {locale === 'ja'
                  ? '過去3ヶ月間のSearch Consoleデータ（表示回数・クリック数・CTR・順位）'
                  : '최근 3개월간 Search Console 데이터 (노출수・클릭수・CTR・순위)'}
              </p>
              <p className="text-purple-600">
                💡 {locale === 'ja'
                  ? '※ 高表示・低CTR記事をリライト対象に追加すると、追加時点のデータがBefore値として記録されます'
                  : '※ 고노출・저CTR 기사를 리라이팅 대상에 추가하면, 추가 시점의 데이터가 Before 값으로 기록됩니다'}
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <label className="text-sm fw-medium text-gray-700">
                    {locale === 'ja' ? '最小表示回数:' : '최소 노출수:'}
                  </label>
                  <input
                    type="number"
                    value={filterMinImpr}
                    onChange={(e) => setFilterMinImpr(parseInt(e.target.value) || 0)}
                    className="form-control form-control-sm"
                    style={{ width: '6rem' }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-sm fw-medium text-gray-700">
                    {locale === 'ja' ? '最大CTR:' : '최대 CTR:'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={filterMaxCtr}
                    onChange={(e) => setFilterMaxCtr(parseFloat(e.target.value) || 0)}
                    className="form-control form-control-sm"
                    style={{ width: '5rem' }}
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <button
                  onClick={fetchPageData}
                  disabled={pageDataLoading}
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                >
                  <RefreshCw size={16} className={pageDataLoading ? 'animate-spin' : ''} />
                  {locale === 'ja' ? '更新' : '새로고침'}
                </button>
                {selectedPages.size > 0 && (
                  <button
                    onClick={addSelectedToRewrite}
                    className="btn btn-sm btn-primary d-flex align-items-center gap-2 ms-auto"
                  >
                    <ArrowRight size={16} />
                    {locale === 'ja'
                      ? `${selectedPages.size}件をリライト対象に追加`
                      : `${selectedPages.size}건을 리라이팅 대상에 추가`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Page List */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h3 className="card-title">
                {locale === 'ja' ? '高表示・低CTR記事' : '고노출・저CTR 기사'}
                <span className="ms-2 text-sm fw-normal text-gray-500">
                  ({safePageData.length}{locale === 'ja' ? '件' : '건'})
                </span>
              </h3>
              {safePageData.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedPages.size === safePageData.length
                    ? (locale === 'ja' ? '全選択解除' : '전체 선택 해제')
                    : (locale === 'ja' ? '全選択' : '전체 선택')}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              {pageDataLoading ? (
                <div className="d-flex align-items-center justify-content-center py-4">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : safePageData.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-4 text-center">
                  <FileText size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {locale === 'ja'
                      ? '条件に該当する記事がありません'
                      : '조건에 해당하는 기사가 없습니다'}
                  </p>
                </div>
              ) : (
                <table className="table table-sm table-hover">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-start text-xs fw-medium text-gray-500 uppercase" style={{ width: '2.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedPages.size === safePageData.length}
                          onChange={toggleSelectAll}
                          className="form-check-input"
                        />
                      </th>
                      <th className="px-3 py-2 text-start text-xs fw-medium text-gray-500 uppercase">
                        {locale === 'ja' ? 'ページ' : '페이지'}
                      </th>
                      <th className="px-3 py-2 text-end text-xs fw-medium text-gray-500 uppercase">
                        {locale === 'ja' ? '表示回数' : '노출수'}
                      </th>
                      <th className="px-3 py-2 text-end text-xs fw-medium text-gray-500 uppercase">
                        {locale === 'ja' ? 'クリック数' : '클릭수'}
                      </th>
                      <th className="px-3 py-2 text-end text-xs fw-medium text-gray-500 uppercase">
                        CTR
                      </th>
                      <th className="px-3 py-2 text-end text-xs fw-medium text-gray-500 uppercase">
                        {locale === 'ja' ? '順位' : '순위'}
                      </th>
                      <th className="px-3 py-2 text-center text-xs fw-medium text-gray-500 uppercase">
                        {locale === 'ja' ? '優先度' : '우선순위'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {safePageData.map((page) => {
                      const isSelected = selectedPages.has(page.page)
                      const isAlreadyAdded = rewriteItems.some(item => item.articleUrl?.includes(page.page))
                      const priority = page.impressions > 10000 ? 'HIGH' : page.impressions > 5000 ? 'MEDIUM' : 'LOW'

                      return (
                        <tr
                          key={page.page}
                          className={`cursor-pointer ${isSelected ? 'bg-blue-50' : ''} ${isAlreadyAdded ? 'opacity-50' : ''}`}
                          onClick={() => !isAlreadyAdded && togglePageSelection(page.page)}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePageSelection(page.page)}
                              disabled={isAlreadyAdded}
                              className="form-check-input"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <p className="fw-medium text-gray-900 text-sm">
                                {page.title || page.page}
                              </p>
                              <a
                                href={`https://www.kaflixcloud.co.jp${page.page}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline d-flex align-items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={12} />
                                {page.page}
                              </a>
                              {isAlreadyAdded && (
                                <span className="text-xs text-green-600 mt-1 d-block">
                                  ✓ {locale === 'ja' ? 'リライト対象済み' : '리라이팅 대상에 추가됨'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-end">
                            <span className="fw-medium text-gray-900">
                              {page.impressions.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-end text-gray-600">
                            {page.clicks.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-end">
                            <span className="text-red-600 fw-medium">
                              {page.ctr.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-end text-gray-600">
                            {page.position.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded ${priorityConfig[priority].color}`}>
                              {priorityConfig[priority].label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 {locale === 'ja' ? 'ヒント' : '힌트'}:</strong>{' '}
              {locale === 'ja'
                ? '高表示・低CTRの記事を選択し、「リライト対象に追加」ボタンでリライティング管理タブに追加できます。'
                : '고노출・저CTR 기사를 선택하고 "리라이팅 대상에 추가" 버튼으로 리라이팅 관리 탭에 추가할 수 있습니다.'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'rewrite-manage' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="row g-3">
            <div className="col-md-3">
              <div className="stat-card">
                <p className="stat-label">{locale === 'ja' ? '全記事' : '전체 기사'}</p>
                <p className="stat-value">{stats.total}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <p className="stat-label">{t.notStartedStatus}</p>
                <p className="stat-value text-gray-500">{stats.notStarted}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <p className="stat-label">{t.inProgressStatus}</p>
                <p className="stat-value text-blue-500">{stats.inProgress}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <p className="stat-label">{t.completedStatus}</p>
                <p className="stat-value text-green-500">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-sm fw-medium text-gray-700">{t.progressRate}</span>
                <span className="text-sm text-gray-500">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
              </div>
              <div className="w-100 bg-gray-200 rounded-full d-flex" style={{ height: '0.75rem', overflow: 'hidden' }}>
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`, height: '0.75rem' }}
                />
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`, height: '0.75rem' }}
                />
              </div>
            </div>
          </div>

          {/* Before/After Period Definition */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="fw-semibold text-blue-800 mb-2">
              📊 {locale === 'ja' ? 'Before/After 期間の定義' : 'Before/After 기간 정의'}
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>Before:</strong>{' '}
                {locale === 'ja'
                  ? '改善完了日の1ヶ月前のデータ（例: 完了日 2/15 → 1/15~2/14）'
                  : '개선 완료일 1개월 전 데이터 (예: 완료일 2/15 → 1/15~2/14)'}
              </p>
              <p>
                <strong>After:</strong>{' '}
                {locale === 'ja'
                  ? '改善完了日から1ヶ月後のデータ（例: 完了日 2/15 → 2/15~3/14）'
                  : '개선 완료일부터 1개월 후 데이터 (예: 완료일 2/15 → 2/15~3/14)'}
              </p>
              <p className="text-blue-600 mt-2">
                💡 {locale === 'ja'
                  ? '※ After データは完了後1ヶ月経過後に「指標更新」ボタンで取得できます'
                  : '※ After 데이터는 완료 후 1개월 경과 후 "지표 업데이트" 버튼으로 조회 가능'}
              </p>
            </div>
          </div>

          {/* Add Button */}
          <div className="d-flex justify-content-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              {t.addArticle}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="card bg-blue-50 border-blue-200">
              <div className="card-body">
                <h3 className="fw-semibold text-gray-800 mb-3">{t.addArticle}</h3>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="d-block text-sm fw-medium text-gray-700 mb-1">{t.articleTitle}</label>
                    <input
                      type="text"
                      value={newItem.articleTitle}
                      onChange={(e) => setNewItem(prev => ({ ...prev, articleTitle: e.target.value }))}
                      className="form-control"
                      placeholder={locale === 'ja' ? '記事タイトルを入力' : '기사 제목 입력'}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="d-block text-sm fw-medium text-gray-700 mb-1">{t.articleUrl}</label>
                    <input
                      type="url"
                      value={newItem.articleUrl}
                      onChange={(e) => setNewItem(prev => ({ ...prev, articleUrl: e.target.value }))}
                      className="form-control"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="d-block text-sm fw-medium text-gray-700 mb-1">{t.initialCtr} (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.initialCtr}
                      onChange={(e) => setNewItem(prev => ({ ...prev, initialCtr: e.target.value }))}
                      className="form-control"
                      placeholder="0.67"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="d-block text-sm fw-medium text-gray-700 mb-1">{t.impressions}</label>
                    <input
                      type="number"
                      value={newItem.initialImpr}
                      onChange={(e) => setNewItem(prev => ({ ...prev, initialImpr: e.target.value }))}
                      className="form-control"
                      placeholder="10000"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="d-block text-sm fw-medium text-gray-700 mb-1">{locale === 'ja' ? 'カテゴリ' : '카테고리'}</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      className="form-select"
                    >
                      <option value="CTR改善">{locale === 'ja' ? 'CTR改善' : 'CTR 개선'}</option>
                      <option value="AEO対応">{locale === 'ja' ? 'AEO対応' : 'AEO 대응'}</option>
                      <option value="構造改善">{locale === 'ja' ? '構造改善' : '구조 개선'}</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="d-block text-sm fw-medium text-gray-700 mb-1">{locale === 'ja' ? '優先度' : '우선순위'}</label>
                    <select
                      value={newItem.priority}
                      onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' }))}
                      className="form-select"
                    >
                      <option value="HIGH">{locale === 'ja' ? '高' : '높음'}</option>
                      <option value="MEDIUM">{locale === 'ja' ? '中' : '보통'}</option>
                      <option value="LOW">{locale === 'ja' ? '低' : '낮음'}</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="btn btn-ghost"
                  >
                    {locale === 'ja' ? 'キャンセル' : '취소'}
                  </button>
                  <button
                    onClick={addNewItem}
                    className="btn btn-primary"
                  >
                    {t.add}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rewrite Items - Card Layout with Before/After Comparison */}
          <div className="space-y-4">
            {rewriteItems.map((item) => {
              const ctrChange = getCtrChange(item)
              const imprChange = getImprChange(item)
              const clicksChange = getClicksChange(item)
              const isUpdating = updatingMetricsId === item.id
              const beforePeriod = getBeforePeriod(item.completedAt)
              const afterPeriod = getAfterPeriod(item.completedAt)
              const canMeasureAfter = isAfterPeriodReady(item.completedAt)

              return (
                <div key={item.id} className="card">
                  <div className="card-body">
                    {/* Header Row */}
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${priorityConfig[item.priority].color}`}>
                          {priorityConfig[item.priority].label}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${statusConfig[item.status].color}`}>
                          {statusConfig[item.status].label}
                        </span>
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          {item.category}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {item.status === 'COMPLETED' && (
                          <button
                            onClick={() => refreshItemMetrics(item.id)}
                            disabled={isUpdating || !canMeasureAfter}
                            className={`btn btn-sm d-flex align-items-center gap-1 ${
                              canMeasureAfter
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={!canMeasureAfter
                              ? (locale === 'ja' ? '完了後1ヶ月経過後に測定可能' : '완료 후 1개월 경과 후 측정 가능')
                              : (locale === 'ja' ? '指標を更新' : '지표 업데이트')}
                          >
                            <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                            {locale === 'ja' ? '指標更新' : '지표 업데이트'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="btn btn-sm btn-ghost text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Title & URL */}
                    <div className="mb-3">
                      <h4 className="fw-semibold text-gray-900">{item.articleTitle}</h4>
                      {item.articleUrl && (
                        <a
                          href={item.articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline d-flex align-items-center gap-1 mt-1"
                        >
                          <ExternalLink size={14} />
                          {item.articleUrl}
                        </a>
                      )}
                    </div>

                    {/* Period Info (only for completed items) */}
                    {item.status === 'COMPLETED' && item.completedAt && (
                      <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                        <div className="d-flex align-items-center justify-content-between text-xs">
                          <div>
                            <span className="text-purple-600 fw-medium">
                              {locale === 'ja' ? '改善完了日: ' : '개선 완료일: '}
                            </span>
                            <span className="text-purple-800">
                              {new Date(item.completedAt).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR')}
                            </span>
                          </div>
                          <div className="d-flex gap-3">
                            {beforePeriod && (
                              <span className="text-purple-600">
                                Before: {formatDateShort(beforePeriod.start)}~{formatDateShort(beforePeriod.end)}
                              </span>
                            )}
                            {afterPeriod && (
                              <span className={canMeasureAfter ? 'text-purple-600' : 'text-gray-400'}>
                                After: {formatDateShort(afterPeriod.start)}~{formatDateShort(afterPeriod.end)}
                                {!canMeasureAfter && ` (${locale === 'ja' ? '測定待ち' : '측정 대기'})`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Not Completed - Show instruction */}
                    {item.status !== 'COMPLETED' && (
                      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">
                          {locale === 'ja'
                            ? '※ Before/After比較は「完了」ステータスに変更後、1ヶ月経過後に測定できます'
                            : '※ Before/After 비교는 "완료" 상태로 변경 후 1개월 경과 후 측정 가능합니다'}
                        </p>
                      </div>
                    )}

                    {/* Before/After Metrics Comparison */}
                    <div className="row g-3 mb-3">
                      {/* Impressions */}
                      <div className="col-md-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">{locale === 'ja' ? '表示回数' : '노출수'}</p>
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              <p className="text-xs text-gray-400">Before</p>
                              <p className="fw-semibold text-gray-700">
                                {item.initialImpr?.toLocaleString() ?? '-'}
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">After</p>
                              <p className={`fw-semibold ${item.currentImpr !== null ? 'text-gray-900' : 'text-gray-300'}`}>
                                {item.currentImpr?.toLocaleString() ?? (item.status === 'COMPLETED' ? (canMeasureAfter ? '-' : locale === 'ja' ? '待機中' : '대기중') : '-')}
                              </p>
                            </div>
                            {imprChange !== null && (
                              <span className={`ms-auto text-sm fw-medium ${
                                parseFloat(imprChange) > 0 ? 'text-green-600' : parseFloat(imprChange) < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {parseFloat(imprChange) > 0 ? '+' : ''}{imprChange}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Clicks */}
                      <div className="col-md-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">{locale === 'ja' ? 'クリック数' : '클릭수'}</p>
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              <p className="text-xs text-gray-400">Before</p>
                              <p className="fw-semibold text-gray-700">
                                {item.initialClicks?.toLocaleString() ?? '-'}
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">After</p>
                              <p className={`fw-semibold ${item.currentClicks !== null ? 'text-gray-900' : 'text-gray-300'}`}>
                                {item.currentClicks?.toLocaleString() ?? (item.status === 'COMPLETED' ? (canMeasureAfter ? '-' : locale === 'ja' ? '待機中' : '대기중') : '-')}
                              </p>
                            </div>
                            {clicksChange !== null && (
                              <span className={`ms-auto text-sm fw-medium ${
                                parseFloat(clicksChange) > 0 ? 'text-green-600' : parseFloat(clicksChange) < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {parseFloat(clicksChange) > 0 ? '+' : ''}{clicksChange}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CTR */}
                      <div className="col-md-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">CTR</p>
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              <p className="text-xs text-gray-400">Before</p>
                              <p className="fw-semibold text-gray-700">
                                {item.initialCtr !== null ? `${item.initialCtr}%` : '-'}
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">After</p>
                              <p className={`fw-semibold ${item.currentCtr !== null ? 'text-gray-900' : 'text-gray-300'}`}>
                                {item.currentCtr !== null ? `${item.currentCtr}%` : (item.status === 'COMPLETED' ? (canMeasureAfter ? '-' : locale === 'ja' ? '待機中' : '대기중') : '-')}
                              </p>
                            </div>
                            {ctrChange !== null && (
                              <span className={`ms-auto d-flex align-items-center gap-1 text-sm fw-medium ${
                                parseFloat(ctrChange) > 0 ? 'text-green-600' : parseFloat(ctrChange) < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {parseFloat(ctrChange) > 0 ? <TrendingUp size={16} /> : parseFloat(ctrChange) < 0 ? <TrendingDown size={16} /> : null}
                                {parseFloat(ctrChange) > 0 ? '+' : ''}{ctrChange}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Updated Info */}
                    {item.metricsUpdatedAt && (
                      <p className="text-xs text-gray-400 mb-2">
                        {locale === 'ja' ? '指標更新日時: ' : '지표 업데이트: '}
                        {new Date(item.metricsUpdatedAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'ko-KR')}
                      </p>
                    )}

                    {/* Status & Changes */}
                    <div className="d-flex align-items-center gap-3 pt-2 border-t border-gray-100">
                      <div className="d-flex align-items-center gap-2">
                        <label className="text-xs text-gray-500">{t.rewriteStatus}:</label>
                        <select
                          value={item.status}
                          onChange={(e) => updateItemStatus(item.id, e.target.value as RewriteItem['status'])}
                          className={`text-xs px-2 py-1 rounded border-0 ${statusConfig[item.status].color}`}
                        >
                          <option value="NOT_STARTED">{t.notStartedStatus}</option>
                          <option value="IN_PROGRESS">{t.inProgressStatus}</option>
                          <option value="COMPLETED">{t.completedStatus}</option>
                        </select>
                      </div>
                      <div className="flex-fill">
                        <input
                          type="text"
                          value={item.changes}
                          onChange={(e) => updateItemChanges(item.id, e.target.value)}
                          className="form-control form-control-sm"
                          placeholder={locale === 'ja' ? '変更内容を入力...' : '변경 내용 입력...'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {rewriteItems.length === 0 && (
              <div className="card">
                <div className="card-body text-center py-4">
                  <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {locale === 'ja'
                      ? 'リライト対象の記事がありません。AI分析タブから記事を追加してください。'
                      : '리라이팅 대상 기사가 없습니다. AI분석 탭에서 기사를 추가해주세요.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'structure-guide' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t.structureGuideTitle}</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-600 mb-4">
                {locale === 'ja'
                  ? 'AI検索時代では、「AIに引用される」と「ユーザーにクリックされる」の両方を狙うコンテンツ設計が重要です。'
                  : 'AI 검색 시대에는 "AI에 인용되는 것"과 "사용자에게 클릭되는 것" 두 가지를 모두 노리는 콘텐츠 설계가 중요합니다.'}
              </p>

              <div className="row g-4">
                {/* AI Citation Section */}
                <div className="col-md-6">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="bg-purple-100 rounded-lg d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                        <span className="text-xl">🤖</span>
                      </div>
                      <h4 className="fw-semibold text-purple-800">{t.aiCitationSection}</h4>
                    </div>
                    <p className="text-sm text-purple-600 mb-3">
                      {locale === 'ja'
                        ? 'AIに引用されやすいコンテンツ要素'
                        : 'AI에 인용되기 쉬운 콘텐츠 요소'}
                    </p>
                    <ul className="space-y-3">
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-purple-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.faqFormat}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? '質問と回答の形式で情報を整理'
                              : '질문과 답변 형식으로 정보 정리'}
                          </p>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-purple-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.schemaMarkup}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? 'FAQPage, HowTo, Articleスキーマの実装'
                              : 'FAQPage, HowTo, Article 스키마 구현'}
                          </p>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-purple-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.clearDefinition}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? '「〜とは」で始まる明確な説明文'
                              : '"~란"으로 시작하는 명확한 설명문'}
                          </p>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-purple-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.featuredSnippet}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? '箇条書き、表、ステップ形式の活用'
                              : '글머리 기호, 표, 단계 형식 활용'}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Click Drive Section */}
                <div className="col-md-6">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="bg-green-100 rounded-lg d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                        <span className="text-xl">👆</span>
                      </div>
                      <h4 className="fw-semibold text-green-800">{t.clickDriveSection}</h4>
                    </div>
                    <p className="text-sm text-green-600 mb-3">
                      {locale === 'ja'
                        ? 'クリックしないと得られない価値を提供'
                        : '클릭해야만 얻을 수 있는 가치 제공'}
                    </p>
                    <ul className="space-y-3">
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.exclusiveInsight}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? '独自調査データ、業界分析、専門家意見'
                              : '독자 조사 데이터, 업계 분석, 전문가 의견'}
                          </p>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.downloadMaterial}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? 'チェックリスト、テンプレート、ガイドPDF'
                              : '체크리스트, 템플릿, 가이드 PDF'}
                          </p>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.calculator}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? '料金計算、ROI試算、比較ツール'
                              : '요금 계산, ROI 시산, 비교 도구'}
                          </p>
                        </div>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <div>
                          <p className="fw-medium text-gray-800">{t.caseStudy}</p>
                          <p className="text-xs text-gray-500">
                            {locale === 'ja'
                              ? '実際の導入事例、成功ストーリー'
                              : '실제 도입 사례, 성공 스토리'}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Implementation Tips */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="fw-semibold text-yellow-800 mb-2">
                  {locale === 'ja' ? '💡 実装のポイント' : '💡 구현 포인트'}
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• {locale === 'ja' ? '記事冒頭でAI引用用の簡潔な回答を提供し、詳細は本文で展開' : '기사 서두에 AI 인용용 간결한 답변 제공, 상세 내용은 본문에서 전개'}</li>
                  <li>• {locale === 'ja' ? 'クリック誘導コンテンツは「続きを読む」「詳しく見る」などのCTAで誘導' : '클릭 유도 콘텐츠는 "계속 읽기", "자세히 보기" 등의 CTA로 유도'}</li>
                  <li>• {locale === 'ja' ? '独自データや事例は記事の後半に配置し、最後まで読む動機を作る' : '독자 데이터나 사례는 기사 후반에 배치, 끝까지 읽을 동기 부여'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
