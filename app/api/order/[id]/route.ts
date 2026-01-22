import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 단일 발주 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const orderProcess = await prisma.orderProcess.findUnique({
            where: { id },
            include: {
                client: true
            }
        })

        if (!orderProcess) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 })
        }

        // 발주번호로 생성된 Kiosk들 찾기
        const kiosks = await prisma.kiosk.findMany({
            where: {
                memo: `발주: ${orderProcess.processNumber}`
            },
            include: {
                branch: {
                    include: {
                        corporation: {
                            include: {
                                fc: true
                            }
                        }
                    }
                }
            }
        })

        const firstKiosk = kiosks[0]

        // step1Notes에서 의뢰자, 단가, 세금포함 여부, 발주의뢰일 파싱
        let requesterName = null
        let kioskUnitPrice = null
        let plateUnitPrice = null
        let taxIncluded = false
        let orderRequestDate = null
        let plateCount = 0

        if (orderProcess.step1Notes) {
            const requesterMatch = orderProcess.step1Notes.match(/의뢰자:\s*(.+?)(?:\n|$)/)
            if (requesterMatch) requesterName = requesterMatch[1].trim()

            const kioskPriceMatch = orderProcess.step1Notes.match(/키오스크단가:\s*([\d,]+)/)
            if (kioskPriceMatch) kioskUnitPrice = parseInt(kioskPriceMatch[1].replace(/,/g, ''))

            const platePriceMatch = orderProcess.step1Notes.match(/철판단가:\s*([\d,]+)/)
            if (platePriceMatch) plateUnitPrice = parseInt(platePriceMatch[1].replace(/,/g, ''))

            const plateCountMatch = orderProcess.step1Notes.match(/철판수량:\s*(\d+)/)
            if (plateCountMatch) plateCount = parseInt(plateCountMatch[1])

            const orderDateMatch = orderProcess.step1Notes.match(/발주의뢰일:\s*(.+?)(?:\n|$)/)
            if (orderDateMatch) orderRequestDate = orderDateMatch[1].trim()

            taxIncluded = orderProcess.step1Notes.includes('세금포함')
        }

        // 총 금액 계산
        const kioskTotal = (kioskUnitPrice || 0) * (orderProcess.quantity || 0)
        const plateTotal = (plateUnitPrice || 0) * plateCount
        const totalAmount = kioskTotal + plateTotal || null

        // 복수 업체 정보를 위해 지점별로 그룹핑
        const itemsMap = new Map<string, {
            corporationId: string | null
            corporationName: string | null
            branchId: string | null
            branchName: string | null
            brandName: string | null
            postalCode: string | null
            address: string | null
            contact: string | null
            acquisition: string
            kioskCount: number
            plateCount: number
        }>()

        kiosks.forEach(kiosk => {
            const branchId = kiosk.branchId || 'unknown'
            const existing = itemsMap.get(branchId)
            if (existing) {
                existing.kioskCount += 1
            } else {
                itemsMap.set(branchId, {
                    corporationId: kiosk.branch?.corporationId || null,
                    corporationName: kiosk.branch?.corporation?.name || null,
                    branchId: kiosk.branchId,
                    branchName: kiosk.branch?.name || null,
                    brandName: kiosk.brandName || kiosk.branch?.corporation?.fc?.name || null,
                    postalCode: kiosk.branch?.postalCode || null,
                    address: kiosk.branch?.address || null,
                    contact: kiosk.branch?.managerPhone || null,
                    acquisition: kiosk.acquisition || 'FREE',
                    kioskCount: 1,
                    plateCount: 0
                })
            }
        })

        const items = Array.from(itemsMap.values())

        const order = {
            id: orderProcess.id,
            orderNumber: orderProcess.processNumber,
            title: orderProcess.title,
            requesterName,
            kioskUnitPrice,
            plateUnitPrice,
            taxIncluded,
            totalAmount,
            orderRequestDate: orderRequestDate || orderProcess.createdAt,
            // 납품항목 정보 (첫 번째 항목)
            corporationId: firstKiosk?.branch?.corporationId || null,
            corporationName: firstKiosk?.branch?.corporation?.name || null,
            branchId: firstKiosk?.branchId || null,
            branchName: firstKiosk?.branch?.name || null,
            brandName: firstKiosk?.brandName || firstKiosk?.branch?.corporation?.fc?.name || null,
            postalCode: firstKiosk?.branch?.postalCode || null,
            address: firstKiosk?.branch?.address || null,
            contact: firstKiosk?.branch?.managerPhone || null,
            quantity: orderProcess.quantity || kiosks.length,
            kioskCount: orderProcess.quantity || kiosks.length,
            plateCount,
            acquisition: firstKiosk?.acquisition || orderProcess.acquisition || 'FREE',
            leaseCompanyId: orderProcess.leaseCompanyId,
            desiredDeliveryDate: orderProcess.desiredDeliveryDate,
            status: orderProcess.status,
            memo: orderProcess.step1Notes,
            createdAt: orderProcess.createdAt,
            updatedAt: orderProcess.updatedAt,
            // 복수 업체 정보
            items: items.length > 1 ? items : null,
            itemCount: items.length
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Failed to fetch order:', error)
        return NextResponse.json({ message: 'Failed to fetch order' }, { status: 500 })
    }
}

// DELETE: 발주 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // 연관된 Kiosk 찾기 (발주번호로)
        const orderProcess = await prisma.orderProcess.findUnique({
            where: { id }
        })

        if (!orderProcess) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 })
        }

        // 발주번호로 생성된 Kiosk 삭제 (TEMP- 시리얼 번호로 식별)
        await prisma.kiosk.deleteMany({
            where: {
                memo: `발주: ${orderProcess.processNumber}`
            }
        })

        // OrderProcess 삭제
        await prisma.orderProcess.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Order deleted successfully' })
    } catch (error) {
        console.error('Failed to delete order:', error)
        return NextResponse.json({ message: 'Failed to delete order' }, { status: 500 })
    }
}

// PUT: 발주 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const {
            title,
            requesterName,
            orderRequestDate,
            desiredDeliveryDate,
            kioskUnitPrice,
            plateUnitPrice,
            notes,
            items,
            totalKioskCount,
            totalPlateCount,
            totalAmount
        } = body

        // 첫 번째 항목의 정보를 대표로 저장
        const firstItem = items?.[0]

        // step1Notes에 메타데이터 및 items JSON 저장
        const metaData = {
            notes: notes || '',
            kioskUnitPrice,
            plateUnitPrice,
            totalPlateCount,
            orderRequestDate,
            items: items || []
        }

        const orderProcess = await prisma.orderProcess.update({
            where: { id },
            data: {
                title: title,
                requesterName: requesterName,
                desiredDeliveryDate: desiredDeliveryDate || null,
                step1Notes: JSON.stringify(metaData),
                quantity: totalKioskCount,
                // 첫 번째 항목 정보
                clientId: firstItem?.branchId || undefined,
                acquisition: firstItem?.acquisition || 'FREE',
                leaseCompanyId: firstItem?.leaseCompanyId || null
            }
        })

        return NextResponse.json({
            id: orderProcess.id,
            orderNumber: orderProcess.processNumber,
            title: orderProcess.title,
            quantity: orderProcess.quantity,
            updatedAt: orderProcess.updatedAt
        })
    } catch (error) {
        console.error('Failed to update order:', error)
        return NextResponse.json({ message: 'Failed to update order' }, { status: 500 })
    }
}
