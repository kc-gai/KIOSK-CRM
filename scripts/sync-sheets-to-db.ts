/**
 * Google Sheets → DB 동기화 스크립트
 * 실행: npx tsx scripts/sync-sheets-to-db.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ========== sales-tracking.ts에서 필요한 부분 복사 ==========

const SPREADSHEET_ID = '1DmsvdcknuIXETeBj72ewSefwjJ8fKb6ROAl3dS5JJmg'
const HOKKAIDO_SPREADSHEET_ID = '1TlpV41LIYjmEE0z8lamuFTCn_-3VK3VH'

const SHEET_GID_MAP: Record<string, { gid: string; region: string; regionKo: string; office: string; spreadsheetId?: string }> = {
  'hokkaido': { gid: '608712546', region: '北海道', regionKo: '홋카이도', office: 'A', spreadsheetId: HOKKAIDO_SPREADSHEET_ID },
  'kanto': { gid: '1409968920', region: '関東', regionKo: '관동', office: 'B' },
  'tohoku': { gid: '744301574', region: '東北', regionKo: '도호쿠', office: 'B' },
  'tokai': { gid: '308948332', region: '静岡・愛知・岐阜', regionKo: '토카이', office: 'B' },
  'chugoku': { gid: '286265685', region: '中国', regionKo: '주고쿠', office: 'C' },
  'kinki': { gid: '678324682', region: '近畿', regionKo: '긴키', office: 'C' },
  'kyushu': { gid: '255263912', region: '九州', regionKo: '규슈', office: 'D' },
  'shikoku': { gid: '1256969569', region: '四国', regionKo: '시코쿠', office: 'C' },
  'okinawa': { gid: '687117153', region: '沖縄', regionKo: '오키나와', office: 'E' },
  'ishigaki_miyako': { gid: '593579122', region: '石垣・宮古', regionKo: '이시가키/미야코', office: 'E' },
}

type ProgressStatus = '未交渉' | '連絡中' | '商談中' | '見積提出' | '成約' | '失注' | '保留' | 'unknown'

type ContactRecord = {
  date: Date
  dateStr: string
  year: number
  month: number
  day: number
  contactType?: 'mail' | 'inquiry' | 'phone' | 'unknown'
}

type CompanyData = {
  companyName: string
  prefecture: string
  region: string
  office: string
  phone: string
  email?: string
  contactUrl?: string
  address: string
  status: ProgressStatus
  systemInUse: string
  notes: string
  contactHistory: ContactRecord[]
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  const fullDateMatch = dateStr.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/)
  if (fullDateMatch) {
    return new Date(parseInt(fullDateMatch[1]), parseInt(fullDateMatch[2]) - 1, parseInt(fullDateMatch[3]))
  }
  const jaFullMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (jaFullMatch) {
    return new Date(parseInt(jaFullMatch[1]), parseInt(jaFullMatch[2]) - 1, parseInt(jaFullMatch[3]))
  }
  const jaMatch = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
  if (jaMatch) {
    return new Date(new Date().getFullYear(), parseInt(jaMatch[1]) - 1, parseInt(jaMatch[2]))
  }
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (slashMatch) {
    return new Date(new Date().getFullYear(), parseInt(slashMatch[1]) - 1, parseInt(slashMatch[2]))
  }
  return null
}

function parseContactHistory(cells: string[]): ContactRecord[] {
  const records: ContactRecord[] = []
  for (const cell of cells) {
    if (!cell || cell.trim() === '') continue
    const date = parseDate(cell)
    if (date) {
      records.push({ date, dateStr: cell, year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() })
    }
  }
  return records
}

function parseProgressStatus(status: string): ProgressStatus {
  const s = status?.trim() || ''
  if (s.includes('成約') || s.includes('契約')) return '成約'
  if (s.includes('失注') || s.includes('不成立')) return '失注'
  if (s.includes('保留') || s.includes('待')) return '保留'
  if (s.includes('見積')) return '見積提出'
  if (s.includes('商談') || s.includes('検討')) return '商談中'
  if (s.includes('連絡')) return '連絡中'
  if (s === '未交渉' || s === '') return '未交渉'
  return '未交渉'
}

function isEmailAddress(value: string): boolean {
  if (!value) return false
  return value.includes('@') || value.includes('\uff20')
}

function normalizeEmail(value: string): string {
  return value.replace(/\uff20/g, '@')
}

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]
    if (char === '"') {
      if (inQuotes && nextChar === '"') { currentCell += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell); currentCell = ''
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell.trim())) rows.push(currentRow)
      currentRow = []; currentCell = ''
      if (char === '\r') i++
    } else if (char !== '\r') {
      currentCell += char
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell)
    if (currentRow.some(cell => cell.trim())) rows.push(currentRow)
  }
  return rows
}

function findColIdx(rows: string[][], keywords: string[]): number {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    for (let j = 0; j < (rows[i]?.length || 0); j++) {
      const cell = (rows[i][j] || '').trim()
      if (cell && keywords.some(kw => cell.includes(kw))) return j
    }
  }
  return -1
}

function detectColumnMap(rows: string[][]) {
  const phoneIdx = findColIdx(rows, ['電話番号', '전화번호'])
  if (phoneIdx >= 0) {
    const contactMethodIdx = phoneIdx + 1
    const addressIdx = phoneIdx + 2
    const notesIdx = phoneIdx + 3
    const hasNdaCols = findColIdx(rows, ['NDA']) >= 0
    const offset = hasNdaCols ? 5 : 1
    const currentStatusIdx = phoneIdx - offset
    const systemIdx = currentStatusIdx - 1
    const fleetIdx = systemIdx - 1
    const progressIdx = fleetIdx - 1
    const contactDatesEnd = progressIdx
    return { phoneIdx, contactMethodIdx, addressIdx, notesIdx, progressIdx, fleetIdx, systemIdx, currentStatusIdx, contactDatesEnd }
  }
  return { phoneIdx: 14, contactMethodIdx: 15, addressIdx: 16, notesIdx: 17, progressIdx: 10, fleetIdx: 11, systemIdx: 12, currentStatusIdx: 13, contactDatesEnd: 10 }
}

function parseCSVRowToCompany(row: string[], region: string, office: string, columnMap: ReturnType<typeof detectColumnMap>): CompanyData | null {
  if (!row || row.length < 3) return null
  const companyName = row[1]?.trim() || ''
  if (!companyName || companyName === '会社名' || companyName === '회사명' || companyName === '운영회사' || companyName === 'レンタカー会社') return null

  const cm = columnMap
  const contactCells = row.slice(5, cm.contactDatesEnd).filter(Boolean)
  const contactHistory = parseContactHistory(contactCells)

  const currentStatus = row[cm.currentStatusIdx]?.trim() || ''
  const progressStatus = row[cm.progressIdx]?.trim() || ''
  const status = parseProgressStatus(currentStatus || progressStatus || '未交渉')

  const rawContact = row[cm.contactMethodIdx]?.trim() || row[3]?.trim() || ''

  return {
    companyName,
    prefecture: row[0]?.trim() || '',
    region,
    office,
    phone: row[cm.phoneIdx]?.trim() || row[4]?.trim() || '',
    email: isEmailAddress(rawContact) ? normalizeEmail(rawContact) : undefined,
    contactUrl: rawContact && !isEmailAddress(rawContact) ? rawContact : undefined,
    address: row[cm.addressIdx]?.trim() || '',
    status,
    systemInUse: row[cm.systemIdx]?.trim() || '',
    notes: row[cm.notesIdx]?.trim() || '',
    contactHistory,
  }
}

// ========== 메인 실행 ==========

async function main() {
  console.log('=== Google Sheets → DB 동기화 시작 ===\n')

  let totalFetched = 0
  let created = 0
  let updated = 0
  let contactsCreated = 0
  const errors: string[] = []

  // 1. 모든 시트에서 데이터 가져오기 (병렬)
  const allCompanies: { company: CompanyData; sheetKey: string }[] = []

  const results = await Promise.allSettled(
    Object.entries(SHEET_GID_MAP).map(async ([key, config]) => {
      const spreadsheetId = config.spreadsheetId || SPREADSHEET_ID
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${config.gid}`
      console.log(`  [${key}] Fetching...`)

      const response = await fetch(url, { headers: { 'Accept': 'text/csv' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const csvText = await response.text()
      const rows = parseCSV(csvText)
      const columnMap = detectColumnMap(rows)

      const companies: CompanyData[] = []
      for (let i = 1; i < rows.length; i++) {
        const company = parseCSVRowToCompany(rows[i], config.region, config.office, columnMap)
        if (company) companies.push(company)
      }

      console.log(`  [${key}] ${companies.length} companies parsed`)
      return { key, companies }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const company of result.value.companies) {
        allCompanies.push({ company, sheetKey: result.value.key })
      }
    } else {
      errors.push(result.reason?.message || 'Unknown error')
      console.error(`  ERROR:`, result.reason)
    }
  }

  totalFetched = allCompanies.length
  console.log(`\n총 ${totalFetched}개 업체 가져옴. DB에 저장 중...\n`)

  // 2. DB에 upsert (batch로 처리)
  for (let i = 0; i < allCompanies.length; i++) {
    const { company, sheetKey } = allCompanies[i]

    try {
      // 기존 레코드 검색
      const existing = await prisma.company.findFirst({
        where: {
          companyName: company.companyName,
          region: company.region,
          source: 'sheets',
        },
      })

      if (existing) {
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

        // 연락기록 동기화
        if (company.contactHistory.length > 0) {
          const existingContacts = await prisma.contactRecord.count({ where: { companyId: existing.id } })
          if (company.contactHistory.length > existingContacts) {
            const newRecords = company.contactHistory.slice(existingContacts)
            for (const record of newRecords) {
              await prisma.contactRecord.create({
                data: {
                  companyId: existing.id,
                  contactDate: record.date,
                  contactType: record.contactType || 'unknown',
                  channel: 'sheets',
                  summary: `Synced from Sheets (${record.dateStr})`,
                  sentBy: 'sync',
                },
              })
              contactsCreated++
            }
          }
        }
      } else {
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
            sourceDetail: `${sheetKey} (${company.region})`,
          },
        })
        created++

        // 연락기록 생성
        for (const record of company.contactHistory) {
          await prisma.contactRecord.create({
            data: {
              companyId: newCompany.id,
              contactDate: record.date,
              contactType: record.contactType || 'unknown',
              channel: 'sheets',
              summary: `Synced from Sheets (${record.dateStr})`,
              sentBy: 'sync',
            },
          })
          contactsCreated++
        }
      }

      // 진행 상황 표시 (50개마다)
      if ((i + 1) % 50 === 0) {
        console.log(`  진행: ${i + 1}/${allCompanies.length} (created: ${created}, updated: ${updated})`)
      }
    } catch (err) {
      console.error(`  Error for ${company.companyName}:`, err)
    }
  }

  console.log('\n=== 동기화 완료 ===')
  console.log(`  총 가져온 업체: ${totalFetched}`)
  console.log(`  신규 생성: ${created}`)
  console.log(`  업데이트: ${updated}`)
  console.log(`  연락기록 생성: ${contactsCreated}`)
  if (errors.length > 0) {
    console.log(`  에러: ${errors.join(', ')}`)
  }

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
