import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 주소에서 도도부현 추출
function extractPrefecture(address: string): string | null {
    // 일본 47개 도도부현 목록
    const prefectures = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ]

    for (const pref of prefectures) {
        if (address.includes(pref)) {
            return pref
        }
    }
    return null
}

// 주소에서 시구정촌 추출
function extractCity(address: string, prefecture: string): string | null {
    // 도도부현 이후 부분 추출
    const afterPref = address.split(prefecture)[1]
    if (!afterPref) return null

    // 시, 구, 정, 촌 패턴 매칭
    const cityMatch = afterPref.match(/^([^市区町村]+(?:市|区|町|村))/u)
    return cityMatch ? cityMatch[1] : null
}

export async function POST(req: Request) {
    try {
        const { address } = await req.json()

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 })
        }

        const prefecture = extractPrefecture(address)
        const city = prefecture ? extractCity(address, prefecture) : null

        // 1. Area의 addressKeywords로 매칭 시도
        const areas = await prisma.area.findMany({
            where: { isActive: true },
            include: { region: true }
        })

        let matchedArea = null
        let matchedRegion = null

        // addressKeywords에서 직접 매칭
        for (const area of areas) {
            if (area.addressKeywords) {
                const keywords = area.addressKeywords.split(',').map(k => k.trim())
                for (const keyword of keywords) {
                    if (address.includes(keyword)) {
                        matchedArea = area
                        matchedRegion = area.region
                        break
                    }
                }
            }
            if (matchedArea) break
        }

        // 2. 도도부현으로 Region 매칭
        if (!matchedRegion && prefecture) {
            const regions = await prisma.region.findMany({
                where: { isActive: true },
                include: { areas: true }
            })

            for (const region of regions) {
                const prefList = region.prefectures.split(',').map(p => p.trim())
                if (prefList.includes(prefecture)) {
                    matchedRegion = region
                    // 해당 Region의 첫 번째 Area를 기본값으로
                    if (region.areas.length > 0) {
                        matchedArea = region.areas[0]
                    }
                    break
                }
            }
        }

        return NextResponse.json({
            prefecture,
            city,
            regionCode: matchedRegion?.code || null,
            regionName: matchedRegion?.name || null,
            areaCode: matchedArea?.code || null,
            areaName: matchedArea?.name || null
        })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
