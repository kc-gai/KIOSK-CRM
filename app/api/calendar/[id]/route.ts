import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 캘린더 이벤트 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const event = await prisma.calendarEvent.findUnique({
            where: { id }
        })

        if (!event) {
            return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 })
        }

        return NextResponse.json(event)
    } catch (error) {
        console.error('Failed to fetch calendar event:', error)
        return NextResponse.json({ error: 'Failed to fetch calendar event' }, { status: 500 })
    }
}

// PUT: 캘린더 이벤트 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            calendarId,
            title,
            description,
            eventDate,
            startTime,
            endTime,
            allDay,
            syncStatus
        } = body

        const updateData: Record<string, unknown> = {}

        if (calendarId !== undefined) updateData.calendarId = calendarId
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (eventDate) updateData.eventDate = new Date(eventDate)
        if (startTime !== undefined) updateData.startTime = startTime
        if (endTime !== undefined) updateData.endTime = endTime
        if (allDay !== undefined) updateData.allDay = allDay
        if (syncStatus !== undefined) updateData.syncStatus = syncStatus

        const event = await prisma.calendarEvent.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(event)
    } catch (error) {
        console.error('Failed to update calendar event:', error)
        return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 })
    }
}

// DELETE: 캘린더 이벤트 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.calendarEvent.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete calendar event:', error)
        return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 })
    }
}
