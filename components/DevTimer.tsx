'use client'

import { useState, useEffect } from 'react'

// 실제 세션 기록 (Claude Code 로그 기반 + 초기 개발 추정)
const SESSION_LOGS = [
    // 초기 개발 기간 (Git 커밋 및 파일 수정 시간 기반 추정)
    { date: '2025-12-15', hours: 4.0, note: '프로젝트 초기화, 기본 구조 설정' },
    { date: '2025-12-16', hours: 5.0, note: '기본 UI 및 DB 스키마 설계' },
    { date: '2025-12-17', hours: 3.0, note: '인증 시스템 구현' },
    { date: '2025-12-18', hours: 4.5, note: 'CRUD 기능 개발' },
    { date: '2025-12-19', hours: 2.0, note: '데이터 마이그레이션' },
    { date: '2025-12-22', hours: 3.0, note: '버그 수정 및 개선' },

    // Claude Code 세션 기록 (실제 로그 기반)
    { date: '2026-01-05', hours: 3.5, note: '14:27~17:59 KST - 자산관리 기능 개발' },
    { date: '2026-01-06', hours: 9.0, note: '09:11~18:17 KST - UI 개선, 필터 기능' },
    { date: '2026-01-07', hours: 8.3, note: '09:39~18:00 KST - 이력 관리 기능' },
    { date: '2026-01-08', hours: 0, note: '09:34~ KST - 배포 준비, DevTimer' }, // 실시간 계산
]

export function DevTimer() {
    const [now, setNow] = useState(new Date())
    const [sessionHours, setSessionHours] = useState(0)
    const [showDetail, setShowDetail] = useState(false)

    // 개발 시작일
    const startDate = new Date('2025-12-15T00:00:00')

    // 오늘 세션 시간 계산
    const calculateTodaySession = () => {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // 오늘 시작 시간 (09:34 KST = 00:34 UTC)
        const todayStart = new Date('2026-01-08T00:34:00Z')
        const elapsed = Math.max(0, (today.getTime() - todayStart.getTime()) / (1000 * 60 * 60))

        // 기존 세션 시간 합계
        const pastHours = SESSION_LOGS.reduce((sum, s) => sum + s.hours, 0)

        // 오늘이 1월 8일이면 실시간 계산 추가
        return pastHours + (todayStr === '2026-01-08' ? elapsed : 0)
    }

    // 2시간마다 자동 업데이트 (부하 방지)
    useEffect(() => {
        setSessionHours(calculateTodaySession())

        const timer = setInterval(() => {
            setNow(new Date())
            setSessionHours(calculateTodaySession())
        }, 2 * 60 * 60 * 1000) // 2시간

        return () => clearInterval(timer)
    }, [])

    // 일수 계산
    const diffTime = now.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // 날짜 포맷
    const formatDate = (date: Date) => {
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    }

    // 오늘 실시간 시간 계산
    const getTodayHours = () => {
        const todayStart = new Date('2026-01-08T00:34:00Z')
        return Math.max(0, (now.getTime() - todayStart.getTime()) / (1000 * 60 * 60))
    }

    return (
        <div className="mt-2">
            <div
                className="text-center cursor-pointer"
                onClick={() => setShowDetail(!showDetail)}
                style={{ cursor: 'pointer' }}
            >
                <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                    개발기간: <span className="text-info fw-bold">{diffDays}일</span>
                    <span className="text-warning ms-1">({sessionHours.toFixed(1)}h)</span>
                    <i className={`ti ti-chevron-${showDetail ? 'up' : 'down'} ms-1`} style={{ fontSize: '0.6rem' }}></i>
                </div>
                <div className="text-muted" style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                    {formatDate(startDate)} ~ {formatDate(now)}
                </div>
            </div>

            {/* 상세 세션 기록 */}
            {showDetail && (
                <div
                    className="mt-2 p-2 rounded"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontSize: '0.6rem'
                    }}
                >
                    <div className="text-muted mb-1 fw-bold">세션 기록</div>
                    {SESSION_LOGS.map((session, idx) => {
                        const [time, work] = session.note.includes(' - ')
                            ? session.note.split(' - ')
                            : ['', session.note]
                        return (
                            <div key={idx} className="py-1 border-bottom border-secondary" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                <div className="d-flex justify-content-between">
                                    <span className="text-info">{session.date.slice(5)}</span>
                                    <span className="text-warning">
                                        {session.date === '2026-01-08' ? getTodayHours().toFixed(1) : session.hours}h
                                    </span>
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.55rem' }}>
                                    {time && <span className="text-secondary">{time} </span>}
                                    {work}
                                </div>
                            </div>
                        )
                    })}
                    <div className="d-flex justify-content-between pt-1 fw-bold">
                        <span className="text-white">합계</span>
                        <span className="text-success">{sessionHours.toFixed(1)}h</span>
                    </div>
                </div>
            )}
        </div>
    )
}
