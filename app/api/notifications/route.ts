import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const channel = searchParams.get('channel')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: any = {}
        if (status) where.status = status
        if (channel) where.channel = channel

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// 알림 읽음 처리
export async function PUT(req: Request) {
    try {
        const json = await req.json()
        const { ids } = json

        if (!ids || !Array.isArray(ids)) {
            return new NextResponse("Invalid request", { status: 400 })
        }

        await prisma.notification.updateMany({
            where: { id: { in: ids } },
            data: { status: 'SENT', sentAt: new Date() }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
