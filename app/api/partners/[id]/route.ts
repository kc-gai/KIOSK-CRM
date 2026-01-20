import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const partner = await prisma.partner.findUnique({
            where: { id },
            include: {
                currentKiosks: {
                    select: {
                        id: true,
                        serialNumber: true,
                        kioskNumber: true,
                        branchName: true,
                        status: true
                    }
                },
                _count: {
                    select: { currentKiosks: true }
                }
            }
        })

        if (!partner) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(partner)
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

        const existing = await prisma.partner.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const partner = await prisma.partner.update({
            where: { id },
            data: {
                name: json.name,
                nameJa: json.nameJa !== undefined ? json.nameJa : existing.nameJa,
                type: json.type,
                contact: json.contact !== undefined ? json.contact : existing.contact,
                address: json.address !== undefined ? json.address : existing.address,
                // 사업 정보
                storeCount: json.storeCount !== undefined
                    ? (json.storeCount ? parseInt(json.storeCount) : null)
                    : existing.storeCount,
                vehicleCount: json.vehicleCount !== undefined
                    ? (json.vehicleCount ? parseInt(json.vehicleCount) : null)
                    : existing.vehicleCount,
                // 계약 정보
                contractDate: json.contractDate !== undefined
                    ? (json.contractDate ? new Date(json.contractDate) : null)
                    : existing.contractDate,
                contractStartDate: json.contractStartDate !== undefined
                    ? (json.contractStartDate ? new Date(json.contractStartDate) : null)
                    : existing.contractStartDate,
                commissionTerms: json.commissionTerms !== undefined ? json.commissionTerms : existing.commissionTerms,
                saleTerms: json.saleTerms !== undefined ? json.saleTerms : existing.saleTerms,
                maintenanceTerms: json.maintenanceTerms !== undefined ? json.maintenanceTerms : existing.maintenanceTerms,
                feeChangeTerms: json.feeChangeTerms !== undefined ? json.feeChangeTerms : existing.feeChangeTerms,
                erpReflected: json.erpReflected !== undefined ? json.erpReflected : existing.erpReflected,
                // 수수료 정보
                pmsRate: json.pmsRate !== undefined
                    ? (json.pmsRate ? parseFloat(json.pmsRate) : null)
                    : existing.pmsRate,
                otaRate: json.otaRate !== undefined
                    ? (json.otaRate ? parseFloat(json.otaRate) : null)
                    : existing.otaRate,
                // 키오스크 판매 조건
                kioskSaleType: json.kioskSaleType !== undefined ? json.kioskSaleType : existing.kioskSaleType,
                kioskSalePrice: json.kioskSalePrice !== undefined
                    ? (json.kioskSalePrice ? parseInt(json.kioskSalePrice) : null)
                    : existing.kioskSalePrice,
                kioskFreeCondition: json.kioskFreeCondition !== undefined ? json.kioskFreeCondition : existing.kioskFreeCondition
            }
        })

        return NextResponse.json(partner)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const existing = await prisma.partner.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { currentKiosks: true }
                }
            }
        })
        if (!existing) {
            return NextResponse.json({ error: '거래처를 찾을 수 없습니다' }, { status: 404 })
        }

        // 연결된 키오스크 체크
        if (existing._count.currentKiosks > 0) {
            return NextResponse.json({
                error: `연결된 키오스크가 ${existing._count.currentKiosks}대 있어 삭제할 수 없습니다`
            }, { status: 400 })
        }

        // 연결된 주문 체크
        const ordersAsClient = await prisma.order.findFirst({ where: { clientId: id } })
        const ordersAsSupplier = await prisma.order.findFirst({ where: { supplierId: id } })

        if (ordersAsClient || ordersAsSupplier) {
            return NextResponse.json({
                error: '연결된 주문이 있어 삭제할 수 없습니다'
            }, { status: 400 })
        }

        await prisma.partner.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Partner delete error:', error)
        return NextResponse.json({ error: '삭제 중 오류가 발생했습니다' }, { status: 500 })
    }
}
