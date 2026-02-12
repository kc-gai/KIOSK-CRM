import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 가격 정보 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const pricing = await prisma.kioskPricing.findUnique({
            where: { id }
        })

        if (!pricing) {
            return NextResponse.json({ error: 'Pricing not found' }, { status: 404 })
        }

        // 마진 계산
        const result = {
            ...pricing,
            margin: (pricing.salePrice || 0) - (pricing.costPrice || 0),
            marginRate: pricing.costPrice && pricing.costPrice > 0
                ? (((pricing.salePrice || 0) - pricing.costPrice) / pricing.costPrice * 100)
                : 0
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Failed to fetch pricing:', error)
        return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
    }
}

// PUT: 가격 정보 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            costPrice,
            purchaseDate,
            supplierId,
            supplierName,
            salePrice,
            saleDate,
            clientId,
            clientName,
            saleType,
            leaseMonthlyFee,
            leasePeriod,
            costNotes,
            saleNotes
        } = body

        const updateData: Record<string, unknown> = {}

        if (costPrice !== undefined) updateData.costPrice = costPrice ? parseInt(costPrice) : null
        if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null
        if (supplierId !== undefined) updateData.supplierId = supplierId || null
        if (supplierName !== undefined) updateData.supplierName = supplierName || null
        if (salePrice !== undefined) updateData.salePrice = salePrice ? parseInt(salePrice) : null
        if (saleDate !== undefined) updateData.saleDate = saleDate ? new Date(saleDate) : null
        if (clientId !== undefined) updateData.clientId = clientId || null
        if (clientName !== undefined) updateData.clientName = clientName || null
        if (saleType !== undefined) updateData.saleType = saleType
        if (leaseMonthlyFee !== undefined) updateData.leaseMonthlyFee = leaseMonthlyFee ? parseInt(leaseMonthlyFee) : null
        if (leasePeriod !== undefined) updateData.leasePeriod = leasePeriod ? parseInt(leasePeriod) : null
        if (costNotes !== undefined) updateData.costNotes = costNotes || null
        if (saleNotes !== undefined) updateData.saleNotes = saleNotes || null

        const pricing = await prisma.kioskPricing.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(pricing)
    } catch (error) {
        console.error('Failed to update pricing:', error)
        return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
    }
}

// DELETE: 가격 정보 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.kioskPricing.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete pricing:', error)
        return NextResponse.json({ error: 'Failed to delete pricing' }, { status: 500 })
    }
}
