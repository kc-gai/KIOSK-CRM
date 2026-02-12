import { NextRequest, NextResponse } from 'next/server'
import {
  getDashboardData,
  getLeadStats,
  getDealStats,
  getActivityStats,
  getLeads,
  getDeals,
  getActivities,
  getPipelines,
  getStages,
  getLeadsWithOrganizations,
  getLeadsByRegion,
  getOrganizations,
} from '@/lib/pipedrive'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'dashboard'
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

  try {
    let data: any

    switch (type) {
      case 'dashboard':
        data = await getDashboardData(year)
        break

      case 'leads':
        data = await getLeads()
        break

      case 'leads-with-orgs':
        data = await getLeadsWithOrganizations()
        break

      case 'leads-by-region':
        data = await getLeadsByRegion(year)
        break

      case 'lead-stats':
        data = await getLeadStats(year)
        break

      case 'organizations':
        data = await getOrganizations()
        break

      case 'deals':
        const dealStatus = searchParams.get('status') as 'open' | 'won' | 'lost' | 'all_not_deleted' | undefined
        data = await getDeals(dealStatus || 'all_not_deleted')
        break

      case 'deal-stats':
        data = await getDealStats(year)
        break

      case 'activities':
        const done = searchParams.get('done')
        data = await getActivities(done ? done === 'true' : undefined)
        break

      case 'activity-stats':
        data = await getActivityStats(year)
        break

      case 'pipelines':
        data = await getPipelines()
        break

      case 'stages':
        const pipelineId = searchParams.get('pipeline_id')
        data = await getStages(pipelineId ? parseInt(pipelineId) : undefined)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Pipedrive API Error:', error)

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('PIPEDRIVE_API_TOKEN')) {
      return NextResponse.json({
        success: false,
        error: 'Pipedrive API token not configured',
        message: 'Please set PIPEDRIVE_API_TOKEN in your environment variables',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
