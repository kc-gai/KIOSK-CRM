import { NextRequest, NextResponse } from 'next/server'

// Apps Script 웹 앱 URL (배포 후 설정)
const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || ''

interface AppsScriptResponse {
  success: boolean
  timestamp: string
  period: {
    startDate: string
    endDate: string
    prevStartDate: string
    prevEndDate: string
  }
  data: {
    gsc: {
      impressions: number
      impressionsTrend: number
      clicks: number
      clicksTrend: number
      ctr: number
      ctrTrend: number
      position: number
      positionTrend: number
    }
    ga4: {
      users: number
      usersTrend: number
      pageviews: number
      pageviewsTrend: number
    }
    conversion?: {
      demoRequests: number
      demoRequestsTrend: number
      inquiries: number
      inquiriesTrend: number
      salesLeads: number
      salesLeadsTrend: number
    }
  }
  error?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '3m'
  const customStart = searchParams.get('startDate')
  const customEnd = searchParams.get('endDate')

  // Apps Script URL이 설정되지 않은 경우 더미 데이터 반환
  if (!APPS_SCRIPT_URL) {
    // 요청된 월 추출
    const requestedMonth = customStart ? parseInt(customStart.split('-')[1]) : new Date().getMonth() + 1
    const requestedYear = customStart ? parseInt(customStart.split('-')[0]) : new Date().getFullYear()

    // 2026년 월별 더미 데이터 (실제 API 연동 전까지 사용)
    const monthlyDemoData: { [key: number]: any } = {
      1: {
        gsc: { impressions: 225341, clicks: 1794, ctr: 0.80, position: 4.8 },
        ga4: { users: 3491, pageviews: 5605 },
        conversion: { demoRequests: 3, inquiries: 5, salesLeads: 8 }
      },
      2: {
        gsc: { impressions: 215000, clicks: 1850, ctr: 0.86, position: 4.6 },
        ga4: { users: 3650, pageviews: 5800 },
        conversion: { demoRequests: 4, inquiries: 6, salesLeads: 9 }
      },
      3: {
        gsc: { impressions: 230000, clicks: 2000, ctr: 0.87, position: 4.5 },
        ga4: { users: 3800, pageviews: 6000 },
        conversion: { demoRequests: 5, inquiries: 7, salesLeads: 10 }
      },
    }

    // 해당 월의 데이터 가져오기 (없으면 기본값)
    const monthData = monthlyDemoData[requestedMonth] || monthlyDemoData[1]

    return NextResponse.json({
      success: true,
      message: 'Apps Script URL not configured. Returning demo data.',
      requestedMonth,
      requestedYear,
      period: {
        startDate: customStart || '2026-02-01',
        endDate: customEnd || '2026-02-28',
        prevStartDate: '2026-01-01',
        prevEndDate: '2026-01-31',
      },
      gsc: {
        impressions: monthData.gsc.impressions,
        impressionsTrend: 5.2,
        clicks: monthData.gsc.clicks,
        clicksTrend: 3.1,
        ctr: monthData.gsc.ctr,
        ctrTrend: 2.5,
        position: monthData.gsc.position,
        positionTrend: -1.2,
      },
      ga4: {
        users: monthData.ga4.users,
        usersTrend: 4.5,
        pageviews: monthData.ga4.pageviews,
        pageviewsTrend: 3.8,
      },
      conversion: {
        demoRequests: monthData.conversion.demoRequests,
        demoRequestsTrend: 33.3,
        inquiries: monthData.conversion.inquiries,
        inquiriesTrend: 20.0,
        salesLeads: monthData.conversion.salesLeads,
        salesLeadsTrend: 12.5,
      },
    })
  }

  try {
    // Apps Script에 요청
    const url = new URL(APPS_SCRIPT_URL)
    url.searchParams.set('action', 'all')
    url.searchParams.set('period', period)

    if (customStart && customEnd) {
      url.searchParams.set('startDate', customStart)
      url.searchParams.set('endDate', customEnd)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Apps Script는 리다이렉트 응답을 반환할 수 있음
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }

    const data: AppsScriptResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Apps Script returned an error')
    }

    return NextResponse.json({
      success: true,
      period: data.period,
      gsc: data.data.gsc,
      ga4: data.data.ga4,
      conversion: data.data.conversion,
    })

  } catch (error) {
    console.error('Analytics API Error:', error)

    // 에러 시 더미 데이터 반환 (개발 중에도 UI가 보이도록)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      period: {
        startDate: '2025-11-01',
        endDate: '2026-02-02',
        prevStartDate: '2025-08-01',
        prevEndDate: '2025-10-31',
      },
      gsc: {
        impressions: 550157,
        impressionsTrend: 63.8,
        clicks: 5629,
        clicksTrend: -2.1,
        ctr: 1.02,
        ctrTrend: -40.2,
        position: 5.0,
        positionTrend: -43.1,
      },
      ga4: {
        users: 10072,
        usersTrend: 11.3,
        pageviews: 17511,
        pageviewsTrend: -1.8,
      },
      conversion: {
        demoRequests: 3,
        demoRequestsTrend: 50.0,
        inquiries: 5,
        inquiriesTrend: 25.0,
        salesLeads: 8,
        salesLeadsTrend: 33.3,
      },
    })
  }
}
