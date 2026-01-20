import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendDeliveryReminder } from '@/lib/email'

// 알림 대상 일수 설정
const REMINDER_DAYS = [7, 3, 1]  // D-7, D-3, D-1

/**
 * GET /api/cron/delivery-reminder
 * 납기 알림 스케줄러 - 외부 Cron 서비스에서 호출
 *
 * 사용법:
 * - Vercel Cron: vercel.json에 설정
 * - 외부 서비스: https://your-domain.com/api/cron/delivery-reminder?secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
    // 보안: 시크릿 키 검증 (선택사항)
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const results = {
            checked: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [] as { requestNumber: string; daysRemaining: number; status: string }[]
        }

        // 각 알림 일수에 대해 처리
        for (const days of REMINDER_DAYS) {
            const targetDate = new Date(today)
            targetDate.setDate(targetDate.getDate() + days)

            // 해당 날짜가 납기예정일인 의뢰서 조회
            const startOfDay = new Date(targetDate)
            startOfDay.setHours(0, 0, 0, 0)

            const endOfDay = new Date(targetDate)
            endOfDay.setHours(23, 59, 59, 999)

            const requests = await prisma.deliveryRequest.findMany({
                where: {
                    desiredDeliveryDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    status: {
                        notIn: ['COMPLETED', 'CANCELLED']
                    }
                },
                include: {
                    items: {
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            })

            results.checked += requests.length

            for (const request of requests) {
                // 이미 해당 일수로 알림을 보냈는지 확인
                const existingNotification = await prisma.notification.findFirst({
                    where: {
                        type: 'DELIVERY_REMINDER',
                        targetId: request.id,
                        message: {
                            contains: `D-${days}`
                        }
                    }
                })

                if (existingNotification) {
                    results.skipped++
                    results.details.push({
                        requestNumber: request.requestNumber,
                        daysRemaining: days,
                        status: 'skipped (already sent)'
                    })
                    continue
                }

                // 이메일 발송
                try {
                    const totalQuantity = request.items.reduce((sum, item) => sum + item.quantity, 0)

                    const emailSent = await sendDeliveryReminder({
                        requestNumber: request.requestNumber,
                        title: request.title,
                        requesterName: request.requesterName,
                        desiredDeliveryDate: request.desiredDeliveryDate!,
                        daysRemaining: days,
                        items: request.items.map(item => ({
                            locationName: item.locationName,
                            address: item.address,
                            quantity: item.quantity
                        })),
                        totalQuantity
                    })

                    // Notification 레코드 생성
                    await prisma.notification.create({
                        data: {
                            type: 'DELIVERY_REMINDER',
                            targetId: request.id,
                            channel: 'EMAIL',
                            message: `納期リマインダー D-${days}: ${request.requestNumber} - ${request.title}`,
                            status: emailSent ? 'SENT' : 'FAILED',
                            sentAt: emailSent ? new Date() : null
                        }
                    })

                    if (emailSent) {
                        results.sent++
                        results.details.push({
                            requestNumber: request.requestNumber,
                            daysRemaining: days,
                            status: 'sent'
                        })
                    } else {
                        results.errors++
                        results.details.push({
                            requestNumber: request.requestNumber,
                            daysRemaining: days,
                            status: 'email failed'
                        })
                    }
                } catch (error) {
                    console.error(`Failed to send reminder for ${request.requestNumber}:`, error)
                    results.errors++
                    results.details.push({
                        requestNumber: request.requestNumber,
                        daysRemaining: days,
                        status: 'error'
                    })
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...results
        })
    } catch (error) {
        console.error('Delivery reminder cron error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        )
    }
}
