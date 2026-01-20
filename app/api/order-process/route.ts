import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 프로세스 번호 생성 함수
async function generateProcessNumber() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

    // 오늘 생성된 프로세스 개수 조회
    const count = await prisma.orderProcess.count({
        where: {
            processNumber: {
                startsWith: `OP-${dateStr}`
            }
        }
    })

    return `OP-${dateStr}-${String(count + 1).padStart(3, '0')}`
}

// GET: 발주의뢰 프로세스 목록 조회
export async function GET() {
    try {
        const processes = await prisma.orderProcess.findMany({
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(processes)
    } catch (error) {
        console.error('Failed to fetch order processes:', error)
        return NextResponse.json({ error: 'Failed to fetch order processes' }, { status: 500 })
    }
}

// POST: 발주의뢰 프로세스 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            title,
            clientId,
            requesterName,
            quantity,
            modelType,
            desiredDeliveryDate,
            dueDate,
            step1Notes,
            acquisition,
            leaseCompanyId,
            leaseMonthlyFee,
            leasePeriod
        } = body

        // 필수 필드 검증
        if (!title || !clientId) {
            return NextResponse.json(
                { error: 'Title and clientId are required' },
                { status: 400 }
            )
        }

        const processNumber = await generateProcessNumber()

        const process = await prisma.orderProcess.create({
            data: {
                processNumber,
                title,
                clientId,
                requesterName,
                quantity: quantity ? parseInt(quantity) : null,
                modelType,
                desiredDeliveryDate: desiredDeliveryDate ? new Date(desiredDeliveryDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                step1Notes,
                acquisition: acquisition || 'PURCHASE',
                leaseCompanyId: leaseCompanyId || null,
                leaseMonthlyFee: leaseMonthlyFee ? parseInt(leaseMonthlyFee) : null,
                leasePeriod: leasePeriod ? parseInt(leasePeriod) : null,
                currentStep: 1,
                status: 'IN_PROGRESS'
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return NextResponse.json(process, { status: 201 })
    } catch (error) {
        console.error('Failed to create order process:', error)
        return NextResponse.json({ error: 'Failed to create order process' }, { status: 500 })
    }
}
