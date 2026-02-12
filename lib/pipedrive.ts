// Pipedrive API Integration for CRM Dashboard
// Requires: PIPEDRIVE_API_TOKEN

const PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1'

// Get API token from environment
function getApiToken(): string {
  const token = process.env.PIPEDRIVE_API_TOKEN
  if (!token) {
    throw new Error('PIPEDRIVE_API_TOKEN is not configured')
  }
  return token
}

// Types
export type PipedriveLeadStatus = 'open' | 'converted' | 'lost'

export type PipedriveLead = {
  id: string
  title: string
  owner_id: number
  creator_id: number
  person_id: number | null
  organization_id: number | null
  source_name: string | null
  value: {
    amount: number
    currency: string
  } | null
  expected_close_date: string | null
  add_time: string
  update_time: string
  is_archived: boolean
  label_ids: string[]
}

export type PipedriveDeal = {
  id: number
  title: string
  value: number
  currency: string
  status: 'open' | 'won' | 'lost' | 'deleted'
  stage_id: number
  pipeline_id: number
  person_id: number | null
  org_id: number | null
  add_time: string
  update_time: string
  close_time: string | null
  won_time: string | null
  lost_time: string | null
  expected_close_date: string | null
  probability: number | null
  owner_id: number
}

export type PipedriveActivity = {
  id: number
  type: string
  subject: string
  done: boolean
  due_date: string | null
  due_time: string | null
  duration: string | null
  add_time: string
  marked_as_done_time: string | null
  person_id: number | null
  org_id: number | null
  deal_id: number | null
  lead_id: string | null
  note: string | null
  owner_id: number
}

export type PipedrivePerson = {
  id: number
  name: string
  email: { value: string; primary: boolean }[]
  phone: { value: string; primary: boolean }[]
  org_id: number | null
  add_time: string
  owner_id: number
}

export type PipedriveOrganization = {
  id: number
  name: string
  address: string | null
  address_locality: string | null
  address_country: string | null
  address_postal_code: string | null
  address_admin_area_level_1: string | null  // 都道府県
  address_admin_area_level_2: string | null  // 市区町村
  add_time: string
  owner_id: number
}

export type PipedriveStage = {
  id: number
  name: string
  pipeline_id: number
  order_nr: number
  active_flag: boolean
}

export type PipedrivePipeline = {
  id: number
  name: string
  active: boolean
  order_nr: number
  deal_probability: boolean
}

// API Response wrapper
type PipedriveResponse<T> = {
  success: boolean
  data: T | null
  additional_data?: {
    pagination?: {
      start: number
      limit: number
      more_items_in_collection: boolean
      next_start?: number
    }
  }
  error?: string
}

// Generic fetch function
async function pipedriveFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const token = getApiToken()
  const url = new URL(`${PIPEDRIVE_API_BASE}${endpoint}`)
  url.searchParams.set('api_token', token)

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  const data: PipedriveResponse<T> = await response.json()

  if (!data.success) {
    console.error('Pipedrive API error:', data.error)
    return null
  }

  return data.data
}

// Fetch all items with pagination
async function fetchAllPaginated<T>(
  endpoint: string,
  params: Record<string, string> = {},
  limit = 500
): Promise<T[]> {
  const allItems: T[] = []
  let start = 0
  let hasMore = true

  while (hasMore) {
    const token = getApiToken()
    const url = new URL(`${PIPEDRIVE_API_BASE}${endpoint}`)
    url.searchParams.set('api_token', token)
    url.searchParams.set('start', start.toString())
    url.searchParams.set('limit', limit.toString())

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url.toString())
    const data: PipedriveResponse<T[]> = await response.json()

    if (!data.success || !data.data) {
      break
    }

    allItems.push(...data.data)
    hasMore = data.additional_data?.pagination?.more_items_in_collection ?? false
    start = data.additional_data?.pagination?.next_start ?? 0
  }

  return allItems
}

// ==================== Lead Labels ====================

