import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - ブラックリスト一覧取得
export async function GET() {
  try {
    const blacklist = await prisma.emailBlacklist.findMany({
      orderBy: { blockedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: blacklist,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Blacklist API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - ブラックリスト追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, companyName, email, reason, blockedBy } = body

    if (!companyId || !companyName || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: companyId, companyName, email' },
        { status: 400 }
      )
    }

    // 既存チェック（companyIdがuniqueなのでupsert）
    const entry = await prisma.emailBlacklist.upsert({
      where: { companyId },
      update: {
        companyName,
        email,
        reason: reason || 'manual',
        blockedBy,
        blockedAt: new Date(),
      },
      create: {
        companyId,
        companyName,
        email,
        reason: reason || 'manual',
        blockedBy,
      },
    })

    return NextResponse.json({
      success: true,
      data: entry,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Blacklist API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - ブラックリスト解除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing companyId parameter' },
        { status: 400 }
      )
    }

    await prisma.emailBlacklist.delete({
      where: { companyId },
    })

    return NextResponse.json({
      success: true,
      message: 'Removed from blacklist',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Blacklist API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
