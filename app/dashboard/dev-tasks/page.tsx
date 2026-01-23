'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronRight, MessageSquare, Zap, FileText, Truck, BarChart, Settings, Wrench, Monitor, Building2, Link } from 'lucide-react'
import Link2 from 'next/link'
import { menuProgress } from '@/lib/dev-progress'
import { devTasks, processCategories, recommendedOrder, type DevTask, type TaskStatus, type TaskPriority, type ProcessCategory } from '@/lib/dev-progress'

// LocalStorage용 타입 (subtask 완료 상태 저장)
interface TaskState {
    id: string
    subtaskStates: Record<string, boolean>
    lastUpdated: string
}

export default function DevTasksPage() {
    const t = useTranslations('devTasks')
    const locale = useLocale()
    const isKorean = locale === 'ko'
    const isJapanese = locale === 'ja'

    const [taskStates, setTaskStates] = useState<Record<string, Record<string, boolean>>>({})
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
    const [expandedCategories, setExpandedCategories] = useState<Set<ProcessCategory>>(new Set(['order', 'delivery', 'installation', 'assets', 'statistics', 'partners', 'common']))
    const [filter, setFilter] = useState<'all' | TaskStatus | TaskPriority>('all')

    // LocalStorage에서 subtask 상태 로드
    useEffect(() => {
        const saved = localStorage.getItem('dev-tasks-states-v2')
        if (saved) {
            const parsed: TaskState[] = JSON.parse(saved)
            const statesMap: Record<string, Record<string, boolean>> = {}
            parsed.forEach(state => {
                statesMap[state.id] = state.subtaskStates
            })
            setTaskStates(statesMap)
        }
    }, [])

    // subtask 상태 저장
    const saveTaskStates = (newStates: Record<string, Record<string, boolean>>) => {
        setTaskStates(newStates)
        const stateArray: TaskState[] = Object.entries(newStates).map(([id, subtaskStates]) => ({
            id,
            subtaskStates,
            lastUpdated: new Date().toISOString()
        }))
        localStorage.setItem('dev-tasks-states-v2', JSON.stringify(stateArray))
    }

    // 중앙 데이터에 LocalStorage 상태 적용
    const getTasksWithState = () => {
        return devTasks.map(task => {
            if (!task.subtasks) return task
            const savedStates = taskStates[task.id] || {}
            const subtasksWithState = task.subtasks.map(st => ({
                ...st,
                completed: savedStates[st.id] !== undefined ? savedStates[st.id] : st.completed
            }))
            const completedCount = subtasksWithState.filter(st => st.completed).length
            const progress = Math.round((completedCount / subtasksWithState.length) * 100)
            const status: TaskStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : task.status
            return {
                ...task,
                subtasks: subtasksWithState,
                progress,
                status
            }
        })
    }

    const tasks = getTasksWithState()

    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks)
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId)
        } else {
            newExpanded.add(taskId)
        }
        setExpandedTasks(newExpanded)
    }

    const toggleCategory = (category: ProcessCategory) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(category)) {
            newExpanded.delete(category)
        } else {
            newExpanded.add(category)
        }
        setExpandedCategories(newExpanded)
    }

    const toggleSubtask = (taskId: string, subtaskId: string) => {
        const task = devTasks.find(t => t.id === taskId)
        if (!task?.subtasks) return

        const currentStates = taskStates[taskId] || {}
        const subtask = task.subtasks.find(st => st.id === subtaskId)
        const currentState = currentStates[subtaskId] !== undefined ? currentStates[subtaskId] : subtask?.completed || false

        const newStates = {
            ...taskStates,
            [taskId]: {
                ...currentStates,
                [subtaskId]: !currentState
            }
        }
        saveTaskStates(newStates)
    }

    const getStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="text-success" size={20} />
            case 'in_progress':
                return <Clock className="text-primary" size={20} />
            case 'blocked':
                return <AlertCircle className="text-danger" size={20} />
            default:
                return <Circle className="text-muted" size={20} />
        }
    }

    const getPriorityBadge = (priority: TaskPriority) => {
        const colors = {
            high: 'bg-red text-white',
            medium: 'bg-yellow text-dark',
            low: 'bg-secondary text-white'
        }
        return <span className={`badge ${colors[priority]}`}>{priority.toUpperCase()}</span>
    }

    const getCategoryIcon = (category: ProcessCategory) => {
        switch (category) {
            case 'order':
                return <FileText size={20} />
            case 'delivery':
                return <Truck size={20} />
            case 'installation':
                return <Wrench size={20} />
            case 'assets':
                return <Monitor size={20} />
            case 'statistics':
                return <BarChart size={20} />
            case 'partners':
                return <Building2 size={20} />
            case 'common':
                return <Settings size={20} />
            default:
                return <Zap size={20} />
        }
    }

    const getCategoryColor = (category: ProcessCategory) => {
        switch (category) {
            case 'order': return 'primary'
            case 'delivery': return 'info'
            case 'installation': return 'warning'
            case 'assets': return 'cyan'
            case 'statistics': return 'success'
            case 'partners': return 'purple'
            case 'common': return 'secondary'
            default: return 'secondary'
        }
    }

    // 메뉴 이름 매핑
    const menuNameMap: Record<string, { ko: string, ja: string, en: string, href: string }> = {
        'order-process': { ko: '발주 프로세스', ja: '発注プロセス', en: 'Order Process', href: '/dashboard/order' },
        'delivery-process': { ko: '납품 프로세스', ja: '納品プロセス', en: 'Delivery Process', href: '/dashboard/delivery-process' },
        'delivery-status': { ko: '발주 현황', ja: '発注状況', en: 'Delivery Status', href: '/dashboard/delivery-status' },
        'delivery-request': { ko: '납품의뢰', ja: '納品依頼', en: 'Delivery Request', href: '/dashboard/delivery-request' },
        'installation': { ko: '설치 관리', ja: '設置管理', en: 'Installation', href: '/dashboard/installation' },
        'assets': { ko: '자산 목록', ja: '資産一覧', en: 'Assets', href: '/dashboard/assets' },
        'history': { ko: '이력 관리', ja: '履歴管理', en: 'History', href: '/dashboard/history' },
        'statistics': { ko: '통계', ja: '統計', en: 'Statistics', href: '/dashboard/statistics' },
        'pricing': { ko: '매출 관리', ja: '売上管理', en: 'Pricing', href: '/dashboard/pricing' },
        'clients': { ko: '거래처 관리', ja: '取引先管理', en: 'Clients', href: '/dashboard/clients' },
        'lease-companies': { ko: '리스회사', ja: 'リース会社', en: 'Lease Companies', href: '/dashboard/lease-companies' },
        'api-settings': { ko: 'API 설정', ja: 'API設定', en: 'API Settings', href: '/dashboard/api-settings' },
        'ai-search': { ko: 'AI 검색', ja: 'AI検索', en: 'AI Search', href: '/dashboard/ai-search' },
        'dashboard': { ko: '대시보드', ja: 'ダッシュボード', en: 'Dashboard', href: '/dashboard' },
    }

    const getMenuName = (menuKey: string) => {
        const menu = menuNameMap[menuKey]
        if (!menu) return menuKey
        return isKorean ? menu.ko : (isJapanese ? menu.ja : menu.en)
    }

    const getMenuHref = (menuKey: string) => {
        return menuNameMap[menuKey]?.href || '/dashboard'
    }

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true
        if (['completed', 'in_progress', 'pending', 'blocked'].includes(filter)) {
            return task.status === filter
        }
        if (['high', 'medium', 'low'].includes(filter)) {
            return task.priority === filter
        }
        return true
    })

    // 전체 통계 계산
    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    }

    const overallProgress = tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0

    const resetTasks = () => {
        if (confirm(t('confirmReset'))) {
            saveTaskStates({})
        }
    }

    // 작업 제목/설명/노트 표시 (언어별)
    const getTaskTitle = (task: DevTask) => isKorean ? task.titleKo : (isJapanese ? task.titleJa : task.title)
    const getTaskDescription = (task: DevTask) => isKorean ? task.descriptionKo : (isJapanese ? task.descriptionJa : task.description)
    const getTaskNotes = (task: DevTask) => isKorean ? task.notesKo : (isJapanese ? task.notesJa : task.notes)
    const getCategoryLabel = (cat: ProcessCategory) => {
        const info = processCategories[cat]
        return isKorean ? info.labelKo : (isJapanese ? info.labelJa : info.label)
    }
    const getCategoryDescription = (cat: ProcessCategory) => {
        const info = processCategories[cat]
        return isKorean ? info.descriptionKo : (isJapanese ? info.descriptionJa : info.description)
    }
    const getCategoryStakeholders = (cat: ProcessCategory) => {
        const info = processCategories[cat]
        return isKorean ? info.stakeholdersKo : (isJapanese ? info.stakeholdersJa : info.stakeholders)
    }

    // 프로세스 카테고리 목록 (발주 → 납품 → 설치 → 자산 → 통계 → 거래처 → 공통)
    const categoryList: ProcessCategory[] = ['order', 'delivery', 'installation', 'assets', 'statistics', 'partners', 'common']

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">
                            <Zap className="me-2" size={24} />
                            {t('title')}
                        </h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
                    </div>
                    <div className="col-auto ms-auto">
                        <button className="btn btn-outline-secondary btn-sm" onClick={resetTasks}>
                            {t('reset')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 전체 진척도 통계 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary-lt p-3 me-3">
                                    <BarChart size={24} className="text-primary" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('overallProgress')}</div>
                                    <div className="h2 mb-0">{overallProgress}%</div>
                                </div>
                            </div>
                            <div className="progress mt-2" style={{ height: '6px' }}>
                                <div className="progress-bar bg-primary" style={{ width: `${overallProgress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success-lt p-3 me-3">
                                    <CheckCircle2 size={24} className="text-success" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('completed')}</div>
                                    <div className="h2 mb-0">{stats.completed}/{stats.total}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-blue-lt p-3 me-3">
                                    <Clock size={24} className="text-blue" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('inProgress')}</div>
                                    <div className="h2 mb-0">{stats.inProgress}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-red-lt p-3 me-3">
                                    <AlertCircle size={24} className="text-red" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('highPriorityPending')}</div>
                                    <div className="h2 mb-0">{stats.highPriority}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 프로세스별 진척도 카드 - 프로세스 순서대로 배치 (발주→납품→설치→자산→통계→거래처→공통) */}
            <div className="row row-deck row-cards mb-4">
                {categoryList.map(cat => {
                    const catTasks = tasks.filter(t => t.processCategory === cat)
                    const catCompleted = catTasks.filter(t => t.status === 'completed').length
                    const catProgress = catTasks.length > 0
                        ? Math.round(catTasks.reduce((sum, t) => sum + t.progress, 0) / catTasks.length)
                        : 0
                    return { cat, catTasks, catCompleted, catProgress }
                }).map(({ cat, catTasks, catCompleted, catProgress }) => {
                        const color = getCategoryColor(cat)
                        return (
                            <div key={cat} className="col-6 col-lg">
                                <div className={`card border-${color}`}>
                                    <div className="card-body p-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className={`rounded-circle bg-${color}-lt p-2 me-2`}>
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <div>
                                                <div className="fw-bold">{getCategoryLabel(cat)}</div>
                                                <div className="small text-muted">{catCompleted}/{catTasks.length} {t('completed')}</div>
                                            </div>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div className={`progress-bar bg-${color}`} style={{ width: `${catProgress}%` }} />
                                        </div>
                                        <div className="text-end small text-muted mt-1">{catProgress}%</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>

            {/* 필터 */}
            <div className="card mb-4">
                <div className="card-body py-2">
                    <div className="d-flex gap-2 flex-wrap">
                        <button
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilter('all')}
                        >
                            {t('filterAll')}
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'in_progress' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilter('in_progress')}
                        >
                            <Clock size={14} className="me-1" />
                            {t('filterInProgress')}
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilter('pending')}
                        >
                            <Circle size={14} className="me-1" />
                            {t('filterPending')}
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilter('completed')}
                        >
                            <CheckCircle2 size={14} className="me-1" />
                            {t('filterCompleted')}
                        </button>
                        <div className="vr mx-2"></div>
                        <button
                            className={`btn btn-sm ${filter === 'high' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setFilter('high')}
                        >
                            High
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'medium' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setFilter('medium')}
                        >
                            Medium
                        </button>
                    </div>
                </div>
            </div>

            {/* 프로세스 카테고리별 작업 목록 - 2열 배열 */}
            <div className="row" style={{ alignItems: 'flex-start' }}>
                {categoryList.map(cat => {
                    const catTasks = filteredTasks.filter(t => t.processCategory === cat)
                    if (catTasks.length === 0) return null

                    const catInfo = processCategories[cat]
                    const color = getCategoryColor(cat)
                    const isExpanded = expandedCategories.has(cat)

                    // 진행중/대기 태스크와 완료된 태스크 분리
                    const pendingTasks = catTasks.filter(t => t.status !== 'completed')
                    const completedTasks = catTasks.filter(t => t.status === 'completed')

                    // 태스크 렌더링 함수
                    const renderTask = (task: typeof catTasks[0], isCompleted: boolean) => (
                        <div key={task.id} className={`list-group-item py-2 ${isCompleted ? 'bg-light' : ''}`} style={isCompleted ? { opacity: 0.7 } : {}}>
                            <div className="row align-items-center g-2">
                                <div className="col-auto">
                                    {getStatusIcon(task.status)}
                                </div>
                                <div className="col">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <button
                                            className={`btn btn-link p-0 fw-bold text-start ${isCompleted ? 'text-decoration-line-through text-muted' : 'text-decoration-none'}`}
                                            onClick={() => toggleExpand(task.id)}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {expandedTasks.has(task.id) ? (
                                                <ChevronDown size={14} className="me-1" />
                                            ) : (
                                                <ChevronRight size={14} className="me-1" />
                                            )}
                                            {getTaskTitle(task)}
                                        </button>
                                        {!isCompleted && getPriorityBadge(task.priority)}
                                    </div>
                                    {!isCompleted && (
                                        <>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{getTaskDescription(task)}</div>
                                            {getTaskNotes(task) && (
                                                <div className="text-info mt-1" style={{ fontSize: '0.7rem' }}>
                                                    <MessageSquare size={10} className="me-1" />
                                                    {getTaskNotes(task)}
                                                </div>
                                            )}
                                            {/* 관련 메뉴 표시 */}
                                            {task.relatedMenus && task.relatedMenus.length > 0 && (
                                                <div className="d-flex flex-wrap gap-1 mt-1">
                                                    <Link size={10} className="text-muted me-1" />
                                                    {task.relatedMenus.map(menuKey => {
                                                        const progress = menuProgress[menuKey] ?? 0
                                                        return (
                                                            <Link2
                                                                key={menuKey}
                                                                href={getMenuHref(menuKey)}
                                                                className={`badge ${progress === 100 ? 'bg-success-lt text-success' : progress > 0 ? 'bg-primary-lt text-primary' : 'bg-secondary-lt text-secondary'} text-decoration-none`}
                                                                style={{ fontSize: '0.65rem' }}
                                                            >
                                                                {getMenuName(menuKey)} ({progress}%)
                                                            </Link2>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="col-auto">
                                    <div className="d-flex align-items-center gap-1">
                                        <div style={{ width: '60px' }}>
                                            <div className="progress" style={{ height: '6px' }}>
                                                <div
                                                    className={`progress-bar ${task.progress === 100 ? 'bg-success' : task.progress > 0 ? `bg-${color}` : 'bg-secondary'}`}
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-muted" style={{ minWidth: '35px', fontSize: '0.75rem' }}>
                                            {task.progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 서브태스크 */}
                            {expandedTasks.has(task.id) && task.subtasks && (
                                <div className="mt-2 ms-4 d-flex flex-wrap gap-1">
                                    {task.subtasks.map(subtask => (
                                        <label
                                            key={subtask.id}
                                            className={`d-inline-flex align-items-center gap-1 px-2 py-1 rounded border ${subtask.completed ? 'bg-success-lt border-success' : 'bg-light border-secondary'}`}
                                            style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-check-input m-0"
                                                checked={subtask.completed}
                                                onChange={() => toggleSubtask(task.id, subtask.id)}
                                                style={{ width: '12px', height: '12px' }}
                                            />
                                            <span className={subtask.completed ? 'text-muted text-decoration-line-through' : ''}>
                                                {subtask.title}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )

                    return (
                        <div key={cat} className="col-12 col-xl-6 mb-3">
                            <div className="card">
                                <div
                                    className={`card-header bg-${color}-lt cursor-pointer py-2`}
                                    onClick={() => toggleCategory(cat)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center w-100">
                                        <div className="d-flex align-items-center flex-grow-1">
                                            {isExpanded ? <ChevronDown size={18} className="me-2" /> : <ChevronRight size={18} className="me-2" />}
                                            {getCategoryIcon(cat)}
                                            <h4 className={`card-title mb-0 ms-2 text-${color}`} style={{ fontSize: '0.95rem' }}>
                                                {getCategoryLabel(cat)}
                                            </h4>
                                            <span className="badge bg-white text-dark ms-2">{catTasks.length}</span>
                                        </div>
                                        <div className="text-muted small d-none d-md-block" style={{ fontSize: '0.75rem' }}>
                                            <span className="me-2">
                                                <i className="ti ti-users me-1"></i>
                                                {getCategoryStakeholders(cat)}
                                            </span>
                                            {catInfo.integrations.length > 0 && (
                                                <span>
                                                    <i className="ti ti-plug me-1"></i>
                                                    {catInfo.integrations.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <>
                                        <div className="card-body py-1 bg-light border-bottom">
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{getCategoryDescription(cat)}</small>
                                        </div>
                                        <div className="list-group list-group-flush">
                                            {/* 진행중/대기 태스크 */}
                                            {pendingTasks.map((task) => renderTask(task, false))}

                                            {/* 완료된 태스크 - 구분선과 함께 표시 */}
                                            {completedTasks.length > 0 && (
                                                <>
                                                    <div className="list-group-item py-1 bg-success-lt border-top border-success" style={{ borderTopWidth: '2px' }}>
                                                        <small className="text-success fw-bold">
                                                            <CheckCircle2 size={12} className="me-1" />
                                                            {t('completed')} ({completedTasks.length})
                                                        </small>
                                                    </div>
                                                    {completedTasks.map((task) => renderTask(task, true))}
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* 권장 작업 순서 */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3 className="card-title">
                        <Zap className="me-2" size={18} />
                        {t('recommendedOrder')}
                    </h3>
                </div>
                <div className="card-body">
                    <ol className="mb-0">
                        {recommendedOrder.map((item, index) => {
                            const task = devTasks.find(t => t.id === item.id)
                            if (!task) return null
                            return (
                                <li key={item.id} className={index < recommendedOrder.length - 1 ? 'mb-2' : ''}>
                                    <strong>{isKorean ? task.titleKo : (isJapanese ? task.titleJa : task.title)}</strong>
                                    <span className="text-muted ms-2">- {isKorean ? item.reasonKo : (isJapanese ? item.reasonJa : item.reason)}</span>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            </div>
        </div>
    )
}
