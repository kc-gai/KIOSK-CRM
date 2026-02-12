// 영업 진척 관리 - Google Sheets 데이터 파싱 및 타입 정의

// 메인 스프레드시트 ID
export const SPREADSHEET_ID = '1DmsvdcknuIXETeBj72ewSefwjJ8fKb6ROAl3dS5JJmg'
// 홋카이도 스프레드시트 ID (별도 파일)
export const HOKKAIDO_SPREADSHEET_ID = '1TlpV41LIYjmEE0z8lamuFTCn_-3VK3VH'

// 지역별 시트 gid 매핑
export const SHEET_GID_MAP: { [key: string]: { gid: string; region: string; regionKo: string; office: string; spreadsheetId?: string } } = {
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

// 진척 상태 타입
export type ProgressStatus =
  | '未交渉'      // 미교섭
  | '連絡中'      // 연락 중
  | '商談中'      // 상담 중
  | '見積提出'    // 견적 제출
  | '成約'        // 성약
  | '失注'        // 실주
  | '保留'        // 보류
  | 'unknown'

// 연락 방법 타입
export type ContactType = 'mail' | 'inquiry' | 'phone' | 'unknown'

// 연락 기록
export type ContactRecord = {
  date: Date
  dateStr: string  // 원본 문자열
  year: number
  month: number
  day: number
  contactType?: ContactType  // [메일], [문의], [전화] 등
}

// 렌터카 회사 정보
export type RentalCarCompany = {
  id: string
  rowNumber: number
  prefecture: string           // 都道府県
  companyName: string          // 会社名
  phone: string                // 電話番号
  contactMethod: string        // 問合せ先 (레거시 - email/contactUrl 분리 전 호환용)
  email?: string               // 이메일 주소
  contactUrl?: string          // HP 문의 URL
  address: string              // 住所
  status: ProgressStatus       // 進捗状況
  systemInUse: string          // 使用システム (レンタカー侍 등)
  contactHistory: ContactRecord[]  // 訪問・連絡 履歴
  notes: string                // 備考
  region: string               // 地域 (関東, 東北, etc.)
  regionKo: string             // 지역 (한국어)
  office: string               // 管轄オフィス (A, B, C, D, E)
}

// 지역별 통계
export type RegionSalesStats = {
  region: string
  regionKo: string
  office: string
  totalCompanies: number
  statusBreakdown: {
    [key in ProgressStatus]?: number
  }
  contactedCount: number       // 1회 이상 연락한 회사 수
  lastContactDate: Date | null // 가장 최근 연락 날짜
}

// 전체 통계
export type SalesOverviewStats = {
  totalCompanies: number
  statusBreakdown: {
    [key in ProgressStatus]?: number
  }
  contactedCompanies: number   // 연락 기록 있는 회사
  neverContactedCompanies: number  // 연락 없는 회사
  recentlyContacted: number    // 최근 30일 내 연락
  byRegion: RegionSalesStats[]
  byOffice: {
    [officeCode: string]: {
      name: string
      totalCompanies: number
      contacted: number
    }
  }
}

// 날짜 파싱 함수 (Google Sheets에 년도 포함되어 있으므로 그대로 파싱)
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null

  let year: number | null = null
  let month: number | null = null
  let day: number | null = null

  // 1. 년도 포함 형식: 2025/7/2, 2025-7-2, 2025.7.2
  const fullDateMatch = dateStr.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/)
  if (fullDateMatch) {
    year = parseInt(fullDateMatch[1])
    month = parseInt(fullDateMatch[2])
    day = parseInt(fullDateMatch[3])
    return new Date(year, month - 1, day)
  }

  // 2. 년도 포함 일본어 형식: 2025年3月7日
  const jaFullMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (jaFullMatch) {
    year = parseInt(jaFullMatch[1])
    month = parseInt(jaFullMatch[2])
    day = parseInt(jaFullMatch[3])
    return new Date(year, month - 1, day)
  }

  // 3. 일본어 형식 (년도 없음): 3月7日
  const jaMatch = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
  if (jaMatch) {
    month = parseInt(jaMatch[1])
    day = parseInt(jaMatch[2])
  }

  // 4. 슬래시 형식 (월/일): 5/1, 10/14
  if (!month) {
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/)
    if (slashMatch) {
      month = parseInt(slashMatch[1])
      day = parseInt(slashMatch[2])
    }
  }

  // 5. 하이픈 형식 (월-일): 5-1, 10-14
  if (!month) {
    const hyphenMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})$/)
    if (hyphenMatch) {
      month = parseInt(hyphenMatch[1])
      day = parseInt(hyphenMatch[2])
    }
  }

  if (!month || !day) return null

  // 년도 없는 경우 현재 년도 사용
  year = new Date().getFullYear()
  return new Date(year, month - 1, day)
}

