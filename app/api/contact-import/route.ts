import { NextRequest, NextResponse } from 'next/server'
import { ContactType, determineContactType } from '@/lib/sales-tracking'

// 연락 시도 가져오기 데이터 타입
export type ContactImportRecord = {
  companyName: string
  contactDate: string  // YYYY-MM-DD 또는 YYYY/M/D 형식
  contactType: ContactType
  region?: string
  office?: string
}

// 연락 시도 가져오기 요청 타입
type ImportRequest = {
  action: 'import' | 'reset' | 'get'
  records?: ContactImportRecord[]
}

// 메모리 저장소 (실제로는 localStorage에 저장됨 - 클라이언트 측)
// 서버에서는 요청 처리만 담당

// POST: 연락 시도 데이터 가져오기/리셋
export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()

    if (body.action === 'import') {
      // 데이터 가져오기 - 클라이언트에서 localStorage에 저장하도록 반환
      const records = body.records || []

      // 유효성 검사
      const validRecords = records.filter(r => r.companyName && r.contactDate)

      // 날짜 포맷 정규화
      const normalizedRecords = validRecords.map(r => ({
        ...r,
        contactDate: normalizeDate(r.contactDate),
      }))

      return NextResponse.json({
        success: true,
        data: {
          imported: normalizedRecords.length,
          records: normalizedRecords,
        },
        message: `${normalizedRecords.length}개의 연락 시도 기록을 가져왔습니다.`,
      })
    }

    if (body.action === 'reset') {
      return NextResponse.json({
        success: true,
        data: {
          reset: true,
        },
        message: '연락 시도 기록이 초기화되었습니다.',
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 })
  } catch (error) {
    console.error('Contact import API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// 날짜 정규화 (YYYY-MM-DD 형식으로 통일)
function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''

  // YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // YYYY/M/D 또는 YYYY-M-D 형식
  const fullMatch = dateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/)
  if (fullMatch) {
    const year = fullMatch[1]
    const month = fullMatch[2].padStart(2, '0')
    const day = fullMatch[3].padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // M/D 형식 (년도 없음) - 기본 년도 2024 사용
  const mdMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/)
  if (mdMatch) {
    const month = mdMatch[1].padStart(2, '0')
    const day = mdMatch[2].padStart(2, '0')
    // 9~12월이면 2024, 1~8월이면 2025으로 추론
    const monthNum = parseInt(mdMatch[1])
    const year = monthNum >= 9 ? '2024' : '2025'
    return `${year}-${month}-${day}`
  }

  return dateStr
}

// 텍스트 데이터 파싱 (스프레드시트 복사본)
function parseSpreadsheetText(text: string): ContactImportRecord[] {
  const records: ContactImportRecord[] = []
  const lines = text.split('\n').filter(l => l.trim())

  for (const line of lines) {
    // 탭 또는 쉼표로 분리
    const parts = line.split(/\t|,/).map(p => p.trim())

    if (parts.length >= 2) {
      const companyName = parts[0]
      const contactDate = parts[1]
      const contactMethod = parts[2] || ''

      if (companyName && contactDate) {
        records.push({
          companyName,
          contactDate: normalizeDate(contactDate),
          contactType: determineContactType(contactMethod),
        })
      }
    }
  }

  return records
}
