import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 조립 매뉴얼 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        // ID 또는 slug로 조회
        const manual = await prisma.assemblyManual.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id }
                ]
            },
            include: {
                sections: {
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })

        if (!manual) {
            return NextResponse.json({ error: 'Manual not found' }, { status: 404 })
        }

        return NextResponse.json(manual)
    } catch (error) {
        console.error('Failed to fetch assembly manual:', error)
        return NextResponse.json({ error: 'Failed to fetch assembly manual' }, { status: 500 })
    }
}

// PUT: 조립 매뉴얼 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
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

        const updateData: Record<string, unknown> = {}

        if (slug !== undefined) updateData.slug = slug
        if (title !== undefined) updateData.title = title
        if (titleKo !== undefined) updateData.titleKo = titleKo || null
        if (subtitle !== undefined) updateData.subtitle = subtitle || null
        if (version !== undefined) updateData.version = version
        if (versionDate !== undefined) updateData.versionDate = versionDate ? new Date(versionDate) : null
        if (changeLog !== undefined) updateData.changeLog = changeLog || null
        if (docType !== undefined) updateData.docType = docType
        if (status !== undefined) updateData.status = status
        if (authorName !== undefined) updateData.authorName = authorName || null
        if (authorId !== undefined) updateData.authorId = authorId || null
        if (tags !== undefined) updateData.tags = tags || null
        if (notes !== undefined) updateData.notes = notes || null

        // 기존 최신 버전 해제 (새 버전이 최신인 경우)
        if (isLatest === true) {
            const currentManual = await prisma.assemblyManual.findUnique({ where: { id } })
            if (currentManual) {
                await prisma.assemblyManual.updateMany({
                    where: {
                        isLatest: true,
                        docType: currentManual.docType,
                        id: { not: id }
                    },
                    data: { isLatest: false }
                })
            }
        }
        if (isLatest !== undefined) updateData.isLatest = isLatest

        // 트랜잭션으로 sections 업데이트
        const manual = await prisma.$transaction(async (tx) => {
            // 기본 정보 업데이트
            await tx.assemblyManual.update({
                where: { id },
                data: updateData
            })

            // sections 업데이트가 있는 경우
            if (sections !== undefined) {
                // 기존 sections 삭제
                await tx.assemblyManualSection.deleteMany({
                    where: { manualId: id }
                })

                // 새 sections 생성
                if (sections && sections.length > 0) {
                    await tx.assemblyManualSection.createMany({
                        data: sections.map((section: {
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
                            manualId: id,
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
                    })
                }
            }

            // 업데이트된 데이터 조회
            return tx.assemblyManual.findUnique({
                where: { id },
                include: {
                    sections: {
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            })
        })

        return NextResponse.json(manual)
    } catch (error) {
        console.error('Failed to update assembly manual:', error)
        return NextResponse.json({ error: 'Failed to update assembly manual' }, { status: 500 })
    }
}

// DELETE: 조립 매뉴얼 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.assemblyManual.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete assembly manual:', error)
        return NextResponse.json({ error: 'Failed to delete assembly manual' }, { status: 500 })
    }
}
