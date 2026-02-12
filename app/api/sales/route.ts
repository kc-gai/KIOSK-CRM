import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const sales = await prisma.kioskSale.findMany({
            include: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        nameJa: true
                    }
                }
            },
            orderBy: { saleDate: 'desc' }
        })
        return NextResponse.json(sales)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const {
            partnerId,
            saleDate,
            saleType,
            quantity,
            unitPrice,
            notes
        } = json

        if (!partnerId || !saleDate || !saleType || !quantity) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const totalPrice = unitPrice ? unitPrice * quantity : null

        const sale = await prisma.kioskSale.create({
            data: {
                partnerId,
                saleDate: new Date(saleDate),
                saleType,
                quantity,
                unitPrice,
                totalPrice,
                notes
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
