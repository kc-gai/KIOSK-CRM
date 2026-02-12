import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/assets/[id]/history
 * 특정 키오스크의 이동이력 조회
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const history = await prisma.locationHistory.findMany({
            where: { kioskId: id },
            include: {
                prevPartner: {
                    select: { id: true, name: true, nameJa: true }
                },
                newPartner: {
                    select: { id: true, name: true, nameJa: true }
                },
                prevBranchRel: {
                    select: { id: true, name: true, nameJa: true }
                },
                newBranchRel: {
                    select: { id: true, name: true, nameJa: true }
                },
                prevCorporation: {
                    select: { id: true, name: true, nameJa: true }
                },
                newCorporation: {
                    select: { id: true, name: true, nameJa: true }
                }
            },
            orderBy: { eventDate: 'asc' }
        })

        return NextResponse.json(history)
    } catch (error) {
        console.error("Error fetching history:", error)
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        )
    }
}

/**
 * POST /api/assets/[id]/history
 * 새 이동이력 추가
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // 키오스크 확인 (현재 branch 정보 포함)
        const kiosk = await prisma.kiosk.findUnique({
            where: { id },
            include: {
                currentPartner: true,
                branch: {
                    select: { id: true, corporationId: true }
                }
            }
        })

        if (!kiosk) {
            return NextResponse.json(
                { error: "Kiosk not found" },
                { status: 404 }
            )
        }

        // 새로운 branchId가 있으면 해당 Branch의 corporationId 및 FC 정보 조회
        let newBranchCorporationId: string | null = null
        let newFcData: { code: string | null; name: string } | null = null

        if (body.newBranchId) {
            const newBranch = await prisma.branch.findUnique({
                where: { id: body.newBranchId },
                select: {
                    corporationId: true,
                    code: true,
                    name: true,
                    corporation: {
                        select: {
                            code: true,
                            name: true,
                            fc: {
                                select: { code: true, name: true }
                            }
                        }
                    }
                }
            })
            if (newBranch) {
                newBranchCorporationId = newBranch.corporationId
                if (newBranch.corporation?.fc) {
                    newFcData = { code: newBranch.corporation.fc.code, name: newBranch.corporation.fc.name }
                }
            }
        }

        // 이력 생성
        const history = await prisma.locationHistory.create({
            data: {
                kioskId: id,
                moveType: body.moveType || 'TRANSFER',
                prevLocation: kiosk.branchName,
                newLocation: body.newBranch || body.newLocation || null,
                prevPartnerId: kiosk.currentPartnerId,
                newPartnerId: body.newPartnerId || null,
                prevBranch: kiosk.branchName,
                newBranch: body.newBranch || body.newLocation || null,
                prevBranchId: kiosk.branch?.id || null,
                newBranchId: body.newBranchId || null,
                prevCorporationId: kiosk.branch?.corporationId || null,
                newCorporationId: newBranchCorporationId,
                prevRegionCode: kiosk.regionCode,
                newRegionCode: body.newRegionCode || null,
                prevAreaCode: kiosk.areaCode,
                newAreaCode: body.newAreaCode || null,
                prevStatus: kiosk.status,
                newStatus: body.newStatus || null,
                prevAcquisition: kiosk.acquisition,
                newAcquisition: body.newAcquisition || null,
                prevPrice: kiosk.salePrice,
                newPrice: body.newPrice ? parseFloat(body.newPrice) : null,
                repairReason: body.repairReason || null,
                repairCost: body.repairCost ? parseFloat(body.repairCost) : null,
                repairVendor: body.repairVendor || null,
                eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
                description: body.description || null,
                handledBy: body.handledBy || null
            },
            include: {
                prevPartner: { select: { id: true, name: true } },
                newPartner: { select: { id: true, name: true } },
                prevBranchRel: { select: { id: true, name: true, nameJa: true } },
                newBranchRel: { select: { id: true, name: true, nameJa: true } },
                prevCorporation: { select: { id: true, name: true, nameJa: true } },
                newCorporation: { select: { id: true, name: true, nameJa: true } }
            }
        })

        // 키오스크 정보 업데이트 (이동 시)
        if (body.updateKiosk !== false) {
            const updateData: Record<string, unknown> = {}
            if (body.newBranch) updateData.branchName = body.newBranch
            if (body.newBranchId) updateData.branchId = body.newBranchId
            if (body.newRegionCode) updateData.regionCode = body.newRegionCode
            if (body.newAreaCode) updateData.areaCode = body.newAreaCode
            if (body.newStatus) updateData.status = body.newStatus
            if (body.newPrice) updateData.salePrice = parseFloat(body.newPrice)

            // 브랜드명 생성 (FC코드 / FC명 형식)
            // 예: "FC022 / Lilmobi"
            if (newFcData) {
                const fcCode = newFcData.code || ''
                const fcName = newFcData.name || ''

                if (fcCode && fcName) {
                    updateData.brandName = `${fcCode} / ${fcName}`
                } else if (fcCode) {
                    updateData.brandName = fcCode
                } else if (fcName) {
                    updateData.brandName = fcName
                }
            }

            // 이력 추가 시 deliveryDate 업데이트 (단, 기존 납품일이 없는 경우에만)
            if (!kiosk.deliveryDate) {
                updateData.deliveryDate = history.eventDate
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.kiosk.update({
                    where: { id },
                    data: updateData
                })
            }
        }

        return NextResponse.json(history)
    } catch (error) {
        console.error("Error creating history:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create history" },
            { status: 500 }
        )
    }
}
