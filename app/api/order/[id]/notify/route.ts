import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotification } from '@/lib/email'

// POST: 발주통지 메일 발송
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 발주 정보 조회
        const orderProcess = await prisma.orderProcess.findUnique({
            where: { id },
            include: { client: true }
        })

        if (!orderProcess) {
            return NextResponse.json({ message: '発注が見つかりません' }, { status: 404 })
        }

        // step1Notes에서 상세 정보 파싱
        let kioskUnitPrice = 0
        let plateUnitPrice = 0
        let orderRequestDate = ''
        let title = orderProcess.title || ''
        let savedItems: Array<{
            corporationId?: string
            corporationName?: string
            branchId?: string
            branchName?: string
            address?: string
            acquisition?: string
            leaseCompanyId?: string
            kioskCount?: number
            plateCount?: number
            desiredDeliveryDate?: string
        }> = []

        if (orderProcess.step1Notes) {
            try {
                const parsed = JSON.parse(orderProcess.step1Notes)
                kioskUnitPrice = parsed.kioskUnitPrice || 0
                plateUnitPrice = parsed.plateUnitPrice || 0
                orderRequestDate = parsed.orderRequestDate || ''
                if (parsed.items) savedItems = parsed.items
            } catch {
                // 텍스트 형식 fallback
                const kioskPriceMatch = orderProcess.step1Notes.match(/키오스크단가:\s*([\d,]+)/)
                if (kioskPriceMatch) kioskUnitPrice = parseInt(kioskPriceMatch[1].replace(/,/g, ''))
                const platePriceMatch = orderProcess.step1Notes.match(/철판단가:\s*([\d,]+)/)
                if (platePriceMatch) plateUnitPrice = parseInt(platePriceMatch[1].replace(/,/g, ''))
            }
        }

        // 법인/지점 이름 조회
        const corporations = await prisma.corporation.findMany({
            select: { id: true, name: true, nameJa: true }
        })
        const corpMap = new Map(corporations.map(c => [c.id, c.nameJa || c.name]))

        const branches = await prisma.branch.findMany({
            select: { id: true, name: true, nameJa: true }
        })
        const branchMap = new Map(branches.map(b => [b.id, b.nameJa || b.name]))

        // 납품 항목 구성
        const items = savedItems.map(item => ({
            corporationName: (item.corporationId ? corpMap.get(item.corporationId) : null) || item.corporationName || null,
            branchName: (item.branchId ? branchMap.get(item.branchId) : null) || item.branchName || null,
            address: item.address || null,
            acquisition: item.acquisition || 'FREE',
            kioskCount: item.kioskCount || 0,
            plateCount: item.plateCount || 0,
            desiredDeliveryDate: item.desiredDeliveryDate || null,
        }))

        // 합계 계산
        const totalKioskCount = items.reduce((sum, i) => sum + i.kioskCount, 0) || orderProcess.quantity || 0
        const totalPlateCount = items.reduce((sum, i) => sum + i.plateCount, 0)
        const subtotal = (kioskUnitPrice * totalKioskCount) + (plateUnitPrice * totalPlateCount)
        const totalAmount = Math.floor(subtotal * 1.1)

        // 수신 이메일 (request body에서 override 가능)
        let recipientEmails: string[] | undefined
        try {
            const body = await request.json()
            if (body.recipientEmails && Array.isArray(body.recipientEmails)) {
                recipientEmails = body.recipientEmails
            }
        } catch {
            // body가 없어도 OK
        }

        // 메일 발송
        const success = await sendOrderNotification({
            orderNumber: orderProcess.processNumber,
            title,
            requesterName: orderProcess.requesterName || '-',
            orderRequestDate,
            items: items.length > 0 ? items : [{
                corporationName: orderProcess.client?.name || null,
                branchName: null,
                address: null,
                acquisition: 'FREE',
                kioskCount: totalKioskCount,
                plateCount: totalPlateCount,
                desiredDeliveryDate: null,
            }],
            totalKioskCount,
            totalPlateCount,
            kioskUnitPrice,
            plateUnitPrice,
            subtotal,
            totalAmount,
            recipientEmails,
        })

        if (success) {
            // 발송 성공 → DB 업데이트
            await prisma.orderProcess.update({
                where: { id },
                data: {
                    emailNotified: true,
                    status: 'NOTIFIED',
                    step5CompletedAt: new Date(),
                }
            })
            return NextResponse.json({ success: true, message: 'メールを送信しました' })
        } else {
            return NextResponse.json({ success: false, message: 'メール送信に失敗しました。SMTP設定を確認してください。' }, { status: 500 })
        }
    } catch (error) {
        console.error('Order notification error:', error)
        return NextResponse.json({ message: 'サーバーエラー' }, { status: 500 })
    }
}
