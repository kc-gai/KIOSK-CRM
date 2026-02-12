import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * PUT /api/delivery-status/[id]
 * 납품현황 항목 업데이트 (발송정보 입력)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { slipNumber, serialNumber, anydeskNo, shippedDate, notes, status, actualDeliveryDate } = body

        // DeliveryRequestItem 업데이트
        // 현재 스키마에는 slipNumber, serialNumber 등의 필드가 없으므로
        // itemNotes에 JSON 형태로 저장하거나 스키마 확장이 필요
        // 임시로 notes 필드에 저장

        const updateData: any = {}

        // 메모에 발송정보 저장 (임시 방안)
        const shippingInfo = {
            slipNumber,
            serialNumber,
            anydeskNo,
            shippedDate,
            status: status || 'PENDING',
            actualDeliveryDate
        }

        updateData.itemNotes = JSON.stringify(shippingInfo)

        const updatedItem = await prisma.deliveryRequestItem.update({
            where: { id },
            data: updateData,
            include: {
                deliveryRequest: true
            }
        })

        // 상태가 DELIVERED인 경우 DeliveryRequest도 COMPLETED로 업데이트
        if (status === 'DELIVERED') {
            // 해당 DeliveryRequest의 모든 항목이 DELIVERED인지 확인
            const allItems = await prisma.deliveryRequestItem.findMany({
                where: { deliveryRequestId: updatedItem.deliveryRequestId }
            })

            const allDelivered = allItems.every(item => {
                try {
                    const itemInfo = item.itemNotes ? JSON.parse(item.itemNotes) : {}
                    return itemInfo.status === 'DELIVERED'
                } catch {
                    return false
                }
            })

            if (allDelivered) {
                await prisma.deliveryRequest.update({
                    where: { id: updatedItem.deliveryRequestId },
                    data: { status: 'COMPLETED' }
                })
            }
        }

        return NextResponse.json(updatedItem)
    } catch (error) {
        console.error("Error updating delivery status:", error)
        return NextResponse.json(
            { error: "Failed to update delivery status" },
            { status: 500 }
        )
    }
}
