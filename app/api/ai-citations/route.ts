import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Score types and their point values
const scorePoints: Record<string, number> = {
  A: 10,
  B: 7,
  C: 3,
  D: 0,
  E: -2,
}

// GET - Fetch AI citations for a specific month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required' },
        { status: 400 }
      )
    }

    const citations = await prisma.aiCitation.findMany({
      where: { month },
      orderBy: [{ keyword: 'asc' }, { platform: 'asc' }],
    })

    return NextResponse.json(citations)
  } catch (error) {
    console.error('Error fetching AI citations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI citations' },
      { status: 500 }
    )
  }
}

// POST - Create or update AI citations (bulk upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, citations } = body as {
      month: string
      citations: Array<{
        keyword: string
        platform: string
        scoreType: string | null
        notes?: string
      }>
    }

    if (!month || !citations || !Array.isArray(citations)) {
      return NextResponse.json(
        { error: 'Month and citations array are required' },
        { status: 400 }
      )
    }

    // Process each citation
    const results = await Promise.all(
      citations
        .filter((c) => c.scoreType !== null)
        .map(async (citation) => {
          const score = citation.scoreType ? scorePoints[citation.scoreType] ?? 0 : 0

          return prisma.aiCitation.upsert({
            where: {
              month_platform_keyword: {
                month,
                platform: citation.platform,
                keyword: citation.keyword,
              },
            },
            update: {
              scoreType: citation.scoreType || 'D',
              score,
              notes: citation.notes,
            },
            create: {
              month,
              platform: citation.platform,
              keyword: citation.keyword,
              scoreType: citation.scoreType || 'D',
              score,
              notes: citation.notes,
            },
          })
        })
    )

    // Calculate summary stats
    const allCitations = await prisma.aiCitation.findMany({
      where: { month },
    })

    const totalScore = allCitations.reduce((sum, c) => sum + c.score, 0)
    const uniqueKeywords = Array.from(new Set(allCitations.map((c) => c.keyword)))
    const citedKeywords = uniqueKeywords.filter((kw) =>
      allCitations.some((c) => c.keyword === kw && c.scoreType !== 'D')
    )
    const citationRate =
      uniqueKeywords.length > 0
        ? Math.round((citedKeywords.length / uniqueKeywords.length) * 100)
        : 0

    // Update or create monthly summary
    await prisma.monthlySummary.upsert({
      where: { month },
      update: {
        aiScore: totalScore,
        aiCitationRate: citationRate,
      },
      create: {
        month,
        aiScore: totalScore,
        aiCitationRate: citationRate,
      },
    })

    return NextResponse.json({
      success: true,
      saved: results.length,
      summary: {
        totalScore,
        citationRate,
        citedKeywords: citedKeywords.length,
        totalKeywords: uniqueKeywords.length,
      },
    })
  } catch (error) {
    console.error('Error saving AI citations:', error)
    return NextResponse.json(
      { error: 'Failed to save AI citations' },
      { status: 500 }
    )
  }
}

// DELETE - Remove AI citations for a specific month
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required' },
        { status: 400 }
      )
    }

    const deleted = await prisma.aiCitation.deleteMany({
      where: { month },
    })

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
    })
  } catch (error) {
    console.error('Error deleting AI citations:', error)
    return NextResponse.json(
      { error: 'Failed to delete AI citations' },
      { status: 500 }
    )
  }
}
