'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocale } from 'next-intl'

// ==========================================
// Types
// ==========================================

// 키오스크 - Reports/ 기반 리포트
interface KioskReport {
    report_id: string
    created_at: string
    status: string
    task_summary: string
    task_summary_ja?: string
    completed_tasks: string[]
    completed_tasks_ja?: string[]
    modified_files: { path: string; changes: string }[]
    created_files?: { path: string; description: string }[]
    work_hours?: number
    work_type?: string
    _filename: string
}

// 마케팅 - Prisma WorkLog
interface MarketingWorkLog {
    id: string
    date: string
    title: string
    description?: string | null
    author: string
    startTime?: string | null
    endTime?: string | null
    workHours: number
    category: string
    completedTasks?: string | null
    modifiedFiles?: string | null
    createdAt: string
}

// ==========================================
// Main Page
// ==========================================

export default function SharedWorkLogsPage() {
    const locale = useLocale()
    const isJa = locale === 'ja'
    const [activeTab, setActiveTab] = useState<'kiosk' | 'marketing'>('kiosk')

    return (
        <div>
            {/* Page Header */}
            <div className="mb-4">
                <h1 className="fw-bold" style={{ fontSize: '1.5rem' }}>
                    <i className="ti ti-clock-record me-2 text-primary"></i>
                    {isJa ? '作業日誌' : '작업일지'}
                </h1>
                <p className="text-muted small">
                    {isJa ? 'プロジェクト別の作業ログを一覧で確認' : '프로젝트별 작업 로그를 한눈에 확인'}
                </p>
            </div>

            {/* Project Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'kiosk' ? 'active' : ''}`}
                        onClick={() => setActiveTab('kiosk')}
                    >
                        <i className="ti ti-device-desktop me-1"></i>
                        Kiosk Asset CRM
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'marketing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('marketing')}
                    >
                        <i className="ti ti-chart-line me-1"></i>
                        Marketing SEO CRM
                    </button>
                </li>
            </ul>

            {/* Content by Tab */}
            {activeTab === 'kiosk' ? (
                <KioskWorkLogsView isJa={isJa} />
            ) : (
                <MarketingWorkLogsView isJa={isJa} />
            )}

            {/* Link to full page */}
            <div className="text-center mt-4 pt-3 border-top">
                <a
                    href={activeTab === 'kiosk' ? '/dashboard/work-logs' : '/marketing/work-logs'}
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
// 키오스크 작업일지 뷰 (Reports/ 폴더 기반)
// ==========================================

function KioskWorkLogsView({ isJa }: { isJa: boolean }) {
    const [reports, setReports] = useState<KioskReport[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/work-logs')
            .then(res => res.json())
            .then(data => {
                setReports(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    // 날짜별 그룹핑
    const reportsByDate = useMemo(() => {
        const map: Record<string, KioskReport[]> = {}
        reports.forEach(r => {
            const date = r.created_at ? r.created_at.split('T')[0] : 'unknown'
            if (!map[date]) map[date] = []
            map[date].push(r)
        })
        return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
    }, [reports])

    const totalHours = useMemo(() => {
        return Math.round(reports.reduce((sum, r) => sum + (r.work_hours || 0), 0) * 10) / 10
    }, [reports])

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="text-muted mt-2 small">Loading...</div>
            </div>
        )
    }

    return (
        <div>
            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '総レポート' : '총 리포트'}</div>
                            <div className="h2 mb-0">{reports.length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '総作業時間' : '총 작업시간'}</div>
                            <div className="h2 mb-0">{totalHours}h</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '作業日数' : '작업 일수'}</div>
                            <div className="h2 mb-0">{reportsByDate.length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '完了タスク' : '완료 작업'}</div>
                            <div className="h2 mb-0">{reports.reduce((sum, r) => sum + (r.completed_tasks?.length || 0), 0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports by Date */}
            {reports.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="ti ti-folder-off mb-2" style={{ fontSize: '2rem' }}></i>
                        <p>{isJa ? 'レポートがありません' : '리포트가 없습니다'}</p>
                        <small className="text-muted">{isJa ? 'Reports/ フォルダにJSON作業レポートを追加してください' : 'Reports/ 폴더에 JSON 작업 리포트를 추가하세요'}</small>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {reportsByDate.slice(0, 20).map(([date, dayReports]) => (
                        <div key={date} className="card mb-3">
                            <div className="card-header">
                                <h3 className="card-title d-flex align-items-center gap-2">
                                    <i className="ti ti-calendar text-primary"></i>
                                    {date}
                                    <span className="badge bg-blue-lt">{dayReports.length}{isJa ? '件' : '건'}</span>
                                    <span className="badge bg-green-lt">
                                        {Math.round(dayReports.reduce((s, r) => s + (r.work_hours || 0), 0) * 10) / 10}h
                                    </span>
                                </h3>
                            </div>
                            <div className="list-group list-group-flush">
                                {dayReports.map(report => (
                                    <div key={report.report_id || report._filename} className="list-group-item">
                                        <div className="d-flex align-items-start gap-2">
                                            <i className="ti ti-file-text text-muted mt-1"></i>
                                            <div className="flex-1">
                                                <div className="fw-medium small">
                                                    {(isJa && report.task_summary_ja) ? report.task_summary_ja : report.task_summary}
                                                </div>
                                                {report.completed_tasks && report.completed_tasks.length > 0 && (
                                                    <div className="mt-1">
                                                        {((isJa && report.completed_tasks_ja) ? report.completed_tasks_ja : report.completed_tasks)
                                                            .slice(0, 3).map((task, i) => (
                                                            <div key={i} className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                                                <i className="ti ti-check text-success" style={{ fontSize: '0.7rem' }}></i>
                                                                {task}
                                                            </div>
                                                        ))}
                                                        {report.completed_tasks.length > 3 && (
                                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                +{report.completed_tasks.length - 3} {isJa ? 'タスク' : '작업'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-end">
                                                {report.work_hours && (
                                                    <span className="badge bg-blue-lt">{report.work_hours}h</span>
                                                )}
                                                {report.modified_files && (
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                        {report.modified_files.length} {isJa ? 'ファイル' : '파일'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ==========================================
// 마케팅 작업일지 뷰 (Prisma DB 기반)
// ==========================================

function MarketingWorkLogsView({ isJa }: { isJa: boolean }) {
    const [logs, setLogs] = useState<MarketingWorkLog[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [calendarData, setCalendarData] = useState<Record<string, { hours: number; count: number }>>({})
    const [stats, setStats] = useState({ totalHours: 0, totalEntries: 0, totalCompleted: 0 })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [logsRes, calRes, statsRes] = await Promise.all([
                fetch(`/api/work-logs/work-logs?month=${selectedMonth}`),
                fetch(`/api/work-logs/work-logs?type=calendar&month=${selectedMonth}`),
                fetch(`/api/work-logs/work-logs?type=stats`),
            ])

            const logsData = await logsRes.json()
            const calData = await calRes.json()
            const statsData = await statsRes.json()

            setLogs(logsData.logs || [])
            setCalendarData(calData.dateMap || {})
            setStats({
                totalHours: statsData.totalHours || 0,
                totalEntries: statsData.totalEntries || 0,
                totalCompleted: statsData.totalCompleted || 0,
            })
        } catch {
            // ignore
        }
        setLoading(false)
    }, [selectedMonth])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // 월 이동
    const changeMonth = (delta: number) => {
        const [y, m] = selectedMonth.split('-').map(Number)
        const d = new Date(y, m - 1 + delta, 1)
        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    // 캘린더 생성
    const calendarDays = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number)
        const firstDay = new Date(y, m - 1, 1).getDay()
        const daysInMonth = new Date(y, m, 0).getDate()

        const days: { date: string | null; hours: number; count: number }[] = []
        for (let i = 0; i < firstDay; i++) days.push({ date: null, hours: 0, count: 0 })
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const info = calendarData[dateStr]
            days.push({ date: dateStr, hours: info?.hours || 0, count: info?.count || 0 })
        }
        return days
    }, [selectedMonth, calendarData])

    const monthHours = useMemo(() => {
        return Math.round(logs.reduce((sum, l) => sum + l.workHours, 0) * 10) / 10
    }, [logs])

    const categoryLabel = (cat: string) => {
        const map: Record<string, string> = {
            coding: isJa ? 'コーディング' : '코딩',
            manual: isJa ? '手動作業' : '수동 작업',
            meeting: isJa ? '会議' : '회의',
            research: isJa ? 'リサーチ' : '리서치',
            design: isJa ? 'デザイン' : '디자인',
        }
        return map[cat] || cat
    }

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="text-muted mt-2 small">Loading...</div>
            </div>
        )
    }

    return (
        <div>
            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '総作業時間' : '총 작업시간'}</div>
                            <div className="h2 mb-0">{stats.totalHours}h</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '総エントリー' : '총 엔트리'}</div>
                            <div className="h2 mb-0">{stats.totalEntries}</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '今月の時間' : '이번 달 시간'}</div>
                            <div className="h2 mb-0">{monthHours}h</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card card-sm">
                        <div className="card-body text-center">
                            <div className="text-muted small">{isJa ? '今月のログ' : '이번 달 로그'}</div>
                            <div className="h2 mb-0">{logs.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Calendar */}
                <div className="col-12 col-lg-5">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <button className="btn btn-ghost-primary btn-sm" onClick={() => changeMonth(-1)}>
                                <i className="ti ti-chevron-left"></i>
                            </button>
                            <span className="fw-bold">{selectedMonth}</span>
                            <button className="btn btn-ghost-primary btn-sm" onClick={() => changeMonth(1)}>
                                <i className="ti ti-chevron-right"></i>
                            </button>
                        </div>
                        <div className="card-body p-2">
                            <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                                    <div key={d} className="text-center text-muted small py-1" style={{ fontSize: '0.7rem' }}>{d}</div>
                                ))}
                                {calendarDays.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`text-center rounded p-1 ${day.date ? 'border' : ''}`}
                                        style={{
                                            minHeight: '40px',
                                            fontSize: '0.75rem',
                                            backgroundColor: day.hours > 0 ? `rgba(32, 107, 196, ${Math.min(day.hours / 8, 1) * 0.3})` : undefined,
                                        }}
                                    >
                                        {day.date && (
                                            <>
                                                <div>{parseInt(day.date.split('-')[2])}</div>
                                                {day.hours > 0 && (
                                                    <div className="text-primary fw-bold" style={{ fontSize: '0.6rem' }}>
                                                        {day.hours}h
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log List */}
                <div className="col-12 col-lg-7">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                {selectedMonth} {isJa ? 'ログ一覧' : '로그 목록'}
                                <span className="badge bg-blue-lt ms-2">{logs.length}</span>
                            </h3>
                        </div>
                        {logs.length === 0 ? (
                            <div className="card-body text-center py-5 text-muted">
                                <i className="ti ti-file-off mb-2" style={{ fontSize: '2rem' }}></i>
                                <p>{isJa ? 'この月のログはありません' : '이번 달 로그가 없습니다'}</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {logs.map(log => (
                                    <div key={log.id} className="list-group-item">
                                        <div className="d-flex align-items-start gap-2">
                                            <div className="flex-shrink-0 text-center" style={{ width: '45px' }}>
                                                <div className="text-primary fw-bold" style={{ fontSize: '0.7rem' }}>{log.date.split('-')[2]}</div>
                                                <div className="badge bg-blue-lt" style={{ fontSize: '0.6rem' }}>{log.workHours}h</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="fw-medium small">{log.title}</div>
                                                {log.description && (
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{log.description}</div>
                                                )}
                                                <div className="d-flex gap-2 mt-1">
                                                    <span className="badge bg-secondary-lt" style={{ fontSize: '0.6rem' }}>
                                                        {categoryLabel(log.category)}
                                                    </span>
                                                    {log.startTime && log.endTime && (
                                                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                            {log.startTime} - {log.endTime}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
