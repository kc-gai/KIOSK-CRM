import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const regions = await prisma.region.findMany({
            include: {
                areas: {
                    orderBy: { sortOrder: 'asc' }
                }
            },
            orderBy: { sortOrder: 'asc' }
        })
        return NextResponse.json(regions)
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
        const existing = await prisma.region.findUnique({
            where: { code: json.code }
        })
        if (existing) {
            return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
        }

        const region = await prisma.region.create({
            data: {
                code: json.code,
                name: json.name,
                nameJa: json.nameJa || null,
                prefectures: json.prefectures,
                isActive: json.isActive ?? true,
                sortOrder: json.sortOrder ?? 0
            }
        })
        return NextResponse.json(region)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
