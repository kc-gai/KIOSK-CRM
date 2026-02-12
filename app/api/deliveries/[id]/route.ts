import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const delivery = await prisma.delivery.findUnique({
            where: { id }
        })

        if (!delivery) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(delivery)
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

        const existing = await prisma.delivery.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const delivery = await prisma.delivery.update({
            where: { id },
            data: {
                deliveryDate: json.deliveryDate ? new Date(json.deliveryDate) : existing.deliveryDate,
                invoiceNumber: json.invoiceNumber ?? existing.invoiceNumber,
                serialNumber: json.serialNumber ?? existing.serialNumber,
                anydeskId: json.anydeskId ?? existing.anydeskId,
                modelName: json.modelName ?? existing.modelName,
                destination: json.destination ?? existing.destination,
                recipientName: json.recipientName ?? existing.recipientName,
                recipientPhone: json.recipientPhone ?? existing.recipientPhone,
                status: json.status ?? existing.status,
                supplierName: json.supplierName ?? existing.supplierName,
                supplierContact: json.supplierContact ?? existing.supplierContact,
                notes: json.notes ?? existing.notes
            }
        })

        // 상태 변경 시 알림
        if (json.status && json.status !== existing.status) {
            const statusLabels: Record<string, string> = {
                'SHIPPED': '발송',
                'DELIVERED': '납품완료',
                'CONFIRMED': '확인완료'
            }

            await prisma.notification.create({
                data: {
                    type: 'DELIVERY',
                    targetId: delivery.id,
                    channel: 'DASHBOARD',
                    message: `납품 상태 변경: ${delivery.serialNumber} → ${statusLabels[json.status] || json.status}`,
                    status: 'PENDING'
                }
            })
        }

        return NextResponse.json(delivery)
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

        const existing = await prisma.delivery.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // 관련 알림도 삭제
        await prisma.notification.deleteMany({
            where: { targetId: id, type: 'DELIVERY' }
        })

        await prisma.delivery.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
