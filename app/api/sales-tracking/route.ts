import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  SHEET_GID_MAP,
  calculateSalesStats,
  type RentalCarCompany,
  type ProgressStatus,
} from '@/lib/sales-tracking'

// 지역 → regionKo / office 매핑 (SHEET_GID_MAP에서 추출)
const REGION_INFO: Record<string, { regionKo: string; office: string }> = {}
for (const config of Object.values(SHEET_GID_MAP)) {
  REGION_INFO[config.region] = { regionKo: config.regionKo, office: config.office }
}

// DB Company → RentalCarCompany 변환
function dbToRentalCarCompany(
  c: {
    id: string
    companyName: string
    prefecture: string | null
    region: string | null
    office: string | null
    phone: string | null
    email: string | null
    contactUrl: string | null
    address: string | null
    status: string
    systemInUse: string | null
    notes: string | null
    contactRecords: Array<{
      contactDate: Date
      contactType: string
    }>
  },
  idx: number
): RentalCarCompany {
  const regionInfo = REGION_INFO[c.region || ''] || { regionKo: c.region || '', office: c.office || 'B' }
  return {
    id: c.id,
    rowNumber: idx,
    companyName: c.companyName,
    prefecture: c.prefecture || '',
    region: c.region || '',
    regionKo: regionInfo.regionKo,
    office: c.office || regionInfo.office,
    phone: c.phone || '',
    contactMethod: c.email || c.contactUrl || '',
    email: c.email || undefined,
    contactUrl: c.contactUrl || undefined,
    address: c.address || '',
    status: (c.status || '未交渉') as ProgressStatus,
    systemInUse: c.systemInUse || '',
    notes: c.notes || '',
    contactHistory: (c.contactRecords || []).map(cr => ({
      date: cr.contactDate,
      dateStr: cr.contactDate.toISOString().split('T')[0],
      year: cr.contactDate.getFullYear(),
      month: cr.contactDate.getMonth() + 1,
      day: cr.contactDate.getDate(),
      contactType: (cr.contactType as 'mail' | 'inquiry' | 'phone' | 'unknown') || 'unknown',
    })),
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'overview'
  const region = searchParams.get('region')

  try {
    // 지역 목록만 요청
    if (type === 'regions') {
      const regions = Object.entries(SHEET_GID_MAP).map(([key, config]) => ({
        key,
        region: config.region,
        regionKo: config.regionKo,
        office: config.office,
      }))
      return NextResponse.json({
        success: true,
        data: regions,
        timestamp: new Date().toISOString(),
      })
    }

    // 특정 지역만 요청
    if (type === 'region' && region) {
      const dbCompanies = await prisma.company.findMany({
        where: { region, source: 'sheets' },
        include: {
          contactRecords: { orderBy: { contactDate: 'asc' } },
        },
        orderBy: { companyName: 'asc' },
      })

      const companies = dbCompanies.map((c, i) => dbToRentalCarCompany(c, i + 1))
      const stats = calculateSalesStats(companies)
      const regionInfo = REGION_INFO[region] || { regionKo: region, office: 'B' }

      return NextResponse.json({
        success: true,
        data: {
          region,
          regionKo: regionInfo.regionKo,
          office: regionInfo.office,
          companies,
          stats: stats.byRegion[0] || null,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 전체 데이터 요청 (overview / all) - DB에서 조회
    if (type === 'overview' || type === 'all') {
      const dbCompanies = await prisma.company.findMany({
        where: { source: 'sheets' },
        include: {
          contactRecords: { orderBy: { contactDate: 'asc' } },
        },
        orderBy: [{ region: 'asc' }, { companyName: 'asc' }],
      })

      const allCompanies = dbCompanies.map((c, i) => dbToRentalCarCompany(c, i + 1))
      const stats = calculateSalesStats(allCompanies)

      // DB에 데이터가 없으면 안내 메시지
      if (allCompanies.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            stats,
            companies: type === 'all' ? [] : undefined,
            totalCompanies: 0,
            needsSync: true,
            message: 'No data in DB. Please run sync first (POST /api/sales-tracking/sync)',
          },
          timestamp: new Date().toISOString(),
        })
      }

      if (type === 'overview') {
        return NextResponse.json({
          success: true,
          data: { stats, totalCompanies: allCompanies.length },
          timestamp: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        data: { companies: allCompanies, stats },
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter. Use: overview, all, region, regions',
    }, { status: 400 })

  } catch (error) {
    console.error('Sales Tracking API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
