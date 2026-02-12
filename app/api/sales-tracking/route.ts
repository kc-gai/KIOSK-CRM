import { NextRequest, NextResponse } from 'next/server'
import {
  SHEET_GID_MAP,
  SPREADSHEET_ID,
  parseCSV,
  parseCSVRowToCompany,
  calculateSalesStats,
  detectColumnMap,
  type RentalCarCompany,
} from '@/lib/sales-tracking'

// Google Sheets에서 CSV 데이터 가져오기 (서버 사이드)
async function fetchSheetData(gid: string, spreadsheetId: string = SPREADSHEET_ID): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'text/csv',
    },
    next: { revalidate: 300 }, // 5분 캐시
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status}`)
  }

  return response.text()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'overview'
  const region = searchParams.get('region')

  try {
    // 특정 지역만 요청한 경우
    if (type === 'region' && region) {
      const config = SHEET_GID_MAP[region]
      if (!config) {
        return NextResponse.json({
          success: false,
          error: `Unknown region: ${region}`,
        }, { status: 400 })
      }

      const spreadsheetId = config.spreadsheetId || SPREADSHEET_ID
      const csvText = await fetchSheetData(config.gid, spreadsheetId)
      const rows = parseCSV(csvText)
      const columnMap = detectColumnMap(rows)
      const companies: RentalCarCompany[] = []

      for (let i = 1; i < rows.length; i++) {
        const company = parseCSVRowToCompany(
          rows[i],
          i,
          config.region,
          config.regionKo,
          config.office,
          columnMap
        )
        if (company) {
          companies.push(company)
        }
      }

      const stats = calculateSalesStats(companies)

      return NextResponse.json({
        success: true,
        data: {
          region: config.region,
          regionKo: config.regionKo,
          office: config.office,
          companies,
          stats: stats.byRegion[0] || null,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 전체 데이터 요청
    if (type === 'overview' || type === 'all') {
      const allCompanies: RentalCarCompany[] = []
      const errors: string[] = []

      // 모든 시트에서 데이터 가져오기 (병렬 처리)
      const sheetPromises = Object.entries(SHEET_GID_MAP).map(async ([key, config]) => {
        try {
          const spreadsheetId = config.spreadsheetId || SPREADSHEET_ID
          const csvText = await fetchSheetData(config.gid, spreadsheetId)
          const rows = parseCSV(csvText)
          const columnMap = detectColumnMap(rows)

          const companies: RentalCarCompany[] = []
          for (let i = 1; i < rows.length; i++) {
            const company = parseCSVRowToCompany(
              rows[i],
              i,
              config.region,
              config.regionKo,
              config.office,
              columnMap
            )
            if (company) {
              companies.push(company)
            }
          }

          return { key, companies, error: null }
        } catch (error) {
          return { key, companies: [], error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      const results = await Promise.all(sheetPromises)

      for (const result of results) {
        allCompanies.push(...result.companies)
        if (result.error) {
          errors.push(`${result.key}: ${result.error}`)
        }
      }

      const stats = calculateSalesStats(allCompanies)

      // overview만 요청한 경우 companies 제외
      if (type === 'overview') {
        return NextResponse.json({
          success: true,
          data: {
            stats,
            totalCompanies: allCompanies.length,
            errors: errors.length > 0 ? errors : undefined,
          },
          timestamp: new Date().toISOString(),
        })
      }

      // all 요청한 경우 companies 포함
      return NextResponse.json({
        success: true,
        data: {
          companies: allCompanies,
          stats,
          errors: errors.length > 0 ? errors : undefined,
        },
        timestamp: new Date().toISOString(),
      })
    }

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
