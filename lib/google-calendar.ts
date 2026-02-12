import { google, calendar_v3 } from 'googleapis'
import prisma from '@/lib/prisma'

// DB에서 설정값 가져오기 (환경변수 fallback)
async function getCalendarConfig() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'CALENDAR' }
        })

        const config: Record<string, string> = {}
        settings.forEach(s => {
            config[s.key] = s.value
        })

        return {
            email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: (config.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
            calendarId: config.GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID
        }
    } catch {
        // DB 연결 실패 시 환경변수만 사용
        return {
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            calendarId: process.env.GOOGLE_CALENDAR_ID
        }
    }
}

// Google Calendar Service Account 인증
const getCalendarClient = async (): Promise<{ calendar: calendar_v3.Calendar; calendarId: string } | null> => {
    const config = await getCalendarConfig()
    const { email, privateKey, calendarId } = config

    if (!email || !privateKey || !calendarId) {
        console.warn('Google Calendar credentials not configured')
        return null
    }

    try {
        const auth = new google.auth.JWT({
            email,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/calendar']
        })

        return {
            calendar: google.calendar({ version: 'v3', auth }),
            calendarId
        }
    } catch (error) {
        console.error('Failed to initialize Google Calendar client:', error)
        return null
    }
}

export interface CalendarEventData {
    title: string
    description?: string
    date: Date
    allDay?: boolean
    startTime?: string  // HH:mm
    endTime?: string    // HH:mm
}

/**
 * Google Calendar에 이벤트 생성
 */
export async function createCalendarEvent(data: CalendarEventData): Promise<string | null> {
    const client = await getCalendarClient()
    if (!client) return null

    const { calendar, calendarId } = client

    try {
        let start: calendar_v3.Schema$EventDateTime
        let end: calendar_v3.Schema$EventDateTime

        if (data.allDay !== false) {
            // 종일 이벤트
            const dateStr = data.date.toISOString().split('T')[0]
            start = { date: dateStr }
            end = { date: dateStr }
        } else {
            // 시간 지정 이벤트
            const dateStr = data.date.toISOString().split('T')[0]
            const startDateTime = new Date(`${dateStr}T${data.startTime || '09:00'}:00`)
            const endDateTime = new Date(`${dateStr}T${data.endTime || '10:00'}:00`)
            start = { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Tokyo' }
            end = { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Tokyo' }
        }

        const event: calendar_v3.Schema$Event = {
            summary: data.title,
            description: data.description,
            start,
            end,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 * 7 },  // D-7
                    { method: 'email', minutes: 24 * 60 * 3 },  // D-3
                    { method: 'email', minutes: 24 * 60 },      // D-1
                    { method: 'popup', minutes: 24 * 60 }       // D-1 팝업
                ]
            }
        }

        const response = await calendar.events.insert({
            calendarId,
            requestBody: event
        })

        console.log('Calendar event created:', response.data.id)
        return response.data.id || null
    } catch (error) {
        console.error('Failed to create calendar event:', error)
        return null
    }
}

/**
 * Google Calendar 이벤트 수정
 */
export async function updateCalendarEvent(
    eventId: string,
    data: Partial<CalendarEventData>
): Promise<boolean> {
    const client = await getCalendarClient()
    if (!client) return false

    const { calendar, calendarId } = client

    try {
        const updateData: calendar_v3.Schema$Event = {}

        if (data.title) updateData.summary = data.title
        if (data.description !== undefined) updateData.description = data.description

        if (data.date) {
            if (data.allDay !== false) {
                const dateStr = data.date.toISOString().split('T')[0]
                updateData.start = { date: dateStr }
                updateData.end = { date: dateStr }
            } else {
                const dateStr = data.date.toISOString().split('T')[0]
                const startDateTime = new Date(`${dateStr}T${data.startTime || '09:00'}:00`)
                const endDateTime = new Date(`${dateStr}T${data.endTime || '10:00'}:00`)
                updateData.start = { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Tokyo' }
                updateData.end = { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Tokyo' }
            }
        }

        await calendar.events.patch({
            calendarId,
            eventId,
            requestBody: updateData
        })

        console.log('Calendar event updated:', eventId)
        return true
    } catch (error) {
        console.error('Failed to update calendar event:', error)
        return false
    }
}

/**
 * Google Calendar 이벤트 삭제
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
    const client = await getCalendarClient()
    if (!client) return false

    const { calendar, calendarId } = client

    try {
        await calendar.events.delete({
            calendarId,
            eventId
        })

        console.log('Calendar event deleted:', eventId)
        return true
    } catch (error) {
        console.error('Failed to delete calendar event:', error)
        return false
    }
}

/**
 * Google Calendar 연결 테스트
 */
export async function testCalendarConnection(): Promise<{ success: boolean; message: string }> {
    const client = await getCalendarClient()
    if (!client) {
        return { success: false, message: 'Google Calendar 설정이 없습니다.' }
    }

    const { calendar, calendarId } = client

    try {
        const response = await calendar.calendarList.get({
            calendarId
        })

        return {
            success: true,
            message: `연결 성공: ${response.data.summary || calendarId}`
        }
    } catch (error: any) {
        return {
            success: false,
            message: `연결 실패: ${error.message || '알 수 없는 오류'}`
        }
    }
}
