import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  sendEmail,
  replaceTemplateVariables,
  textToHtml,
  getRandomDelay,
  type TemplateVariables,
} from '@/lib/gmail'

type CompanyEmailData = {
  companyId: string
  companyName: string
  recipientEmail: string
  contactRound: number
  region?: string
  office?: string
  phone?: string
  systemInUse?: string
  contactPerson?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companies,
      customOverrides,
      sentBy,
    } = body as {
      companies: CompanyEmailData[]
      customOverrides?: { [round: number]: { subject?: string; bodyText?: string; bodyHtml?: string } }
      sentBy?: string
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No companies provided' },
        { status: 400 }
      )
    }

    // 設定取得
    const settings = await prisma.emailSettings.findFirst()
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Email settings not configured. Please configure in Settings page.' },
        { status: 400 }
      )
    }

    // ブラックリストチェック（日次上限より先にフィルタリング）
    const blacklist = await prisma.emailBlacklist.findMany()
    const blacklistedIds = new Set(blacklist.map(b => b.companyId))
    const nonBlacklistedCompanies = companies.filter(c => !blacklistedIds.has(c.companyId))
    const blacklistedCount = companies.length - nonBlacklistedCompanies.length

    if (nonBlacklistedCompanies.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All selected companies are blacklisted or filtered out',
      }, { status: 400 })
    }

    // 今日の送信数チェック
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCount = await prisma.emailLog.count({
      where: { sentAt: { gte: todayStart }, status: 'SENT' },
    })

    const remainingToday = settings.dailyLimit - todayCount
    if (remainingToday <= 0) {
      return NextResponse.json({
        success: false,
        error: `Daily limit reached (${settings.dailyLimit}). Please try again tomorrow.`,
        data: { todayCount, dailyLimit: settings.dailyLimit },
      }, { status: 429 })
    }

    // 送信可能数に制限（ブラックリスト除外後の数で適用）
    const filteredCompanies = nonBlacklistedCompanies.slice(0, remainingToday)

    // テンプレート取得（全回次）
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { contactRound: 'asc' },
    })

    const templateMap = new Map(templates.map(t => [t.contactRound, t]))

    // 送信結果
    const results: Array<{
      companyId: string
      companyName: string
      status: 'SENT' | 'FAILED' | 'BOUNCED' | 'NO_TEMPLATE' | 'NO_EMAIL'
      error?: string
    }> = []

    // バッチ処理
    for (let i = 0; i < filteredCompanies.length; i++) {
      const company = filteredCompanies[i]

      // メールアドレスチェック
      if (!company.recipientEmail || !company.recipientEmail.includes('@')) {
        results.push({
          companyId: company.companyId,
          companyName: company.companyName,
          status: 'NO_EMAIL',
          error: 'No valid email address',
        })
        continue
      }

      // 回次（5回以上は5に統一）
      const round = Math.min(company.contactRound, 5)

      // テンプレートまたはカスタムオーバーライド取得
      const template = templateMap.get(round)
      const override = customOverrides?.[round]

      let subject: string
      let bodyText: string
      let bodyHtml: string

      if (override) {
        subject = override.subject || template?.subject || `【KAFLIX CLOUD】ご連絡 (${round}回目)`
        bodyText = override.bodyText || template?.bodyText || ''
        bodyHtml = override.bodyHtml || (override.bodyText ? textToHtml(override.bodyText) : template?.bodyHtml || textToHtml(bodyText))
      } else if (template) {
        subject = template.subject
        bodyText = template.bodyText
        bodyHtml = template.bodyHtml || textToHtml(template.bodyText)
      } else {
        results.push({
          companyId: company.companyId,
          companyName: company.companyName,
          status: 'NO_TEMPLATE',
          error: `No template for round ${round}`,
        })
        continue
      }

      // 変数置換
      const vars: TemplateVariables = {
        companyName: company.companyName,
        contactPerson: company.contactPerson,
        region: company.region,
        phone: company.phone,
        email: company.recipientEmail,
        contactRound: round,
        systemInUse: company.systemInUse,
        senderName: settings.senderName,
      }

      const finalSubject = replaceTemplateVariables(subject, vars)
      const finalBodyText = replaceTemplateVariables(bodyText, vars)
      const finalBodyHtml = replaceTemplateVariables(bodyHtml, vars)

      // 送信
      const result = await sendEmail(
        settings.senderEmail,
        settings.senderName,
        company.recipientEmail,
        finalSubject,
        finalBodyText,
        finalBodyHtml
      )

      // ログ保存
      const logStatus = result.success ? 'SENT' : (result.bounced ? 'BOUNCED' : 'FAILED')

      await prisma.emailLog.create({
        data: {
          companyId: company.companyId,
          companyName: company.companyName,
          recipientEmail: company.recipientEmail,
          senderEmail: settings.senderEmail,
          subject: finalSubject,
          bodyPreview: finalBodyText.substring(0, 200),
          bodyText: finalBodyText,
          templateId: template?.id,
          contactRound: round,
          status: logStatus,
          errorMessage: result.error,
          sentBy: sentBy || settings.senderName,
          region: company.region,
          office: company.office,
        },
      })

      results.push({
        companyId: company.companyId,
        companyName: company.companyName,
        status: logStatus as 'SENT' | 'FAILED' | 'BOUNCED',
        error: result.error,
      })

      // バウンス時にブラックリスト候補として記録
      if (result.bounced) {
        try {
          await prisma.emailBlacklist.upsert({
            where: { companyId: company.companyId },
            update: {
              reason: 'bounce',
              blockedAt: new Date(),
            },
            create: {
              companyId: company.companyId,
              companyName: company.companyName,
              email: company.recipientEmail,
              reason: 'bounce',
              blockedBy: 'system',
            },
          })
        } catch {
          // ブラックリスト追加失敗は無視
        }
      }

      // スパム防止遅延（最後のメール以外）
      if (i < filteredCompanies.length - 1) {
        // バッチ間の大休止
        if ((i + 1) % settings.batchSize === 0) {
          await new Promise(resolve =>
            setTimeout(resolve, settings.batchIntervalMin * 60 * 1000)
          )
        } else {
          // 通常の遅延
          const delay = getRandomDelay(
            Math.max(15, settings.intervalSeconds - 10),
            settings.intervalSeconds + 15
          )
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // 結果サマリー
    const sent = results.filter(r => r.status === 'SENT').length
    const failed = results.filter(r => r.status === 'FAILED').length
    const bounced = results.filter(r => r.status === 'BOUNCED').length
    const skipped = results.filter(r => r.status === 'NO_TEMPLATE' || r.status === 'NO_EMAIL').length
    const blacklisted = blacklistedCount

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: companies.length,
          sent,
          failed,
          bounced,
          skipped,
          blacklisted,
          limitExceeded: nonBlacklistedCompanies.length - filteredCompanies.length,
        },
        results,
        // クライアント側で連絡履歴に追加するための成功リスト
        sentCompanies: results
          .filter(r => r.status === 'SENT')
          .map(r => ({
            companyId: r.companyId,
            companyName: r.companyName,
            contactDate: new Date().toISOString().split('T')[0],
            contactType: 'mail' as const,
          })),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Send API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
