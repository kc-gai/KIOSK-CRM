import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 샘플 번호 생성
async function generateSampleNumber(): Promise<string> {
    const lastSample = await prisma.sampleLoan.findFirst({
        orderBy: { sampleNumber: 'desc' },
        select: { sampleNumber: true }
    })

    let nextNumber = 1
    if (lastSample?.sampleNumber) {
        const match = lastSample.sampleNumber.match(/SAMPLE-(\d+)/)
        if (match) {
            nextNumber = parseInt(match[1]) + 1
        }
    }

    return `SAMPLE-${String(nextNumber).padStart(3, '0')}`
}

// GET: 샘플 대여 목록 조회
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
                { sampleNumber: { contains: search } },
                { serialNumber: { contains: search } },
                { lenderName: { contains: search } },
                { modelName: { contains: search } }
            ]
        }

        const samples = await prisma.sampleLoan.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(samples)
    } catch (error) {
        console.error('Failed to fetch sample loans:', error)
        return NextResponse.json({ error: 'Failed to fetch sample loans' }, { status: 500 })
    }
}

// POST: 샘플 대여 등록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            serialNumber,
            modelName,
            description,
            lenderName,
            lenderContact,
            lenderPhone,
            lenderEmail,
            loanDate,
            expectedReturnDate,
            purpose,
            usageLocation,
            responsiblePerson,
            notes
        } = body

        const sampleNumber = await generateSampleNumber()

        const sample = await prisma.sampleLoan.create({
            data: {
                sampleNumber,
                serialNumber,
                modelName,
                description,
                lenderName,
                lenderContact,
                lenderPhone,
                lenderEmail,
                loanDate: loanDate ? new Date(loanDate) : new Date(),
                expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
                purpose,
                usageLocation,
                responsiblePerson,
                notes,
                status: 'ON_LOAN'
            }
        })

        return NextResponse.json(sample)
    } catch (error) {
        console.error('Failed to create sample loan:', error)
        return NextResponse.json({ error: 'Failed to create sample loan' }, { status: 500 })
    }
}
