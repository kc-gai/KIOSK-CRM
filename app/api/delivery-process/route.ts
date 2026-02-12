import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 프로세스 번호 생성 함수
async function generateProcessNumber() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

    // 오늘 생성된 프로세스 개수 조회
    const count = await prisma.deliveryProcess.count({
        where: {
            processNumber: {
                startsWith: `DP-${dateStr}`
            }
        }
    })

    return `DP-${dateStr}-${String(count + 1).padStart(3, '0')}`
}

// GET: 납품 프로세스 목록 조회
export async function GET() {
    try {
        const processes = await prisma.deliveryProcess.findMany({
            include: {
                orderProcess: {
                    select: {
                        id: true,
                        processNumber: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(processes)
    } catch (error) {
        console.error('Failed to fetch delivery processes:', error)
        return NextResponse.json({ error: 'Failed to fetch delivery processes' }, { status: 500 })
    }
}

// POST: 납품 프로세스 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            serialNumber,
            modelName,
            orderProcessId,
            shippedDate,
            expectedArrival,
            trackingNumber,
            logistics,
            vendorName,
            vendorContact,
            vendorNotes
        } = body

        // 필수 필드 검증
        if (!serialNumber) {
            return NextResponse.json(
                { error: 'Serial number is required' },
                { status: 400 }
            )
        }

        const processNumber = await generateProcessNumber()

        const process = await prisma.deliveryProcess.create({
            data: {
                processNumber,
                serialNumber,
                modelName,
                orderProcessId: orderProcessId || null,
                shippedDate: shippedDate ? new Date(shippedDate) : null,
                expectedArrival: expectedArrival ? new Date(expectedArrival) : null,
                trackingNumber,
                logistics,
                vendorName,
                vendorContact,
                vendorNotes,
                currentStep: 1,
                status: 'IN_PROGRESS'
            },
            include: {
                orderProcess: {
                    select: {
                        id: true,
                        processNumber: true,
                        title: true
                    }
                }
            }
        })

        return NextResponse.json(process, { status: 201 })
    } catch (error) {
        console.error('Failed to create delivery process:', error)
        return NextResponse.json({ error: 'Failed to create delivery process' }, { status: 500 })
    }
}