export type PipedriveLeadLabel = {
  id: string
  name: string
  color: string
  add_time: string
  update_time: string
}

export async function getLeadLabels(): Promise<PipedriveLeadLabel[]> {
  const result = await pipedriveFetch<PipedriveLeadLabel[]>('/leadLabels')
  return result || []
}

// ==================== Leads ====================

export async function getLeads(archived = false): Promise<PipedriveLead[]> {
  const params: Record<string, string> = {}
  if (archived) {
    params.archived_status = 'archived'
  }
  return fetchAllPaginated<PipedriveLead>('/leads', params)
}

export async function getLeadById(id: string): Promise<PipedriveLead | null> {
  return pipedriveFetch<PipedriveLead>(`/leads/${id}`)
}

// ==================== Deals ====================

export async function getDeals(status?: 'open' | 'won' | 'lost' | 'all_not_deleted'): Promise<PipedriveDeal[]> {
  const params: Record<string, string> = {}
  if (status) {
    params.status = status
  }
  return fetchAllPaginated<PipedriveDeal>('/deals', params)
}

export async function getDealById(id: number): Promise<PipedriveDeal | null> {
  return pipedriveFetch<PipedriveDeal>(`/deals/${id}`)
}

export async function getDealsByPipeline(pipelineId: number): Promise<PipedriveDeal[]> {
  return fetchAllPaginated<PipedriveDeal>('/deals', { pipeline_id: pipelineId.toString() })
}

// ==================== Activities ====================

export async function getActivities(done?: boolean): Promise<PipedriveActivity[]> {
  const params: Record<string, string> = {}
  if (done !== undefined) {
    params.done = done ? '1' : '0'
  }
  return fetchAllPaginated<PipedriveActivity>('/activities', params)
}

export async function getRecentActivities(days = 30): Promise<PipedriveActivity[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const params: Record<string, string> = {
    start_date: startDate.toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  }

  return fetchAllPaginated<PipedriveActivity>('/activities', params)
}

// ==================== Pipelines & Stages ====================

export async function getPipelines(): Promise<PipedrivePipeline[]> {
  const result = await pipedriveFetch<PipedrivePipeline[]>('/pipelines')
  return result || []
}

export async function getStages(pipelineId?: number): Promise<PipedriveStage[]> {
  const params: Record<string, string> = {}
  if (pipelineId) {
    params.pipeline_id = pipelineId.toString()
  }
  const result = await pipedriveFetch<PipedriveStage[]>('/stages')
  return result || []
}

// ==================== Persons & Organizations ====================

export async function getPersons(): Promise<PipedrivePerson[]> {
  return fetchAllPaginated<PipedrivePerson>('/persons')
}

export async function getOrganizations(): Promise<PipedriveOrganization[]> {
  return fetchAllPaginated<PipedriveOrganization>('/organizations')
}

// ==================== Statistics & Aggregations ====================

export type LeadStats = {
  total: number
  byMonth: { month: string; count: number }[]
  bySource: { source: string; count: number }[]
  avgValue: number
  totalValue: number
}

