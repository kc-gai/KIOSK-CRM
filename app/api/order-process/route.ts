import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createCalendarEvent } from '@/lib/google-calendar'

// 프로세스 번호 생성 함수
async function generateProcessNumber() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

    // 오늘 생성된 프로세스 개수 조회
    const count = await prisma.orderProcess.count({
        where: {
            processNumber: {
                startsWith: `OP-${dateStr}`
            }
        }
    })

    return `OP-${dateStr}-${String(count + 1).padStart(3, '0')}`
}

// GET: 발주의뢰 프로세스 목록 조회
export async function GET() {
    try {
        const processes = await prisma.orderProcess.findMany({
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(processes)
    } catch (error) {
        console.error('Failed to fetch order processes:', error)
        return NextResponse.json({ error: 'Failed to fetch order processes' }, { status: 500 })
    }
}

// POST: 발주의뢰 프로세스 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            title,
            clientId,
            requesterName,
            quantity,
            modelType,
            desiredDeliveryDate,
            dueDate,
            step1Notes,
            acquisition,
            leaseCompanyId,
            leaseMonthlyFee,
            leasePeriod
        } = body

        // 필수 필드 검증
        if (!title || !clientId) {
            return NextResponse.json(
                { error: 'Title and clientId are required' },
                { status: 400 }
            )
        }

        const processNumber = await generateProcessNumber()

        const process = await prisma.orderProcess.create({
            data: {
                processNumber,
                title,
                clientId,
                requesterName,
                quantity: quantity ? parseInt(quantity) : null,
                modelType,
                desiredDeliveryDate: desiredDeliveryDate ? new Date(desiredDeliveryDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                step1Notes,
                acquisition: acquisition || 'PURCHASE',
                leaseCompanyId: leaseCompanyId || null,
                leaseMonthlyFee: leaseMonthlyFee ? parseInt(leaseMonthlyFee) : null,
                leasePeriod: leasePeriod ? parseInt(leasePeriod) : null,
                currentStep: 1,
                status: 'IN_PROGRESS'
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        // Google Calendar 이벤트 생성 (납기희망일이 있는 경우)
        if (desiredDeliveryDate) {
            try {
                const eventId = await createCalendarEvent({
                    title: `【発注】${processNumber} - ${title}`,
                    description: `依頼者: ${requesterName || '-'}\n取引先: ${process.client?.name || '-'}\n数量: ${quantity || '-'}台\nモデル: ${modelType || '-'}`,
                    date: new Date(desiredDeliveryDate),
                    allDay: true,
                })

                if (eventId) {
                    await prisma.calendarEvent.create({
                        data: {
                            eventId,
                            calendarId: globalThis.process?.env?.GOOGLE_CALENDAR_ID || null,
                            title: `【発注】${processNumber} - ${title}`,
                            description: `依頼者: ${requesterName || '-'}\n数量: ${quantity || '-'}台`,
                            eventDate: new Date(desiredDeliveryDate),
                            allDay: true,
                            sourceType: 'ORDER_PROCESS',
                            sourceId: process.id,
                            syncStatus: 'SYNCED',
                            syncedAt: new Date(),
                        }
                    })
                }
            } catch (calendarError) {
                console.error('Calendar event creation failed:', calendarError)
                // 캘린더 실패해도 발주 생성은 성공으로 처리
            }
        }

        return NextResponse.json(process, { status: 201 })
    } catch (error) {
        console.error('Failed to create order process:', error)
        return NextResponse.json({ error: 'Failed to create order process' }, { status: 500 })
    }
}
