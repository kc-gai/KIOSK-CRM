import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const deliveries = await prisma.delivery.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(deliveries)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const {
            deliveryDate,
            invoiceNumber,
            serialNumber,
            anydeskId,
            modelName,
            destination,
            recipientName,
            recipientPhone,
            supplierName,
            supplierContact,
            notes
        } = json

        if (!serialNumber) {
            return new NextResponse("Serial number is required", { status: 400 })
        }

        const delivery = await prisma.delivery.create({
            data: {
                deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
                invoiceNumber,
                serialNumber,
                anydeskId,
                modelName,
                destination,
                recipientName,
                recipientPhone,
                supplierName,
                supplierContact,
                notes,
                status: 'SHIPPED'
            }
        })

        // 알림 생성
        await prisma.notification.create({
            data: {
                type: 'DELIVERY',
                targetId: delivery.id,
                channel: 'DASHBOARD',
                message: `새로운 납품이 등록되었습니다: ${serialNumber} (${destination || '미지정'})`,
                status: 'PENDING'
            }
        })

        // Slack 웹훅이 설정되어 있으면 Slack으로도 알림
        const slackWebhook = process.env.SLACK_WEBHOOK_URL
        if (slackWebhook) {
            try {
                await fetch(slackWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `🚚 *새로운 납품 등록*\n• 시리얼: ${serialNumber}\n• AnyDesk: ${anydeskId || '-'}\n• 납품처: ${destination || '-'}\n• 전표번호: ${invoiceNumber || '-'}\n• 위탁업체: ${supplierName || '-'}`
                    })
                })

                await prisma.notification.create({
                    data: {
                        type: 'DELIVERY',
                        targetId: delivery.id,
                        channel: 'SLACK',
                        message: `Slack 알림 발송: ${serialNumber}`,
                        status: 'SENT',
                        sentAt: new Date()
                    }
                })
            } catch (slackError) {
                console.error('Slack notification failed:', slackError)
            }
        }

        // 납품 알림 발송 표시
        await prisma.delivery.update({
            where: { id: delivery.id },
            data: {
                notificationSent: true,
                notificationSentAt: new Date()
            }
        })

        return NextResponse.json(delivery)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
