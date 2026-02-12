import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DB 입력 작업 시간 분석 API
// 자산, FC, 법인, 지점 등의 createdAt을 분석하여 수작업 입력 시간을 추정

export async function GET() {
    try {
        // 자산(Kiosk) 데이터의 생성 시간 분포 분석
        const kiosks = await prisma.kiosk.findMany({
            select: {
                id: true,
                serialNumber: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' }
        })

        // FC 데이터
        const fcs = await prisma.fC.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' }
        })

        // 법인 데이터
        const corporations = await prisma.corporation.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' }
        })

        // 지점 데이터
        const branches = await prisma.branch.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' }
        })

        // 날짜별로 그룹화
        const groupByDate = (items: { createdAt: Date }[]) => {
            const groups: Record<string, { count: number, firstAt: Date, lastAt: Date }> = {}

            items.forEach(item => {
                const date = item.createdAt.toISOString().split('T')[0]
                if (!groups[date]) {
                    groups[date] = { count: 0, firstAt: item.createdAt, lastAt: item.createdAt }
                }
                groups[date].count++
                if (item.createdAt < groups[date].firstAt) groups[date].firstAt = item.createdAt
                if (item.createdAt > groups[date].lastAt) groups[date].lastAt = item.createdAt
            })

            return Object.entries(groups).map(([date, data]) => {
                const durationMs = data.lastAt.getTime() - data.firstAt.getTime()
                const durationHours = durationMs / (1000 * 60 * 60)
                // 최소 작업 시간 추정: 건당 1분 또는 실제 소요 시간 중 큰 값
                const estimatedHours = Math.max(durationHours, data.count / 60)

                return {
                    date,
                    count: data.count,
                    firstAt: data.firstAt.toISOString(),
                    lastAt: data.lastAt.toISOString(),
                    durationHours: Math.round(durationHours * 100) / 100,
                    estimatedWorkHours: Math.round(estimatedHours * 100) / 100
                }
            }).sort((a, b) => a.date.localeCompare(b.date))
        }

        // 작업 세션 분석 (30분 이상 간격이면 새 세션으로 간주)
        const analyzeWorkSessions = (items: { createdAt: Date }[]) => {
            if (items.length === 0) return []

            const sessions: { start: Date, end: Date, count: number }[] = []
            let currentSession = { start: items[0].createdAt, end: items[0].createdAt, count: 1 }

            for (let i = 1; i < items.length; i++) {
                const gap = items[i].createdAt.getTime() - currentSession.end.getTime()
                const gapMinutes = gap / (1000 * 60)

                if (gapMinutes > 30) {
                    // 새 세션 시작
                    sessions.push(currentSession)
                    currentSession = { start: items[i].createdAt, end: items[i].createdAt, count: 1 }
                } else {
                    // 현재 세션 연장
                    currentSession.end = items[i].createdAt
                    currentSession.count++
                }
            }
            sessions.push(currentSession)

            return sessions.map(s => {
                const durationMs = s.end.getTime() - s.start.getTime()
                const durationHours = durationMs / (1000 * 60 * 60)
                // 최소 작업 시간: 건당 1분
                const estimatedHours = Math.max(durationHours, s.count / 60)

                return {
                    date: s.start.toISOString().split('T')[0],
                    startTime: s.start.toISOString(),
                    endTime: s.end.toISOString(),
                    count: s.count,
                    durationHours: Math.round(durationHours * 100) / 100,
                    estimatedWorkHours: Math.round(estimatedHours * 100) / 100
                }
            })
        }

        const kioskSessions = analyzeWorkSessions(kiosks)
        const fcSessions = analyzeWorkSessions(fcs)
        const corpSessions = analyzeWorkSessions(corporations)
        const branchSessions = analyzeWorkSessions(branches)

        // 총 수작업 시간 계산
        const totalManualWorkHours = [
            ...kioskSessions,
            ...fcSessions,
            ...corpSessions,
            ...branchSessions
        ].reduce((sum, s) => sum + s.estimatedWorkHours, 0)

        return NextResponse.json({
            summary: {
                totalKiosks: kiosks.length,
                totalFCs: fcs.length,
                totalCorporations: corporations.length,
                totalBranches: branches.length,
                totalManualWorkHours: Math.round(totalManualWorkHours * 100) / 100
            },
            kiosksByDate: groupByDate(kiosks),
            kioskSessions,
            fcSessions,
            corpSessions,
            branchSessions,
        })
    } catch (error) {
        console.error('DB work analysis error:', error)
        return NextResponse.json({ error: 'Failed to analyze DB work' }, { status: 500 })
    }
}
