import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const region = await prisma.region.findUnique({
            where: { id },
            include: {
                areas: {
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })
        if (!region) {
            return new NextResponse("Not Found", { status: 404 })
        }
        return NextResponse.json(region)
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
        const region = await prisma.region.update({
            where: { id },
            data: {
                code: json.code,
                name: json.name,
                prefectures: json.prefectures,
                isActive: json.isActive,
                sortOrder: json.sortOrder
            }
        })
        return NextResponse.json(region)
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
        // 먼저 해당 Region의 Areas를 삭제
        await prisma.area.deleteMany({
            where: { regionId: id }
        })
        // 그 다음 Region 삭제
        await prisma.region.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
