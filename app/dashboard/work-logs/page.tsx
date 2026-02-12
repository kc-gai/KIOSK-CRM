'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
    Calendar, Clock, ChevronLeft, ChevronRight, BarChart3,
    CheckCircle2, FileText, TrendingUp, FolderOpen, Code2,
    GitBranch, FileCode, AlertCircle, Bot, MessageSquare
} from 'lucide-react'

// 세션 정보 타입
interface SessionInfo {
    ai_assistant: string | null
    session_start: string
    session_end: string
    conversation_turns?: number
    tools_used?: string[]
    data_source?: string
}

// 작업 리포트 타입
interface WorkReport {
    report_id: string
    created_at: string
    status: string
    task_summary: string
    task_summary_ja?: string
    completed_tasks: string[]
    completed_tasks_ja?: string[]
    modified_files: { path: string; changes: string }[]
    created_files?: { path: string; description: string }[]
    next_steps?: string[]
    next_steps_ja?: string[]
    blockers?: string[]
    work_hours?: number
    work_type?: string  // 'manual_data_entry' | 'coding' 등
    session_info?: SessionInfo
    data_summary?: {
        kiosk_count?: number
        fc_count?: number
        corporation_count?: number
        branch_count?: number
        total_records?: number
    }
}

// DB 수작업 입력 분석 결과 타입
interface ManualWorkSession {
    date: string
    startTime: string
    endTime: string
    count: number
    durationHours: number
    estimatedWorkHours: number
}

interface ManualWorkAnalysis {
    summary: {
        totalKiosks: number
        totalFCs: number
        totalCorporations: number
        totalBranches: number
        totalManualWorkHours: number
    }
    kioskSessions: ManualWorkSession[]
    fcSessions: ManualWorkSession[]
    corpSessions: ManualWorkSession[]
    branchSessions: ManualWorkSession[]
}

// 일별 작업 통계 타입
interface DailyStats {
    date: string
    reportCount: number
    taskCount: number
    fileCount: number
    workHours: number
    reports: WorkReport[]
}

