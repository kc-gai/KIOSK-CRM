import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TEMPLATE_KEY = 'inquiry-form-template'

const DEFAULT_TEMPLATE = {
  companyName: 'KAFLIX CLOUD株式会社',
  contactPerson: '営業部',
  email: 'sales@kaflixcloud.co.jp',
  phone: '',
  message: `突然のご連絡失礼いたします。

弊社 KAFLIX CLOUD株式会社は、レンタカー事業者様向けの管理システム「REborn」を提供しております。

車両管理、予約管理、精算管理を一元化し、業務効率を大幅に改善するシステムです。

もしよろしければ、一度オンラインデモをご覧いただければ幸いです。
ご興味がございましたら、お気軽にご返信ください。

何卒よろしくお願いいたします。`,
}

// GET /api/inquiry-form/template - テンプレート取得
export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: TEMPLATE_KEY },
    })

    const template = setting ? JSON.parse(setting.value) : DEFAULT_TEMPLATE

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Template GET error:', error)
    return NextResponse.json({ template: DEFAULT_TEMPLATE })
  }
}

// POST /api/inquiry-form/template - テンプレート保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    await prisma.settings.upsert({
      where: { key: TEMPLATE_KEY },
      update: { value: JSON.stringify(body) },
      create: { key: TEMPLATE_KEY, value: JSON.stringify(body) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template POST error:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}
