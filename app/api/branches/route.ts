import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 주소에서 도도부현 추출
function extractPrefecture(address: string): string | null {
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
        if (address.includes(pref)) return pref
    }
    return null
}

function extractCity(address: string, prefecture: string): string | null {
    const afterPref = address.split(prefecture)[1]
    if (!afterPref) return null
    const cityMatch = afterPref.match(/^([^市区町村]+(?:市|区|町|村))/u)
    return cityMatch ? cityMatch[1] : null
}

// 주소 기반 Region/Area 매칭
async function matchRegionArea(address: string) {
    const prefecture = extractPrefecture(address)
    if (!prefecture) return { regionCode: null, areaCode: null }

    // Area의 addressKeywords로 먼저 매칭
    const areas = await prisma.area.findMany({
        where: { isActive: true },
        include: { region: true }
    })

    for (const area of areas) {
        if (area.addressKeywords) {
            const keywords = area.addressKeywords.split(',').map(k => k.trim())
            for (const keyword of keywords) {
                if (address.includes(keyword)) {
                    return { regionCode: area.region.code, areaCode: area.code }
                }
            }
        }
    }

    // Region의 prefectures로 매칭
    const regions = await prisma.region.findMany({
        where: { isActive: true },
        include: { areas: { where: { isActive: true } } }
    })

    for (const region of regions) {
        const prefList = region.prefectures.split(',').map(p => p.trim())
        if (prefList.includes(prefecture)) {
            return {
                regionCode: region.code,
                areaCode: region.areas[0]?.code || null
            }
        }
    }

    return { regionCode: null, areaCode: null }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const corporationId = searchParams.get('corporationId')

        const branches = await prisma.branch.findMany({
            where: corporationId ? { corporationId } : undefined,
            include: {
                corporation: {
                    include: { fc: true }
                },
                kiosks: {
                    select: {
                        id: true,
                        acquisition: true
                    }
                },
                _count: {
                    select: { kiosks: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        // 취득유형별 카운트 추가
        const branchesWithAcquisitionCount = branches.map(branch => {
            const leaseCount = branch.kiosks.filter(k => k.acquisition === 'LEASE').length
            const purchaseCount = branch.kiosks.filter(k => k.acquisition === 'PURCHASE').length
            return {
                ...branch,
                _acquisitionCount: {
                    lease: leaseCount,
                    purchase: purchaseCount
                }
            }
        })

        return NextResponse.json(branchesWithAcquisitionCount)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()

        // 코드 필수 체크
        if (!json.code) {
            return NextResponse.json({ error: '코드는 필수입니다' }, { status: 400 })
        }

        // 법인ID 필수 체크
        if (!json.corporationId) {
            return NextResponse.json({ error: '법인을 선택해주세요' }, { status: 400 })
        }

        // 같은 법인 내 코드 중복 체크 (복합 unique: corporationId + code)
        const existing = await prisma.branch.findUnique({
            where: {
                corporationId_code: {
                    corporationId: json.corporationId,
                    code: json.code
                }
            }
        })
        if (existing) {
            return NextResponse.json({ error: `이 법인 내에 코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
        }

        // 주소에서 자동 매핑
        let regionCode = json.regionCode
        let areaCode = json.areaCode
        let prefecture = json.prefecture
        let city = json.city

        if (json.address && (!regionCode || !areaCode)) {
            const matched = await matchRegionArea(json.address)
            regionCode = regionCode || matched.regionCode
            areaCode = areaCode || matched.areaCode
            prefecture = prefecture || extractPrefecture(json.address)
            if (prefecture) {
                city = city || extractCity(json.address, prefecture)
            }
        }

        const branch = await prisma.branch.create({
            data: {
                code: json.code,
                name: json.name,
                nameJa: json.nameJa,
                corporationId: json.corporationId,
                address: json.address,
                postalCode: json.postalCode,
                prefecture,
                city,
                regionCode,
                areaCode,
                managerName: json.managerName,
                managerPhone: json.managerPhone,
                isActive: json.isActive ?? true
            }
        })
        return NextResponse.json(branch)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
