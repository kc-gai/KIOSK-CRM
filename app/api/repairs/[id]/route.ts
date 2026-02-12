import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 수리 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const repair = await prisma.kioskRepair.findUnique({
            where: { id }
        })

        if (!repair) {
            return NextResponse.json({ error: 'Repair not found' }, { status: 404 })
        }

        return NextResponse.json(repair)
    } catch (error) {
        console.error('Failed to fetch repair:', error)
        return NextResponse.json({ error: 'Failed to fetch repair' }, { status: 500 })
    }
}

// PUT: 수리 정보 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            status,
            repairStartDate,
            repairEndDate,
            repairVendor,
            repairCost,
            repairDetails,
            partsReplaced,
            releaseDate,
            releasedTo,
            releaseNotes,
            beforeImageUrl,
            afterImageUrl,
            notes
        } = body

        const updateData: Record<string, unknown> = {}

        if (status) updateData.status = status
        if (repairStartDate) updateData.repairStartDate = new Date(repairStartDate)
        if (repairEndDate) updateData.repairEndDate = new Date(repairEndDate)
        if (repairVendor !== undefined) updateData.repairVendor = repairVendor
        if (repairCost !== undefined) updateData.repairCost = repairCost ? parseInt(repairCost) : null
        if (repairDetails !== undefined) updateData.repairDetails = repairDetails
        if (partsReplaced !== undefined) updateData.partsReplaced = partsReplaced
        if (releaseDate) updateData.releaseDate = new Date(releaseDate)
        if (releasedTo !== undefined) updateData.releasedTo = releasedTo
        if (releaseNotes !== undefined) updateData.releaseNotes = releaseNotes
        if (beforeImageUrl !== undefined) updateData.beforeImageUrl = beforeImageUrl
        if (afterImageUrl !== undefined) updateData.afterImageUrl = afterImageUrl
        if (notes !== undefined) updateData.notes = notes

        const repair = await prisma.kioskRepair.update({
            where: { id },
            data: updateData
        })

        // 수리 완료/출고 시 키오스크 상태 업데이트
        if (status === 'RELEASED' && repair.kioskId) {
            await prisma.kiosk.update({
                where: { id: repair.kioskId },
                data: { status: 'IN_STOCK' }
            })

            await prisma.locationHistory.create({
                data: {
                    kioskId: repair.kioskId,
                    moveType: 'REPAIR_COMPLETE',
                    prevStatus: 'REPAIR',
                    newStatus: 'IN_STOCK',
                    repairCost: repairCost ? parseFloat(repairCost) : null,
                    repairVendor,
                    description: `수리 완료 출고: ${releasedTo || '창고'}`,
                }
            })
        }

        return NextResponse.json(repair)
    } catch (error) {
        console.error('Failed to update repair:', error)
        return NextResponse.json({ error: 'Failed to update repair' }, { status: 500 })
    }
}

// DELETE: 수리 기록 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.kioskRepair.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete repair:', error)
        return NextResponse.json({ error: 'Failed to delete repair' }, { status: 500 })
    }
}
