import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: 조립 매뉴얼 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const docType = searchParams.get('docType')
        const status = searchParams.get('status')
        const latestOnly = searchParams.get('latestOnly') === 'true'

        const where: Record<string, unknown> = {}
        if (docType) where.docType = docType
        if (status) where.status = status
        if (latestOnly) where.isLatest = true

        const manuals = await prisma.assemblyManual.findMany({
            where,
            include: {
                sections: {
                    where: { isVisible: true },
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        sectionNumber: true,
                        title: true,
                        titleKo: true,
                        sortOrder: true
                    }
                }
            },
            orderBy: [
                { isLatest: 'desc' },
                { versionDate: 'desc' }
            ]
        })

        return NextResponse.json(manuals)
    } catch (error) {
        console.error('Failed to fetch assembly manuals:', error)
        return NextResponse.json({ error: 'Failed to fetch assembly manuals' }, { status: 500 })
    }
}

// POST: 조립 매뉴얼 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            slug,
            title,
            titleKo,
            subtitle,
            version,
            versionDate,
            changeLog,
            docType,
            status,
            isLatest,
            authorName,
            authorId,
            tags,
            notes,
            sections
        } = body

        // 필수 필드 검증
        if (!slug || !title || !version) {
            return NextResponse.json(
                { error: 'Slug, title, and version are required' },
                { status: 400 }
            )
        }

        // 기존 최신 버전 해제 (새 버전이 최신인 경우)
        if (isLatest) {
            await prisma.assemblyManual.updateMany({
                where: {
                    isLatest: true,
                    docType: docType || 'ASSEMBLY'
                },
                data: { isLatest: false }
            })
        }

        const manual = await prisma.assemblyManual.create({
            data: {
                slug,
                title,
                titleKo: titleKo || null,
                subtitle: subtitle || null,
                version,
                versionDate: versionDate ? new Date(versionDate) : new Date(),
                changeLog: changeLog || null,
                docType: docType || 'ASSEMBLY',
                status: status || 'DRAFT',
                isLatest: isLatest ?? true,
                authorName: authorName || null,
                authorId: authorId || null,
                tags: tags || null,
                notes: notes || null,
                sections: sections && sections.length > 0 ? {
                    create: sections.map((section: {
                        sectionNumber: number
                        title: string
                        titleKo?: string
                        content: string
                        contentKo?: string
                        imageUrl?: string
                        imageUrls?: string
                        layout?: string
                        sortOrder?: number
                        notes?: string
                        isVisible?: boolean
                    }, index: number) => ({
                        sectionNumber: section.sectionNumber || index + 1,
                        title: section.title,
                        titleKo: section.titleKo || null,
                        content: section.content,
                        contentKo: section.contentKo || null,
                        imageUrl: section.imageUrl || null,
                        imageUrls: section.imageUrls || null,
                        layout: section.layout || 'TEXT_IMAGE',
                        sortOrder: section.sortOrder ?? index,
                        notes: section.notes || null,
                        isVisible: section.isVisible ?? true
                    }))
                } : undefined
            },
            include: {
                sections: {
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })

        return NextResponse.json(manual, { status: 201 })
    } catch (error) {
        console.error('Failed to create assembly manual:', error)
        return NextResponse.json({ error: 'Failed to create assembly manual' }, { status: 500 })
    }
}
