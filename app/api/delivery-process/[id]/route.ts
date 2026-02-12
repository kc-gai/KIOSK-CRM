import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 납품 프로세스 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const process = await prisma.deliveryProcess.findUnique({
            where: { id },
            include: {
                orderProcess: {
                    select: {
                        id: true,
                        processNumber: true,
                        title: true,
                        client: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!process) {
            return NextResponse.json({ error: 'Process not found' }, { status: 404 })
        }

        return NextResponse.json(process)
    } catch (error) {
        console.error('Failed to fetch delivery process:', error)
        return NextResponse.json({ error: 'Failed to fetch delivery process' }, { status: 500 })
    }
}

// PUT: 납품 프로세스 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            serialNumber,
            modelName,
            orderProcessId,
            currentStep,
            status,
            // 1단계 필드 (외주업체 담당자)
            shippedDate,
            expectedArrival,
            trackingNumber,
            logistics,
            vendorName,
            vendorContact,
            vendorNotes,
            step1CompletedAt,
            step1CompletedBy,
            // 2단계 필드 (내부 담당자)
            actualArrival,
            inspectionPassed,
            inspectionNotes,
            internalNotes,
            step2CompletedAt,
            step2CompletedBy,
            // 자산 연결
            kioskId
        } = body

        const updateData: Record<string, unknown> = {}

        // 기본 필드
        if (serialNumber !== undefined) updateData.serialNumber = serialNumber
        if (modelName !== undefined) updateData.modelName = modelName
        if (orderProcessId !== undefined) updateData.orderProcessId = orderProcessId || null
        if (currentStep !== undefined) updateData.currentStep = currentStep
        if (status !== undefined) updateData.status = status

        // 1단계 필드
        if (shippedDate !== undefined) updateData.shippedDate = shippedDate ? new Date(shippedDate) : null
        if (expectedArrival !== undefined) updateData.expectedArrival = expectedArrival ? new Date(expectedArrival) : null
        if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
        if (logistics !== undefined) updateData.logistics = logistics
        if (vendorName !== undefined) updateData.vendorName = vendorName
        if (vendorContact !== undefined) updateData.vendorContact = vendorContact
        if (vendorNotes !== undefined) updateData.vendorNotes = vendorNotes
        if (step1CompletedAt !== undefined) updateData.step1CompletedAt = step1CompletedAt ? new Date(step1CompletedAt) : null
        if (step1CompletedBy !== undefined) updateData.step1CompletedBy = step1CompletedBy

        // 2단계 필드
        if (actualArrival !== undefined) updateData.actualArrival = actualArrival ? new Date(actualArrival) : null
        if (inspectionPassed !== undefined) updateData.inspectionPassed = inspectionPassed
        if (inspectionNotes !== undefined) updateData.inspectionNotes = inspectionNotes
        if (internalNotes !== undefined) updateData.internalNotes = internalNotes
        if (step2CompletedAt !== undefined) updateData.step2CompletedAt = step2CompletedAt ? new Date(step2CompletedAt) : null
        if (step2CompletedBy !== undefined) updateData.step2CompletedBy = step2CompletedBy

        // 자산 연결
        if (kioskId !== undefined) updateData.kioskId = kioskId

        const process = await prisma.deliveryProcess.update({
            where: { id },
            data: updateData,
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

        return NextResponse.json(process)
    } catch (error) {
        console.error('Failed to update delivery process:', error)
        return NextResponse.json({ error: 'Failed to update delivery process' }, { status: 500 })
    }
}

// DELETE: 납품 프로세스 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.deliveryProcess.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete delivery process:', error)
        return NextResponse.json({ error: 'Failed to delete delivery process' }, { status: 500 })
    }
}
