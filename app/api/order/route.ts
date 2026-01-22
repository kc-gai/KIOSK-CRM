import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 발주 목록 조회
export async function GET() {
    try {
        // OrderProcess 데이터와 연관된 Kiosk를 통해 Corporation/Branch 정보 조회
        const orderProcesses = await prisma.orderProcess.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: true
            }
        })

        // 각 발주에 대해 연관된 Kiosk에서 Branch/Corporation 정보 가져오기
        const orders = await Promise.all(orderProcesses.map(async (op) => {
            // 발주번호로 생성된 Kiosk들 찾기
            const kiosks = await prisma.kiosk.findMany({
                where: {
                    memo: `발주: ${op.processNumber}`
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

            if (op.step1Notes) {
                const requesterMatch = op.step1Notes.match(/의뢰자:\s*(.+?)(?:\n|$)/)
                if (requesterMatch) requesterName = requesterMatch[1].trim()

                const kioskPriceMatch = op.step1Notes.match(/키오스크단가:\s*([\d,]+)/)
                if (kioskPriceMatch) kioskUnitPrice = parseInt(kioskPriceMatch[1].replace(/,/g, ''))

                const platePriceMatch = op.step1Notes.match(/철판단가:\s*([\d,]+)/)
                if (platePriceMatch) plateUnitPrice = parseInt(platePriceMatch[1].replace(/,/g, ''))

                const plateCountMatch = op.step1Notes.match(/철판수량:\s*(\d+)/)
                if (plateCountMatch) plateCount = parseInt(plateCountMatch[1])

                const orderDateMatch = op.step1Notes.match(/발주의뢰일:\s*(.+?)(?:\n|$)/)
                if (orderDateMatch) orderRequestDate = orderDateMatch[1].trim()

                taxIncluded = op.step1Notes.includes('세금포함')
            }

            // 총 금액 계산
            const kioskTotal = (kioskUnitPrice || 0) * (op.quantity || 0)
            const plateTotal = (plateUnitPrice || 0) * plateCount
            const totalAmount = kioskTotal + plateTotal || null

            // 복수 업체 정보를 위해 지점별로 그룹핑
            const itemsMap = new Map<string, {
                corporationId: string | null
                corporationName: string | null
                corporationNameJa: string | null
                branchId: string | null
                branchName: string | null
                branchNameJa: string | null
                brandName: string | null
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
                        corporationNameJa: kiosk.branch?.corporation?.nameJa || null,
                        branchId: kiosk.branchId,
                        branchName: kiosk.branch?.name || null,
                        branchNameJa: kiosk.branch?.nameJa || null,
                        brandName: kiosk.brandName || kiosk.branch?.corporation?.fc?.name || null,
                        acquisition: kiosk.acquisition || 'FREE',
                        kioskCount: 1,
                        plateCount: 0  // 철판은 전체 합계로만 관리
                    })
                }
            })

            const items = Array.from(itemsMap.values())

            return {
                id: op.id,
                orderNumber: op.processNumber,
                title: op.title,
                requesterName,
                kioskUnitPrice,
                plateUnitPrice,
                taxIncluded,
                totalAmount,
                orderRequestDate: orderRequestDate || op.createdAt,
                // 납품항목 정보 (첫 번째 항목 - 기존 호환)
                corporationId: firstKiosk?.branch?.corporationId || null,
                corporationName: firstKiosk?.branch?.corporation?.name || null,
                corporationNameJa: firstKiosk?.branch?.corporation?.nameJa || null,
                branchId: firstKiosk?.branchId || null,
                branchName: firstKiosk?.branch?.name || null,
                branchNameJa: firstKiosk?.branch?.nameJa || null,
                brandName: firstKiosk?.brandName || firstKiosk?.branch?.corporation?.fc?.name || null,
                quantity: op.quantity || kiosks.length,
                kioskCount: op.quantity || kiosks.length,
                plateCount,
                acquisition: firstKiosk?.acquisition || op.acquisition || 'FREE',
                leaseCompanyId: op.leaseCompanyId,
                desiredDeliveryDate: op.desiredDeliveryDate,
                status: op.status,
                memo: op.step1Notes,
                createdAt: op.createdAt,
                updatedAt: op.updatedAt,
                // 복수 업체 정보
                items: items.length > 1 ? items : null,
                itemCount: items.length
            }
        }))

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Failed to fetch orders:', error)
        return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 })
    }
}

