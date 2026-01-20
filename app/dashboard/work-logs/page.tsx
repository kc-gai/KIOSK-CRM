'use client'

import { useState, useEffect } from 'react'
import {
    Calendar, Clock, ChevronLeft, ChevronRight, BarChart3,
    CheckCircle2, FileText, TrendingUp, FolderOpen, Code2,
    GitBranch, FileCode, AlertCircle
} from 'lucide-react'

// 작업 리포트 타입
interface WorkReport {
    report_id: string
    created_at: string
    status: string
    task_summary: string
    completed_tasks: string[]
    modified_files: { path: string; changes: string }[]
    created_files?: { path: string; description: string }[]
    next_steps?: string[]
    blockers?: string[]
    work_hours?: number
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

    // 리포트 데이터 로드
    useEffect(() => {
        loadReports()
    }, [])

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

    // 전체 통계
    const getTotalStats = () => {
        let totalTasks = 0
        let totalFiles = 0
        let totalHours = 0
        let totalReports = reports.length

        Object.values(dailyStats).forEach(stats => {
            totalTasks += stats.taskCount
            totalFiles += stats.fileCount
            totalHours += stats.workHours
        })

        return { totalTasks, totalFiles, totalHours, totalReports }
    }

    const monthStats = getMonthStats()
    const totalStats = getTotalStats()
    const calendarDays = generateCalendar()

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
                            작업 일지
                        </h2>
                        <div className="text-muted mt-1">개발 작업 리포트 자동 집계</div>
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
                                    <div className="text-muted small">선택일 작업 시간</div>
                                    <div className="h2 mb-0">{(currentDayStats?.workHours || 0).toFixed(1)}시간</div>
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
                                    <div className="text-muted small">선택일 완료 작업</div>
                                    <div className="h2 mb-0">{currentDayStats?.taskCount || 0}건</div>
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
                                    <div className="text-muted small">이번 달 ({monthStats.workDays}일)</div>
                                    <div className="h2 mb-0">{monthStats.totalHours.toFixed(1)}시간</div>
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
                                    <div className="text-muted small">전체 작업 시간</div>
                                    <div className="h2 mb-0">{totalStats.totalHours.toFixed(1)}시간</div>
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
                                    {currentMonth.year}년 {currentMonth.month + 1}월
                                </h3>
                                <button className="btn btn-ghost-secondary btn-sm" onClick={nextMonth}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-2">
                            <div className="row g-1 text-center mb-2">
                                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
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
                                                        {taskCount}건
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
                                전체 통계
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small">완료된 작업</span>
                                    <span className="small text-muted">{totalStats.totalTasks}건</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div className="progress-bar bg-success" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small">수정된 파일</span>
                                    <span className="small text-muted">{totalStats.totalFiles}개</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div className="progress-bar bg-blue" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small">작업 리포트</span>
                                    <span className="small text-muted">{totalStats.totalReports}건</span>
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
                                {selectedDate} 작업 내역
                            </h3>
                            {currentDayStats && (
                                <div className="card-actions">
                                    <span className="badge bg-success-lt text-success me-2">
                                        {currentDayStats.taskCount}건 완료
                                    </span>
                                    <span className="badge bg-blue-lt text-blue">
                                        {currentDayStats.fileCount}개 파일
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
                                                <span className="fw-bold">{report.task_summary}</span>
                                            </div>
                                            <span className={`badge ${report.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                                                {report.status === 'completed' ? '완료' : report.status}
                                            </span>
                                        </div>

                                        {/* 완료된 작업 */}
                                        {report.completed_tasks?.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-muted small mb-1">
                                                    <CheckCircle2 size={12} className="me-1" />
                                                    완료된 작업 ({report.completed_tasks.length})
                                                </div>
                                                <ul className="list-unstyled mb-0 ms-3" style={{ fontSize: '0.85rem' }}>
                                                    {report.completed_tasks.map((task, i) => (
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
                                                    수정된 파일 ({report.modified_files.length})
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
                                                    생성된 파일 ({report.created_files.length})
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
                                                    다음 작업
                                                </div>
                                                <ul className="list-unstyled mb-0 ms-3" style={{ fontSize: '0.8rem' }}>
                                                    {report.next_steps.slice(0, 3).map((step, i) => (
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
                                    <div>이 날짜에 기록된 작업 리포트가 없습니다</div>
                                    <div className="small">Reports 폴더에 작업 리포트를 저장하면 자동으로 표시됩니다</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
