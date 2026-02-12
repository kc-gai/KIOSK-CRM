import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const corporation = await prisma.corporation.findUnique({
            where: { id },
            include: {
                fc: true,
                branches: {
                    include: {
                        kiosks: true
                    }
                }
            }
        })
        if (!corporation) {
            return new NextResponse("Not Found", { status: 404 })
        }
        return NextResponse.json(corporation)
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

        // code 중복 체크 (다른 법인이 같은 code를 사용하고 있는지)
        if (json.code) {
            const existing = await prisma.corporation.findFirst({
                where: {
                    code: json.code,
                    id: { not: id }
                }
            })
            if (existing) {
                return NextResponse.json(
                    { error: '이미 사용 중인 법인코드입니다' },
                    { status: 400 }
                )
            }
        }

        // 부분 업데이트 지원: 전달된 필드만 업데이트
        const updateData: Record<string, unknown> = {}
        if (json.code !== undefined) updateData.code = json.code
        if (json.name !== undefined) updateData.name = json.name
        if (json.nameJa !== undefined) updateData.nameJa = json.nameJa
        if ('fcId' in json) updateData.fcId = json.fcId || null
        if (json.contact !== undefined) updateData.contact = json.contact
        if (json.postalCode !== undefined) updateData.postalCode = json.postalCode || null
        if (json.address !== undefined) updateData.address = json.address
        if (json.contractDate !== undefined) updateData.contractDate = json.contractDate ? new Date(json.contractDate) : null
        if (json.erpFeeRate !== undefined) updateData.erpFeeRate = json.erpFeeRate ? parseFloat(json.erpFeeRate) : null
        if (json.erpFeeNotes !== undefined) updateData.erpFeeNotes = json.erpFeeNotes || null
        if (json.kioskMaintenanceCost !== undefined) updateData.kioskMaintenanceCost = json.kioskMaintenanceCost ? parseFloat(json.kioskMaintenanceCost) : null
        if (json.kioskSaleCost !== undefined) updateData.kioskSaleCost = json.kioskSaleCost ? parseFloat(json.kioskSaleCost) : null
        if (json.kioskSaleNotes !== undefined) updateData.kioskSaleNotes = json.kioskSaleNotes || null
        if (typeof json.isActive === 'boolean') updateData.isActive = json.isActive

        const corporation = await prisma.corporation.update({
            where: { id },
            data: updateData
        })
        return NextResponse.json(corporation)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 연결된 지점 확인
        const branchCount = await prisma.branch.count({
            where: { corporationId: id }
        })

        if (branchCount > 0) {
            return NextResponse.json(
                { error: `이 법인에 연결된 지점이 ${branchCount}개 있습니다. 지점을 먼저 삭제해주세요.` },
                { status: 400 }
            )
        }

        // 이력에서 이 법인을 참조하는 항목 확인
        const historyCount = await prisma.locationHistory.count({
            where: {
                OR: [
                    { prevCorporationId: id },
                    { newCorporationId: id }
                ]
            }
        })

        if (historyCount > 0) {
            // 이력이 있으면 참조를 null로 변경
            await prisma.locationHistory.updateMany({
                where: { prevCorporationId: id },
                data: { prevCorporationId: null }
            })
            await prisma.locationHistory.updateMany({
                where: { newCorporationId: id },
                data: { newCorporationId: null }
            })
        }

        await prisma.corporation.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "삭제에 실패했습니다. 연결된 데이터를 확인해주세요." },
            { status: 500 }
        )
    }
}
