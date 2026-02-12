import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDeliveryDates() {
    console.log('납품일 업데이트 시작...')

    // 모든 키오스크의 최신 이동이력 날짜로 납품일 업데이트
    const kiosks = await prisma.kiosk.findMany({
        select: {
            id: true,
            serialNumber: true,
            deliveryDate: true,
        }
    })

    console.log(`총 ${kiosks.length}개의 키오스크 처리 중...`)

    let updatedCount = 0
    let skippedCount = 0

    for (const kiosk of kiosks) {
        // 해당 키오스크의 가장 최근 이동이력 조회
        const latestHistory = await prisma.locationHistory.findFirst({
            where: { kioskId: kiosk.id },
            orderBy: { eventDate: 'desc' },
            select: { eventDate: true }
        })

        if (latestHistory) {
            // 이동이력의 최신 날짜로 납품일 업데이트
            await prisma.kiosk.update({
                where: { id: kiosk.id },
                data: { deliveryDate: latestHistory.eventDate }
            })
            updatedCount++

            if (updatedCount % 50 === 0) {
                console.log(`${updatedCount}개 업데이트 완료...`)
            }
        } else {
            skippedCount++
        }
    }

    console.log(`\n완료!`)
    console.log(`- 업데이트됨: ${updatedCount}개`)
    console.log(`- 이동이력 없음(스킵): ${skippedCount}개`)
}

updateDeliveryDates()
    .catch((e) => {
        console.error('오류 발생:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
