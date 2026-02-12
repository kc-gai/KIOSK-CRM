import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const partners = await prisma.partner.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { currentKiosks: true }
                }
            }
        })
        return NextResponse.json(partners)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()

        // 코드 중복 체크 (코드가 있는 경우에만)
        if (json.code) {
            const existing = await prisma.partner.findUnique({
                where: { code: json.code }
            })
            if (existing) {
                return NextResponse.json({ error: `코드 '${json.code}'가 이미 존재합니다` }, { status: 400 })
            }
        }

        const partner = await prisma.partner.create({
            data: {
                code: json.code || null,
                name: json.name,
                nameJa: json.nameJa || null,
                type: json.type,
                contact: json.contact || null,
                address: json.address || null,
                // 사업 정보
                storeCount: json.storeCount ? parseInt(json.storeCount) : null,
                vehicleCount: json.vehicleCount ? parseInt(json.vehicleCount) : null,
                // 계약 정보
                contractDate: json.contractDate ? new Date(json.contractDate) : null,
                contractStartDate: json.contractStartDate ? new Date(json.contractStartDate) : null,
                commissionTerms: json.commissionTerms || null,
                saleTerms: json.saleTerms || null,
                maintenanceTerms: json.maintenanceTerms || null,
                feeChangeTerms: json.feeChangeTerms || null,
                erpReflected: json.erpReflected || false,
                // 수수료 정보
                pmsRate: json.pmsRate ? parseFloat(json.pmsRate) : null,
                otaRate: json.otaRate ? parseFloat(json.otaRate) : null,
                // 키오스크 판매 조건
                kioskSaleType: json.kioskSaleType || null,
                kioskSalePrice: json.kioskSalePrice ? parseInt(json.kioskSalePrice) : null,
                kioskFreeCondition: json.kioskFreeCondition || null
            }
        })
        return NextResponse.json(partner)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