// 연락 기록 파싱
export function parseContactHistory(cells: string[]): ContactRecord[] {
  const records: ContactRecord[] = []

  for (const cell of cells) {
    if (!cell || cell.trim() === '') continue

    const date = parseDate(cell)
    if (date) {
      records.push({
        date,
        dateStr: cell,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      })
    }
  }

  return records
}

// 진척 상태 파싱
export function parseProgressStatus(status: string): ProgressStatus {
  const statusMap: { [key: string]: ProgressStatus } = {
    // 미교섭 (Not contacted)
    '未交渉': '未交渉',
    '미교섭': '未交渉',
    // 연락중 (In contact)
    '連絡中': '連絡中',
    '연락중': '連絡中',
    '연락 중': '連絡中',
    '連絡': '連絡中',
    '連絡待ち': '連絡中',
    '連絡済み': '連絡中',
    // 상담중 (Negotiating)
    '商談中': '商談中',
    '상담중': '商談中',
    '상담 중': '商談中',
    '商談': '商談中',
    // 견적제출 (Quote submitted)
    '見積提出': '見積提出',
    '견적제출': '見積提出',
    '견적 제출': '見積提出',
    '見積': '見積提出',
    '見積り': '見積提出',
    '見積中': '見積提出',
    // 성약/계약완료 (Contracted)
    '成約': '成約',
    '성약': '成約',
    '契約': '成約',
    '계약': '成約',
    '契約済み': '成約',
    '契約済': '成約',
    '계약완료': '成約',
    // 실주 (Lost deal)
    '失注': '失注',
    '실주': '失注',
    '不成立': '失注',
    // 보류 (On hold)
    '保留': '保留',
    '보류': '保留',
    '待保留': '保留',
    '待機': '保留',
  }

  const normalized = status?.trim() || ''

  // 정확한 매칭 먼저 시도
  if (statusMap[normalized]) {
    return statusMap[normalized]
  }

  // 부분 매칭 시도 (契約済み 등의 변형 처리)
  const normalizedLower = normalized.toLowerCase()
  if (normalizedLower.includes('契約') || normalizedLower.includes('契約済')) {
    return '成約'
  }
  if (normalizedLower.includes('連絡') || normalizedLower.includes('連絡済')) {
    return '連絡中'
  }
  if (normalizedLower.includes('商談') || normalizedLower.includes('検討')) {
    return '商談中'
  }
  if (normalizedLower.includes('見積') || normalizedLower.includes('견적')) {
    return '見積提出'
  }
  if (normalizedLower.includes('保留') || normalizedLower.includes('待')) {
    return '保留'
  }
  if (normalizedLower.includes('失注') || normalizedLower.includes('不成立')) {
    return '失注'
  }

  // 기본값
  return '未交渉'
}

// 이메일 주소 판별 (전각 ＠ 포함)
export function isEmailAddress(value: string): boolean {
  if (!value) return false
  return value.includes('@') || value.includes('\uff20')  // U+FF20 = ＠
}

// 전각 ＠ → 반각 @ 정규화
export function normalizeEmail(value: string): string {
  return value.replace(/\uff20/g, '@')
}

// 연락 방법 타입 판별 (문의처 필드 기반)
export function determineContactType(contactMethod: string): ContactType {
  if (!contactMethod || contactMethod.trim() === '') return 'unknown'

  const trimmed = contactMethod.trim().toLowerCase()

  // 이메일 패턴: @가 포함되어 있으면 메일
  if (trimmed.includes('@')) {
    return 'mail'
  }

  // URL 패턴: http, https, www, .com, .co.jp 등
  if (
    trimmed.startsWith('http') ||
    trimmed.startsWith('www') ||
    trimmed.includes('.com') ||
    trimmed.includes('.co.jp') ||
    trimmed.includes('.jp') ||
    trimmed.includes('.net') ||
    trimmed.includes('form') ||
    trimmed.includes('contact') ||
    trimmed.includes('inquiry')
  ) {
    return 'inquiry'
  }

  // 전화번호 패턴
  if (/^[\d\-\(\)\+\s]+$/.test(trimmed) && trimmed.length >= 8) {
    return 'phone'
  }

  return 'unknown'
}

// 연락 시도 가져오기 데이터 타입
export type ContactImportData = {
  companyName: string
  contactDate: string
  contactType: ContactType
  region?: string
}

// 연락 시도 데이터 파싱 (외부 입력 데이터용)
export function parseContactImportData(
  companyName: string,
  contactDate: string,
  contactMethod: string
): ContactImportData | null {
  if (!companyName || !contactDate) return null

  return {
    companyName: companyName.trim(),
    contactDate: contactDate.trim(),
    contactType: determineContactType(contactMethod),
  }
}

