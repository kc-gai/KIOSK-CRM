import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - メール設定取得
export async function GET() {
  try {
    // 最初の設定を取得（1レコードのみ）
    let settings = await prisma.emailSettings.findFirst()

    // 設定がない場合はデフォルト値で作成
    if (!settings) {
      settings = await prisma.emailSettings.create({
        data: {
          senderEmail: 'sales@kaflixcloud.co.jp',
          senderName: 'KAFLIX CLOUD 営業部',
          dailyLimit: 50,
          intervalSeconds: 30,
          batchSize: 10,
          batchIntervalMin: 5,
          followUpDays: 7,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Settings API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - メール設定更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      senderEmail,
      senderName,
      dailyLimit,
      intervalSeconds,
      batchSize,
      batchIntervalMin,
      followUpDays,
    } = body

    // 既存の設定を取得
    const existing = await prisma.emailSettings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          ...(senderEmail && { senderEmail }),
          ...(senderName && { senderName }),
          ...(dailyLimit !== undefined && { dailyLimit }),
          ...(intervalSeconds !== undefined && { intervalSeconds }),
          ...(batchSize !== undefined && { batchSize }),
          ...(batchIntervalMin !== undefined && { batchIntervalMin }),
          ...(followUpDays !== undefined && { followUpDays }),
        },
      })
    } else {
      settings = await prisma.emailSettings.create({
        data: {
          senderEmail: senderEmail || 'sales@kaflixcloud.co.jp',
          senderName: senderName || 'KAFLIX CLOUD 営業部',
          dailyLimit: dailyLimit ?? 50,
          intervalSeconds: intervalSeconds ?? 30,
          batchSize: batchSize ?? 10,
          batchIntervalMin: batchIntervalMin ?? 5,
          followUpDays: followUpDays ?? 7,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Settings API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
