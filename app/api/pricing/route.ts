import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: 가격 정보 목록 조회
export async function GET() {
    try {
        const pricings = await prisma.kioskPricing.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        // 마진 계산 후 반환
        const result = pricings.map(p => ({
            id: p.id,
            kioskId: p.kioskId,
            serialNumber: p.serialNumber,
            costPrice: p.costPrice,
            salePrice: p.salePrice,
            margin: (p.salePrice || 0) - (p.costPrice || 0),
            marginRate: p.costPrice && p.costPrice > 0
                ? (((p.salePrice || 0) - p.costPrice) / p.costPrice * 100)
                : 0,
            purchaseDate: p.purchaseDate,
            saleDate: p.saleDate,
            supplierId: p.supplierId,
            supplierName: p.supplierName || null,
            clientId: p.clientId,
            clientName: p.clientName || null,
            saleType: p.saleType,
            leaseMonthlyFee: p.leaseMonthlyFee,
            leasePeriodMonths: p.leasePeriodMonths,
            notes: p.notes,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }))

        return NextResponse.json(result)
    } catch (error) {
        console.error('Failed to fetch pricing:', error)
        return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
    }
}

// POST: 가격 정보 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            kioskId,
            serialNumber,
            costPrice,
            purchaseDate,
            supplierId,
            salePrice,
            saleDate,
            clientId,
            saleType,
            leaseMonthlyFee,
            leasePeriodMonths,
            notes
        } = body

        // 필수 필드 검증
        if (!kioskId || !serialNumber) {
            return NextResponse.json(
                { error: 'kioskId and serialNumber are required' },
                { status: 400 }
            )
        }

        // supplierName과 clientName 조회
        let supplierName = null
        let clientName = null

        if (supplierId) {
            const supplier = await prisma.partner.findUnique({
                where: { id: supplierId },
                select: { name: true }
            })
            supplierName = supplier?.name || null
        }

        if (clientId) {
            const client = await prisma.partner.findUnique({
                where: { id: clientId },
                select: { name: true }
            })
            clientName = client?.name || null
        }

        const pricing = await prisma.kioskPricing.create({
            data: {
                kioskId,
                serialNumber,
                costPrice: costPrice ? parseInt(costPrice) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                supplierId: supplierId || null,
                supplierName,
                salePrice: salePrice ? parseInt(salePrice) : null,
                saleDate: saleDate ? new Date(saleDate) : null,
                clientId: clientId || null,
                clientName,
                saleType: saleType || null,
                leaseMonthlyFee: leaseMonthlyFee ? parseInt(leaseMonthlyFee) : null,
                leasePeriodMonths: leasePeriodMonths ? parseInt(leasePeriodMonths) : null,
                notes: notes || null
            }
        })

        return NextResponse.json(pricing, { status: 201 })
    } catch (error) {
        console.error('Failed to create pricing:', error)
        return NextResponse.json({ error: 'Failed to create pricing' }, { status: 500 })
    }
}
