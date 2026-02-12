import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 발주의뢰 프로세스 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const process = await prisma.orderProcess.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        contact: true,
                        address: true
                    }
                },
                deliveryProcesses: {
                    select: {
                        id: true,
                        processNumber: true,
                        serialNumber: true,
                        status: true,
                        currentStep: true
                    }
                }
            }
        })

        if (!process) {
            return NextResponse.json({ error: 'Process not found' }, { status: 404 })
        }

        return NextResponse.json(process)
    } catch (error) {
        console.error('Failed to fetch order process:', error)
        return NextResponse.json({ error: 'Failed to fetch order process' }, { status: 500 })
    }
}

// PUT: 발주의뢰 프로세스 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            title,
            clientId,
            requesterName,
            quantity,
            modelType,
            desiredDeliveryDate,
            dueDate,
            currentStep,
            status,
            // 1단계 필드
            acquisition,
            leaseCompanyId,
            leaseMonthlyFee,
            leasePeriod,
            step1Notes,
            step1CompletedAt,
            step1CompletedBy,
            // 2단계 필드
            documentUrl,
            documentNumber,
            step2CompletedAt,
            step2CompletedBy,
            // 3단계 필드
            approvalRequestId,
            approvalTitle,
            step3CompletedAt,
            step3CompletedBy,
            // 4단계 필드
            approvalStatus,
            approvalDate,
            approvalComment,
            step4CompletedAt,
            step4CompletedBy,
            // 5단계 필드
            vendorOrderSent,
            vendorEmail,
            slackNotified,
            emailNotified,
            step5CompletedAt,
            step5CompletedBy
        } = body

        const updateData: Record<string, unknown> = {}

        // 기본 필드
        if (title !== undefined) updateData.title = title
        if (clientId !== undefined) updateData.clientId = clientId
        if (requesterName !== undefined) updateData.requesterName = requesterName
        if (quantity !== undefined) updateData.quantity = quantity ? parseInt(quantity) : null
        if (modelType !== undefined) updateData.modelType = modelType
        if (desiredDeliveryDate !== undefined) updateData.desiredDeliveryDate = desiredDeliveryDate ? new Date(desiredDeliveryDate) : null
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
        if (currentStep !== undefined) updateData.currentStep = currentStep
        if (status !== undefined) updateData.status = status

        // 1단계 필드
        if (acquisition !== undefined) updateData.acquisition = acquisition
        if (leaseCompanyId !== undefined) updateData.leaseCompanyId = leaseCompanyId || null
        if (leaseMonthlyFee !== undefined) updateData.leaseMonthlyFee = leaseMonthlyFee ? parseInt(leaseMonthlyFee) : null
        if (leasePeriod !== undefined) updateData.leasePeriod = leasePeriod ? parseInt(leasePeriod) : null
        if (step1Notes !== undefined) updateData.step1Notes = step1Notes
        if (step1CompletedAt !== undefined) updateData.step1CompletedAt = step1CompletedAt ? new Date(step1CompletedAt) : null
        if (step1CompletedBy !== undefined) updateData.step1CompletedBy = step1CompletedBy

        // 2단계 필드
        if (documentUrl !== undefined) updateData.documentUrl = documentUrl
        if (documentNumber !== undefined) updateData.documentNumber = documentNumber
        if (step2CompletedAt !== undefined) updateData.step2CompletedAt = step2CompletedAt ? new Date(step2CompletedAt) : null
        if (step2CompletedBy !== undefined) updateData.step2CompletedBy = step2CompletedBy

        // 3단계 필드
        if (approvalRequestId !== undefined) updateData.approvalRequestId = approvalRequestId
        if (approvalTitle !== undefined) updateData.approvalTitle = approvalTitle
        if (step3CompletedAt !== undefined) updateData.step3CompletedAt = step3CompletedAt ? new Date(step3CompletedAt) : null
        if (step3CompletedBy !== undefined) updateData.step3CompletedBy = step3CompletedBy

        // 4단계 필드
        if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus
        if (approvalDate !== undefined) updateData.approvalDate = approvalDate ? new Date(approvalDate) : null
        if (approvalComment !== undefined) updateData.approvalComment = approvalComment
        if (step4CompletedAt !== undefined) updateData.step4CompletedAt = step4CompletedAt ? new Date(step4CompletedAt) : null
        if (step4CompletedBy !== undefined) updateData.step4CompletedBy = step4CompletedBy

        // 5단계 필드
        if (vendorOrderSent !== undefined) updateData.vendorOrderSent = vendorOrderSent
        if (vendorEmail !== undefined) updateData.vendorEmail = vendorEmail
        if (slackNotified !== undefined) updateData.slackNotified = slackNotified
        if (emailNotified !== undefined) updateData.emailNotified = emailNotified
        if (step5CompletedAt !== undefined) updateData.step5CompletedAt = step5CompletedAt ? new Date(step5CompletedAt) : null
        if (step5CompletedBy !== undefined) updateData.step5CompletedBy = step5CompletedBy

        const process = await prisma.orderProcess.update({
            where: { id },
            data: updateData,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return NextResponse.json(process)
    } catch (error) {
        console.error('Failed to update order process:', error)
        return NextResponse.json({ error: 'Failed to update order process' }, { status: 500 })
    }
}

// DELETE: 발주의뢰 프로세스 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.orderProcess.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete order process:', error)
        return NextResponse.json({ error: 'Failed to delete order process' }, { status: 500 })
    }
}
