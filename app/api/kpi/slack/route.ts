import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyKPICounts, KPICountResult } from '@/lib/slack'

export type SlackKPIResponse = {
  success: boolean
  data?: {
    year: number
    month: number
    demoCount: number
    inquiryCount: number
    totalLeads: number
    demoDetails: { date: string; company?: string; person?: string }[]
    inquiryDetails: { date: string; company?: string; person?: string }[]
  }
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Get channel IDs from environment
    const demoChannelId = process.env.SLACK_DEMO_CHANNEL_ID
    const inquiryChannelId = process.env.SLACK_INQUIRY_CHANNEL_ID

    if (!demoChannelId || !inquiryChannelId) {
      return NextResponse.json({
        success: false,
        error: 'Slack channel IDs not configured. Set SLACK_DEMO_CHANNEL_ID and SLACK_INQUIRY_CHANNEL_ID in environment variables.',
      } as SlackKPIResponse, { status: 500 })
    }

    const result = await getMonthlyKPICounts(demoChannelId, inquiryChannelId, year, month)

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        ...result,
      },
    } as SlackKPIResponse)
  } catch (error) {
    console.error('Slack KPI API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as SlackKPIResponse, { status: 500 })
  }
}

// POST endpoint to get multiple months at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { months } = body as { months: { year: number; month: number }[] }

    if (!months || !Array.isArray(months)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected { months: [{ year, month }, ...] }',
      }, { status: 400 })
    }

    const demoChannelId = process.env.SLACK_DEMO_CHANNEL_ID
    const inquiryChannelId = process.env.SLACK_INQUIRY_CHANNEL_ID

    if (!demoChannelId || !inquiryChannelId) {
      return NextResponse.json({
        success: false,
        error: 'Slack channel IDs not configured',
      }, { status: 500 })
    }

    const results = await Promise.all(
      months.map(async ({ year, month }) => {
        const result = await getMonthlyKPICounts(demoChannelId, inquiryChannelId, year, month)
        return { year, month, ...result }
      })
    )

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Slack KPI API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}
