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

        // 취득형태별 통계 (acquisition 필드 기준 - 기존 호환용)
        const [purchaseKiosks, leaseKiosks, leaseFreeKiosks, freeKiosks, paidKiosks, rentalKiosks] = await Promise.all([
            prisma.kiosk.count({ where: { acquisition: 'PURCHASE' } }),
            prisma.kiosk.count({ where: { acquisition: 'LEASE' } }),
            prisma.kiosk.count({ where: { acquisition: 'LEASE_FREE' } }),
            prisma.kiosk.count({ where: { acquisition: 'FREE' } }),
            prisma.kiosk.count({ where: { acquisition: 'PAID' } }),
            prisma.kiosk.count({ where: { acquisition: 'RENTAL' } })
        ])

        // Effective 취득형태별 통계 (자산관리 페이지와 동일한 로직)
        // 무상: salePrice가 0 또는 null이고, acquisition이 FREE 또는 PURCHASE
        // 리스: acquisition이 LEASE 또는 LEASE_FREE
        // 유상: salePrice > 0 (acquisition과 무관)
        // 렌탈: acquisition이 RENTAL
        const effectiveFreeKiosks = await prisma.kiosk.count({
            where: {
                OR: [
                    { salePrice: null },
                    { salePrice: 0 }
                ],
                acquisition: { in: ['FREE', 'PURCHASE'] }
            }
        })

        const effectiveLeaseKiosks = await prisma.kiosk.count({
            where: { acquisition: { in: ['LEASE', 'LEASE_FREE'] } }
        })

        const effectivePaidKiosks = await prisma.kiosk.count({
            where: { salePrice: { gt: 0 } }
        })

        const effectivePaidRevenue = await prisma.kiosk.aggregate({
            _sum: { salePrice: true },
            where: { salePrice: { gt: 0 } }
        })

        const effectiveRentalKiosks = await prisma.kiosk.count({
            where: { acquisition: 'RENTAL' }
        })

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

        // 월별 키오스크 판매 현황 (취득형태별 대수 및 매출)
        // 모든 키오스크 조회 (deliveryDate 기준)
        const allKiosks = await prisma.kiosk.findMany({
            select: {
                id: true,
                acquisition: true,
                salePrice: true,
                deliveryDate: true,
                createdAt: true
            }
        })

        // 월별 데이터 구조화
        // 자산관리 페이지와 동일한 로직 적용:
        // - 무상: salePrice가 0 또는 null이고, acquisition이 FREE 또는 PURCHASE
        // - 리스: acquisition이 LEASE 또는 LEASE_FREE
        // - 유상: salePrice > 0 (acquisition과 무관)
        // - 렌탈: acquisition이 RENTAL
        type MonthlyKioskStat = {
            month: string
            freeCount: number      // 무상 (FREE + PURCHASE with salePrice=0)
            leaseCount: number     // 리스 (LEASE + LEASE_FREE)
            paidCount: number      // 유상 (salePrice > 0)
            rentalCount: number    // 렌탈
            totalCount: number
            freeSales: number      // 무상 매출 (0)
            leaseSales: number     // 리스 매출 (0)
            paidSales: number      // 유상 매출
            rentalSales: number    // 렌탈 매출
            totalSales: number
            // 하위호환용 (기존 freeToPayCount, freeToPaySales는 0으로 유지)
            freeToPayCount: number
            freeToPaySales: number
        }

        const monthlyKioskStats: Record<string, MonthlyKioskStat> = {}

        // Effective acquisition 계산 함수 (자산관리 페이지와 동일)
        // salePrice > 0이면 무조건 유상으로 처리
        const getEffectiveType = (kiosk: { acquisition: string, salePrice: number | null }) => {
            // salePrice > 0이면 무조건 유상
            if (kiosk.salePrice && kiosk.salePrice > 0) {
                return 'PAID'
            }
            // 리스 계열
            if (kiosk.acquisition === 'LEASE' || kiosk.acquisition === 'LEASE_FREE') {
                return 'LEASE'
            }
            // 렌탈
            if (kiosk.acquisition === 'RENTAL') {
                return 'RENTAL'
            }
            // 나머지는 무상 (FREE, PURCHASE with salePrice=0)
            return 'FREE'
        }

        // 키오스크별 월별 통계 (납품일 기준)
        // 자산관리 페이지와 동일한 로직: salePrice > 0이면 유상
        allKiosks.forEach(kiosk => {
            // deliveryDate가 없으면 스킵
            if (!kiosk.deliveryDate) {
                return
            }

            const deliveryDate = new Date(kiosk.deliveryDate)
            const monthKey = deliveryDate.toISOString().slice(0, 7)

            if (!monthlyKioskStats[monthKey]) {
                monthlyKioskStats[monthKey] = {
                    month: monthKey,
                    freeCount: 0,
                    leaseCount: 0,
                    paidCount: 0,
                    rentalCount: 0,
                    totalCount: 0,
                    freeSales: 0,
                    leaseSales: 0,
                    paidSales: 0,
                    rentalSales: 0,
                    totalSales: 0,
                    freeToPayCount: 0,
                    freeToPaySales: 0
                }
            }

            const stat = monthlyKioskStats[monthKey]
            const price = kiosk.salePrice || 0

            // effective type 기준으로 집계 (납품일과 무관하게 salePrice > 0이면 유상)
            const effectiveType = getEffectiveType(kiosk)

            switch (effectiveType) {
                case 'PAID':
                    stat.paidCount++
                    stat.paidSales += price
                    stat.totalSales += price
                    break
                case 'LEASE':
                    stat.leaseCount++
                    break
                case 'RENTAL':
                    stat.rentalCount++
                    break
                case 'FREE':
                default:
                    stat.freeCount++
                    break
            }
            stat.totalCount++
        })

        // 정렬된 월별 통계 배열
        const monthlyKioskStatsArray = Object.values(monthlyKioskStats)
            .sort((a, b) => a.month.localeCompare(b.month))

        return NextResponse.json({
            // 기본 통계
            totalKiosks,
            deployedKiosks,
            inStockKiosks,
            maintenanceKiosks,
            retiredKiosks,
            // 취득형태별 (acquisition 필드 기준 - 기존 호환용)
            purchaseKiosks,
            leaseKiosks: leaseKiosks + leaseFreeKiosks, // LEASE + LEASE_FREE 합산
            leaseFreeKiosks,
            freeKiosks,
            paidKiosks,
            rentalKiosks,
            // Effective 취득형태별 (자산관리 페이지와 동일 로직)
            effectiveFreeKiosks,      // 무상: FREE/PURCHASE with salePrice=0
            effectiveLeaseKiosks,     // 리스: LEASE + LEASE_FREE
            effectivePaidKiosks,      // 유상: salePrice > 0
            effectivePaidRevenue: effectivePaidRevenue._sum.salePrice || 0, // 유상 매출
            effectiveRentalKiosks,    // 렌탈: RENTAL
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
            })),
            // 월별 키오스크 판매 현황 (대수 및 매출)
            monthlyKioskStats: monthlyKioskStatsArray
        })
    } catch (error) {
        console.error('Failed to fetch statistics:', error)
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }
}
