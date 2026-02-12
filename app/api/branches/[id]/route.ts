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

async function matchRegionArea(address: string) {
    const prefecture = extractPrefecture(address)
    if (!prefecture) return { regionCode: null, areaCode: null }

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

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const branch = await prisma.branch.findUnique({
            where: { id },
            include: {
                corporation: {
                    include: { fc: true }
                },
                kiosks: true
            }
        })
        if (!branch) {
            return new NextResponse("Not Found", { status: 404 })
        }
        return NextResponse.json(branch)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await req.json()

        // 주소 변경시 자동 매핑
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

        const updateData: Record<string, unknown> = {
            name: json.name,
            nameJa: json.nameJa,
            address: json.address,
            postalCode: json.postalCode,
            prefecture,
            city,
            regionCode,
            areaCode,
            managerName: json.managerName,
            managerPhone: json.managerPhone
        }

        // code가 명시적으로 전달된 경우 업데이트 (null도 허용)
        if ('code' in json) {
            updateData.code = json.code || null
        }

        // corporationId가 있으면 관계로 연결
        if (json.corporationId) {
            updateData.corporation = { connect: { id: json.corporationId } }
        }

        // isActive가 명시적으로 전달된 경우만 업데이트
        if (typeof json.isActive === 'boolean') {
            updateData.isActive = json.isActive
        }

        const branch = await prisma.branch.update({
            where: { id },
            data: updateData
        })

        // 지점명 변경 시 해당 지점에 연결된 모든 키오스크의 branchName도 업데이트
        if (json.name) {
            await prisma.kiosk.updateMany({
                where: { branchId: id },
                data: { branchName: json.name }
            })
        }

        return NextResponse.json(branch)
    } catch (error: unknown) {
        console.error(error)
        // Prisma 중복 키 에러 처리 (같은 법인 내에서 코드 중복)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({ error: '해당 법인 내에서 이미 사용 중인 코드입니다.' }, { status: 400 })
        }
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.branch.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
