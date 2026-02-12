import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: 캘린더 이벤트 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const sourceType = searchParams.get('sourceType')
        const syncStatus = searchParams.get('syncStatus')

        const where: Record<string, unknown> = {}

        if (sourceType) {
            where.sourceType = sourceType
        }

        if (syncStatus) {
            where.syncStatus = syncStatus
        }

        const events = await prisma.calendarEvent.findMany({
            where,
            orderBy: { eventDate: 'desc' }
        })

        return NextResponse.json(events)
    } catch (error) {
        console.error('Failed to fetch calendar events:', error)
        return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
    }
}

// POST: 캘린더 이벤트 생성 (발주 납기예정일 등록)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            calendarId,
            title,
            description,
            eventDate,
            startTime,
            endTime,
            allDay,
            sourceType,
            sourceId
        } = body

        // 이벤트 생성
        const event = await prisma.calendarEvent.create({
            data: {
                calendarId,
                title,
                description,
                eventDate: new Date(eventDate),
                startTime,
                endTime,
                allDay: allDay !== false,
                sourceType,
                sourceId,
                syncStatus: 'PENDING'
            }
        })

        // Google Calendar API 호출 (설정이 있는 경우)
        const calendarConfig = await prisma.apiConfig.findFirst({
            where: {
                apiType: 'GOOGLE_CALENDAR',
                isActive: true
            }
        })

        if (calendarConfig && calendarId) {
            try {
                // TODO: 실제 Google Calendar API 호출
                // 현재는 API 설정 페이지에서 연동 설정 후 사용
                // const googleCalendarResponse = await sendToGoogleCalendar(event, calendarConfig)

                // 데모용: 바로 SYNCED로 설정
                await prisma.calendarEvent.update({
                    where: { id: event.id },
                    data: {
                        syncStatus: 'PENDING',
                        // eventId: googleCalendarResponse.id // 실제 구현 시
                    }
                })
            } catch (syncError) {
                console.error('Failed to sync to Google Calendar:', syncError)
                await prisma.calendarEvent.update({
                    where: { id: event.id },
                    data: {
                        syncStatus: 'FAILED',
                        syncError: String(syncError)
                    }
                })
            }
        }

        return NextResponse.json(event)
    } catch (error) {
        console.error('Failed to create calendar event:', error)
        return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
    }
}
