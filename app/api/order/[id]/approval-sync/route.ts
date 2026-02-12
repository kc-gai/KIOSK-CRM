import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApprovalStatus } from '@/lib/jobcan'
import { sendApprovalStatusEmail } from '@/lib/email'

// POST: Jobcan에서 품의 상태 동기화
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const orderProcess = await prisma.orderProcess.findUnique({
            where: { id }
        })

        if (!orderProcess) {
            return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 })
        }

        if (!orderProcess.approvalRequestId) {
            return NextResponse.json({ error: '稟議番号が登録されていません' }, { status: 400 })
        }

        // Jobcan API 조회
        const result = await getApprovalStatus(orderProcess.approvalRequestId)
        if (!result) {
            return NextResponse.json({
                error: 'Jobcan APIへの接続に失敗しました。API設定を確認してください。'
            }, { status: 502 })
        }

        const previousStatus = orderProcess.approvalStatus
        const newApprovalStatus = result.status === 'UNKNOWN' ? (previousStatus || 'PENDING') : result.status

        // DB 업데이트
        const updateData: Record<string, unknown> = {
            approvalStatus: newApprovalStatus,
        }

        if (result.comment) {
            updateData.approvalComment = result.comment
        }

        if (newApprovalStatus === 'APPROVED' && previousStatus !== 'APPROVED') {
            updateData.approvalDate = result.approvalDate ? new Date(result.approvalDate) : new Date()
            updateData.status = 'APPROVED'
            updateData.step4CompletedAt = new Date()
        } else if (newApprovalStatus === 'REJECTED' && previousStatus !== 'REJECTED') {
            updateData.approvalDate = result.approvalDate ? new Date(result.approvalDate) : new Date()
        }

        await prisma.orderProcess.update({
            where: { id },
            data: updateData
        })

        // 상태 변경 시 알림 메일 발송
        if (previousStatus !== newApprovalStatus && (newApprovalStatus === 'APPROVED' || newApprovalStatus === 'REJECTED' || newApprovalStatus === 'WITHDRAWN')) {
            try {
                await sendApprovalStatusEmail({
                    orderNumber: orderProcess.processNumber,
                    title: orderProcess.title || '',
                    approvalStatus: newApprovalStatus,
                    approverName: result.approverName,
                    approvalDate: result.approvalDate,
                    comment: result.comment,
                })
            } catch (emailError) {
                console.error('Approval email failed:', emailError)
            }
        }

        return NextResponse.json({
            success: true,
            previousStatus,
            currentStatus: newApprovalStatus,
            jobcanTitle: result.title,
            changed: previousStatus !== newApprovalStatus
        })
    } catch (error) {
        console.error('Approval sync error:', error)
        return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
    }
}
