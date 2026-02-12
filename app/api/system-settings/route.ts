import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 설정 키 목록
const SETTING_KEYS = {
    CALENDAR: [
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_CALENDAR_ID',
    ],
    EMAIL: [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'SMTP_FROM',
        'NOTIFICATION_EMAILS',
    ],
    NOTIFICATION: [
        'REMINDER_DAYS', // 예: "7,3,1"
    ],
    JOBCAN: [
        'JOBCAN_BASE_URL',
        'JOBCAN_API_TOKEN',
    ],
    VERTEX: [
        'VERTEX_API_KEY',
        'VERTEX_PROJECT_ID',
        'VERTEX_LOCATION',
    ]
}

// 암호화가 필요한 키들
const ENCRYPTED_KEYS = ['GOOGLE_PRIVATE_KEY', 'SMTP_PASSWORD', 'JOBCAN_API_TOKEN', 'VERTEX_API_KEY']

/**
 * GET /api/system-settings
 * 시스템 설정 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        const where = category ? { category } : {}

        const settings = await prisma.systemSetting.findMany({
            where,
            orderBy: { key: 'asc' }
        })

        // 암호화된 값은 마스킹
        const maskedSettings = settings.map(setting => ({
            ...setting,
            value: setting.encrypted ? '••••••••' : setting.value
        }))

        return NextResponse.json(maskedSettings)
    } catch (error) {
        console.error('Failed to fetch system settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

/**
 * POST /api/system-settings
 * 시스템 설정 저장 (일괄 업데이트)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { settings } = body // { key: value, key: value, ... }

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
        }

        const results = []

        for (const [key, value] of Object.entries(settings)) {
            // 빈 값이면 건너뛰기 (암호화된 필드의 마스킹 값 제외)
            if (value === '••••••••' || value === '') continue

            // 카테고리 결정
            let category = 'GENERAL'
            if (SETTING_KEYS.CALENDAR.includes(key)) category = 'CALENDAR'
            else if (SETTING_KEYS.EMAIL.includes(key)) category = 'EMAIL'
            else if (SETTING_KEYS.NOTIFICATION.includes(key)) category = 'NOTIFICATION'
            else if (SETTING_KEYS.JOBCAN.includes(key)) category = 'JOBCAN'
            else if (SETTING_KEYS.VERTEX.includes(key)) category = 'VERTEX'

            const encrypted = ENCRYPTED_KEYS.includes(key)

            const result = await prisma.systemSetting.upsert({
                where: { key },
                update: {
                    value: String(value),
                    encrypted,
                    category
                },
                create: {
                    key,
                    value: String(value),
                    encrypted,
                    category
                }
            })

            results.push(result)
        }

        return NextResponse.json({ success: true, updated: results.length })
    } catch (error) {
        console.error('Failed to save system settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}

/**
 * DELETE /api/system-settings
 * 특정 키 삭제
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const key = searchParams.get('key')

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 })
        }

        await prisma.systemSetting.delete({
            where: { key }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete system setting:', error)
        return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
    }
}