// 시트별 컬럼 위치 매핑 (NDA/MOU/DX/SONOCAR 추가 등으로 시트마다 다름)
export type ColumnMap = {
  phoneIdx: number         // 電話番号
  contactMethodIdx: number // 問合せ先
  addressIdx: number       // 住所
  notesIdx: number         // 備考
  progressIdx: number      // 進捗状況
  fleetIdx: number         // 保有台数
  systemIdx: number        // システム
  currentStatusIdx: number // 現状
  contactDatesEnd: number  // 연락기록 끝 index (exclusive) - 시작은 항상 5
}

// 헤더 행에서 특정 키워드를 포함하는 컬럼 인덱스를 찾기
function findColIdx(rows: string[][], keywords: string[]): number {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    for (let j = 0; j < (rows[i]?.length || 0); j++) {
      const cell = (rows[i][j] || '').trim()
      if (cell && keywords.some(kw => cell.includes(kw))) {
        return j
      }
    }
  }
  return -1
}

// CSV 헤더 행으로부터 컬럼 매핑을 자동 감지
export function detectColumnMap(rows: string[][]): ColumnMap {
  // 전화번호 컬럼을 기준점으로 사용 (가장 확실한 마커)
  const phoneIdx = findColIdx(rows, ['電話番号', '전화번호'])

  if (phoneIdx >= 0) {
    // 전화번호 기준으로 나머지 컬럼 위치 결정
    // 전화번호 바로 뒤: 問合せ先, 住所, 備考
    const contactMethodIdx = phoneIdx + 1
    const addressIdx = phoneIdx + 2
    const notesIdx = phoneIdx + 3

    // 전화번호 앞쪽: NDA/MOU/DX/SONOCAR가 있으면 -5, 없으면 -1
    const hasNdaCols = findColIdx(rows, ['NDA']) >= 0
    const offset = hasNdaCols ? 5 : 1  // NDA/MOU/DX/SONOCAR(4개) + 現状(1개)

    const currentStatusIdx = phoneIdx - offset
    const systemIdx = currentStatusIdx - 1
    const fleetIdx = systemIdx - 1
    const progressIdx = fleetIdx - 1
    const contactDatesEnd = progressIdx  // 연락기록은 5번부터 progressIdx 직전까지

    return {
      phoneIdx,
      contactMethodIdx,
      addressIdx,
      notesIdx,
      progressIdx,
      fleetIdx,
      systemIdx,
      currentStatusIdx,
      contactDatesEnd,
    }
  }

  // fallback: 관동 형식 (NDA 컬럼 없음)
  return {
    phoneIdx: 14,
    contactMethodIdx: 15,
    addressIdx: 16,
    notesIdx: 17,
    progressIdx: 10,
    fleetIdx: 11,
    systemIdx: 12,
    currentStatusIdx: 13,
    contactDatesEnd: 10,
  }
}

// CSV 행을 회사 정보로 파싱
// 컬럼 구조는 시트마다 다름 - columnMap으로 동적 매핑
export function parseCSVRowToCompany(
  row: string[],
  rowNumber: number,
  region: string,
  regionKo: string,
  office: string,
  columnMap?: ColumnMap
): RentalCarCompany | null {
  // 최소한의 데이터가 있는지 확인
  if (!row || row.length < 3) return null

  const companyName = row[1]?.trim() || ''
  // 헤더 행 스킵 (회사명, 운영회사, レンタカー会社 등은 제목)
  if (!companyName || companyName === '会社名' || companyName === '회사명' || companyName === '운영회사' || companyName === 'レンタカー会社') return null

  // 컬럼 매핑 (없으면 기본값)
  const cm = columnMap || {
    phoneIdx: 14, contactMethodIdx: 15, addressIdx: 16, notesIdx: 17,
    progressIdx: 10, fleetIdx: 11, systemIdx: 12, currentStatusIdx: 13,
    contactDatesEnd: 10,
  }

  // 연락 기록 컬럼 (5번부터 progressIdx 직전까지)
  const contactCells = row.slice(5, cm.contactDatesEnd).filter(Boolean)
  const contactHistory = parseContactHistory(contactCells)

  // 현상황 - 실제 영업 상태
  const currentStatus = row[cm.currentStatusIdx]?.trim() || ''
  // 진척상황 - fallback
  const progressStatus = row[cm.progressIdx]?.trim() || ''
  // 현상황 우선, 없으면 진척상황, 둘 다 없으면 未交渉
  const status = parseProgressStatus(currentStatus || progressStatus || '未交渉')

  // 문의처 (이메일/HP URL 분리)
  const rawContact = row[cm.contactMethodIdx]?.trim() || row[3]?.trim() || ''

  return {
    id: `${region}-${rowNumber}`,
    rowNumber,
    prefecture: row[0]?.trim() || '',
    companyName,
    phone: row[cm.phoneIdx]?.trim() || row[4]?.trim() || '',  // 전화번호 또는 TEL(E)
    contactMethod: rawContact,
    email: isEmailAddress(rawContact) ? normalizeEmail(rawContact) : undefined,
    contactUrl: rawContact && !isEmailAddress(rawContact) ? rawContact : undefined,
    address: row[cm.addressIdx]?.trim() || '',
    status,
    systemInUse: row[cm.systemIdx]?.trim() || '',
    contactHistory,
    notes: row[cm.notesIdx]?.trim() || '',
    region,
    regionKo,
    office,
  }
}

