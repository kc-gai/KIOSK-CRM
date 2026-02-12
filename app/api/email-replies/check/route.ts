import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findRepliesFromRecipients } from '@/lib/gmail'
import { notifyEmailReply } from '@/lib/slack'

// POST /api/email-replies/check - 返信チェック（ポーリング）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { daysBack } = body as { daysBack?: number }

    // 最近送信したメールの受信者リストを取得
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - (daysBack || 30))

    const sentLogs = await prisma.emailLog.findMany({
      where: {
        status: 'SENT',
        sentAt: { gte: sinceDate },
      },
      select: {
        id: true,
        companyId: true,
        companyName: true,
        recipientEmail: true,
      },
      distinct: ['recipientEmail'],
    })

    if (sentLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sent emails to check',
        newReplies: 0,
      })
    }

    // メールアドレスリスト
    const recipientEmails = sentLogs.map((l) => l.recipientEmail).filter(Boolean)

    // Gmailから返信を検索
    const gmailReplies = await findRepliesFromRecipients(recipientEmails, sinceDate)

    // 既存の返信と比較して新規のみ処理
    const existingMsgIds = new Set(
      (
        await prisma.emailReply.findMany({
          select: { gmailMsgId: true },
        })
      ).map((r) => r.gmailMsgId)
    )

    let newReplyCount = 0

    for (const reply of gmailReplies) {
      // 既に記録済みならスキップ
      if (existingMsgIds.has(reply.id)) continue

      // 送信先とマッチング
      const matchedLog = sentLogs.find(
        (l) => l.recipientEmail.toLowerCase() === reply.from.toLowerCase()
      )

      // DB保存
      const saved = await prisma.emailReply.create({
        data: {
          emailLogId: matchedLog?.id || null,
          companyId: matchedLog?.companyId || null,
          fromEmail: reply.from,
          fromName: reply.fromName,
          subject: reply.subject,
          bodyPreview: reply.bodyPreview?.substring(0, 200),
          gmailMsgId: reply.id,
          threadId: reply.threadId,
          receivedAt: reply.receivedAt,
        },
      })

      // 連絡履歴に追加
      if (matchedLog?.companyId) {
        await prisma.contactRecord.create({
          data: {
            companyId: matchedLog.companyId,
            contactDate: reply.receivedAt,
            contactType: 'reply',
            channel: 'email',
            summary: `メール返信: ${reply.subject}`,
          },
        })
      }

      // Slack通知
      await notifyEmailReply({
        companyName: matchedLog?.companyName || reply.fromName || '',
        fromEmail: reply.from,
        subject: reply.subject,
        bodyPreview: reply.bodyPreview || '',
        receivedAt: reply.receivedAt,
      })

      // Slack通知済みフラグ更新
      await prisma.emailReply.update({
        where: { id: saved.id },
        data: { slackNotified: true },
      })

      newReplyCount++
    }

    return NextResponse.json({
      success: true,
      checked: recipientEmails.length,
      gmailResults: gmailReplies.length,
      newReplies: newReplyCount,
      message: newReplyCount > 0
        ? `${newReplyCount}件の新しい返信を検出しました`
        : '新しい返信はありません',
    })
  } catch (error) {
    console.error('Email reply check error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Check failed: ${message}` }, { status: 500 })
  }
}
