import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/assets/[id]/sync-latest
 * 최신 이력으로 키오스크 정보 동기화
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 가장 최신 이력 조회 (eventDate 기준 내림차순, 같은 날짜면 createdAt 기준)
        const latestHistory = await prisma.locationHistory.findFirst({
            where: { kioskId: id },
            orderBy: [
                { eventDate: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                newBranchRel: {
                    select: { id: true, name: true, code: true, regionCode: true, areaCode: true }
                },
                newCorporation: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        fc: {
                            select: { code: true, name: true }
                        }
                    }
                }
            }
        })

        if (!latestHistory) {
            return NextResponse.json(
                { error: "이력이 없습니다" },
                { status: 404 }
            )
        }

        // 키오스크 업데이트 데이터 구성
        const updateData: Record<string, unknown> = {}

        // 지점 정보 (지점을 통해 법인 정보도 연결됨)
        if (latestHistory.newBranchId) {
            updateData.branchId = latestHistory.newBranchId
        }
        if (latestHistory.newBranch) {
            updateData.branchName = latestHistory.newBranch
        }

        // 브랜드명 생성 (FC코드 / FC명 형식)
        // 예: "FC022 / Lilmobi"
        if (latestHistory.newCorporation?.fc) {
            const fcCode = latestHistory.newCorporation.fc.code || ''
            const fcName = latestHistory.newCorporation.fc.name || ''

            if (fcCode && fcName) {
                updateData.brandName = `${fcCode} / ${fcName}`
            } else if (fcCode) {
                updateData.brandName = fcCode
            } else if (fcName) {
                updateData.brandName = fcName
            }
        }

        // 지역/관할 코드 (이력에 저장된 값 우선, 없으면 지점에서 가져오기)
        if (latestHistory.newRegionCode) {
            updateData.regionCode = latestHistory.newRegionCode
        } else if (latestHistory.newBranchRel?.regionCode) {
            updateData.regionCode = latestHistory.newBranchRel.regionCode
        }

        if (latestHistory.newAreaCode) {
            updateData.areaCode = latestHistory.newAreaCode
        } else if (latestHistory.newBranchRel?.areaCode) {
            updateData.areaCode = latestHistory.newBranchRel.areaCode
        }

        // 상태
        if (latestHistory.newStatus) {
            updateData.status = latestHistory.newStatus
        }

        // 가격
        if (latestHistory.newPrice !== null) {
            updateData.salePrice = latestHistory.newPrice
        }

        // 취득유형
        if (latestHistory.newAcquisition) {
            updateData.acquisition = latestHistory.newAcquisition
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "동기화할 데이터가 없습니다", updated: false })
        }

        // 키오스크 업데이트
        const kiosk = await prisma.kiosk.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({
            message: "최신 이력으로 동기화되었습니다",
            updated: true,
            kiosk,
            syncedFrom: {
                historyId: latestHistory.id,
                eventDate: latestHistory.eventDate
            }
        })
    } catch (error) {
        console.error("Error syncing with latest history:", error)
        return NextResponse.json(
            { error: "동기화에 실패했습니다" },
            { status: 500 }
        )
    }
}
