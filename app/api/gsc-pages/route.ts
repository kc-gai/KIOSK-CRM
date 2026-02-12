import { NextRequest, NextResponse } from 'next/server'

// Apps Script 웹 앱 URL (배포 후 설정)
const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || ''

export interface PageData {
  page: string
  title: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface AppsScriptPagesResponse {
  success: boolean
  data: PageData[]
  error?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const minImpressions = parseInt(searchParams.get('minImpressions') || '1000')
  const maxCtr = parseFloat(searchParams.get('maxCtr') || '2')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Apps Script URL이 설정되지 않은 경우 더미 데이터 반환
  if (!APPS_SCRIPT_URL) {
    const demoData: PageData[] = [
      {
        page: '/blog/myna-license-nfc-reader/',
        title: 'マイナ免許証とNFCリーダー｜レンタカー店舗への導入ガイド',
        impressions: 59383,
        clicks: 398,
        ctr: 0.67,
        position: 3.2,
      },
      {
        page: '/blog/car-rental-business-profit-margin/',
        title: 'レンタカー事業の利益率｜収益改善のポイント',
        impressions: 10185,
        clicks: 23,
        ctr: 0.23,
        position: 8.5,
      },
      {
        page: '/blog/rentalcar-shaken-guide/',
        title: 'レンタカー車検ガイド｜費用と手続きの流れ',
        impressions: 8542,
        clicks: 85,
        ctr: 0.99,
        position: 4.1,
      },
      {
        page: '/blog/rentacar-startup-guide/',
        title: 'レンタカー事業開業ガイド｜必要な許可と手続き',
        impressions: 7234,
        clicks: 72,
        ctr: 1.0,
        position: 5.3,
      },
      {
        page: '/blog/rental-car-insurance-guide/',
        title: 'レンタカー保険完全ガイド｜補償内容と選び方',
        impressions: 5642,
        clicks: 28,
        ctr: 0.50,
        position: 6.8,
      },
      {
        page: '/blog/international-driving-permit-japan/',
        title: '国際運転免許証で日本でレンタカーを借りる方法',
        impressions: 4521,
        clicks: 45,
        ctr: 1.0,
        position: 4.5,
      },
      {
        page: '/blog/rental-car-reservation-system/',
        title: 'レンタカー予約システム比較｜おすすめの選び方',
        impressions: 3890,
        clicks: 31,
        ctr: 0.80,
        position: 7.2,
      },
      {
        page: '/blog/ev-rental-car-guide/',
        title: '電気自動車レンタル完全ガイド｜EV導入のメリット',
        impressions: 3245,
        clicks: 48,
        ctr: 1.48,
        position: 3.8,
      },
      {
        page: '/blog/rental-car-fleet-management/',
        title: 'レンタカー車両管理｜効率化のポイント',
        impressions: 2876,
        clicks: 37,
        ctr: 1.29,
        position: 5.1,
      },
      {
        page: '/blog/self-checkin-kiosk-guide/',
        title: 'セルフチェックイン機導入ガイド｜無人受付のメリット',
        impressions: 2543,
        clicks: 38,
        ctr: 1.49,
        position: 4.9,
      },
    ]

    // 필터링: 고노출 + 저CTR
    const filtered = demoData
      .filter(item => item.impressions >= minImpressions && item.ctr < maxCtr)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      message: 'Apps Script URL not configured. Returning demo data.',
      data: filtered,
      filters: { minImpressions, maxCtr },
      total: filtered.length,
    })
  }

  try {
    // Apps Script에 요청
    const url = new URL(APPS_SCRIPT_URL)
    url.searchParams.set('action', 'pages')
    url.searchParams.set('minImpressions', minImpressions.toString())
    url.searchParams.set('maxCtr', maxCtr.toString())
    url.searchParams.set('limit', limit.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }

    const data = await response.json()

    // Apps Script가 pages 액션을 지원하는지 확인 (배열 반환 여부)
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Apps Script does not support pages action yet')
    }

    return NextResponse.json({
      success: true,
      data: data.data,
      filters: { minImpressions, maxCtr },
      total: data.data.length,
    })

  } catch (error) {
    console.error('GSC Pages API Error:', error)

    // 에러 시 더미 데이터 반환 (전체 데이터)
    const demoData: PageData[] = [
      {
        page: '/blog/myna-license-nfc-reader/',
        title: 'マイナ免許証とNFCリーダー｜レンタカー店舗への導入ガイド',
        impressions: 59383,
        clicks: 398,
        ctr: 0.67,
        position: 3.2,
      },
      {
        page: '/blog/car-rental-business-profit-margin/',
        title: 'レンタカー事業の利益率｜収益改善のポイント',
        impressions: 10185,
        clicks: 23,
        ctr: 0.23,
        position: 8.5,
      },
      {
        page: '/blog/rentalcar-shaken-guide/',
        title: 'レンタカー車検ガイド｜費用と手続きの流れ',
        impressions: 8542,
        clicks: 85,
        ctr: 0.99,
        position: 4.1,
      },
      {
        page: '/blog/rentacar-startup-guide/',
        title: 'レンタカー事業開業ガイド｜必要な許可と手続き',
        impressions: 7234,
        clicks: 72,
        ctr: 1.0,
        position: 5.3,
      },
      {
        page: '/blog/rental-car-insurance-guide/',
        title: 'レンタカー保険完全ガイド｜補償内容と選び方',
        impressions: 5642,
        clicks: 28,
        ctr: 0.50,
        position: 6.8,
      },
      {
        page: '/blog/international-driving-permit-japan/',
        title: '国際運転免許証で日本でレンタカーを借りる方法',
        impressions: 4521,
        clicks: 45,
        ctr: 1.0,
        position: 4.5,
      },
      {
        page: '/blog/rental-car-reservation-system/',
        title: 'レンタカー予約システム比較｜おすすめの選び方',
        impressions: 3890,
        clicks: 31,
        ctr: 0.80,
        position: 7.2,
      },
      {
        page: '/blog/ev-rental-car-guide/',
        title: '電気自動車レンタル完全ガイド｜EV導入のメリット',
        impressions: 3245,
        clicks: 48,
        ctr: 1.48,
        position: 3.8,
      },
      {
        page: '/blog/rental-car-fleet-management/',
        title: 'レンタカー車両管理｜効率化のポイント',
        impressions: 2876,
        clicks: 37,
        ctr: 1.29,
        position: 5.1,
      },
      {
        page: '/blog/self-checkin-kiosk-guide/',
        title: 'セルフチェックイン機導入ガイド｜無人受付のメリット',
        impressions: 2543,
        clicks: 38,
        ctr: 1.49,
        position: 4.9,
      },
    ]

    const filtered = demoData
      .filter(item => item.impressions >= minImpressions && item.ctr < maxCtr)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      message: 'Using demo data (Apps Script does not support pages action)',
      data: filtered,
      filters: { minImpressions, maxCtr },
      total: filtered.length,
    })
  }
}
