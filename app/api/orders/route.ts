import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 임시: 인증 비활성화 (개발용)

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                client: true,
                items: {
                    include: { kiosk: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(orders)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

        const order = await prisma.order.create({
            data: {
                orderNumber,
                clientId: json.clientId,
                status: 'REQUESTED'
            }
        })
        return NextResponse.json(order)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const json = await req.json()
        const { id, status, trackingNo, logistics } = json

        const order = await prisma.order.update({
            where: { id },
            data: {
                status,
                trackingNo,
                logistics,
                shippedDate: status === 'SHIPPED' ? new Date() : undefined
            }
        })
        return NextResponse.json(order)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
