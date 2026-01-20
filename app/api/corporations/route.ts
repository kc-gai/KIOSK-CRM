import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const fcId = searchParams.get('fcId')
        const independent = searchParams.get('independent')  // 독립법인만 조회

        let whereClause = {}
        if (independent === 'true') {
            // FC에 속하지 않은 독립 법인만 조회
            whereClause = { fcId: null }
        } else if (fcId) {
            whereClause = { fcId }
        }

        const corporations = await prisma.corporation.findMany({
            where: whereClause,
            include: {
                fc: true,  // FC 전체 정보 포함 (계약 정보 필드 추가 후 자동 반영)
                branches: {
                    include: {
                        _count: {
                            select: { kiosks: true }
                        }
                    },
                    orderBy: { name: 'asc' }
                },
                _count: {
                    select: { branches: true }
                }
            },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(corporations)
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
        const existing = await prisma.corporation.findUnique({
            where: { code: json.code }
        })
        if (existing) {
            return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
        }

        const corporation = await prisma.corporation.create({
            data: {
                code: json.code,
                name: json.name,
                nameJa: json.nameJa,
                fcId: json.fcId || null,
                contact: json.contact,
                address: json.address,
                contractDate: json.contractDate ? new Date(json.contractDate) : null,
                erpFeeRate: json.erpFeeRate ? parseFloat(json.erpFeeRate) : null,
                erpFeeNotes: json.erpFeeNotes || null,
                kioskMaintenanceCost: json.kioskMaintenanceCost ? parseFloat(json.kioskMaintenanceCost) : null,
                kioskSaleCost: json.kioskSaleCost ? parseFloat(json.kioskSaleCost) : null,
                kioskSaleNotes: json.kioskSaleNotes || null,
                isActive: json.isActive ?? true
            }
        })
        return NextResponse.json(corporation)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
