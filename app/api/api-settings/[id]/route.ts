import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: API 설정 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const config = await prisma.apiConfig.findUnique({
            where: { id }
        })

        if (!config) {
            return NextResponse.json({ error: 'API config not found' }, { status: 404 })
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error('Failed to fetch API config:', error)
        return NextResponse.json({ error: 'Failed to fetch API config' }, { status: 500 })
    }
}

// PUT: API 설정 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const updateData: Record<string, unknown> = {}

        if (body.name !== undefined) updateData.name = body.name
        if (body.apiType !== undefined) updateData.apiType = body.apiType
        if (body.description !== undefined) updateData.description = body.description || null
        if (body.baseUrl !== undefined) updateData.baseUrl = body.baseUrl || null
        if (body.apiKey !== undefined) updateData.apiKey = body.apiKey || null
        if (body.webhookUrl !== undefined) updateData.webhookUrl = body.webhookUrl || null
        if (body.authType !== undefined) updateData.authType = body.authType
        if (body.smtpHost !== undefined) updateData.smtpHost = body.smtpHost || null
        if (body.smtpPort !== undefined) updateData.smtpPort = body.smtpPort ? parseInt(body.smtpPort) : null
        if (body.smtpUser !== undefined) updateData.smtpUser = body.smtpUser || null
        if (body.smtpPass !== undefined) updateData.smtpPass = body.smtpPass || null
        if (body.smtpSecure !== undefined) updateData.smtpSecure = body.smtpSecure
        if (body.isActive !== undefined) updateData.isActive = body.isActive

        const config = await prisma.apiConfig.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error('Failed to update API config:', error)
        return NextResponse.json({ error: 'Failed to update API config' }, { status: 500 })
    }
}

// DELETE: API 설정 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.apiConfig.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete API config:', error)
        return NextResponse.json({ error: 'Failed to delete API config' }, { status: 500 })
    }
}
