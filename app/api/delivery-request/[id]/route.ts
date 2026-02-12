import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 납품 의뢰서 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const deliveryRequest = await prisma.deliveryRequest.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })

        if (!deliveryRequest) {
            return NextResponse.json({ error: 'Delivery request not found' }, { status: 404 })
        }

        // 총 수량 계산 추가
        const requestWithTotals = {
            ...deliveryRequest,
            totalQuantity: deliveryRequest.items.reduce((sum, item) => sum + item.quantity, 0),
            totalKioskCount: deliveryRequest.items.reduce((sum, item) => sum + item.kioskCount, 0),
            totalPlateCount: deliveryRequest.items.reduce((sum, item) => sum + item.plateCount, 0),
            totalAmount: deliveryRequest.items.reduce((sum, item) => sum + (item.quantity * deliveryRequest.unitPrice), 0)
        }

        return NextResponse.json(requestWithTotals)
    } catch (error) {
        console.error('Failed to fetch delivery request:', error)
        return NextResponse.json({ error: 'Failed to fetch delivery request' }, { status: 500 })
    }
}

// PUT: 납품 의뢰서 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            requesterName,
            requesterId,
            title,
            orderDate,
            desiredDeliveryDate,
            desiredDeliveryWeek,
            unitPrice,
            taxIncluded,
            status,
            notes,
            items
        } = body

        const updateData: Record<string, unknown> = {}

        if (requesterName !== undefined) updateData.requesterName = requesterName
        if (requesterId !== undefined) updateData.requesterId = requesterId || null
        if (title !== undefined) updateData.title = title
        if (orderDate !== undefined) updateData.orderDate = orderDate ? new Date(orderDate) : null
        if (desiredDeliveryDate !== undefined) updateData.desiredDeliveryDate = desiredDeliveryDate ? new Date(desiredDeliveryDate) : null
        if (desiredDeliveryWeek !== undefined) updateData.desiredDeliveryWeek = desiredDeliveryWeek || null
        if (unitPrice !== undefined) updateData.unitPrice = unitPrice
        if (taxIncluded !== undefined) updateData.taxIncluded = taxIncluded
        if (status !== undefined) updateData.status = status
        if (notes !== undefined) updateData.notes = notes || null

        // 트랜잭션으로 items 업데이트
        const deliveryRequest = await prisma.$transaction(async (tx) => {
            // 기본 정보 업데이트
            await tx.deliveryRequest.update({
                where: { id },
                data: updateData
            })

            // items 업데이트가 있는 경우
            if (items !== undefined) {
                // 기존 items 삭제
                await tx.deliveryRequestItem.deleteMany({
                    where: { deliveryRequestId: id }
                })

                // 새 items 생성
                if (items && items.length > 0) {
                    await tx.deliveryRequestItem.createMany({
                        data: items.map((item: {
                            locationName: string
                            postalCode?: string
                            address: string
                            contactPhone?: string
                            quantity?: number
                            kioskCount?: number
                            plateCount?: number
                            branchId?: string
                            itemNotes?: string
                            sortOrder?: number
                        }, index: number) => ({
                            deliveryRequestId: id,
                            locationName: item.locationName,
                            postalCode: item.postalCode || null,
                            address: item.address,
                            contactPhone: item.contactPhone || null,
                            quantity: item.quantity || 1,
                            kioskCount: item.kioskCount || 1,
                            plateCount: item.plateCount || 1,
                            branchId: item.branchId || null,
                            itemNotes: item.itemNotes || null,
                            sortOrder: item.sortOrder ?? index
                        }))
                    })
                }
            }

            // 업데이트된 데이터 조회
            return tx.deliveryRequest.findUnique({
                where: { id },
                include: {
                    items: {
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            })
        })

        return NextResponse.json(deliveryRequest)
    } catch (error) {
        console.error('Failed to update delivery request:', error)
        return NextResponse.json({ error: 'Failed to update delivery request' }, { status: 500 })
    }
}

// DELETE: 납품 의뢰서 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.deliveryRequest.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete delivery request:', error)
        return NextResponse.json({ error: 'Failed to delete delivery request' }, { status: 500 })
    }
}
