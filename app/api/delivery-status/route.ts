import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/delivery-status
 * 납품현황 리스트 조회
 * 발주의뢰서(DeliveryRequest)의 각 항목(DeliveryRequestItem)을 기반으로 납품현황을 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // DeliveryRequestItem을 기반으로 납품현황 조회
        const items = await prisma.deliveryRequestItem.findMany({
            include: {
                deliveryRequest: {
                    select: {
                        id: true,
                        requestNumber: true,
                        requesterName: true,
                        title: true,
                        desiredDeliveryDate: true,
                        desiredDeliveryWeek: true,
                        status: true,
                        unitPrice: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 각 항목에 발송정보 필드 추가 (현재 스키마에 없으므로 빈 값 또는 별도 테이블 필요)
        // 임시로 DeliveryRequestItem에서 가져온 데이터에 상태 정보 추가
        const deliveryStatusItems = items.map(item => {
            // 납기예정일 확인하여 상태 결정
            const expectedDate = item.deliveryRequest.desiredDeliveryDate
            const isOverdue = expectedDate ? new Date(expectedDate) < new Date() : false

            // 상태 결정: DRAFT/SUBMITTED = PENDING, CONFIRMED = SHIPPING, COMPLETED = DELIVERED
            let itemStatus = 'PENDING'
            if (item.deliveryRequest.status === 'CONFIRMED') {
                itemStatus = 'SHIPPING'
            } else if (item.deliveryRequest.status === 'COMPLETED' || isOverdue) {
                itemStatus = 'DELIVERED'
            }

            return {
                id: item.id,
                orderProcessId: item.deliveryRequestId,
                orderProcess: {
                    processNumber: item.deliveryRequest.requestNumber,
                    title: item.deliveryRequest.title,
                    client: { name: item.deliveryRequest.requesterName }
                },
                branchName: item.locationName,
                slipNumber: null, // 추후 확장: item.slipNumber
                serialNumber: null, // 추후 확장: item.serialNumber
                anydeskNo: null, // 추후 확장: item.anydeskNo
                quantity: item.quantity,
                shippedDate: null, // 추후 확장
                expectedDeliveryDate: item.deliveryRequest.desiredDeliveryDate,
                actualDeliveryDate: item.deliveryRequest.status === 'COMPLETED' ? new Date().toISOString() : null,
                status: itemStatus,
                vendorName: null,
                vendorContact: null,
                notes: item.itemNotes,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString()
            }
        })

        // 상태 필터링
        const filteredItems = status && status !== 'ALL'
            ? deliveryStatusItems.filter(item => item.status === status)
            : deliveryStatusItems

        return NextResponse.json(filteredItems)
    } catch (error) {
        console.error("Error fetching delivery status:", error)
        return NextResponse.json(
            { error: "Failed to fetch delivery status" },
            { status: 500 }
        )
    }
}
