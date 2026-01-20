import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 임시: 인증 비활성화 (개발용)

export async function GET() {
    try {
        const manuals = await prisma.manual.findMany({
            orderBy: { updatedAt: 'desc' }
        })
        return NextResponse.json(manuals)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const { title, content, version } = json

        const manual = await prisma.manual.create({
            data: {
                title,
                content,
                version,
                isPublished: true
            }
        })
        return NextResponse.json(manual)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
