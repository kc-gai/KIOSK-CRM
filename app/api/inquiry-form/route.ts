import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeAndFill, analyzeForm, CompanyTemplate } from '@/lib/form-filler'

// POST /api/inquiry-form - フォーム分析・入力実行
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // フォーム分析のみ
    if (action === 'analyze') {
      const { url } = body as { url: string }
      if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

      const { analysis, browser } = await analyzeForm(url)
      await browser.close()

      return NextResponse.json({
        success: true,
        analysis,
      })
    }

    // フォーム分析 + 自動入力 + スクリーンショット
    if (action === 'fill') {
      const { url, companyId, template } = body as {
        url: string
        companyId: string
        template: CompanyTemplate
      }

      if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })
      if (!template) return NextResponse.json({ error: 'Template is required' }, { status: 400 })

      const { analysis, filledFields, screenshot } = await analyzeAndFill(url, template)

      // スクリーンショットをBase64で返却
      const screenshotBase64 = screenshot.toString('base64')

      // InquiryFormLogに記録
      let logId: string | null = null
      if (companyId) {
        const log = await prisma.inquiryFormLog.create({
          data: {
            companyId,
            formUrl: url,
            status: 'filled',
            filledFields: JSON.stringify(filledFields),
          },
        })
        logId = log.id
      }

      return NextResponse.json({
        success: true,
        logId,
        analysis,
        filledFields,
        screenshot: `data:image/png;base64,${screenshotBase64}`,
      })
    }

    // フォーム送信完了を記録
    if (action === 'mark-submitted') {
      const { logId, companyId } = body as { logId: string; companyId?: string }

      if (!logId) return NextResponse.json({ error: 'logId is required' }, { status: 400 })

      await prisma.inquiryFormLog.update({
        where: { id: logId },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
        },
      })

      // 連絡履歴にも追加
      if (companyId) {
        await prisma.contactRecord.create({
          data: {
            companyId,
            contactDate: new Date(),
            contactType: 'inquiry',
            channel: 'web-form',
            summary: '問合せフォームから送信',
          },
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Inquiry form error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Form operation failed: ${message}` }, { status: 500 })
  }
}

// GET /api/inquiry-form - フォーム入力履歴
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const where: Record<string, string> = {}
    if (companyId) where.companyId = companyId

    const logs = await prisma.inquiryFormLog.findMany({
      where,
      include: { company: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Inquiry form GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
