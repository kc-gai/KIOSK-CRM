import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 이력 생성 없이 deliveryDate만 업데이트하는 API
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await req.json()

        const existing = await prisma.kiosk.findUnique({
            where: { id }
        })

        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // deliveryDate만 업데이트 (이력 생성 없음)
        const parseDate = (value: string | null | undefined) => {
            if (!value) return null
            const date = new Date(value)
            return isNaN(date.getTime()) ? null : date
        }

        const kiosk = await prisma.kiosk.update({
            where: { id },
            data: {
                deliveryDate: parseDate(json.deliveryDate)
            }
        })

        return NextResponse.json(kiosk)
    } catch (error) {
        console.error('PATCH /api/assets/[id]/delivery-date error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Error' },
            { status: 500 }
        )
    }
}