export async function getLeadStats(year?: number): Promise<LeadStats> {
  const leads = await getLeads()

  // Filter by year only if year is specified
  const filteredLeads = year
    ? leads.filter(lead => {
        const leadYear = new Date(lead.add_time).getFullYear()
        return leadYear === year
      })
    : leads  // 년도 지정 없으면 모든 리드

  // By month - 전체 기간 집계
  const byMonth: { [key: string]: number } = {}
  filteredLeads.forEach(lead => {
    const monthKey = lead.add_time.substring(0, 7)
    byMonth[monthKey] = (byMonth[monthKey] || 0) + 1
  })

  // By source
  const bySource: { [key: string]: number } = {}
  filteredLeads.forEach(lead => {
    const source = lead.source_name || 'Unknown'
    bySource[source] = (bySource[source] || 0) + 1
  })

  // Value calculations
  let totalValue = 0
  let valueCount = 0
  filteredLeads.forEach(lead => {
    if (lead.value?.amount) {
      totalValue += lead.value.amount
      valueCount++
    }
  })

  return {
    total: filteredLeads.length,
    byMonth: Object.entries(byMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    bySource: Object.entries(bySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    avgValue: valueCount > 0 ? totalValue / valueCount : 0,
    totalValue,
  }
}

export type DealStats = {
  total: number
  open: number
  won: number
  lost: number
  winRate: number
  totalValue: number
  wonValue: number
  avgDealSize: number
  byStage: { stage: string; count: number; value: number }[]
  byMonth: { month: string; won: number; lost: number; value: number }[]
}

export async function getDealStats(year?: number): Promise<DealStats> {
  const [deals, stages] = await Promise.all([
    getDeals('all_not_deleted'),
    getStages(),
  ])

  const targetYear = year || new Date().getFullYear()

  // Filter by year (based on add_time)
  const yearDeals = deals.filter(deal => {
    const dealYear = new Date(deal.add_time).getFullYear()
    return dealYear === targetYear
  })

  // Stage map
  const stageMap = new Map(stages.map(s => [s.id, s.name]))

  // Basic counts
  const open = yearDeals.filter(d => d.status === 'open').length
  const won = yearDeals.filter(d => d.status === 'won').length
  const lost = yearDeals.filter(d => d.status === 'lost').length
  const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0

  // Values
  const totalValue = yearDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const wonValue = yearDeals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.value || 0), 0)
  const avgDealSize = yearDeals.length > 0 ? totalValue / yearDeals.length : 0

  // By stage
  const byStageMap: { [key: number]: { count: number; value: number } } = {}
  yearDeals.filter(d => d.status === 'open').forEach(deal => {
    if (!byStageMap[deal.stage_id]) {
      byStageMap[deal.stage_id] = { count: 0, value: 0 }
    }
    byStageMap[deal.stage_id].count++
    byStageMap[deal.stage_id].value += deal.value || 0
  })

  // By month (won/lost)
  const byMonthMap: { [key: string]: { won: number; lost: number; value: number } } = {}
  for (let i = 1; i <= 12; i++) {
    const monthKey = `${targetYear}-${String(i).padStart(2, '0')}`
    byMonthMap[monthKey] = { won: 0, lost: 0, value: 0 }
  }

  yearDeals.forEach(deal => {
    if (deal.status === 'won' && deal.won_time) {
      const monthKey = deal.won_time.substring(0, 7)
      if (byMonthMap[monthKey]) {
        byMonthMap[monthKey].won++
        byMonthMap[monthKey].value += deal.value || 0
      }
    }
    if (deal.status === 'lost' && deal.lost_time) {
      const monthKey = deal.lost_time.substring(0, 7)
      if (byMonthMap[monthKey]) {
        byMonthMap[monthKey].lost++
      }
    }
  })

  return {
    total: yearDeals.length,
    open,
    won,
    lost,
    winRate,
    totalValue,
    wonValue,
    avgDealSize,
    byStage: Object.entries(byStageMap).map(([stageId, data]) => ({
      stage: stageMap.get(parseInt(stageId)) || `Stage ${stageId}`,
      count: data.count,
      value: data.value,
    })),
    byMonth: Object.entries(byMonthMap).map(([month, data]) => ({
      month,
      won: data.won,
      lost: data.lost,
      value: data.value,
    })),
  }
}

export type ActivityStats = {
  total: number
  completed: number
  pending: number
  byType: { type: string; count: number; completed: number }[]
  byMonth: { month: string; total: number; completed: number }[]
}

