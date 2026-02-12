import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 임시: 인증 비활성화 (개발용)

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const manual = await prisma.manual.findUnique({
            where: { id }
        })

        if (!manual) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(manual)
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

        const existing = await prisma.manual.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const manual = await prisma.manual.update({
            where: { id },
            data: {
                title: json.title,
                content: json.content,
                version: json.version,
                isPublished: json.isPublished ?? existing.isPublished
            }
        })

        return NextResponse.json(manual)
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

        const existing = await prisma.manual.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        await prisma.manual.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
