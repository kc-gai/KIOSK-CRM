'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useLocale } from 'next-intl'
import {
    devTasks, processCategories, type DevTask as KioskDevTask, type TaskStatus as KioskTaskStatus, type ProcessCategory,
} from '@/lib/dev-progress'
import {
    MARKETING_DEV_CATEGORIES, getMarketingAllTasks, getMarketingCategoryProgress, getMarketingTotalStats,
    type MarketingDevCategory, type MarketingDevTask, type MarketingTaskStatus, type MarketingCategoryIcon,
} from '@/lib/marketing-dev-progress'

// ==========================================
// 키오스크 관련 로직
// ==========================================

interface KioskTaskState {
    id: string
    subtaskStates: Record<string, boolean>
    lastUpdated: string
}

function useKioskTasks() {
    const [taskStates, setTaskStates] = useState<Record<string, Record<string, boolean>>>({})

    useEffect(() => {
        const saved = localStorage.getItem('dev-tasks-states-v2')
        if (saved) {
            const parsed: KioskTaskState[] = JSON.parse(saved)
            const statesMap: Record<string, Record<string, boolean>> = {}
            parsed.forEach(state => {
                statesMap[state.id] = state.subtaskStates
            })
            setTaskStates(statesMap)
        }
    }, [])

    const tasks = useMemo(() => {
        return devTasks.map(task => {
            if (!task.subtasks) return task
            const savedStates = taskStates[task.id] || {}
            const subtasksWithState = task.subtasks.map(st => ({
                ...st,
                completed: savedStates[st.id] !== undefined ? savedStates[st.id] : st.completed
            }))
            const completedCount = subtasksWithState.filter(st => st.completed).length
            const progress = Math.round((completedCount / subtasksWithState.length) * 100)
            const status: KioskTaskStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : task.status
            return { ...task, subtasks: subtasksWithState, progress, status }
        })
    }, [taskStates])

    const stats = useMemo(() => {
        const completed = tasks.filter(t => t.status === 'completed').length
        const inProgress = tasks.filter(t => t.status === 'in_progress').length
        const pending = tasks.filter(t => t.status === 'pending').length
        const totalProgress = tasks.length > 0
            ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
            : 0
        return { total: tasks.length, completed, inProgress, pending, totalProgress }
    }, [tasks])

    // 카테고리별 그룹핑
    const tasksByCategory = useMemo(() => {
        const map: Record<ProcessCategory, KioskDevTask[]> = {
            order: [], delivery: [], installation: [], assets: [], statistics: [], partners: [], common: []
        }
        tasks.forEach(t => {
            if (map[t.processCategory]) {
                map[t.processCategory].push(t)
            }
        })
        return map
    }, [tasks])

    return { tasks, stats, tasksByCategory }
}

// ==========================================
// Progress color helper
// ==========================================

function getProgressColor(progress: number): string {
    if (progress === 100) return 'bg-success'
    if (progress >= 60) return 'bg-primary'
    if (progress >= 30) return 'bg-warning'
    return 'bg-secondary'
}

function getProgressColorTw(progress: number): string {
    if (progress === 100) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 30) return 'bg-yellow-500'
    return 'bg-gray-300'
}

// ==========================================
// Main Page
// ==========================================

