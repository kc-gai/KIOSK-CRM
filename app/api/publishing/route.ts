import { NextRequest, NextResponse } from 'next/server'

// 콘텐츠 발행 API
// 2024/2025: 하드코딩 데이터 (Blog + News 합계)
// 2026: 사이트맵에서 자동 추출

type BlogPost = {
  url: string
  lastmod: string | null
  publishedDate: string | null
  title?: string
}

type MonthlyStats = {
  month: string
  count: number
  target: number
}

type YearlyData = {
  year: number
  total: number
  target: number
  monthlyData: MonthlyStats[]
  posts: BlogPost[]
}

// 모든 데이터는 사이트맵에서 자동 추출 (2024, 2025, 2026 모두)

// 사이트맵 URL (2026년 자동 수집용)
const BLOG_SITEMAP_URL = 'https://www.kaflixcloud.co.jp/blog_ja-sitemap.xml'
const NEWS_SITEMAP_URL = 'https://www.kaflixcloud.co.jp/news_ja-sitemap.xml'

// 캐시 (모든 포스트)
let cachedAllPosts: {
  posts: BlogPost[]
  timestamp: number
} | null = null

const CACHE_DURATION = 30 * 60 * 1000 // 30분

// 블로그 페이지에서 발행일 추출
async function fetchPublishedDate(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-CRM/1.0)' },
    })

    if (!response.ok) return null

    const html = await response.text()

    // 1. article:published_time 메타 태그
    const ogMatch = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i)
    if (ogMatch) return ogMatch[1]

    // 2. datePublished JSON-LD
    const jsonLdMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/i)
    if (jsonLdMatch) return jsonLdMatch[1]

    // 3. time 태그
    const timeMatch = html.match(/<time[^>]+datetime="([^"]+)"/i)
    if (timeMatch) return timeMatch[1]

    // 4. 날짜 패턴
    const patterns = [
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      /(\d{4})-(\d{2})-(\d{2})/,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      }
    }

    return null
  } catch {
    return null
  }
}

// 사이트맵에서 URL 가져오기
async function fetchSitemapUrls(sitemapUrl: string, pathFilter: string): Promise<{ url: string; lastmod: string | null }[]> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-CRM/1.0)' },
    })

    if (!response.ok) return []

    const xml = await response.text()
    const posts: { url: string; lastmod: string | null }[] = []
    const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || []

    for (const block of urlBlocks) {
      const locMatch = block.match(/<loc>(.*?)<\/loc>/)
      const loc = locMatch ? locMatch[1] : null
      const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/)
      const lastmod = lastmodMatch ? lastmodMatch[1] : null

      if (loc && loc.includes(pathFilter) && !loc.endsWith(`${pathFilter}/`) && !loc.endsWith(pathFilter)) {
        posts.push({ url: loc, lastmod })
      }
    }

    return posts
  } catch {
    return []
  }
}

// 모든 포스트 가져오기 (사이트맵에서)
async function fetchAllPosts(): Promise<BlogPost[]> {
  // 캐시 확인
  if (cachedAllPosts && Date.now() - cachedAllPosts.timestamp < CACHE_DURATION) {
    return cachedAllPosts.posts
  }

  // Blog + News 사이트맵에서 URL 가져오기
  const [blogUrls, newsUrls] = await Promise.all([
    fetchSitemapUrls(BLOG_SITEMAP_URL, '/blog/'),
    fetchSitemapUrls(NEWS_SITEMAP_URL, '/news/'),
  ])

  const allUrls = [...blogUrls, ...newsUrls]
  const posts: BlogPost[] = []

  // 발행일 추출 (병렬 5개씩)
  const batchSize = 5
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async ({ url, lastmod }) => ({
        url,
        lastmod,
        publishedDate: await fetchPublishedDate(url),
      }))
    )
    posts.push(...results)
  }

  // 캐시 업데이트
  cachedAllPosts = { posts, timestamp: Date.now() }

  return posts
}

// 연도별 포스트 필터링
function filterPostsByYear(posts: BlogPost[], year: number): BlogPost[] {
  return posts.filter(post => {
    const dateStr = post.publishedDate || post.lastmod
    if (!dateStr) return false
    const date = new Date(dateStr)
    return date.getFullYear() === year
  })
}

// 하드코딩 데이터는 더 이상 사용하지 않음 - 사이트맵에서 모든 연도 자동 추출

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()

  try {
    // 모든 포스트 가져오기 (캐시 사용)
    const allPosts = await fetchAllPosts()

    // 연도별 포스트 필터링
    const yearPosts = filterPostsByYear(allPosts, year)

    // 월별 데이터 집계
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: `${i + 1}月`, count: 0, target: 10 }))
    for (const post of yearPosts) {
      const dateStr = post.publishedDate || post.lastmod
      if (!dateStr) continue
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) continue
      const month = date.getMonth()
      monthlyData[month].count++
    }

    const yearData: YearlyData = {
      year,
      total: yearPosts.length,
      target: 120,
      monthlyData,
      posts: yearPosts.sort((a, b) => {
        const dateA = new Date(a.publishedDate || a.lastmod || 0)
        const dateB = new Date(b.publishedDate || b.lastmod || 0)
        return dateB.getTime() - dateA.getTime() // 최신순 정렬
      }),
    }

    // 모든 연도 합계
    const posts2024 = filterPostsByYear(allPosts, 2024)
    const posts2025 = filterPostsByYear(allPosts, 2025)
    const posts2026 = filterPostsByYear(allPosts, 2026)

    const allYears = [
      { year: 2024, total: posts2024.length, target: 120 },
      { year: 2025, total: posts2025.length, target: 120 },
      { year: 2026, total: posts2026.length, target: 120 },
    ]

    // 전체 포스트 수
    const totalPosts = allPosts.length

    return NextResponse.json({
      success: true,
      data: {
        year,
        total: yearData.total,
        target: yearData.target,
        monthlyData: yearData.monthlyData,
        posts: yearData.posts,
        allYears,
        totalPosts,
      },
      timestamp: new Date().toISOString(),
      source: 'sitemap-api',
      cacheAge: cachedAllPosts ? Math.round((Date.now() - cachedAllPosts.timestamp) / 1000) : 0,
    })
  } catch (error) {
    console.error('Publishing API Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        year,
        total: 0,
        target: 120,
        monthlyData: Array.from({ length: 12 }, (_, i) => ({ month: `${i + 1}月`, count: 0, target: 10 })),
        posts: [],
        allYears: [],
        totalPosts: 0,
      },
    }, { status: 500 })
  }
}
