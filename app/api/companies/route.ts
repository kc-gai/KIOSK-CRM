import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/companies - 会社一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'list'
    const region = searchParams.get('region')
    const source = searchParams.get('source')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (region) where.region = region
    if (source) where.source = source
    if (status) where.status = status
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { prefecture: { contains: search } },
      ]
    }

    if (type === 'stats') {
      const [total, byStatus, byRegion, bySource] = await Promise.all([
        prisma.company.count({ where }),
        prisma.company.groupBy({ by: ['status'], _count: true, where }),
        prisma.company.groupBy({ by: ['region'], _count: true, where }),
        prisma.company.groupBy({ by: ['source'], _count: true, where }),
      ])
      return NextResponse.json({ total, byStatus, byRegion, bySource })
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { contactRecords: { orderBy: { contactDate: 'desc' }, take: 10 } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({
      companies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Company GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

// POST /api/companies - 会社作成 / 一括作成 / マイグレーション
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // 一括登録（OTAクロールやマイグレーション用）
    if (action === 'bulk-create') {
      const { companies } = body as { companies: Array<Record<string, string | null>> }
      const created = await prisma.$transaction(
        companies.map((c: Record<string, string | null>) =>
          prisma.company.create({
            data: {
              companyName: c.companyName || '',
              prefecture: c.prefecture,
              region: c.region,
              office: c.office,
              phone: c.phone,
              email: c.email,
              contactUrl: c.contactUrl,
              address: c.address,
              status: c.status || '未交渉',
              systemInUse: c.systemInUse,
              fleetSize: c.fleetSize,
              notes: c.notes,
              source: c.source || 'manual',
              sourceDetail: c.sourceDetail,
            },
          })
        )
      )
      return NextResponse.json({ success: true, count: created.length })
    }

    // 連絡履歴を手動追加
    if (action === 'add-contact') {
      const { companyId, contactDate, contactType, channel, summary } = body
      if (!companyId || !contactDate || !contactType) {
        return NextResponse.json({ error: 'companyId, contactDate, contactType required' }, { status: 400 })
      }
      const record = await prisma.contactRecord.create({
        data: {
          companyId,
          contactDate: new Date(contactDate),
          contactType,
          channel: channel || null,
          summary: summary || null,
          sentBy: 'manual',
        },
      })
      return NextResponse.json({ success: true, record })
    }

    // 連絡履歴を削除
    if (action === 'delete-contact') {
      const { recordId } = body
      if (!recordId) {
        return NextResponse.json({ error: 'recordId required' }, { status: 400 })
      }
      await prisma.contactRecord.delete({ where: { id: recordId } })
      return NextResponse.json({ success: true })
    }

    // 単体作成
    const company = await prisma.company.create({
      data: {
        companyName: body.companyName,
        prefecture: body.prefecture,
        region: body.region,
        office: body.office,
        phone: body.phone,
        email: body.email,
        contactUrl: body.contactUrl,
        address: body.address,
        status: body.status || '未交渉',
        systemInUse: body.systemInUse,
        fleetSize: body.fleetSize,
        notes: body.notes,
        source: body.source || 'manual',
        sourceDetail: body.sourceDetail,
        lineId: body.lineId,
        instagram: body.instagram,
        twitter: body.twitter,
        facebook: body.facebook,
        otherSns: body.otherSns,
      },
    })

    return NextResponse.json({ success: true, company })
  } catch (error) {
    console.error('Company POST error:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}

// PUT /api/companies - 会社更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        companyName: data.companyName,
        prefecture: data.prefecture,
        region: data.region,
        office: data.office,
        phone: data.phone,
        email: data.email,
        contactUrl: data.contactUrl,
        address: data.address,
        status: data.status,
        systemInUse: data.systemInUse,
        fleetSize: data.fleetSize,
        notes: data.notes,
        lineId: data.lineId,
        instagram: data.instagram,
        twitter: data.twitter,
        facebook: data.facebook,
        otherSns: data.otherSns,
      },
    })

    return NextResponse.json({ success: true, company })
  } catch (error) {
    console.error('Company PUT error:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

// DELETE /api/companies - 会社削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    await prisma.company.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Company DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