// POST: 새 발주 생성 (복수 납품 항목 지원)
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            // 기본 정보 (새 UI)
            title,
            requesterName,
            orderRequestDate,
            desiredDeliveryDate,
            kioskUnitPrice,
            plateUnitPrice,
            taxIncluded,
            notes,
            // 납품 항목 (복수)
            items,
            totalKioskCount,
            totalPlateCount,
            totalAmount,
            // 기존 단일 항목 호환
            corporationId,
            branchId,
            quantity,
            acquisition,
            leaseCompanyId,
            memo
        } = body

        // 발주 번호 생성
        const today = new Date()
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
        const count = await prisma.orderProcess.count({
            where: {
                processNumber: {
                    startsWith: `ORD-${dateStr}`
                }
            }
        })
        const orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`

        // 복수 항목 처리 (새 UI)
        if (items && Array.isArray(items) && items.length > 0) {
            // 첫 번째 항목의 법인으로 Partner 생성
            const firstItem = items.find((item: { corporationId: string }) => item.corporationId) || items[0]
            let partnerId: string | null = null

            if (firstItem.corporationId) {
                const corporation = await prisma.corporation.findUnique({
                    where: { id: firstItem.corporationId },
                    include: { fc: true }
                })

                if (corporation) {
                    // Partner 찾기 또는 생성
                    let partner = await prisma.partner.findFirst({
                        where: {
                            OR: [
                                { code: corporation.code },
                                { name: corporation.name }
                            ]
                        }
                    })

                    if (!partner) {
                        partner = await prisma.partner.create({
                            data: {
                                name: corporation.name,
                                nameJa: corporation.nameJa,
                                type: 'CLIENT',
                                code: corporation.code,
                                contact: corporation.contact,
                                address: corporation.address
                            }
                        })
                    }
                    partnerId = partner.id
                }
            }

            // 철판 총 수량 계산
            const totalPlates = totalPlateCount || items.reduce((sum: number, item: { plateCount?: number }) => sum + (item.plateCount || 0), 0)

            // clientId가 필수이므로 확인
            if (!partnerId) {
                return NextResponse.json({ message: 'Client (Partner) is required' }, { status: 400 })
            }

            // OrderProcess 생성 - 상태를 PENDING으로 설정 (대기)
            const orderProcess = await prisma.orderProcess.create({
                data: {
                    processNumber: orderNumber,
                    title: title || `발주의뢰 ${orderNumber}`,
                    clientId: partnerId,
                    quantity: totalKioskCount || items.reduce((sum: number, item: { kioskCount: number }) => sum + (item.kioskCount || 0), 0),
                    acquisition: firstItem.acquisition || 'FREE',
                    leaseCompanyId: firstItem.acquisition === 'LEASE_FREE' ? firstItem.leaseCompanyId : null,
                    desiredDeliveryDate: desiredDeliveryDate ? new Date(desiredDeliveryDate) : null,
                    step1Notes: `의뢰자: ${requesterName}\n발주의뢰일: ${orderRequestDate}\n키오스크단가: ${kioskUnitPrice}\n철판단가: ${plateUnitPrice}\n철판수량: ${totalPlates}\n${taxIncluded ? '세금포함' : '세금별도'}\n${notes || ''}`.trim(),
                    status: 'PENDING',  // 대기 상태로 시작
                    currentStep: 1
                }
            })

            // 각 납품 항목별로 Kiosk 생성 (항목별 취득형태/리스회사 적용)
            const kioskPromises = []
            let kioskIndex = 1

            for (const item of items) {
                if (!item.corporationId) continue

                const corporation = await prisma.corporation.findUnique({
                    where: { id: item.corporationId },
                    include: { fc: true }
                })

                // 항목별 취득형태와 리스회사 사용 (없으면 기본값)
                const itemAcquisition = item.acquisition || 'FREE'
                const itemLeaseCompanyId = itemAcquisition === 'LEASE_FREE' ? item.leaseCompanyId : null

                for (let i = 0; i < (item.kioskCount || 1); i++) {
                    const kioskNumber = `${orderNumber}-${String(kioskIndex).padStart(2, '0')}`
                    kioskPromises.push(
                        prisma.kiosk.create({
                            data: {
                                serialNumber: `TEMP-${kioskNumber}`,
                                kioskNumber: kioskNumber,
                                branchId: item.branchId || undefined,
                                brandName: corporation?.fc?.name || corporation?.name || '',
                                acquisition: itemAcquisition,
                                leaseCompanyId: itemLeaseCompanyId,
                                orderRequestDate: orderRequestDate ? new Date(orderRequestDate) : null,
                                deliveryDueDate: desiredDeliveryDate || undefined,
                                deliveryStatus: 'PENDING',
                                status: 'ORDERED',
                                memo: `발주: ${orderNumber}`
                            }
                        })
                    )
                    kioskIndex++
                }
            }
            await Promise.all(kioskPromises)

            return NextResponse.json({
                id: orderProcess.id,
                orderNumber: orderProcess.processNumber,
                title: orderProcess.title,
                quantity: orderProcess.quantity,
                totalAmount,
                status: orderProcess.status,
                createdAt: orderProcess.createdAt
            }, { status: 201 })
        }

        // 기존 단일 항목 처리 (하위 호환)
        if (!corporationId) {
            return NextResponse.json({ message: 'Corporation is required' }, { status: 400 })
        }

        const corporation = await prisma.corporation.findUnique({
            where: { id: corporationId },
            include: { fc: true }
        })

        if (!corporation) {
            return NextResponse.json({ message: 'Corporation not found' }, { status: 404 })
        }

        let branch = null
        if (branchId) {
            branch = await prisma.branch.findUnique({
                where: { id: branchId }
            })
        }

        let partner = await prisma.partner.findFirst({
            where: {
                OR: [
                    { code: corporation.code },
                    { name: corporation.name }
                ]
            }
        })

        if (!partner) {
            partner = await prisma.partner.create({
                data: {
                    name: corporation.name,
                    nameJa: corporation.nameJa,
                    type: 'CLIENT',
                    code: corporation.code,
                    contact: corporation.contact,
                    address: corporation.address
                }
            })
        }

        const orderProcess = await prisma.orderProcess.create({
            data: {
                processNumber: orderNumber,
                title: title || `${corporation.name} 발주`,
                clientId: partner.id,
                quantity: quantity || 1,
                acquisition: acquisition || 'FREE',
                leaseCompanyId: leaseCompanyId || null,
                desiredDeliveryDate: desiredDeliveryDate ? new Date(desiredDeliveryDate) : null,
                step1Notes: memo,
                status: 'PENDING',
                currentStep: 1
            }
        })

        const kioskPromises = []
        for (let i = 0; i < (quantity || 1); i++) {
            const kioskNumber = `${orderNumber}-${String(i + 1).padStart(2, '0')}`
            kioskPromises.push(
                prisma.kiosk.create({
                    data: {
                        serialNumber: `TEMP-${kioskNumber}`,
                        kioskNumber: kioskNumber,
                        branchId: branchId || undefined,
                        brandName: corporation.fc?.name || corporation.name,
                        acquisition: acquisition || 'FREE',
                        leaseCompanyId: leaseCompanyId || null,
                        deliveryDueDate: desiredDeliveryDate || undefined,
                        deliveryStatus: 'PENDING',
                        status: 'ORDERED',
                        memo: `발주: ${orderNumber}`
                    }
                })
            )
        }
        await Promise.all(kioskPromises)

        const result = {
            id: orderProcess.id,
            orderNumber: orderProcess.processNumber,
            title: orderProcess.title,
            corporationId,
            corporation: {
                id: corporation.id,
                code: corporation.code,
                name: corporation.name,
                nameJa: corporation.nameJa,
                fc: corporation.fc
            },
            branchId,
            branch: branch ? {
                id: branch.id,
                code: branch.code,
                name: branch.name,
                nameJa: branch.nameJa
            } : null,
            quantity: orderProcess.quantity,
            acquisition: orderProcess.acquisition,
            leaseCompanyId: orderProcess.leaseCompanyId,
            desiredDeliveryDate: orderProcess.desiredDeliveryDate,
            status: orderProcess.status,
            memo: orderProcess.step1Notes,
            createdAt: orderProcess.createdAt,
            updatedAt: orderProcess.updatedAt
        }

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Failed to create order:', error)
        return NextResponse.json({ message: 'Failed to create order' }, { status: 500 })
    }
}
