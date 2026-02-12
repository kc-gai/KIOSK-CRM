import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/email-replies - 返信一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'list'
    const companyId = searchParams.get('companyId')
    const isRead = searchParams.get('isRead')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (type === 'stats') {
      const [total, unread, today] = await Promise.all([
        prisma.emailReply.count(),
        prisma.emailReply.count({ where: { isRead: false } }),
        prisma.emailReply.count({
          where: {
            receivedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ])
      return NextResponse.json({ total, unread, today })
    }

    // 会社別メール履歴（送受信統合）
    if (type === 'history' && companyId) {
      const [sentLogs, replies] = await Promise.all([
        prisma.emailLog.findMany({
          where: { companyId },
          orderBy: { sentAt: 'desc' },
          take: 50,
        }),
        prisma.emailReply.findMany({
          where: { companyId },
          orderBy: { receivedAt: 'desc' },
          take: 50,
        }),
      ])

      // 送受信を統合してタイムライン順に
      const timeline = [
        ...sentLogs.map((l) => ({
          type: 'sent' as const,
          id: l.id,
          date: l.sentAt,
          email: l.recipientEmail,
          subject: l.subject,
          preview: l.bodyPreview,
          status: l.status,
          contactRound: l.contactRound,
        })),
        ...replies.map((r) => ({
          type: 'received' as const,
          id: r.id,
          date: r.receivedAt,
          email: r.fromEmail,
          subject: r.subject,
          preview: r.bodyPreview,
          isRead: r.isRead,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return NextResponse.json({ timeline })
    }

    const where: Record<string, unknown> = {}
    if (companyId) where.companyId = companyId
    if (isRead !== null && isRead !== undefined) where.isRead = isRead === 'true'

    const replies = await prisma.emailReply.findMany({
      where,
      include: { company: { select: { companyName: true, region: true, office: true } } },
      orderBy: { receivedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Email replies GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}

// PUT /api/email-replies - 既読マーク
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ids, isRead } = body

    if (ids && Array.isArray(ids)) {
      await prisma.emailReply.updateMany({
        where: { id: { in: ids } },
        data: { isRead: isRead ?? true },
      })
      return NextResponse.json({ success: true, count: ids.length })
    }

    if (id) {
      await prisma.emailReply.update({
        where: { id },
        data: { isRead: isRead ?? true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  } catch (error) {
    console.error('Email replies PUT error:', error)
    return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 })
  }
}
