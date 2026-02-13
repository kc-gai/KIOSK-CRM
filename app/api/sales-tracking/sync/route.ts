import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  SHEET_GID_MAP,
  SPREADSHEET_ID,
  parseCSV,
  parseCSVRowToCompany,
  detectColumnMap,
  type RentalCarCompany,
} from '@/lib/sales-tracking'

// Google Sheets에서 CSV 데이터 가져오기
async function fetchSheetData(gid: string, spreadsheetId: string = SPREADSHEET_ID): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
  const response = await fetch(url, {
    headers: { 'Accept': 'text/csv' },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status}`)
  }
  return response.text()
}

// POST /api/sales-tracking/sync - Google Sheets → DB 동기화
export async function POST(_request: NextRequest) {
  try {
    const allCompanies: RentalCarCompany[] = []
    const errors: string[] = []

    // 모든 시트에서 데이터 가져오기 (병렬)
    const sheetPromises = Object.entries(SHEET_GID_MAP).map(async ([key, config]) => {
      try {
        const spreadsheetId = config.spreadsheetId || SPREADSHEET_ID
        const csvText = await fetchSheetData(config.gid, spreadsheetId)
        const rows = parseCSV(csvText)
        const columnMap = detectColumnMap(rows)
        const companies: RentalCarCompany[] = []

        for (let i = 1; i < rows.length; i++) {
          const company = parseCSVRowToCompany(
            rows[i], i, config.region, config.regionKo, config.office, columnMap
          )
          if (company) companies.push(company)
        }
        return { key, companies, error: null }
      } catch (error) {
        return { key, companies: [] as RentalCarCompany[], error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    const results = await Promise.all(sheetPromises)
    for (const result of results) {
      allCompanies.push(...result.companies)
      if (result.error) errors.push(`${result.key}: ${result.error}`)
    }

    // DB에 upsert (companyName + region 기준)
    let created = 0
    let updated = 0
    let contactsCreated = 0

    for (const company of allCompanies) {
      // 기존 레코드 검색
      const existing = await prisma.company.findFirst({
        where: {
          companyName: company.companyName,
          region: company.region,
          source: 'sheets',
        },
      })

      if (existing) {
        // 업데이트 (상태, 전화번호 등 변경사항 반영)
        await prisma.company.update({
          where: { id: existing.id },
          data: {
            prefecture: company.prefecture || existing.prefecture,
            office: company.office,
            phone: company.phone || existing.phone,
            email: company.email || existing.email,
            contactUrl: company.contactUrl || existing.contactUrl,
            address: company.address || existing.address,
            status: company.status,
            systemInUse: company.systemInUse || existing.systemInUse,
            notes: company.notes || existing.notes,
          },
        })
        updated++

        // contactHistory → ContactRecord 동기화
        if (company.contactHistory.length > 0) {
          // 기존 연락기록 수 확인
          const existingContacts = await prisma.contactRecord.count({
            where: { companyId: existing.id },
          })

          // 새로운 연락기록이 더 많으면 추가분만 insert
          if (company.contactHistory.length > existingContacts) {
            const newRecords = company.contactHistory.slice(existingContacts)
            for (const record of newRecords) {
              await prisma.contactRecord.create({
                data: {
                  companyId: existing.id,
                  contactDate: record.date,
                  contactType: record.contactType || 'unknown',
                  channel: 'sheets',
                  summary: `Synced from Google Sheets (${record.dateStr})`,
                  sentBy: 'sync',
                },
              })
              contactsCreated++
            }
          }
        }
      } else {
        // 신규 생성
        const newCompany = await prisma.company.create({
          data: {
            companyName: company.companyName,
            prefecture: company.prefecture,
            region: company.region,
            office: company.office,
            phone: company.phone,
            email: company.email,
            contactUrl: company.contactUrl,
            address: company.address,
            status: company.status,
            systemInUse: company.systemInUse,
            notes: company.notes,
            source: 'sheets',
            sourceDetail: `${company.region} (row ${company.rowNumber})`,
          },
        })
        created++

        // contactHistory → ContactRecord 생성
        for (const record of company.contactHistory) {
          await prisma.contactRecord.create({
            data: {
              companyId: newCompany.id,
              contactDate: record.date,
              contactType: record.contactType || 'unknown',
              channel: 'sheets',
              summary: `Synced from Google Sheets (${record.dateStr})`,
              sentBy: 'sync',
            },
          })
          contactsCreated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFetched: allCompanies.length,
        created,
        updated,
        contactsCreated,
        errors: errors.length > 0 ? errors : undefined,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Sales Tracking Sync Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
