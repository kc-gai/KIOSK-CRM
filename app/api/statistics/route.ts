import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: 통계 데이터 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const dateFrom = searchParams.get('dateFrom')
        const dateTo = searchParams.get('dateTo')

        // 날짜 필터 조건
        const dateFilter = dateFrom && dateTo ? {
            createdAt: {
                gte: new Date(dateFrom),
                lte: new Date(dateTo)
            }
        } : {}

        // 키오스크 통계
        const [
            totalKiosks,
            deployedKiosks,
            inStockKiosks,
            maintenanceKiosks,
            retiredKiosks
        ] = await Promise.all([
            prisma.kiosk.count(),
            prisma.kiosk.count({ where: { status: 'DEPLOYED' } }),
            prisma.kiosk.count({ where: { status: 'IN_STOCK' } }),
            prisma.kiosk.count({ where: { status: 'MAINTENANCE' } }),
            prisma.kiosk.count({ where: { status: 'RETIRED' } })
        ])

        // 취득형태별 통계 (모든 형태 포함)
        const [purchaseKiosks, leaseKiosks, leaseFreeKiosks, freeKiosks, paidKiosks, rentalKiosks] = await Promise.all([
            prisma.kiosk.count({ where: { acquisition: 'PURCHASE' } }),
            prisma.kiosk.count({ where: { acquisition: 'LEASE' } }),
            prisma.kiosk.count({ where: { acquisition: 'LEASE_FREE' } }),
            prisma.kiosk.count({ where: { acquisition: 'FREE' } }),
            prisma.kiosk.count({ where: { acquisition: 'PAID' } }),
            prisma.kiosk.count({ where: { acquisition: 'RENTAL' } })
        ])

        // 발주 통계
        const totalOrders = await prisma.orderProcess.count({
            where: dateFilter
        })

        // 납품 통계
        const [totalDeliveries, completedDeliveries] = await Promise.all([
            prisma.deliveryProcess.count({ where: dateFilter }),
            prisma.deliveryProcess.count({
                where: {
                    ...dateFilter,
                    status: 'COMPLETED'
                }
            })
        ])

        // 상위 거래처
        const topPartners = await prisma.kiosk.groupBy({
            by: ['currentPartnerId'],
            _count: {
                id: true
            },
            where: {
                currentPartnerId: { not: null }
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        })

        // 거래처 이름 조회
        const partnerIds = topPartners.map(p => p.currentPartnerId).filter((id): id is string => id !== null)
        const partners = await prisma.partner.findMany({
            where: { id: { in: partnerIds } },
            select: { id: true, name: true }
        })

        const topPartnersWithNames = topPartners.map(p => {
            const partner = partners.find(pr => pr.id === p.currentPartnerId)
            return {
                name: partner?.name || '미지정',
                count: p._count.id,
                percent: totalKiosks > 0 ? Math.round((p._count.id / totalKiosks) * 100) : 0
            }
        })

        // 지역별 통계
        const regionStats = await prisma.kiosk.groupBy({
            by: ['regionCode'],
            _count: {
                id: true
            },
            where: {
                regionCode: { not: null }
            }
        })

        // 월별 발주 추이 (최근 6개월)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyOrders = await prisma.orderProcess.groupBy({
            by: ['createdAt'],
            _count: {
                id: true
            },
            where: {
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // 월별로 그룹화
        const monthlyOrdersGrouped: Record<string, number> = {}
        monthlyOrders.forEach(order => {
            const monthKey = new Date(order.createdAt).toISOString().slice(0, 7) // YYYY-MM
            monthlyOrdersGrouped[monthKey] = (monthlyOrdersGrouped[monthKey] || 0) + order._count.id
        })

        return NextResponse.json({
            // 기본 통계
            totalKiosks,
            deployedKiosks,
            inStockKiosks,
            maintenanceKiosks,
            retiredKiosks,
            // 취득형태별 (기존 호환성 + 신규)
            purchaseKiosks,
            leaseKiosks: leaseKiosks + leaseFreeKiosks, // LEASE + LEASE_FREE 합산
            leaseFreeKiosks,
            freeKiosks,
            paidKiosks,
            rentalKiosks,
            totalOrders,
            totalDeliveries,
            completedDeliveries,

            // 추가 통계
            topPartners: topPartnersWithNames,
            regionCount: regionStats.length,
            regionStats,
            monthlyOrders: Object.entries(monthlyOrdersGrouped).map(([month, count]) => ({
                month,
                count
            }))
        })
    } catch (error) {
        console.error('Failed to fetch statistics:', error)
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }
}
