'use client'

import { useState } from 'react'
import { Plus, Filter, Calendar, CheckCircle, Circle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type ActionItem = {
  id: number
  title: { ja: string; ko: string }
  priority: 'high' | 'medium' | 'low' | 'review'
  status: 'pending' | 'in_progress' | 'done' | 'blocked'
  dueDate: string
  tag: { ja: string; ko: string }
}

const initialActions: ActionItem[] = [
  // 콘텐츠 최적화 - 기존 콘텐츠 리라이팅
  { id: 1, title: { ja: '既存記事のタイトル・メタ説明改善', ko: '기존 기사 타이틀·메타 설명 개선' }, priority: 'high', status: 'pending', dueDate: '2/15', tag: { ja: 'CTR改善', ko: 'CTR개선' } },
  { id: 2, title: { ja: '【AEO】人気記事にFAQ形式追加', ko: '【AEO】인기 기사에 FAQ 형식 추가' }, priority: 'medium', status: 'pending', dueDate: '2/21', tag: { ja: 'AEO/GEO', ko: 'AEO/GEO' } },
  { id: 3, title: { ja: '【GEO】FAQSchema構造化データ実装', ko: '【GEO】FAQSchema 구조화 데이터 구현' }, priority: 'medium', status: 'pending', dueDate: '2/28', tag: { ja: 'AEO/GEO', ko: 'AEO/GEO' } },
  { id: 4, title: { ja: '【GEO】E-E-A-T強化（専門家情報・出典明記）', ko: '【GEO】E-E-A-T 강화 (전문가 정보·출처 명기)' }, priority: 'medium', status: 'pending', dueDate: '2/28', tag: { ja: 'AEO/GEO', ko: 'AEO/GEO' } },
  { id: 5, title: { ja: '低CTR記事のリライト（10記事）', ko: '저CTR 기사 리라이팅 (10개)' }, priority: 'high', status: 'in_progress', dueDate: '2/28', tag: { ja: 'リライト', ko: '리라이팅' } },
  { id: 6, title: { ja: '内部リンク構造の最適化', ko: '내부 링크 구조 최적화' }, priority: 'medium', status: 'pending', dueDate: '3/7', tag: { ja: 'SEO', ko: 'SEO' } },
  { id: 7, title: { ja: 'コアウェブバイタル改善', ko: '코어 웹 바이탈 개선' }, priority: 'low', status: 'pending', dueDate: '3/14', tag: { ja: 'テクニカル', ko: '테크니컬' } },
  { id: 8, title: { ja: '古いコンテンツの更新（2024年以前）', ko: '오래된 콘텐츠 업데이트 (2024년 이전)' }, priority: 'medium', status: 'pending', dueDate: '3/21', tag: { ja: 'リライト', ko: '리라이팅' } },
  { id: 9, title: { ja: 'モバイルページ速度最適化', ko: '모바일 페이지 속도 최적화' }, priority: 'low', status: 'done', dueDate: '2/1', tag: { ja: 'テクニカル', ko: '테크니컬' } },
]

export default function ActionsPage() {
  const { t, locale } = useTranslation()
  const [actions, setActions] = useState(initialActions)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'done'>('all')

  const priorityConfig = {
    high: { label: t.priorityHigh, color: 'bg-red-100 text-red-800' },
    medium: { label: t.priorityMedium, color: 'bg-orange-100 text-orange-800' },
    low: { label: t.priorityLow, color: 'bg-yellow-100 text-yellow-800' },
    review: { label: t.priorityReview, color: 'bg-blue-100 text-blue-800' },
  }

  const statusConfig = {
    pending: { label: t.notStarted, icon: Circle, color: 'text-gray-400' },
    in_progress: { label: t.inProgress, icon: Clock, color: 'text-blue-500' },
    done: { label: locale === 'ja' ? '完了' : '완료', icon: CheckCircle, color: 'text-green-500' },
    blocked: { label: t.blocked, icon: AlertTriangle, color: 'text-red-500' },
  }

  const filteredActions = actions.filter(action => {
    if (filter === 'all') return true
    return action.status === filter
  })

  const toggleStatus = (id: number) => {
    setActions(prev => prev.map(action => {
      if (action.id !== id) return action
      const statusOrder = ['pending', 'in_progress', 'done'] as const
      const currentIndex = statusOrder.indexOf(action.status as typeof statusOrder[number])
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
      return { ...action, status: nextStatus }
    }))
  }

  const stats = {
    total: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    done: actions.filter(a => a.status === 'done').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🔄 {locale === 'ja' ? 'コンテンツ最適化' : '콘텐츠 최적화'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'ja' ? '既存コンテンツのリライト管理' : '기존 콘텐츠 리라이팅 관리'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          {t.newTask}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-400" />
            <p className="stat-label">{t.allTasks}</p>
          </div>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{t.notStarted}</p>
          <p className="stat-value text-gray-500">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{t.inProgress}</p>
          <p className="stat-value text-blue-500">{stats.inProgress}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">{locale === 'ja' ? '完了' : '완료'}</p>
          <p className="stat-value text-green-500">{stats.done}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t.progressRate}</span>
            <span className="text-sm text-gray-500">{Math.round((stats.done / stats.total) * 100)}%</span>
          </div>
          <div className="progress h-3">
            <div
              className="progress-bar bg-success"
              style={{ width: `${(stats.done / stats.total) * 100}%` }}
            />
            <div
              className="progress-bar bg-primary"
              style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex gap-2">
          {(['all', 'pending', 'in_progress', 'done'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? t.all : statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="card">
        <div className="card-header bg-blue-50">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="card-title">{locale === 'ja' ? 'リライト対象タスク' : '리라이팅 대상 태스크'}</h3>
              <p className="text-xs text-gray-500">
                {locale === 'ja' ? 'CTR改善・AEO/GEO対応・テクニカルSEO' : 'CTR개선·AEO/GEO대응·테크니컬SEO'}
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-600">
            {stats.done}/{stats.total} {locale === 'ja' ? '完了' : '완료'}
          </span>
        </div>
        <div className="card-body p-0">
          {filteredActions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              {locale === 'ja' ? '該当するタスクがありません' : '해당하는 태스크가 없습니다'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredActions.map((action) => {
                const StatusIcon = statusConfig[action.status].icon
                const priority = priorityConfig[action.priority]

                return (
                  <div
                    key={action.id}
                    className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => toggleStatus(action.id)}
                      className="flex-shrink-0"
                    >
                      <StatusIcon
                        className={`w-5 h-5 ${statusConfig[action.status].color}`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${action.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {action.title[locale]}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${priority.color}`}>
                          {priority.label}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {action.dueDate}
                        </span>
                        <span className="text-xs text-gray-400">{action.tag[locale]}</span>
                      </div>
                    </div>
                    <button className="text-sm text-gray-400 hover:text-gray-600">
                      {t.edit}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 {locale === 'ja' ? 'ヒント' : '힌트'}:</strong>{' '}
          {locale === 'ja'
            ? '新規コンテンツの発行管理は「コンテンツ発行」メニューで確認できます。'
            : '신규 콘텐츠 발행 관리는 "콘텐츠 발행" 메뉴에서 확인할 수 있습니다.'}
        </p>
      </div>

      {/* Analysis Period Info */}
      <div className="text-xs text-gray-400 text-right">
        {locale === 'ja' ? '分析期間' : '분석기간'}: 2025/11/1 ~ 2026/2/2
      </div>
    </div>
  )
}
