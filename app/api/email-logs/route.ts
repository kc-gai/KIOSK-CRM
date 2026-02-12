import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'list'
  const companyId = searchParams.get('companyId')
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // 発送統計
    if (type === 'stats') {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [todayCount, weekCount, monthCount, statusCounts, roundCounts] = await Promise.all([
        prisma.emailLog.count({
          where: { sentAt: { gte: todayStart }, status: 'SENT' },
        }),
        prisma.emailLog.count({
          where: { sentAt: { gte: weekStart }, status: 'SENT' },
        }),
        prisma.emailLog.count({
          where: { sentAt: { gte: monthStart }, status: 'SENT' },
        }),
        prisma.emailLog.groupBy({
          by: ['status'],
          _count: { status: true },
          where: { sentAt: { gte: monthStart } },
        }),
        prisma.emailLog.groupBy({
          by: ['contactRound'],
          _count: { contactRound: true },
          where: { sentAt: { gte: monthStart }, status: 'SENT' },
        }),
      ])

      // 日別送信推移（直近30日）
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const dailyLogs = await prisma.emailLog.findMany({
        where: { sentAt: { gte: thirtyDaysAgo }, status: 'SENT' },
        select: { sentAt: true },
        orderBy: { sentAt: 'asc' },
      })

      // 日別集計
      const dailyMap: { [date: string]: number } = {}
      dailyLogs.forEach(log => {
        const date = log.sentAt.toISOString().split('T')[0]
        dailyMap[date] = (dailyMap[date] || 0) + 1
      })
      const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

      // 設定を取得して残り送信可能数を計算
      const settings = await prisma.emailSettings.findFirst()
      const dailyLimit = settings?.dailyLimit || 50

      return NextResponse.json({
        success: true,
        data: {
          today: todayCount,
          week: weekCount,
          month: monthCount,
          dailyLimit,
          remainingToday: Math.max(0, dailyLimit - todayCount),
          statusBreakdown: statusCounts.map(s => ({
            status: s.status,
            count: s._count.status,
          })),
          roundBreakdown: roundCounts.map(r => ({
            round: r.contactRound,
            count: r._count.contactRound,
          })),
          dailyTrend,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // フォローアップ必要リスト
    if (type === 'followup') {
      const settings = await prisma.emailSettings.findFirst()
      const followUpDays = settings?.followUpDays || 7
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - followUpDays)

      // N日前に送信して、それ以降再送信していない企業
      const sentLogs = await prisma.emailLog.findMany({
        where: {
          status: 'SENT',
          sentAt: { lte: cutoffDate },
        },
        orderBy: { sentAt: 'desc' },
      })

      // 企業ごとに最新の送信日を取得
      const latestByCompany: { [companyId: string]: typeof sentLogs[0] } = {}
      sentLogs.forEach(log => {
        if (!latestByCompany[log.companyId]) {
          latestByCompany[log.companyId] = log
        }
      })

      // フォローアップが必要な企業（最新送信がN日以上前）
      const followUpNeeded = Object.values(latestByCompany)
        .filter(log => log.sentAt <= cutoffDate)
        .map(log => ({
          companyId: log.companyId,
          companyName: log.companyName,
          lastSentAt: log.sentAt.toISOString(),
          daysSince: Math.floor((Date.now() - log.sentAt.getTime()) / (1000 * 60 * 60 * 24)),
          lastContactRound: log.contactRound,
          recipientEmail: log.recipientEmail,
          region: log.region,
          office: log.office,
        }))
        .sort((a, b) => b.daysSince - a.daysSince)

      return NextResponse.json({
        success: true,
        data: {
          followUpDays,
          count: followUpNeeded.length,
          companies: followUpNeeded,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 送信履歴一覧
    const where: Record<string, unknown> = {}
    if (companyId) where.companyId = companyId
    if (status) where.status = status
    if (startDate || endDate) {
      where.sentAt = {}
      if (startDate) (where.sentAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.sentAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59')
    }

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.emailLog.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Logs API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