export default function SharedDevTasksPage() {
    const locale = useLocale()
    const isJa = locale === 'ja'
    const [activeTab, setActiveTab] = useState<'kiosk' | 'marketing'>('kiosk')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    const kiosk = useKioskTasks()
    const marketingStats = useMemo(() => getMarketingTotalStats(), [])

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const currentStats = activeTab === 'kiosk' ? kiosk.stats : marketingStats

    return (
        <div>
            {/* Page Header */}
            <div className="mb-4">
                <h1 className="fw-bold" style={{ fontSize: '1.5rem' }}>
                    <i className="ti ti-list-check me-2 text-primary"></i>
                    {isJa ? '開発状況' : '개발현황'}
                </h1>
                <p className="text-muted small">
                    {isJa ? 'プロジェクト別の開発進捗を一覧で確認' : '프로젝트별 개발 진척을 한눈에 확인'}
                </p>
            </div>

            {/* Project Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'kiosk' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('kiosk'); setExpandedCategories(new Set()) }}
                    >
                        <i className="ti ti-device-desktop me-1"></i>
                        Kiosk Asset CRM
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'marketing' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('marketing'); setExpandedCategories(new Set()) }}
                    >
                        <i className="ti ti-chart-line me-1"></i>
                        Marketing SEO CRM
                    </button>
                </li>
            </ul>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2">
                                <span className="avatar avatar-sm bg-blue-lt">
                                    <i className="ti ti-chart-bar"></i>
                                </span>
                                <div>
                                    <div className="text-muted small">{isJa ? '全体進捗' : '전체 진척도'}</div>
                                    <div className="h3 mb-0">{currentStats.totalProgress}%</div>
                                </div>
                            </div>
                            <div className="progress mt-2" style={{ height: '4px' }}>
                                <div className={`progress-bar ${getProgressColor(currentStats.totalProgress)}`} style={{ width: `${currentStats.totalProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2">
                                <span className="avatar avatar-sm bg-green-lt">
                                    <i className="ti ti-circle-check"></i>
                                </span>
                                <div>
                                    <div className="text-muted small">{isJa ? '完了' : '완료'}</div>
                                    <div className="h3 mb-0">{currentStats.completed}<span className="text-muted fs-5">/{currentStats.total}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2">
                                <span className="avatar avatar-sm bg-blue-lt">
                                    <i className="ti ti-clock"></i>
                                </span>
                                <div>
                                    <div className="text-muted small">{isJa ? '進行中' : '진행중'}</div>
                                    <div className="h3 mb-0">{currentStats.inProgress}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2">
                                <span className="avatar avatar-sm bg-yellow-lt">
                                    <i className="ti ti-circle-dashed"></i>
                                </span>
                                <div>
                                    <div className="text-muted small">{isJa ? '待機' : '대기'}</div>
                                    <div className="h3 mb-0">{currentStats.pending}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content by Tab */}
            {activeTab === 'kiosk' ? (
                <KioskDevTasksView
                    tasksByCategory={kiosk.tasksByCategory}
                    expandedCategories={expandedCategories}
                    toggleCategory={toggleCategory}
                    isJa={isJa}
                />
            ) : (
                <MarketingDevTasksView
                    expandedCategories={expandedCategories}
                    toggleCategory={toggleCategory}
                    isJa={isJa}
                />
            )}

            {/* Link to full page */}
            <div className="text-center mt-4 pt-3 border-top">
                <a
                    href={activeTab === 'kiosk' ? '/dashboard/dev-tasks' : '/marketing/dev-tasks'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm"
                >
                    <i className="ti ti-external-link me-1"></i>
                    {isJa
                        ? `${activeTab === 'kiosk' ? 'キオスク' : 'マーケティング'}の詳細ページへ`
                        : `${activeTab === 'kiosk' ? '키오스크' : '마케팅'} 상세 페이지로 이동`
                    }
                </a>
            </div>
        </div>
    )
}

// ==========================================
// 키오스크 개발현황 뷰
// ==========================================

function KioskDevTasksView({
    tasksByCategory, expandedCategories, toggleCategory, isJa,
}: {
    tasksByCategory: Record<ProcessCategory, KioskDevTask[]>
    expandedCategories: Set<string>
    toggleCategory: (id: string) => void
    isJa: boolean
}) {
    const categories = Object.entries(processCategories) as [ProcessCategory, typeof processCategories[ProcessCategory]][]

    return (
        <div className="row g-3">
            {categories.map(([key, cat]) => {
                const tasks = tasksByCategory[key]
                if (!tasks || tasks.length === 0) return null
                const completedCount = tasks.filter(t => t.status === 'completed').length
                const progress = Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
                const isExpanded = expandedCategories.has(key)

                return (
                    <div key={key} className="col-12 col-lg-6">
                        <div className="card">
                            <div
                                className="card-header d-flex align-items-center justify-content-between"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleCategory(key)}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <i className={`ti ${cat.icon} text-primary`}></i>
                                    <span className="fw-bold">
                                        {isJa ? cat.labelJa : cat.labelKo}
                                    </span>
                                    <span className="badge bg-secondary-lt">{completedCount}/{tasks.length}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted small">{progress}%</span>
                                    <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} text-muted`}></i>
                                </div>
                            </div>
                            <div className="progress" style={{ height: '3px', borderRadius: 0 }}>
                                <div className={`progress-bar ${getProgressColor(progress)}`} style={{ width: `${progress}%` }}></div>
                            </div>
                            {isExpanded && (
                                <div className="list-group list-group-flush">
                                    {tasks.map(task => (
                                        <div key={task.id} className="list-group-item py-2">
                                            <div className="d-flex align-items-center gap-2">
                                                {task.status === 'completed' ? (
                                                    <i className="ti ti-circle-check text-success"></i>
                                                ) : task.status === 'in_progress' ? (
                                                    <i className="ti ti-clock text-primary"></i>
                                                ) : (
                                                    <i className="ti ti-circle-dashed text-muted"></i>
                                                )}
                                                <div className="flex-1">
                                                    <div className={`small ${task.status === 'completed' ? 'text-muted' : 'fw-medium'}`}>
                                                        {isJa ? task.titleJa : task.titleKo}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-1" style={{ width: '80px' }}>
                                                    <div className="progress flex-1" style={{ height: '4px' }}>
                                                        <div className={`progress-bar ${getProgressColor(task.progress)}`} style={{ width: `${task.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-muted" style={{ fontSize: '0.7rem', width: '30px', textAlign: 'right' }}>{task.progress}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ==========================================
// 마케팅 개발현황 뷰
// ==========================================

function MarketingDevTasksView({
    expandedCategories, toggleCategory, isJa,
}: {
    expandedCategories: Set<string>
    toggleCategory: (id: string) => void
    isJa: boolean
}) {
    const CATEGORY_ICONS: Record<MarketingCategoryIcon, string> = {
        dashboard: 'ti-layout-dashboard',
        globe: 'ti-globe',
        send: 'ti-send',
        chart: 'ti-chart-line',
        code: 'ti-code',
        calendar: 'ti-calendar',
        settings: 'ti-settings',
    }

    return (
        <div className="row g-3">
            {MARKETING_DEV_CATEGORIES.map(cat => {
                const allTasks = getMarketingAllTasks(cat)
                const completedCount = allTasks.filter(t => t.status === 'completed').length
                const progress = getMarketingCategoryProgress(cat)
                const isExpanded = expandedCategories.has(cat.id)

                return (
                    <div key={cat.id} className="col-12 col-lg-6">
                        <div className="card">
                            <div
                                className="card-header d-flex align-items-center justify-content-between"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleCategory(cat.id)}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <i className={`ti ${CATEGORY_ICONS[cat.icon]}`} style={{ color: cat.color }}></i>
                                    <span className="fw-bold">
                                        {isJa ? cat.title : cat.titleKo}
                                    </span>
                                    <span className="badge bg-secondary-lt">{completedCount}/{allTasks.length}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted small">{progress}%</span>
                                    <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} text-muted`}></i>
                                </div>
                            </div>
                            <div className="progress" style={{ height: '3px', borderRadius: 0 }}>
                                <div className={`progress-bar`} style={{ width: `${progress}%`, backgroundColor: cat.color }}></div>
                            </div>
                            {isExpanded && (
                                <div className="list-group list-group-flush">
                                    {cat.subMenus.map(sm => (
                                        <React.Fragment key={sm.id}>
                                            {cat.subMenus.length > 1 && (
                                                <div className="list-group-item bg-light py-1 px-3">
                                                    <small className="fw-bold text-muted">{isJa ? sm.nameJa : sm.name}</small>
                                                </div>
                                            )}
                                            {sm.tasks.map(task => (
                                                <div key={task.id} className="list-group-item py-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {task.status === 'completed' ? (
                                                            <i className="ti ti-circle-check text-success"></i>
                                                        ) : task.status === 'in_progress' ? (
                                                            <i className="ti ti-clock text-primary"></i>
                                                        ) : (
                                                            <i className="ti ti-circle-dashed text-muted"></i>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className={`small ${task.status === 'completed' ? 'text-muted' : 'fw-medium'}`}>
                                                                {isJa ? task.titleJa : task.title}
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-1" style={{ width: '80px' }}>
                                                            <div className="progress flex-1" style={{ height: '4px' }}>
                                                                <div className="progress-bar" style={{ width: `${task.progress}%`, backgroundColor: cat.color }}></div>
                                                            </div>
                                                            <span className="text-muted" style={{ fontSize: '0.7rem', width: '30px', textAlign: 'right' }}>{task.progress}%</span>
                                                        </div>
                                                    </div>
                                                    {task.dependencies && task.dependencies.length > 0 && (
                                                        <div className="ms-4 mt-1">
                                                            <span className="badge bg-warning-lt text-warning" style={{ fontSize: '0.65rem' }}>
                                                                <i className="ti ti-alert-triangle me-1"></i>
                                                                {isJa ? (task.dependenciesJa?.[0] || task.dependencies[0]) : task.dependencies[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
