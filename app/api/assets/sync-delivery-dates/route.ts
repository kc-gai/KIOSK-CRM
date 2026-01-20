import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 기존 데이터의 deliveryDate를 최종 이동이력 날짜로 동기화
export async function POST() {
    try {
        // 모든 키오스크의 최종 이동이력 조회
        const kiosks = await prisma.kiosk.findMany({
            select: { id: true },
        })

        let updatedCount = 0

        for (const kiosk of kiosks) {
            // 해당 키오스크의 최신 이력 조회
            const latestHistory = await prisma.locationHistory.findFirst({
                where: { kioskId: kiosk.id },
                orderBy: { eventDate: 'desc' },
                select: { eventDate: true }
            })

            if (latestHistory) {
                await prisma.kiosk.update({
                    where: { id: kiosk.id },
                    data: { deliveryDate: latestHistory.eventDate }
                })
                updatedCount++
            }
        }

        return NextResponse.json({
            success: true,
            message: `${updatedCount}개의 키오스크 납품일이 업데이트되었습니다.`
        })
    } catch (error) {
        console.error('Sync delivery dates error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Error' },
            { status: 500 }
        )
    }
}
