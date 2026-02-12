import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApprovalStatus } from '@/lib/jobcan'

// POST: PENDING 상태인 모든 발주의 품의 상태를 일괄 동기화
export async function POST() {
    try {
        // 품의번호가 있고 PENDING 상태인 발주 조회
        const pendingOrders = await prisma.orderProcess.findMany({
            where: {
                approvalRequestId: { not: null },
                approvalStatus: 'PENDING',
            },
            select: {
                id: true,
                processNumber: true,
                approvalRequestId: true,
                approvalStatus: true,
            }
        })

        if (pendingOrders.length === 0) {
            return NextResponse.json({
                success: true,
                message: '同期対象の発注がありません',
                synced: 0,
                failed: 0,
                unchanged: 0,
                total: 0,
            })
        }

        let synced = 0
        let failed = 0
        let unchanged = 0
        const results: Array<{
            processNumber: string
            previousStatus: string | null
            newStatus: string
            changed: boolean
        }> = []

        for (const order of pendingOrders) {
            try {
                const result = await getApprovalStatus(order.approvalRequestId!)
                if (!result) {
                    failed++
                    continue
                }

                const newStatus = result.status === 'UNKNOWN' ? 'PENDING' : result.status

                if (newStatus === order.approvalStatus) {
                    unchanged++
                    results.push({
                        processNumber: order.processNumber,
                        previousStatus: order.approvalStatus,
                        newStatus,
                        changed: false,
                    })
                    continue
                }

                // 상태 변경 시 DB 업데이트
                const updateData: Record<string, unknown> = {
                    approvalStatus: newStatus,
                }

                if (result.comment) {
                    updateData.approvalComment = result.comment
                }

                if (newStatus === 'APPROVED') {
                    updateData.approvalDate = result.approvalDate ? new Date(result.approvalDate) : new Date()
                    updateData.status = 'APPROVED'
                    updateData.step4CompletedAt = new Date()
                } else if (newStatus === 'REJECTED') {
                    updateData.approvalDate = result.approvalDate ? new Date(result.approvalDate) : new Date()
                }

                await prisma.orderProcess.update({
                    where: { id: order.id },
                    data: updateData,
                })

                synced++
                results.push({
                    processNumber: order.processNumber,
                    previousStatus: order.approvalStatus,
                    newStatus,
                    changed: true,
                })
            } catch (error) {
                console.error(`Sync failed for ${order.processNumber}:`, error)
                failed++
            }
        }

        return NextResponse.json({
            success: true,
            message: `同期完了: ${synced}件更新, ${unchanged}件変更なし, ${failed}件失敗`,
            synced,
            failed,
            unchanged,
            total: pendingOrders.length,
            results,
        })
    } catch (error) {
        console.error('Bulk sync error:', error)
        return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
    }
}
