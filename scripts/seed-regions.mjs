// seed-regions.mjs - ES Module
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 관할지역 데이터 (스크린샷 기준)
// 코드 형식: {Office}_{Region} 예: A_HK, B_TH
const regionsData = [
    // Sapporo Office(A) 관할
    { code: 'A_HK', name: '北海道 (Hokkaido)', prefectures: '北海道', office: 'A', sortOrder: 1 },

    // Tokyo Office(B) 관할
    { code: 'B_TH', name: '東北 (Tohoku)', prefectures: '青森県,岩手県,宮城県,秋田県,山形県,福島県', office: 'B', sortOrder: 2 },
    { code: 'B_KT', name: '関東 (Kanto)', prefectures: '東京都,神奈川県,埼玉県,千葉県,茨城県,栃木県,群馬県', office: 'B', sortOrder: 3 },
    { code: 'B_CB', name: '中部 (Chubu)', prefectures: '新潟県,富山県,石川県,福井県,山梨県,長野県,岐阜県,静岡県,愛知県', office: 'B', sortOrder: 4 },

    // Osaka Office(C) 관할
    { code: 'C_HR', name: '北陸信越 (Hokuriku-Shinetsu)', prefectures: '新潟県,富山県,石川県,福井県,長野県', office: 'C', sortOrder: 5 },
    { code: 'C_KK', name: '近畿 (Kinki)', prefectures: '三重県,滋賀県,京都府,大阪府,兵庫県,奈良県,和歌山県', office: 'C', sortOrder: 6 },
    { code: 'C_CG', name: '中国 (Chugoku)', prefectures: '鳥取県,島根県,岡山県,広島県,山口県', office: 'C', sortOrder: 7 },
    { code: 'C_SK', name: '四国 (Shikoku)', prefectures: '徳島県,香川県,愛媛県,高知県', office: 'C', sortOrder: 8 },

    // Fukuoka Office(D) 관할
    { code: 'D_KS', name: '九州 (Kyushu)', prefectures: '福岡県,佐賀県,長崎県,熊本県,大分県,宮崎県,鹿児島県', office: 'D', sortOrder: 9 },

    // Okinawa Office(E) 관할
    { code: 'E_OK', name: '沖縄 (Okinawa)', prefectures: '沖縄県', office: 'E', sortOrder: 10 },
]

// 관할사무실 데이터
const areasData = [
    { code: 'A', name: 'Sapporo Office', sortOrder: 1 },
    { code: 'B', name: 'Tokyo Office', sortOrder: 2 },
    { code: 'C', name: 'Osaka Office', sortOrder: 3 },
    { code: 'D', name: 'Fukuoka Office', sortOrder: 4 },
    { code: 'E', name: 'Okinawa Office', sortOrder: 5 },
]

async function main() {
    console.log('Seeding regions and areas...')

    // 기존 데이터 삭제
    await prisma.area.deleteMany()
    await prisma.region.deleteMany()
    console.log('Cleared existing data')

    // Region 생성 (먼저 생성해야 Area에서 참조 가능)
    const regionMap = new Map()
    for (const region of regionsData) {
        const created = await prisma.region.create({
            data: {
                code: region.code,
                name: region.name,
                prefectures: region.prefectures,
                sortOrder: region.sortOrder,
                isActive: true
            }
        })
        regionMap.set(region.code, created.id)
        console.log(`Created region: ${region.code} - ${region.name}`)
    }

    // Area 생성 (각 Office에 첫 번째 Region 연결)
    for (const area of areasData) {
        // 해당 Office에 속한 첫 번째 Region 찾기
        const firstRegionCode = regionsData.find(r => r.office === area.code)?.code
        const regionId = regionMap.get(firstRegionCode)

        if (!regionId) {
            console.error(`No region found for office ${area.code}`)
            continue
        }

        // 해당 Office 관할의 모든 도도부현 (addressKeywords용)
        const relatedRegions = regionsData.filter(r => r.office === area.code)
        const allPrefectures = relatedRegions.map(r => r.prefectures).join(',')

        await prisma.area.create({
            data: {
                code: area.code,
                name: area.name,
                regionId: regionId,
                addressKeywords: allPrefectures,
                sortOrder: area.sortOrder,
                isActive: true
            }
        })
        console.log(`Created area: ${area.code} - ${area.name} (keywords: ${allPrefectures.substring(0, 50)}...)`)
    }

    console.log('Seeding completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
