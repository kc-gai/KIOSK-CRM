import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: 수리 입고 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const where: Record<string, unknown> = {}

        if (status && status !== 'all') {
            where.status = status
        }

        if (search) {
            where.OR = [
                { serialNumber: { contains: search } },
                { receiptReason: { contains: search } },
                { repairVendor: { contains: search } }
            ]
        }

        const repairs = await prisma.kioskRepair.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(repairs)
    } catch (error) {
        console.error('Failed to fetch repairs:', error)
        return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 })
    }
}

// POST: 수리 입고 등록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            kioskId,
            serialNumber,
            receiptReason,
            symptom,
            reportedBy,
            notes
        } = body

        // 수리 입고 생성
        const repair = await prisma.kioskRepair.create({
            data: {
                kioskId: kioskId || '',
                serialNumber,
                receiptReason,
                symptom,
                reportedBy,
                notes,
                status: 'RECEIVED'
            }
        })

        // 키오스크 상태를 REPAIR로 변경
        if (kioskId) {
            await prisma.kiosk.update({
                where: { id: kioskId },
                data: { status: 'REPAIR' }
            })

            // 이력 추가
            await prisma.locationHistory.create({
                data: {
                    kioskId,
                    moveType: 'MAINTENANCE',
                    prevStatus: 'DEPLOYED',
                    newStatus: 'REPAIR',
                    repairReason: receiptReason,
                    description: `수리 입고: ${receiptReason}`,
                    handledBy: reportedBy
                }
            })
        }

        return NextResponse.json(repair)
    } catch (error) {
        console.error('Failed to create repair:', error)
        return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 })
    }
}
