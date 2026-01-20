import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 임시: 인증 비활성화 (개발용)

export async function GET() {
    try {
        const history = await prisma.locationHistory.findMany({
            include: {
                kiosk: true
            },
            orderBy: { eventDate: 'desc' }
        })
        return NextResponse.json(history)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
