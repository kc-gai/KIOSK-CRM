import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createCalendarEvent } from '@/lib/google-calendar'

// 관리번호 생성 함수 (No 1014, 1015...)
async function generateRequestNumber() {
    // 마지막 번호 조회
    const lastRequest = await prisma.deliveryRequest.findFirst({
        orderBy: { requestNumber: 'desc' }
    })

    if (!lastRequest) {
        return '1001' // 시작 번호
    }

    const lastNumber = parseInt(lastRequest.requestNumber, 10)
    return String(lastNumber + 1)
}

// GET: 납품 의뢰서 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '20', 10)

        const where: Record<string, unknown> = {}
        if (status) {
            where.status = status
        }

        const [requests, total] = await Promise.all([
            prisma.deliveryRequest.findMany({
                where,
                include: {
                    items: {
                        orderBy: { sortOrder: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.deliveryRequest.count({ where })
        ])

        // 각 의뢰서에 총 수량 계산 추가
        const requestsWithTotals = requests.map(req => ({
            ...req,
            totalQuantity: req.items.reduce((sum, item) => sum + item.quantity, 0),
            totalKioskCount: req.items.reduce((sum, item) => sum + item.kioskCount, 0),
            totalPlateCount: req.items.reduce((sum, item) => sum + item.plateCount, 0),
            totalAmount: req.items.reduce((sum, item) => sum + (item.quantity * req.unitPrice), 0)
        }))

        return NextResponse.json({
            data: requestsWithTotals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch delivery requests:', error)
        return NextResponse.json({ error: 'Failed to fetch delivery requests' }, { status: 500 })
    }
}

// POST: 납품 의뢰서 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            requesterName,
            requesterId,
            title,
            orderDate,
            desiredDeliveryDate,
            desiredDeliveryWeek,
            unitPrice,
            taxIncluded,
            notes,
            items
        } = body

        // 필수 필드 검증
        if (!requesterName) {
            return NextResponse.json(
                { error: 'Requester name is required' },
                { status: 400 }
            )
        }

        const requestNumber = await generateRequestNumber()

        const deliveryRequest = await prisma.deliveryRequest.create({
            data: {
                requestNumber,
                requesterName,
                requesterId: requesterId || null,
                title: title || 'キオスク端末＆決済端末の鉄板・金具',
                orderDate: orderDate ? new Date(orderDate) : new Date(),
                desiredDeliveryDate: desiredDeliveryDate ? new Date(desiredDeliveryDate) : null,
                desiredDeliveryWeek: desiredDeliveryWeek || null,
                unitPrice: unitPrice ?? 240000,
                taxIncluded: taxIncluded ?? false,
                notes: notes || null,
                status: 'DRAFT',
                items: items && items.length > 0 ? {
                    create: items.map((item: {
                        locationName: string
                        postalCode?: string
                        address: string
                        contactPhone?: string
                        quantity?: number
                        kioskCount?: number
                        plateCount?: number
                        branchId?: string
                        itemNotes?: string
                        sortOrder?: number
                    }, index: number) => ({
                        locationName: item.locationName,
                        postalCode: item.postalCode || null,
                        address: item.address,
                        contactPhone: item.contactPhone || null,
                        quantity: item.quantity || 1,
                        kioskCount: item.kioskCount || 1,
                        plateCount: item.plateCount || 1,
                        branchId: item.branchId || null,
                        itemNotes: item.itemNotes || null,
                        sortOrder: item.sortOrder ?? index
                    }))
                } : undefined
            },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })

        // Google Calendar 이벤트 생성 (납기예정일이 있는 경우)
        if (desiredDeliveryDate) {
            try {
                const totalQuantity = deliveryRequest.items.reduce((sum, item) => sum + item.quantity, 0)
                const locationNames = deliveryRequest.items.map(item => item.locationName).join(', ')

                const eventId = await createCalendarEvent({
                    title: `【納期】${requestNumber} - ${title || '納品依頼'}`,
                    description: `依頼者: ${requesterName}\n納品場所: ${locationNames}\n数量: ${totalQuantity}台\n\n${notes || ''}`,
                    date: new Date(desiredDeliveryDate),
                    allDay: true
                })

                // CalendarEvent 레코드 저장
                if (eventId) {
                    await prisma.calendarEvent.create({
                        data: {
                            eventId,
                            calendarId: process.env.GOOGLE_CALENDAR_ID || null,
                            title: `【納期】${requestNumber} - ${title || '納品依頼'}`,
                            description: `依頼者: ${requesterName}\n納品場所: ${locationNames}`,
                            eventDate: new Date(desiredDeliveryDate),
                            allDay: true,
                            sourceType: 'DELIVERY_REQUEST',
                            sourceId: deliveryRequest.id,
                            syncStatus: 'SYNCED',
                            syncedAt: new Date()
                        }
                    })
                }
            } catch (calendarError) {
                // 캘린더 연동 실패해도 의뢰서 생성은 성공으로 처리
                console.error('Calendar event creation failed:', calendarError)
            }
        }

        return NextResponse.json(deliveryRequest, { status: 201 })
    } catch (error) {
        console.error('Failed to create delivery request:', error)
        return NextResponse.json({ error: 'Failed to create delivery request' }, { status: 500 })
    }
}
