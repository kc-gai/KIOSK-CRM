'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronRight, Calendar, MessageSquare, Zap, FileText, Truck, Mail, Bot, Database, FileSpreadsheet, BarChart, GripVertical } from 'lucide-react'
import { devTasks, recommendedOrder, getTaskStats, type DevTask, type TaskStatus, type TaskPriority, type SubTask } from '@/lib/dev-progress'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// LocalStorage용 타입 (subtask 완료 상태 저장)
interface TaskState {
    id: string
    subtaskStates: Record<string, boolean>
    lastUpdated: string
}

// 드래그 가능한 작업 아이템 컴포넌트
interface SortableTaskItemProps {
    task: DevTask & { subtasks?: (SubTask & { completed: boolean })[] }
    index: number
    expandedTasks: Set<string>
    toggleExpand: (taskId: string) => void
    toggleSubtask: (taskId: string, subtaskId: string) => void
    getStatusIcon: (status: TaskStatus) => React.ReactElement
    getPriorityBadge: (priority: TaskPriority) => React.ReactElement
    getCategoryIcon: (categoryKo: string) => React.ReactElement
    getTaskTitle: (task: DevTask) => string
    getTaskDescription: (task: DevTask) => string | undefined
    getTaskNotes: (task: DevTask) => string | undefined
    getTaskCategory: (task: DevTask) => string
}

