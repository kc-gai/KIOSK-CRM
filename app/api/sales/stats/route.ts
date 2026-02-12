import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        // 전체 판매 데이터 조회
        const sales = await prisma.kioskSale.findMany({
            orderBy: { saleDate: 'asc' }
        })

        // 월별 집계 데이터 생성
        const monthlyStats: Record<string, {
            period: string
            free: number
            paid: number
            freeToPaid: number
            totalQuantity: number
            freeRevenue: number
            paidRevenue: number
            freeToPaidRevenue: number
            totalRevenue: number
        }> = {}

        sales.forEach(sale => {
            const date = new Date(sale.saleDate)
            const period = `${date.getFullYear()}/${date.getMonth() + 1}`

            if (!monthlyStats[period]) {
                monthlyStats[period] = {
                    period,
                    free: 0,
                    paid: 0,
                    freeToPaid: 0,
                    totalQuantity: 0,
                    freeRevenue: 0,
                    paidRevenue: 0,
                    freeToPaidRevenue: 0,
                    totalRevenue: 0
                }
            }

            const stats = monthlyStats[period]

            switch (sale.saleType) {
                case 'FREE':
                    stats.free += sale.quantity
                    stats.freeRevenue += sale.totalPrice || 0
                    break
                case 'PAID':
                    stats.paid += sale.quantity
                    stats.paidRevenue += sale.totalPrice || 0
                    break
                case 'FREE_TO_PAID':
                    stats.freeToPaid += sale.quantity
                    stats.freeToPaidRevenue += sale.totalPrice || 0
                    break
            }

            stats.totalQuantity += sale.quantity
            stats.totalRevenue += sale.totalPrice || 0
        })

        // 배열로 변환 및 정렬
        const monthlyData = Object.values(monthlyStats).sort((a, b) => {
            const [yearA, monthA] = a.period.split('/').map(Number)
            const [yearB, monthB] = b.period.split('/').map(Number)
            return yearA !== yearB ? yearA - yearB : monthA - monthB
        })

        // 총계 계산
        const totals = {
            free: sales.filter(s => s.saleType === 'FREE').reduce((sum, s) => sum + s.quantity, 0),
            paid: sales.filter(s => s.saleType === 'PAID').reduce((sum, s) => sum + s.quantity, 0),
            freeToPaid: sales.filter(s => s.saleType === 'FREE_TO_PAID').reduce((sum, s) => sum + s.quantity, 0),
            totalQuantity: sales.reduce((sum, s) => sum + s.quantity, 0),
            freeRevenue: sales.filter(s => s.saleType === 'FREE').reduce((sum, s) => sum + (s.totalPrice || 0), 0),
            paidRevenue: sales.filter(s => s.saleType === 'PAID').reduce((sum, s) => sum + (s.totalPrice || 0), 0),
            freeToPaidRevenue: sales.filter(s => s.saleType === 'FREE_TO_PAID').reduce((sum, s) => sum + (s.totalPrice || 0), 0),
            totalRevenue: sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0)
        }

        return NextResponse.json({
            monthly: monthlyData,
            totals
        })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