export default function WorkLogsPage() {
    const t = useTranslations('workLogs')
    const locale = useLocale()

    // 현재 선택된 날짜
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })

    // 현재 월 (달력용)
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date()
        return { year: today.getFullYear(), month: today.getMonth() }
    })

    // 작업 리포트 데이터
    const [reports, setReports] = useState<WorkReport[]>([])
    const [loading, setLoading] = useState(true)
    const [dailyStats, setDailyStats] = useState<Record<string, DailyStats>>({})
    const [manualWorkData, setManualWorkData] = useState<ManualWorkAnalysis | null>(null)

    // 리포트 데이터 로드
    useEffect(() => {
        loadReports()
        loadManualWorkData()
    }, [])

    // DB 수작업 입력 분석 데이터 로드
    const loadManualWorkData = async () => {
        try {
            const res = await fetch('/api/db-work-analysis')
            if (res.ok) {
                const data = await res.json()
                setManualWorkData(data)
            }
        } catch (error) {
            console.error('수작업 데이터 로드 실패:', error)
        }
    }

    const loadReports = async () => {
        try {
            const res = await fetch('/api/work-logs')
            if (res.ok) {
                const data = await res.json()
                // API는 배열을 직접 반환
                const reportList = Array.isArray(data) ? data : []
                setReports(reportList)

                // 일별 통계 계산
                const stats: Record<string, DailyStats> = {}
                reportList.forEach((report: WorkReport) => {
                    if (!report.created_at) return
                    const date = report.created_at.split('T')[0]
                    if (!stats[date]) {
                        stats[date] = {
                            date,
                            reportCount: 0,
                            taskCount: 0,
                            fileCount: 0,
                            workHours: 0,
                            reports: []
                        }
                    }
                    stats[date].reportCount++
                    stats[date].taskCount += report.completed_tasks?.length || 0
                    stats[date].fileCount += (report.modified_files?.length || 0) + (report.created_files?.length || 0)
                    stats[date].workHours += report.work_hours || 0
                    stats[date].reports.push(report)
                })
                setDailyStats(stats)

                // 가장 최근 리포트 날짜로 캘린더/선택일 설정
                if (reportList.length > 0 && reportList[0].created_at) {
                    const latestDate = new Date(reportList[0].created_at)
                    setSelectedDate(latestDate.toISOString().split('T')[0])
                    setCurrentMonth({
                        year: latestDate.getFullYear(),
                        month: latestDate.getMonth()
                    })
                }
            }
        } catch (error) {
            console.error('리포트 로드 실패:', error)
        } finally {
            setLoading(false)
        }
    }

    // 현재 날짜의 통계 가져오기
    const currentDayStats = dailyStats[selectedDate]

    // 달력 생성
    const generateCalendar = () => {
        const { year, month } = currentMonth
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startDay = firstDay.getDay()
        const daysInMonth = lastDay.getDate()

        const days: (number | null)[] = []
        for (let i = 0; i < startDay; i++) days.push(null)
        for (let i = 1; i <= daysInMonth; i++) days.push(i)

        return days
    }

    // 특정 날짜에 리포트가 있는지 확인
    const hasReportForDate = (day: number) => {
        const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return !!dailyStats[dateStr]
    }

    // 특정 날짜의 작업 수
    const getTaskCountForDate = (day: number) => {
        const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return dailyStats[dateStr]?.taskCount || 0
    }

    // 월 이동
    const prevMonth = () => {
        setCurrentMonth(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 }
            return { ...prev, month: prev.month - 1 }
        })
    }

    const nextMonth = () => {
        setCurrentMonth(prev => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 }
            return { ...prev, month: prev.month + 1 }
        })
    }

    // 이번 달 통계
    const getMonthStats = () => {
        const { year, month } = currentMonth
        let totalTasks = 0
        let totalFiles = 0
        let totalHours = 0
        let workDays = 0

        Object.entries(dailyStats).forEach(([date, stats]) => {
            const reportDate = new Date(date)
            if (reportDate.getFullYear() === year && reportDate.getMonth() === month) {
                totalTasks += stats.taskCount
                totalFiles += stats.fileCount
                totalHours += stats.workHours
                workDays++
            }
        })

        return { totalTasks, totalFiles, totalHours, workDays }
    }

    // 전체 통계 (수작업 시간 포함)
    const getTotalStats = () => {
        let totalTasks = 0
        let totalFiles = 0
        let totalHours = 0
        let totalReports = reports.length
        let manualWorkHours = manualWorkData?.summary?.totalManualWorkHours || 0

        Object.values(dailyStats).forEach(stats => {
            totalTasks += stats.taskCount
            totalFiles += stats.fileCount
            totalHours += stats.workHours
        })

        // 총 시간에 수작업 시간 추가
        const totalWithManual = totalHours + manualWorkHours

        return {
            totalTasks,
            totalFiles,
            totalHours: totalWithManual,
            totalReports,
            codingHours: totalHours,
            manualWorkHours
        }
    }

    const monthStats = getMonthStats()
    const totalStats = getTotalStats()
    const calendarDays = generateCalendar()
    const isJapanese = locale === 'ja'

    // 다국어 헬퍼 함수
    const getTaskSummary = (report: WorkReport) =>
        isJapanese ? (report.task_summary_ja || report.task_summary) : report.task_summary
    const getCompletedTasks = (report: WorkReport) =>
        isJapanese ? (report.completed_tasks_ja || report.completed_tasks) : report.completed_tasks
    const getNextSteps = (report: WorkReport) =>
        isJapanese ? (report.next_steps_ja || report.next_steps) : report.next_steps

    if (loading) {
        return (
            <div className="container-xl">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">
                            <FileText className="me-2" size={24} />
                            {t('title')}
                        </h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
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
                                    <Clock size={24} className="text-primary" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('selectedDayWorkTime')}</div>
                                    <div className="h2 mb-0">{(currentDayStats?.workHours || 0).toFixed(1)}{t('hour')}</div>
                                </div>
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
                                    <div className="text-muted small">{t('selectedDayCompleted')}</div>
                                    <div className="h2 mb-0">{currentDayStats?.taskCount || 0}{t('count')}</div>
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
                                    <Calendar size={24} className="text-blue" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('thisMonth')} ({monthStats.workDays}{t('days')})</div>
                                    <div className="h2 mb-0">{monthStats.totalHours.toFixed(1)}{t('hour')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-purple-lt p-3 me-3">
                                    <TrendingUp size={24} className="text-purple" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('totalWorkTime')}</div>
                                    <div className="h2 mb-0">{totalStats.totalHours.toFixed(1)}{t('hour')}</div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                        {t('coding')} {totalStats.codingHours.toFixed(1)} + {t('manualWork')} {totalStats.manualWorkHours.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* 달력 */}
                <div className="col-lg-4 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center w-100">
                                <button className="btn btn-ghost-secondary btn-sm" onClick={prevMonth}>
                                    <ChevronLeft size={18} />
                                </button>
                                <h3 className="card-title mb-0">
                                    {locale === 'ja'
                                        ? `${currentMonth.year}年 ${currentMonth.month + 1}月`
                                        : `${currentMonth.year}년 ${currentMonth.month + 1}월`
                                    }
                                </h3>
                                <button className="btn btn-ghost-secondary btn-sm" onClick={nextMonth}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-2">
                            <div className="row g-1 text-center mb-2">
                                {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map(day => (
                                    <div key={day} className="col" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="row g-1">
                                {calendarDays.map((day, idx) => {
                                    if (day === null) {
                                        return <div key={`empty-${idx}`} className="col" style={{ aspectRatio: '1' }}></div>
                                    }

                                    const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                    const isSelected = dateStr === selectedDate
                                    const hasReport = hasReportForDate(day)
                                    const taskCount = getTaskCountForDate(day)
                                    const isToday = dateStr === new Date().toISOString().split('T')[0]

                                    return (
                                        <div key={day} className="col" style={{ aspectRatio: '1' }}>
                                            <button
                                                className={`btn w-100 h-100 p-0 d-flex flex-column align-items-center justify-content-center ${
                                                    isSelected ? 'btn-primary' : hasReport ? 'btn-outline-success' : isToday ? 'btn-outline-primary' : 'btn-ghost-secondary'
                                                }`}
                                                style={{ fontSize: '0.8rem', borderRadius: '8px' }}
                                                onClick={() => setSelectedDate(dateStr)}
                                            >
                                                <span>{day}</span>
                                                {hasReport && (
                                                    <span style={{ fontSize: '0.55rem', marginTop: '-2px' }}>
                                                        {taskCount}{t('count')}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 전체 통계 */}
                    <div className="card mt-4">
                        <div className="card-header">
                            <h3 className="card-title">
                                <BarChart3 size={18} className="me-2" />
                                {t('totalStats')}
                            </h3>
                        </div>
                        <div className="card-body">
                            {/* 작업 시간 상세 */}
                            <div className="mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(32, 107, 196, 0.05)' }}>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small fw-bold">{t('totalWorkTimeLabel')}</span>
                                    <span className="small fw-bold text-primary">{totalStats.totalHours.toFixed(1)}{t('hour')}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small text-muted">
                                        <Code2 size={12} className="me-1" />
                                        {t('codingDevWork')}
                                    </span>
                                    <span className="small text-muted">{totalStats.codingHours.toFixed(1)}{t('hour')}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="small text-muted">
                                        <FileCode size={12} className="me-1" />
                                        {t('manualDbEntry')}
                                    </span>
                                    <span className="small text-muted">{totalStats.manualWorkHours.toFixed(1)}{t('hour')}</span>
                                </div>
                                <div className="progress mt-2" style={{ height: '8px' }}>
                                    <div
                                        className="progress-bar bg-primary"
                                        style={{ width: `${totalStats.totalHours > 0 ? (totalStats.codingHours / totalStats.totalHours) * 100 : 0}%` }}
                                        title={`${t('coding')}: ${totalStats.codingHours.toFixed(1)}${t('hour')}`}
                                    />
                                    <div
                                        className="progress-bar bg-cyan"
                                        style={{ width: `${totalStats.totalHours > 0 ? (totalStats.manualWorkHours / totalStats.totalHours) * 100 : 0}%` }}
                                        title={`${t('manualWork')}: ${totalStats.manualWorkHours.toFixed(1)}${t('hour')}`}
                                    />
                                </div>
                                <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.65rem' }}>
                                    <span className="text-primary">{t('coding')}</span>
                                    <span className="text-cyan">{t('manualWork')}</span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small">{t('completedTasks')}</span>
                                    <span className="small text-muted">{totalStats.totalTasks}{t('count')}</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div className="progress-bar bg-success" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small">{t('modifiedFiles')}</span>
                                    <span className="small text-muted">{totalStats.totalFiles}{t('file')}</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div className="progress-bar bg-blue" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small">{t('workReports')}</span>
                                    <span className="small text-muted">{totalStats.totalReports}{t('count')}</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div className="progress-bar bg-purple" style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 작업 내역 */}
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <Calendar size={18} className="me-2" />
                                {selectedDate} {t('workHistory')}
                            </h3>
                            {currentDayStats && (
                                <div className="card-actions">
                                    <span className="badge bg-success-lt text-success me-2">
                                        {currentDayStats.taskCount}{t('count')} {t('completed')}
                                    </span>
                                    <span className="badge bg-blue-lt text-blue">
                                        {currentDayStats.fileCount}{t('file')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 리포트 목록 */}
                        <div className="list-group list-group-flush">
                            {currentDayStats?.reports.length ? (
                                currentDayStats.reports.map((report, idx) => (
                                    <div key={report.report_id || idx} className="list-group-item">
                                        {/* 리포트 헤더 */}
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <FolderOpen size={16} className="text-primary" />
                                                <span className="fw-bold">{getTaskSummary(report)}</span>
                                            </div>
                                            <span className={`badge ${report.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                                                {report.status === 'completed' ? t('completed') : report.status}
                                            </span>
                                        </div>

                                        {/* AI 세션 정보 */}
                                        {report.session_info && (
                                            <div className="alert alert-info py-2 mb-2" style={{ fontSize: '0.8rem' }}>
                                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                                    <div className="d-flex align-items-center gap-1">
                                                        <Bot size={14} />
                                                        <span className="fw-medium">{report.session_info.ai_assistant}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1 text-muted">
                                                        <Clock size={12} />
                                                        <span>
                                                            {new Date(report.session_info.session_start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                            {' ~ '}
                                                            {new Date(report.session_info.session_end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1 text-muted">
                                                        <MessageSquare size={12} />
                                                        <span>{t('conversation')} {report.session_info.conversation_turns}{t('times')}</span>
                                                    </div>
                                                    {report.session_info.tools_used && report.session_info.tools_used.length > 0 && (
                                                        <div className="d-flex align-items-center gap-1 text-muted">
                                                            <span>{t('tools')}:</span>
                                                            {report.session_info.tools_used.slice(0, 3).map((tool, i) => (
                                                                <span key={i} className="badge bg-secondary-lt" style={{ fontSize: '0.65rem' }}>{tool}</span>
                                                            ))}
                                                            {report.session_info.tools_used.length > 3 && (
                                                                <span className="text-muted">+{report.session_info.tools_used.length - 3}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 완료된 작업 */}
                                        {report.completed_tasks?.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-muted small mb-1">
                                                    <CheckCircle2 size={12} className="me-1" />
                                                    {t('completedTasks')} ({getCompletedTasks(report).length})
                                                </div>
                                                <ul className="list-unstyled mb-0 ms-3" style={{ fontSize: '0.85rem' }}>
                                                    {getCompletedTasks(report).map((task, i) => (
                                                        <li key={i} className="text-success">
                                                            <CheckCircle2 size={10} className="me-1" />
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* 수정된 파일 */}
                                        {report.modified_files?.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-muted small mb-1">
                                                    <Code2 size={12} className="me-1" />
                                                    {t('modifiedFiles')} ({report.modified_files.length})
                                                </div>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {report.modified_files.map((file, i) => (
                                                        <span key={i} className="badge bg-secondary-lt text-secondary" style={{ fontSize: '0.7rem' }}>
                                                            {file.path.split('/').pop()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 생성된 파일 */}
                                        {report.created_files && report.created_files.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-muted small mb-1">
                                                    <GitBranch size={12} className="me-1" />
                                                    {t('createdFiles')} ({report.created_files.length})
                                                </div>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {report.created_files.map((file, i) => (
                                                        <span key={i} className="badge bg-green-lt text-green" style={{ fontSize: '0.7rem' }}>
                                                            + {file.path.split('/').pop()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 다음 단계 */}
                                        {report.next_steps && report.next_steps.length > 0 && (
                                            <div>
                                                <div className="text-muted small mb-1">
                                                    <AlertCircle size={12} className="me-1" />
                                                    {t('nextTasks')}
                                                </div>
                                                <ul className="list-unstyled mb-0 ms-3" style={{ fontSize: '0.8rem' }}>
                                                    {getNextSteps(report)?.slice(0, 3).map((step, i) => (
                                                        <li key={i} className="text-muted">• {step}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="list-group-item text-center text-muted py-5">
                                    <FileText size={48} className="mb-3 opacity-50" />
                                    <div>{t('noReportForDate')}</div>
                                    <div className="small">{t('noReportHint')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
