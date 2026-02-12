import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const sale = await prisma.kioskSale.findUnique({
            where: { id },
            include: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        nameJa: true
                    }
                }
            }
        })

        if (!sale) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(sale)
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

        const existing = await prisma.kioskSale.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const totalPrice = json.unitPrice && json.quantity
            ? json.unitPrice * json.quantity
            : json.unitPrice && existing.quantity
                ? json.unitPrice * existing.quantity
                : existing.totalPrice

        const sale = await prisma.kioskSale.update({
            where: { id },
            data: {
                partnerId: json.partnerId ?? existing.partnerId,
                saleDate: json.saleDate ? new Date(json.saleDate) : existing.saleDate,
                saleType: json.saleType ?? existing.saleType,
                quantity: json.quantity ?? existing.quantity,
                unitPrice: json.unitPrice ?? existing.unitPrice,
                totalPrice,
                notes: json.notes ?? existing.notes
            },
            include: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        nameJa: true
                    }
                }
            }
        })

        return NextResponse.json(sale)
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

        const existing = await prisma.kioskSale.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        await prisma.kioskSale.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
