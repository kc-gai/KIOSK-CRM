import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * PUT /api/history/[id]
 * 이력 수정
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('=== PUT /api/history/[id] called ===')
    try {
        const { id } = await params
        console.log('History ID:', id)
        const body = await request.json()
        console.log('Request body:', body)

        // 기존 이력 조회 (kioskId 필요)
        const existingHistory = await prisma.locationHistory.findUnique({
            where: { id }
        })

        // newBranchId가 있으면 해당 Branch의 corporationId 및 이름 조회
        let newCorporationId: string | null = null
        let branchName: string | null = body.newBranch || null
        if (body.newBranchId) {
            const branch = await prisma.branch.findUnique({
                where: { id: body.newBranchId },
                select: { corporationId: true, name: true }
            })
            newCorporationId = branch?.corporationId || null
            // 지점 ID로부터 지점명 가져오기 (명시적으로 전달받은 이름이 없으면)
            if (branch && !body.newBranch) {
                branchName = branch.name
            }
        }

        const updateData: Record<string, unknown> = {
            moveType: body.moveType,
            eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
            newBranch: branchName,
            newLocation: branchName,
            description: body.description,
            handledBy: body.handledBy
        }

        // 지점 ID가 변경된 경우 관련 필드도 업데이트
        if (body.newBranchId !== undefined) {
            updateData.newBranchId = body.newBranchId || null
            updateData.newCorporationId = newCorporationId
        }
        if (body.newRegionCode !== undefined) {
            updateData.newRegionCode = body.newRegionCode || null
        }
        if (body.newAreaCode !== undefined) {
            updateData.newAreaCode = body.newAreaCode || null
        }

        const history = await prisma.locationHistory.update({
            where: { id },
            data: updateData
        })

        // 키오스크 정보도 함께 업데이트 (지점이 변경된 경우)
        if (existingHistory?.kioskId && (body.newBranchId || branchName)) {
            const kioskUpdateData: Record<string, unknown> = {}
            if (branchName) kioskUpdateData.branchName = branchName
            if (body.newBranchId) kioskUpdateData.branchId = body.newBranchId
            if (body.newRegionCode) kioskUpdateData.regionCode = body.newRegionCode
            if (body.newAreaCode) kioskUpdateData.areaCode = body.newAreaCode

            if (Object.keys(kioskUpdateData).length > 0) {
                await prisma.kiosk.update({
                    where: { id: existingHistory.kioskId },
                    data: kioskUpdateData
                })
            }
        }

        return NextResponse.json(history)
    } catch (error) {
        console.error("Error updating history:", error)
        return NextResponse.json(
            { error: "Failed to update history" },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/history/[id]
 * 이력 삭제
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.locationHistory.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting history:", error)
        return NextResponse.json(
            { error: "Failed to delete history" },
            { status: 500 }
        )
    }
}
