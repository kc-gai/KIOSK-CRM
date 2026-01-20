import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: API 설정 목록 조회
export async function GET() {
    try {
        const configs = await prisma.apiConfig.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(configs)
    } catch (error) {
        console.error('Failed to fetch API configs:', error)
        return NextResponse.json({ error: 'Failed to fetch API configs' }, { status: 500 })
    }
}

// POST: API 설정 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            apiType,
            description,
            baseUrl,
            apiKey,
            webhookUrl,
            authType,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpSecure,
            isActive
        } = body

        if (!name || !apiType) {
            return NextResponse.json(
                { error: 'name and apiType are required' },
                { status: 400 }
            )
        }

        const config = await prisma.apiConfig.create({
            data: {
                name,
                apiType,
                description: description || null,
                baseUrl: baseUrl || null,
                apiKey: apiKey || null,
                webhookUrl: webhookUrl || null,
                authType: authType || 'API_KEY',
                smtpHost: smtpHost || null,
                smtpPort: smtpPort ? parseInt(smtpPort) : null,
                smtpUser: smtpUser || null,
                smtpPassword: smtpPassword || null,
                smtpSecure: smtpSecure ?? true,
                isActive: isActive ?? true
            }
        })

        return NextResponse.json(config, { status: 201 })
    } catch (error) {
        console.error('Failed to create API config:', error)
        return NextResponse.json({ error: 'Failed to create API config' }, { status: 500 })
    }
}
