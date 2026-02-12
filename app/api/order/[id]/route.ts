import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

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
        let requesterName: string | null = orderProcess.requesterName || null
        let kioskUnitPrice: number | null = null
        let plateUnitPrice: number | null = null
        let taxIncluded = false
        let orderRequestDate: string | null = null
        let plateCount = 0
        let savedItems: Array<{
            corporationId?: string
            corporationName?: string
            branchId?: string
            branchName?: string
            brandName?: string
            postalCode?: string
            address?: string
            contact?: string
            acquisition?: string
            leaseCompanyId?: string
            kioskCount?: number
            plateCount?: number
        }> | null = null

        if (orderProcess.step1Notes) {
            // 먼저 JSON 형식인지 확인
            try {
                const parsed = JSON.parse(orderProcess.step1Notes)
                if (parsed && typeof parsed === 'object') {
                    // JSON 형식으로 저장된 경우
                    kioskUnitPrice = parsed.kioskUnitPrice || null
                    plateUnitPrice = parsed.plateUnitPrice || null
                    plateCount = parsed.totalPlateCount || 0
                    orderRequestDate = parsed.orderRequestDate || null
                    savedItems = parsed.items || null
                    // notes 필드가 있으면 텍스트 파싱도 시도
                    if (parsed.notes && typeof parsed.notes === 'string') {
                        taxIncluded = parsed.notes.includes('세금포함')
                    }
                }
            } catch {
                // JSON 파싱 실패 시 기존 텍스트 형식으로 파싱
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
        }

        // 총 금액 계산
        const kioskTotal = (kioskUnitPrice || 0) * (orderProcess.quantity || 0)
        const plateTotal = (plateUnitPrice || 0) * plateCount
        const totalAmount = kioskTotal + plateTotal || null

        // items 결정: 저장된 items가 있으면 사용, 없으면 Kiosk에서 추출
        let items: Array<{
            corporationId: string | null
            corporationName: string | null
            branchId: string | null
            branchName: string | null
            brandName: string | null
            postalCode: string | null
            address: string | null
            contact: string | null
            acquisition: string
            leaseCompanyId?: string | null
            leaseCompanyName?: string | null
            desiredDeliveryDate?: string | null
            kioskCount: number
            plateCount: number
        }>

        // 리스회사 정보 조회
        const leaseCompanies = await prisma.leaseCompany.findMany({
            select: { id: true, name: true, nameJa: true }
        })
        const leaseCompanyMap = new Map(leaseCompanies.map(lc => [lc.id, lc.nameJa || lc.name]))

        // 법인 정보 조회 (일본어 이름 포함)
        const corporations = await prisma.corporation.findMany({
            select: { id: true, name: true, nameJa: true }
        })
        const corporationMap = new Map(corporations.map(c => [c.id, { name: c.name, nameJa: c.nameJa }]))

        // 지점 정보 조회 (일본어 이름 포함)
        const branches = await prisma.branch.findMany({
            select: { id: true, name: true, nameJa: true }
        })
        const branchMap = new Map(branches.map(b => [b.id, { name: b.name, nameJa: b.nameJa }]))

        if (savedItems && savedItems.length > 0) {
            // JSON에서 저장된 items 사용 - DB에서 일본어 이름 조회
            items = savedItems.map(item => {
                const corpInfo = item.corporationId ? corporationMap.get(item.corporationId) : null
                const branchInfo = item.branchId ? branchMap.get(item.branchId) : null
                return {
                    corporationId: item.corporationId || null,
                    corporationName: corpInfo?.nameJa || corpInfo?.name || item.corporationName || null,
                    branchId: item.branchId || null,
                    branchName: branchInfo?.nameJa || branchInfo?.name || item.branchName || null,
                    brandName: item.brandName || null,
                    postalCode: item.postalCode || null,
                    address: item.address || null,
                    contact: item.contact || null,
                    acquisition: item.acquisition || 'FREE',
                    leaseCompanyId: item.leaseCompanyId || null,
                    leaseCompanyName: item.leaseCompanyId ? leaseCompanyMap.get(item.leaseCompanyId) || null : null,
                    desiredDeliveryDate: (item as { desiredDeliveryDate?: string }).desiredDeliveryDate || null,
                    kioskCount: item.kioskCount || 1,
                    plateCount: item.plateCount || 0
                }
            })
        } else {
            // 기존 방식: Kiosk에서 지점별로 그룹핑
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
                    const corpInfo = kiosk.branch?.corporationId ? corporationMap.get(kiosk.branch.corporationId) : null
                    const branchInfo = kiosk.branchId ? branchMap.get(kiosk.branchId) : null
                    itemsMap.set(branchId, {
                        corporationId: kiosk.branch?.corporationId || null,
                        corporationName: corpInfo?.nameJa || corpInfo?.name || kiosk.branch?.corporation?.name || null,
                        branchId: kiosk.branchId,
                        branchName: branchInfo?.nameJa || branchInfo?.name || kiosk.branch?.name || null,
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

            items = Array.from(itemsMap.values())
        }

        // 첫 번째 항목 정보 (items에서 가져오거나 kiosk에서 가져옴)
        const firstItem = items[0] || null

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
            // 납품항목 정보 (첫 번째 항목) - items에서 우선 가져옴
            corporationId: firstItem?.corporationId || firstKiosk?.branch?.corporationId || null,
            corporationName: firstItem?.corporationName || firstKiosk?.branch?.corporation?.name || null,
            branchId: firstItem?.branchId || firstKiosk?.branchId || null,
            branchName: firstItem?.branchName || firstKiosk?.branch?.name || null,
            brandName: firstItem?.brandName || firstKiosk?.brandName || firstKiosk?.branch?.corporation?.fc?.name || null,
            postalCode: firstItem?.postalCode || firstKiosk?.branch?.postalCode || null,
            address: firstItem?.address || firstKiosk?.branch?.address || null,
            contact: firstItem?.contact || firstKiosk?.branch?.managerPhone || null,
            quantity: orderProcess.quantity || kiosks.length,
            kioskCount: orderProcess.quantity || kiosks.length,
            plateCount,
            acquisition: firstItem?.acquisition || firstKiosk?.acquisition || orderProcess.acquisition || 'FREE',
            leaseCompanyId: firstItem?.leaseCompanyId || orderProcess.leaseCompanyId,
            desiredDeliveryDate: orderProcess.desiredDeliveryDate,
            status: orderProcess.status,
            memo: orderProcess.step1Notes,
            createdAt: orderProcess.createdAt,
            updatedAt: orderProcess.updatedAt,
            // 품의 관련 필드
            approvalRequestId: orderProcess.approvalRequestId,
            approvalStatus: orderProcess.approvalStatus,
            approvalDate: orderProcess.approvalDate,
            approvalComment: orderProcess.approvalComment,
            // 복수 업체 정보 (항상 items 반환)
            items: items.length > 0 ? items : null,
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

        // 연관된 캘린더 이벤트 삭제
        try {
            const calendarEvents = await prisma.calendarEvent.findMany({
                where: { sourceType: 'ORDER_PROCESS', sourceId: id }
            })
            for (const ce of calendarEvents) {
                if (ce.eventId) {
                    await deleteCalendarEvent(ce.eventId)
                }
            }
            await prisma.calendarEvent.deleteMany({
                where: { sourceType: 'ORDER_PROCESS', sourceId: id }
            })
        } catch (calError) {
            console.error('Calendar event cleanup failed:', calError)
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
            totalAmount,
            // 품의 관련 필드
            approvalRequestId,
            approvalStatus,
            approvalComment,
            // 상태 변경
            status
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

        // 업데이트 데이터 구성
        const updateData: Record<string, unknown> = {
            title: title,
            requesterName: requesterName,
            desiredDeliveryDate: desiredDeliveryDate ? new Date(desiredDeliveryDate) : null,
            step1Notes: JSON.stringify(metaData),
            quantity: totalKioskCount,
            acquisition: firstItem?.acquisition || 'FREE',
            leaseCompanyId: firstItem?.leaseCompanyId || null
        }

        // 품의 필드 (전달된 경우만 업데이트)
        if (approvalRequestId !== undefined) updateData.approvalRequestId = approvalRequestId
        if (approvalStatus !== undefined) {
            updateData.approvalStatus = approvalStatus
            if (approvalStatus === 'APPROVED') {
                updateData.approvalDate = new Date()
            }
        }
        if (approvalComment !== undefined) updateData.approvalComment = approvalComment
        if (status !== undefined) updateData.status = status

        const orderProcess = await prisma.orderProcess.update({
            where: { id },
            data: updateData
        })

        // 납기희망일 변경 시 캘린더 이벤트 업데이트
        if (desiredDeliveryDate) {
            try {
                const calendarEvent = await prisma.calendarEvent.findFirst({
                    where: { sourceType: 'ORDER_PROCESS', sourceId: id }
                })
                if (calendarEvent?.eventId) {
                    const updated = await updateCalendarEvent(calendarEvent.eventId, {
                        title: `【発注】${orderProcess.processNumber} - ${title || orderProcess.title}`,
                        date: new Date(desiredDeliveryDate),
                    })
                    if (updated) {
                        await prisma.calendarEvent.update({
                            where: { id: calendarEvent.id },
                            data: {
                                title: `【発注】${orderProcess.processNumber} - ${title || orderProcess.title}`,
                                eventDate: new Date(desiredDeliveryDate),
                                syncStatus: 'SYNCED',
                                syncedAt: new Date(),
                            }
                        })
                    }
                }
            } catch (calError) {
                console.error('Calendar event update failed:', calError)
            }
        }

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
