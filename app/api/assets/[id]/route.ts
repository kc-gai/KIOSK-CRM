import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 임시: 인증 비활성화 (개발용)

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const kiosk = await prisma.kiosk.findUnique({
            where: { id },
            include: {
                currentPartner: {
                    select: { id: true, name: true, nameJa: true }
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        nameJa: true,
                        postalCode: true,
                        address: true,
                        managerPhone: true,
                        managerName: true,
                        regionCode: true,
                        areaCode: true,
                        corporation: {
                            select: {
                                id: true,
                                name: true,
                                nameJa: true,
                                fc: {
                                    select: { id: true, code: true, name: true, nameJa: true }
                                }
                            }
                        }
                    }
                },
                // 최신 이력 정보 포함
                // eventDate가 같은 경우 createdAt 기준으로 가장 나중에 생성된 이력 사용
                history: {
                    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
                    take: 1,
                    select: {
                        eventDate: true,
                        moveType: true,
                        newStatus: true,
                        newBranch: true,
                        newBranchId: true,
                        newBranchRel: {
                            select: {
                                id: true,
                                name: true,
                                nameJa: true,
                                postalCode: true,
                                address: true,
                                managerPhone: true,
                                managerName: true,
                                regionCode: true,
                                areaCode: true,
                                corporation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nameJa: true,
                                        fc: {
                                            select: { id: true, code: true, name: true, nameJa: true }
                                        }
                                    }
                                }
                            }
                        },
                        newCorporation: {
                            select: {
                                id: true,
                                name: true,
                                nameJa: true,
                                fc: {
                                    select: { id: true, code: true, name: true, nameJa: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!kiosk) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // 최신 이력 정보를 기반으로 소속 정보 오버라이드
        const latestHistory = kiosk.history[0]
        let result: Record<string, unknown> = { ...kiosk, history: undefined }

        if (latestHistory) {
            const latestBranch = latestHistory.newBranchRel
            const latestCorporation = latestHistory.newCorporation || latestBranch?.corporation

            result = {
                ...result,
                latestEventDate: latestHistory.eventDate,
                latestMoveType: latestHistory.moveType,
                latestStatus: latestHistory.newStatus,
                latestBranchName: latestHistory.newBranch || latestBranch?.name || null,
                latestBranch: latestBranch ? {
                    id: latestBranch.id,
                    name: latestBranch.name,
                    nameJa: latestBranch.nameJa,
                    postalCode: latestBranch.postalCode,
                    address: latestBranch.address,
                    managerPhone: latestBranch.managerPhone,
                    managerName: latestBranch.managerName,
                    regionCode: latestBranch.regionCode,
                    areaCode: latestBranch.areaCode,
                    corporation: latestBranch.corporation
                } : null,
                latestCorporation: latestCorporation ? {
                    id: latestCorporation.id,
                    name: latestCorporation.name,
                    nameJa: latestCorporation.nameJa,
                    fc: latestCorporation.fc
                } : null
            }
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await req.json()
        console.log('PUT /api/assets/[id] - received data:', JSON.stringify(json, null, 2))

        const existing = await prisma.kiosk.findUnique({
            where: { id },
            include: {
                branch: {
                    select: { id: true, corporationId: true }
                }
            }
        })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // 새로운 branchId가 있으면 해당 Branch의 corporationId도 조회
        let newBranchCorporationId: string | null = null
        if (json.branchId) {
            const newBranch = await prisma.branch.findUnique({
                where: { id: json.branchId },
                select: { corporationId: true }
            })
            newBranchCorporationId = newBranch?.corporationId || null
        }

        // 변경 감지
        const partnerChanged = (json.currentPartnerId || null) !== existing.currentPartnerId
        const branchChanged = (json.branchName || null) !== existing.branchName
        const regionChanged = (json.regionCode || null) !== existing.regionCode
        const areaChanged = (json.areaCode || null) !== existing.areaCode
        const statusChanged = json.status !== existing.status
        const acquisitionChanged = json.acquisition !== existing.acquisition
        const priceChanged = (json.salePrice ? parseFloat(json.salePrice) : null) !== existing.salePrice

        // 부분 업데이트 지원: 전달된 필드만 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}
        if (json.serialNumber !== undefined) updateData.serialNumber = json.serialNumber || null
        if (json.kioskNumber !== undefined) updateData.kioskNumber = json.kioskNumber || null
        if (json.anydeskId !== undefined) updateData.anydeskId = json.anydeskId || null
        if (json.brandName !== undefined) updateData.brandName = json.brandName || null

        // currentPartnerId는 relation을 통해 연결
        if (json.currentPartnerId !== undefined) {
            if (json.currentPartnerId) {
                updateData.currentPartner = { connect: { id: json.currentPartnerId } }
            } else {
                updateData.currentPartner = { disconnect: true }
            }
        }

        // branchId는 relation을 통해 연결
        if (json.branchId !== undefined) {
            if (json.branchId) {
                updateData.branch = { connect: { id: json.branchId } }
            } else {
                updateData.branch = { disconnect: true }
            }
        }

        if (json.branchName !== undefined) updateData.branchName = json.branchName || null
        if (json.regionCode !== undefined) updateData.regionCode = json.regionCode || null
        if (json.areaCode !== undefined) updateData.areaCode = json.areaCode || null
        if (json.acquisition !== undefined) updateData.acquisition = json.acquisition
        if (json.salePrice !== undefined) updateData.salePrice = json.salePrice ? parseInt(json.salePrice) : null

        // leaseCompanyId는 relation을 통해 연결
        if (json.leaseCompanyId !== undefined) {
            if (json.leaseCompanyId) {
                updateData.leaseCompany = { connect: { id: json.leaseCompanyId } }
            } else {
                updateData.leaseCompany = { disconnect: true }
            }
        }

        // 날짜 필드 안전하게 파싱 (유효하지 않은 날짜는 null 처리)
        const parseDate = (value: string | null | undefined) => {
            if (!value) return null
            const date = new Date(value)
            return isNaN(date.getTime()) ? null : date
        }

        if (json.orderRequestDate !== undefined) updateData.orderRequestDate = parseDate(json.orderRequestDate)
        if (json.deliveryDueDate !== undefined) updateData.deliveryDueDate = json.deliveryDueDate || null  // 텍스트 형식 지원을 위해 String으로 저장
        if (json.deliveryDate !== undefined) updateData.deliveryDate = parseDate(json.deliveryDate)
        if (json.deliveryStatus !== undefined) updateData.deliveryStatus = json.deliveryStatus
        if (json.status !== undefined) updateData.status = json.status
        if (json.memo !== undefined) updateData.memo = json.memo || null
        // postalCode, address, managerPhone은 Kiosk 모델에 없음 (Branch에만 있음)

        const kiosk = await prisma.kiosk.update({
            where: { id },
            data: updateData,
            include: {
                currentPartner: {
                    select: { id: true, name: true, nameJa: true }
                }
            }
        })

        // 중요한 변경사항이 있으면 이력 생성
        const hasSignificantChange = partnerChanged || branchChanged || regionChanged ||
                                     areaChanged || statusChanged || acquisitionChanged || priceChanged

        if (hasSignificantChange) {
            // 이동 유형 결정
            let moveType = 'TRANSFER'
            if (statusChanged) {
                if (json.status === 'DEPLOYED') moveType = 'DEPLOY'
                else if (json.status === 'IN_STOCK') moveType = 'STORAGE'
                else if (json.status === 'MAINTENANCE') moveType = 'MAINTENANCE'
                else if (json.status === 'RETIRED') moveType = 'DISPOSAL'
            }
            if (partnerChanged && !json.currentPartnerId) moveType = 'RETURN'
            if (partnerChanged && json.currentPartnerId && existing.currentPartnerId) moveType = 'TRANSFER'

            // 변경 내용 설명 생성 (다국어 키 형식으로 저장)
            const changes: string[] = []
            if (partnerChanged) changes.push('CHANGE_PARTNER')
            if (branchChanged) changes.push('CHANGE_BRANCH')
            if (regionChanged || areaChanged) changes.push('CHANGE_AREA')
            if (statusChanged) changes.push(`CHANGE_STATUS:${existing.status}→${json.status}`)
            if (acquisitionChanged) changes.push(`CHANGE_ACQUISITION:${existing.acquisition}→${json.acquisition}`)
            if (priceChanged) changes.push(`CHANGE_PRICE:${existing.salePrice || 0}→${json.salePrice || 0}`)

            // eventDate는 납품일(deliveryDate)을 사용, 없으면 현재 날짜
            const eventDate = json.deliveryDate ? parseDate(json.deliveryDate) || new Date() : new Date()

            const historyRecord = await prisma.locationHistory.create({
                data: {
                    kioskId: kiosk.id,
                    moveType: moveType,
                    eventDate: eventDate,
                    prevLocation: existing.branchName,
                    newLocation: json.branchName || null,
                    prevPartnerId: existing.currentPartnerId,
                    newPartnerId: json.currentPartnerId || null,
                    prevBranch: existing.branchName,
                    newBranch: json.branchName || null,
                    prevBranchId: existing.branch?.id || null,
                    newBranchId: json.branchId || null,
                    prevCorporationId: existing.branch?.corporationId || null,
                    newCorporationId: newBranchCorporationId,
                    prevRegionCode: existing.regionCode,
                    newRegionCode: json.regionCode || null,
                    prevAreaCode: existing.areaCode,
                    newAreaCode: json.areaCode || null,
                    prevStatus: existing.status,
                    newStatus: json.status,
                    prevAcquisition: existing.acquisition,
                    newAcquisition: json.acquisition,
                    prevPrice: existing.salePrice,
                    newPrice: json.salePrice ? parseFloat(json.salePrice) : null,
                    description: changes.join(', '),
                    handledBy: json.handledBy || null
                }
            })

            // 이력이 생성되면 해당 이동일을 Kiosk의 deliveryDate로 업데이트
            // 단, 사용자가 명시적으로 납품일을 입력한 경우에는 덮어쓰지 않음
            if (json.deliveryDate === undefined) {
                await prisma.kiosk.update({
                    where: { id: kiosk.id },
                    data: { deliveryDate: historyRecord.eventDate }
                })
            }
        }

        return NextResponse.json(kiosk)
    } catch (error) {
        console.error('PUT /api/assets/[id] error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const existing = await prisma.kiosk.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        await prisma.locationHistory.deleteMany({
            where: { kioskId: id }
        })

        await prisma.orderKiosk.deleteMany({
            where: { kioskId: id }
        })

        await prisma.kiosk.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
