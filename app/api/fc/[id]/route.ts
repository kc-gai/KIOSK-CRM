import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const fc = await prisma.fC.findUnique({
            where: { id },
            include: {
                corporations: {
                    include: {
                        branches: {
                            include: {
                                kiosks: true
                            }
                        }
                    }
                }
            }
        })
        if (!fc) {
            return new NextResponse("Not Found", { status: 404 })
        }
        return NextResponse.json(fc)
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

        // 코드만 업데이트하는 경우 (인라인 편집)
        if (json.code !== undefined && Object.keys(json).length === 1) {
            // 코드 중복 체크
            if (json.code) {
                const existing = await prisma.fC.findFirst({
                    where: {
                        code: json.code,
                        id: { not: id }
                    }
                })
                if (existing) {
                    return NextResponse.json(
                        { error: "이미 사용 중인 코드입니다" },
                        { status: 400 }
                    )
                }
            }
            const fc = await prisma.fC.update({
                where: { id },
                data: { code: json.code }
            })
            return NextResponse.json(fc)
        }

        // 부분 업데이트 지원: 전달된 필드만 업데이트
        const updateData: Record<string, unknown> = {}
        if (json.name !== undefined) updateData.name = json.name
        if (json.nameJa !== undefined) updateData.nameJa = json.nameJa
        if (json.fcType !== undefined) updateData.fcType = json.fcType
        if (json.contact !== undefined) updateData.contact = json.contact
        if (json.address !== undefined) updateData.address = json.address
        if (json.contractDate !== undefined) updateData.contractDate = json.contractDate ? new Date(json.contractDate) : null
        if (json.commissionRate !== undefined) updateData.commissionRate = json.commissionRate
        if (json.memo !== undefined) updateData.memo = json.memo
        if (typeof json.isActive === 'boolean') updateData.isActive = json.isActive

        const fc = await prisma.fC.update({
            where: { id },
            data: updateData
        })
        return NextResponse.json(fc)
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
        await prisma.fC.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
