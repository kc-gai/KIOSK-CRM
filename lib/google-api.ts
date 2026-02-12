import { google } from 'googleapis'

// Service Account authentication
function getAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google API credentials not configured')
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  })
}

// Search Console API client
export async function getSearchConsoleData(startDate: string, endDate: string) {
  const auth = getAuth()
  const searchconsole = google.searchconsole({ version: 'v1', auth })

  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL

  if (!siteUrl) {
    throw new Error('Search Console site URL not configured')
  }

  // Get overall performance metrics
  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
      type: 'web',
    },
  })

  const rows = response.data.rows || []
  const totals = rows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 }

  return {
    clicks: Math.round(totals.clicks || 0),
    impressions: Math.round(totals.impressions || 0),
    ctr: Number(((totals.ctr || 0) * 100).toFixed(2)),
    position: Number((totals.position || 0).toFixed(1)),
  }
}

// Get Search Console data with comparison period
export async function getSearchConsoleDataWithComparison(
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string
) {
  const [current, previous] = await Promise.all([
    getSearchConsoleData(startDate, endDate),
    getSearchConsoleData(prevStartDate, prevEndDate),
  ])

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Number((((curr - prev) / prev) * 100).toFixed(1))
  }

  return {
    impressions: current.impressions,
    impressionsTrend: calcTrend(current.impressions, previous.impressions),
    clicks: current.clicks,
    clicksTrend: calcTrend(current.clicks, previous.clicks),
    ctr: current.ctr,
    ctrTrend: calcTrend(current.ctr, previous.ctr),
    position: current.position,
    positionTrend: calcTrend(current.position, previous.position),
  }
}

// GA4 Analytics Data API client
export async function getGA4Data(startDate: string, endDate: string) {
  const auth = getAuth()
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth })

  const propertyId = process.env.GA4_PROPERTY_ID

  if (!propertyId) {
    throw new Error('GA4 Property ID not configured')
  }

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
    },
  })

  const row = response.data.rows?.[0]
  const values = row?.metricValues || []

  return {
    users: parseInt(values[0]?.value || '0', 10),
    pageviews: parseInt(values[1]?.value || '0', 10),
  }
}

// Get GA4 data with comparison period
export async function getGA4DataWithComparison(
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string
) {
  const [current, previous] = await Promise.all([
    getGA4Data(startDate, endDate),
    getGA4Data(prevStartDate, prevEndDate),
  ])

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Number((((curr - prev) / prev) * 100).toFixed(1))
  }

  return {
    users: current.users,
    usersTrend: calcTrend(current.users, previous.users),
    pageviews: current.pageviews,
    pageviewsTrend: calcTrend(current.pageviews, previous.pageviews),
  }
}

// Helper: Calculate date ranges
export function getDateRanges(period: string) {
  const today = new Date()
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  let startDate: Date
  let endDate = new Date(today)
  endDate.setDate(endDate.getDate() - 1) // Yesterday (data delay)

  switch (period) {
    case '7d':
      startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)
      break
    case '28d':
      startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 27)
      break
    case '3m':
      startDate = new Date(endDate)
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case '6m':
      startDate = new Date(endDate)
      startDate.setMonth(startDate.getMonth() - 6)
      break
    case '12m':
      startDate = new Date(endDate)
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      // Default to 3 months
      startDate = new Date(endDate)
      startDate.setMonth(startDate.getMonth() - 3)
  }

  // Previous period (same duration, just before)
  const duration = endDate.getTime() - startDate.getTime()
  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(prevEndDate.getDate() - 1)
  const prevStartDate = new Date(prevEndDate.getTime() - duration)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    prevStartDate: formatDate(prevStartDate),
    prevEndDate: formatDate(prevEndDate),
  }
}
