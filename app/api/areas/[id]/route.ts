import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const area = await prisma.area.findUnique({
            where: { id },
            include: {
                region: true
            }
        })
        if (!area) {
            return new NextResponse("Not Found", { status: 404 })
        }
        return NextResponse.json(area)
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
        const area = await prisma.area.update({
            where: { id },
            data: {
                code: json.code,
                name: json.name,
                regionId: json.regionId,
                addressKeywords: json.addressKeywords,
                isActive: json.isActive,
                sortOrder: json.sortOrder
            }
        })
        return NextResponse.json(area)
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
        await prisma.area.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
