import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const areas = await prisma.area.findMany({
            include: {
                region: true
            },
            orderBy: [
                { region: { sortOrder: 'asc' } },
                { sortOrder: 'asc' }
            ]
        })
        return NextResponse.json(areas)
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

        // 코드 중복 체크
        const existing = await prisma.area.findUnique({
            where: { code: json.code }
        })
        if (existing) {
            return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
        }

        const area = await prisma.area.create({
            data: {
                code: json.code,
                name: json.name,
                nameJa: json.nameJa || null,
                regionId: json.regionId,
                addressKeywords: json.addressKeywords,
                isActive: json.isActive ?? true,
                sortOrder: json.sortOrder ?? 0
            }
        })
        return NextResponse.json(area)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