// Google Sheets에서 CSV 데이터 가져오기
export async function fetchSheetData(gid: string, spreadsheetId: string = SPREADSHEET_ID): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'text/csv',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status}`)
  }

  return response.text()
}

// CSV 파싱
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell.trim())) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
      if (char === '\r') i++
    } else if (char !== '\r') {
      currentCell += char
    }
  }

  // 마지막 행 처리
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell)
    if (currentRow.some(cell => cell.trim())) {
      rows.push(currentRow)
    }
  }

  return rows
}

// 전체 영업 데이터 가져오기
export async function fetchAllSalesData(): Promise<{
  companies: RentalCarCompany[]
  stats: SalesOverviewStats
}> {
  const allCompanies: RentalCarCompany[] = []

  // 모든 시트에서 데이터 가져오기
  const sheetPromises = Object.entries(SHEET_GID_MAP).map(async ([key, config]) => {
    try {
      const spreadsheetId = config.spreadsheetId || SPREADSHEET_ID
      const csvText = await fetchSheetData(config.gid, spreadsheetId)
      const rows = parseCSV(csvText)

      // 헤더 행에서 컬럼 위치 자동 감지 (시트마다 NDA/MOU/DX/SONOCAR 유무가 다름)
      const columnMap = detectColumnMap(rows)

      // 데이터 행 파싱
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
          allCompanies.push(company)
        }
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${key}:`, error)
    }
  })

  await Promise.all(sheetPromises)

  // 통계 계산
  const stats = calculateSalesStats(allCompanies)

  return { companies: allCompanies, stats }
}

// 통계 계산
export function calculateSalesStats(companies: RentalCarCompany[]): SalesOverviewStats {
  const statusBreakdown: { [key in ProgressStatus]?: number } = {}
  const regionStatsMap: { [key: string]: RegionSalesStats } = {}
  const officeStats: SalesOverviewStats['byOffice'] = {}

  const officeNames: { [key: string]: string } = {
    'A': '札幌オフィス',
    'B': '東京オフィス',
    'C': '大阪オフィス',
    'D': '福岡オフィス',
    'E': '沖縄オフィス',
  }

  let contactedCompanies = 0
  let recentlyContacted = 0
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  for (const company of companies) {
    // 상태별 카운트
    statusBreakdown[company.status] = (statusBreakdown[company.status] || 0) + 1

    // 연락 기록 있는 회사
    if (company.contactHistory.length > 0) {
      contactedCompanies++

      // 최근 30일 내 연락
      const lastContact = company.contactHistory[company.contactHistory.length - 1]
      if (lastContact && lastContact.date > thirtyDaysAgo) {
        recentlyContacted++
      }
    }

    // 지역별 통계
    if (!regionStatsMap[company.region]) {
      regionStatsMap[company.region] = {
        region: company.region,
        regionKo: company.regionKo,
        office: company.office,
        totalCompanies: 0,
        statusBreakdown: {},
        contactedCount: 0,
        lastContactDate: null,
      }
    }

    const regionStats = regionStatsMap[company.region]
    regionStats.totalCompanies++
    regionStats.statusBreakdown[company.status] = (regionStats.statusBreakdown[company.status] || 0) + 1

    if (company.contactHistory.length > 0) {
      regionStats.contactedCount++
      const lastContact = company.contactHistory[company.contactHistory.length - 1]
      if (!regionStats.lastContactDate || (lastContact && lastContact.date > regionStats.lastContactDate)) {
        regionStats.lastContactDate = lastContact?.date || null
      }
    }

    // 사무소별 통계
    if (!officeStats[company.office]) {
      officeStats[company.office] = {
        name: officeNames[company.office] || company.office,
        totalCompanies: 0,
        contacted: 0,
      }
    }
    officeStats[company.office].totalCompanies++
    if (company.contactHistory.length > 0) {
      officeStats[company.office].contacted++
    }
  }

  return {
    totalCompanies: companies.length,
    statusBreakdown,
    contactedCompanies,
    neverContactedCompanies: companies.length - contactedCompanies,
    recentlyContacted,
    byRegion: Object.values(regionStatsMap).sort((a, b) => b.totalCompanies - a.totalCompanies),
    byOffice: officeStats,
  }
}