export async function getActivityStats(year?: number): Promise<ActivityStats> {
  const activities = await getActivities()
  const targetYear = year || new Date().getFullYear()

  // Filter by year
  const yearActivities = activities.filter(activity => {
    const activityYear = new Date(activity.add_time).getFullYear()
    return activityYear === targetYear
  })

  const completed = yearActivities.filter(a => a.done).length
  const pending = yearActivities.filter(a => !a.done).length

  // By type
  const byTypeMap: { [key: string]: { count: number; completed: number } } = {}
  yearActivities.forEach(activity => {
    const type = activity.type || 'other'
    if (!byTypeMap[type]) {
      byTypeMap[type] = { count: 0, completed: 0 }
    }
    byTypeMap[type].count++
    if (activity.done) {
      byTypeMap[type].completed++
    }
  })

  // By month
  const byMonthMap: { [key: string]: { total: number; completed: number } } = {}
  for (let i = 1; i <= 12; i++) {
    const monthKey = `${targetYear}-${String(i).padStart(2, '0')}`
    byMonthMap[monthKey] = { total: 0, completed: 0 }
  }

  yearActivities.forEach(activity => {
    const monthKey = activity.add_time.substring(0, 7)
    if (byMonthMap[monthKey]) {
      byMonthMap[monthKey].total++
      if (activity.done) {
        byMonthMap[monthKey].completed++
      }
    }
  })

  return {
    total: yearActivities.length,
    completed,
    pending,
    byType: Object.entries(byTypeMap)
      .map(([type, data]) => ({ type, count: data.count, completed: data.completed }))
      .sort((a, b) => b.count - a.count),
    byMonth: Object.entries(byMonthMap).map(([month, data]) => ({
      month,
      total: data.total,
      completed: data.completed,
    })),
  }
}

// ==================== Combined Dashboard Data ====================

export type PipedriveDashboardData = {
  leads: LeadStats
  deals: DealStats
  activities: ActivityStats
  recentLeads: PipedriveLead[]
  recentDeals: PipedriveDeal[]
  upcomingActivities: PipedriveActivity[]
}

