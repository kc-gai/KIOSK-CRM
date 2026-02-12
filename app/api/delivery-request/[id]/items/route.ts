import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// POST: 납품 의뢰서에 항목 추가
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            locationName,
            postalCode,
            address,
            contactPhone,
            quantity,
            kioskCount,
            plateCount,
            branchId,
            itemNotes
        } = body

        // 필수 필드 검증
        if (!locationName || !address) {
            return NextResponse.json(
                { error: 'Location name and address are required' },
                { status: 400 }
            )
        }

        // 현재 최대 sortOrder 조회
        const maxSortOrder = await prisma.deliveryRequestItem.aggregate({
            where: { deliveryRequestId: id },
            _max: { sortOrder: true }
        })

        const item = await prisma.deliveryRequestItem.create({
            data: {
                deliveryRequestId: id,
                locationName,
                postalCode: postalCode || null,
                address,
                contactPhone: contactPhone || null,
                quantity: quantity || 1,
                kioskCount: kioskCount || 1,
                plateCount: plateCount || 1,
                branchId: branchId || null,
                itemNotes: itemNotes || null,
                sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1
            }
        })

        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('Failed to add delivery request item:', error)
        return NextResponse.json({ error: 'Failed to add delivery request item' }, { status: 500 })
    }
}

// PUT: 납품 의뢰서 항목 일괄 수정 (순서 변경 등)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { items } = body

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Items array is required' },
                { status: 400 }
            )
        }

        // 트랜잭션으로 모든 항목 업데이트
        await prisma.$transaction(
            items.map((item: { id: string; sortOrder?: number; quantity?: number; kioskCount?: number; plateCount?: number }) =>
                prisma.deliveryRequestItem.update({
                    where: { id: item.id },
                    data: {
                        sortOrder: item.sortOrder,
                        quantity: item.quantity,
                        kioskCount: item.kioskCount,
                        plateCount: item.plateCount
                    }
                })
            )
        )

        // 업데이트된 항목 조회
        const updatedItems = await prisma.deliveryRequestItem.findMany({
            where: { deliveryRequestId: id },
            orderBy: { sortOrder: 'asc' }
        })

        return NextResponse.json(updatedItems)
    } catch (error) {
        console.error('Failed to update delivery request items:', error)
        return NextResponse.json({ error: 'Failed to update delivery request items' }, { status: 500 })
    }
}