function SortableTaskItem({
    task,
    index,
    expandedTasks,
    toggleExpand,
    toggleSubtask,
    getStatusIcon,
    getPriorityBadge,
    getCategoryIcon,
    getTaskTitle,
    getTaskDescription,
    getTaskNotes,
    getTaskCategory,
}: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? '#f8f9fa' : undefined,
    }

    return (
        <div ref={setNodeRef} style={style} className="list-group-item">
            <div className="row align-items-center">
                <div className="col-auto" {...attributes} {...listeners} style={{ cursor: 'grab' }}>
                    <GripVertical size={16} className="text-muted" />
                </div>
                <div className="col-auto">
                    <span className="text-muted">{index + 1}</span>
                </div>
                <div className="col-auto">
                    {getStatusIcon(task.status)}
                </div>
                <div className="col">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button
                            className="btn btn-link p-0 text-decoration-none fw-bold"
                            onClick={() => toggleExpand(task.id)}
                        >
                            {expandedTasks.has(task.id) ? (
                                <ChevronDown size={16} className="me-1" />
                            ) : (
                                <ChevronRight size={16} className="me-1" />
                            )}
                            {getTaskTitle(task)}
                        </button>
                        {getPriorityBadge(task.priority)}
                        <span className="badge bg-secondary-lt text-secondary">
                            {getCategoryIcon(task.categoryKo)}
                            <span className="ms-1">{getTaskCategory(task)}</span>
                        </span>
                    </div>
                    <div className="text-muted small">{getTaskDescription(task)}</div>
                    {getTaskNotes(task) && (
                        <div className="text-info small mt-1">
                            <MessageSquare size={12} className="me-1" />
                            {getTaskNotes(task)}
                        </div>
                    )}
                </div>
                <div className="col-auto">
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ width: '100px' }}>
                            <div className="progress" style={{ height: '8px' }}>
                                <div
                                    className={`progress-bar ${task.progress === 100 ? 'bg-success' : task.progress > 0 ? 'bg-primary' : 'bg-secondary'}`}
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-muted small" style={{ minWidth: '40px' }}>
                            {task.progress}%
                        </span>
                    </div>
                </div>
            </div>

            {/* 서브태스크 - 인라인 표시 */}
            {expandedTasks.has(task.id) && task.subtasks && (
                <div className="mt-2 ms-5 d-flex flex-wrap gap-2">
                    {task.subtasks.map(subtask => (
                        <label
                            key={subtask.id}
                            className={`d-inline-flex align-items-center gap-1 px-2 py-1 rounded border ${subtask.completed ? 'bg-success-lt border-success' : 'bg-light border-secondary'}`}
                            style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            <input
                                type="checkbox"
                                className="form-check-input m-0"
                                checked={subtask.completed}
                                onChange={() => toggleSubtask(task.id, subtask.id)}
                                style={{ width: '14px', height: '14px' }}
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
}

export default function DevTasksPage() {
    const t = useTranslations('devTasks')
    const locale = useLocale()
    const isKorean = locale === 'ko'

    // 중앙 데이터에서 작업 목록 로드, LocalStorage에서 subtask 상태 오버라이드
    const [taskStates, setTaskStates] = useState<Record<string, Record<string, boolean>>>({})
    const [taskOrder, setTaskOrder] = useState<string[]>([])
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
    const [filter, setFilter] = useState<'all' | TaskStatus | TaskPriority>('all')

    // 드래그 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // LocalStorage에서 subtask 상태 및 순서 로드
    useEffect(() => {
        const saved = localStorage.getItem('dev-tasks-states')
        if (saved) {
            const parsed: TaskState[] = JSON.parse(saved)
            const statesMap: Record<string, Record<string, boolean>> = {}
            parsed.forEach(state => {
                statesMap[state.id] = state.subtaskStates
            })
            setTaskStates(statesMap)
        }

        // 저장된 순서 로드
        const savedOrder = localStorage.getItem('dev-tasks-order')
        if (savedOrder) {
            setTaskOrder(JSON.parse(savedOrder))
        } else {
            // 기본 순서 설정
            setTaskOrder(devTasks.map(t => t.id))
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
        localStorage.setItem('dev-tasks-states', JSON.stringify(stateArray))
    }

    // 중앙 데이터에 LocalStorage 상태 적용 + 순서 적용
    const getTasksWithState = () => {
        const tasksWithState = devTasks.map(task => {
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

        // 저장된 순서에 따라 정렬
        if (taskOrder.length > 0) {
            return tasksWithState.sort((a, b) => {
                const indexA = taskOrder.indexOf(a.id)
                const indexB = taskOrder.indexOf(b.id)
                if (indexA === -1) return 1
                if (indexB === -1) return -1
                return indexA - indexB
            })
        }
        return tasksWithState
    }

    const tasks = getTasksWithState()

    // 드래그 종료 핸들러
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = tasks.findIndex(t => t.id === active.id)
            const newIndex = tasks.findIndex(t => t.id === over.id)

            const newOrder = arrayMove(tasks.map(t => t.id), oldIndex, newIndex)
            setTaskOrder(newOrder)
            localStorage.setItem('dev-tasks-order', JSON.stringify(newOrder))
        }
    }

    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks)
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId)
        } else {
            newExpanded.add(taskId)
        }
        setExpandedTasks(newExpanded)
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
        const labels = {
            high: 'High',
            medium: 'Medium',
            low: 'Low'
        }
        return <span className={`badge ${colors[priority]}`}>{labels[priority]}</span>
    }

    const getCategoryIcon = (categoryKo: string) => {
        switch (categoryKo) {
            case '연동':
                return <Calendar size={16} />
            case '프로세스':
                return <FileText size={16} />
            case '알림':
                return <Mail size={16} />
            case 'AI':
                return <Bot size={16} />
            case 'UI':
                return <BarChart size={16} />
            case '기능':
                return <Zap size={16} />
            default:
                return <Database size={16} />
        }
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

    // 통계 계산
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
            // 순서도 리셋
            const defaultOrder = devTasks.map(t => t.id)
            setTaskOrder(defaultOrder)
            localStorage.setItem('dev-tasks-order', JSON.stringify(defaultOrder))
        }
    }

    // 작업 제목/설명/노트 표시 (언어별)
    const getTaskTitle = (task: DevTask) => isKorean ? task.titleKo : task.title
    const getTaskDescription = (task: DevTask) => isKorean ? task.descriptionKo : task.description
    const getTaskNotes = (task: DevTask) => isKorean ? task.notesKo : task.notes
    const getTaskCategory = (task: DevTask) => isKorean ? task.categoryKo : task.category

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

            {/* 통계 카드 */}
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
                                <div
                                    className="progress-bar bg-primary"
                                    style={{ width: `${overallProgress}%` }}
                                />
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

            {/* 작업 목록 */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h3 className="card-title mb-0">
                        <GripVertical size={16} className="me-2 text-muted" />
                        {t('taskList')} <small className="text-muted">({t('dragToReorder')})</small>
                    </h3>
                </div>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="list-group list-group-flush">
                            {filteredTasks.map((task, index) => (
                                <SortableTaskItem
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    expandedTasks={expandedTasks}
                                    toggleExpand={toggleExpand}
                                    toggleSubtask={toggleSubtask}
                                    getStatusIcon={getStatusIcon}
                                    getPriorityBadge={getPriorityBadge}
                                    getCategoryIcon={getCategoryIcon}
                                    getTaskTitle={getTaskTitle}
                                    getTaskDescription={getTaskDescription}
                                    getTaskNotes={getTaskNotes}
                                    getTaskCategory={getTaskCategory}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
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
                                    <strong>{isKorean ? task.titleKo : task.title}</strong>
                                    <span className="text-muted ms-2">- {isKorean ? item.reasonKo : item.reason}</span>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            </div>
        </div>
    )
}