export async function getDashboardData(year?: number): Promise<PipedriveDashboardData> {
  const [leadStats, dealStats, activityStats, leads, deals, activities] = await Promise.all([
    getLeadStats(year),
    getDealStats(year),
    getActivityStats(year),
    getLeads(),
    getDeals('open'),
    getActivities(false), // pending activities
  ])

  // Recent leads (last 10)
  const recentLeads = leads
    .sort((a, b) => new Date(b.add_time).getTime() - new Date(a.add_time).getTime())
    .slice(0, 10)

  // Recent deals (last 10 open)
  const recentDeals = deals
    .sort((a, b) => new Date(b.add_time).getTime() - new Date(a.add_time).getTime())
    .slice(0, 10)

  // Upcoming activities (next 10)
  const upcomingActivities = activities
    .filter(a => a.due_date && new Date(a.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 10)

  return {
    leads: leadStats,
    deals: dealStats,
    activities: activityStats,
    recentLeads,
    recentDeals,
    upcomingActivities,
  }
}

// ==================== Lead with Organization (for Region Matching) ====================

export type LeadWithOrganization = PipedriveLead & {
  organization?: PipedriveOrganization | null
  person?: PipedrivePerson | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

// Get all leads with their organization and person data
export async function getLeadsWithOrganizations(): Promise<LeadWithOrganization[]> {
  const [leads, organizations, persons] = await Promise.all([
    getLeads(),
    getOrganizations(),
    getPersons(),
  ])

  // Create organization map
  const orgMap = new Map(organizations.map(org => [org.id, org]))
  // Create person map
  const personMap = new Map(persons.map(p => [p.id, p]))

  // Attach organization and person to each lead
  return leads.map(lead => {
    const org = lead.organization_id ? orgMap.get(lead.organization_id) : null
    const person = lead.person_id ? personMap.get(lead.person_id) : null

    // Get primary phone and email from person
    const phone = person?.phone?.find(p => p.primary)?.value || person?.phone?.[0]?.value || null
    const email = person?.email?.find(e => e.primary)?.value || person?.email?.[0]?.value || null

    return {
      ...lead,
      organization: org,
      person: person,
      address: org?.address || org?.address_admin_area_level_1 || null,
      phone,
      email,
    }
  })
}

// Get organization by ID
export async function getOrganizationById(id: number): Promise<PipedriveOrganization | null> {
  return pipedriveFetch<PipedriveOrganization>(`/organizations/${id}`)
}

// ==================== Region Statistics for Leads ====================

import { matchAddressToRegion, matchLabelToRegion, REGIONS } from './regions'

export type LeadRegionStats = {
  region: {
    code: string
    name: string
    nameJa: string
    nameKo: string
    areaCode: string
    areaName: string
    color: string
  }
  count: number
  totalValue: number
  leads: Array<{
    id: string
    title: string
    organization?: string
    address?: string
    phone?: string
    email?: string
    value?: number
    add_time: string
  }>
}

// Get leads grouped by region
export async function getLeadsByRegion(year?: number): Promise<{
  stats: LeadRegionStats[]
  unassigned: LeadRegionStats
  total: number
}> {
  // 라벨 정보도 함께 가져오기
  const [leadsWithOrgs, labels] = await Promise.all([
    getLeadsWithOrganizations(),
    getLeadLabels(),
  ])

  // 라벨 ID → 라벨 이름 맵 생성
  const labelMap = new Map(labels.map(l => [l.id, l.name]))

  // Filter by year only if year is specified
  const filteredLeads = year
    ? leadsWithOrgs.filter(lead => {
        const leadYear = new Date(lead.add_time).getFullYear()
        return leadYear === year
      })
    : leadsWithOrgs  // 년도 지정 없으면 모든 리드

  // Initialize stats for all regions
  const statsMap = new Map<string, LeadRegionStats>()
  REGIONS.forEach(region => {
    statsMap.set(region.code, {
      region: {
        code: region.code,
        name: region.name,
        nameJa: region.nameJa,
        nameKo: region.nameKo,
        areaCode: region.area.code,
        areaName: region.area.nameJa,
        color: region.color,
      },
      count: 0,
      totalValue: 0,
      leads: [],
    })
  })

  // Unassigned bucket
  const unassigned: LeadRegionStats = {
    region: {
      code: 'UNKNOWN',
      name: 'Unassigned',
      nameJa: '未指定',
      nameKo: '미지정',
      areaCode: '?',
      areaName: '未指定',
      color: '#9ca3af',
    },
    count: 0,
    totalValue: 0,
    leads: [],
  }

  // Classify leads
  filteredLeads.forEach(lead => {
    // 1. 먼저 라벨에서 지역 매칭 시도
    let region = null
    if (lead.label_ids && lead.label_ids.length > 0) {
      for (const labelId of lead.label_ids) {
        const labelName = labelMap.get(labelId)
        if (labelName) {
          region = matchLabelToRegion(labelName)
          if (region) break
        }
      }
    }

    // 2. 라벨 매칭 실패 시 주소에서 지역 매칭 시도
    if (!region) {
      const address = lead.address || lead.organization?.address_admin_area_level_1 || lead.organization?.address
      region = matchAddressToRegion(address)
    }

    const address = lead.address || lead.organization?.address_admin_area_level_1 || lead.organization?.address
    const leadData = {
      id: lead.id,
      title: lead.title,
      organization: lead.organization?.name,
      address: address || undefined,
      phone: lead.phone || undefined,
      email: lead.email || undefined,
      value: lead.value?.amount,
      add_time: lead.add_time,
    }

    if (region) {
      const stats = statsMap.get(region.code)!
      stats.count++
      stats.totalValue += lead.value?.amount || 0
      stats.leads.push(leadData)
    } else {
      unassigned.count++
      unassigned.totalValue += lead.value?.amount || 0
      unassigned.leads.push(leadData)
    }
  })

  // Return only regions with data, sorted by count
  const stats = Array.from(statsMap.values())
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    stats,
    unassigned,
    total: filteredLeads.length,
  }
}
