import { prisma } from "@/lib/prisma"
import { DashboardCharts } from "./components/DashboardCharts"
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
    const t = await getTranslations('dashboard')

    // 1. Fetch Key Metrics
    const totalKiosks = await prisma.kiosk.count()
    const deployedKiosks = await prisma.kiosk.count({ where: { status: 'DEPLOYED' } })
    const utilizationRate = totalKiosks > 0 ? ((deployedKiosks / totalKiosks) * 100).toFixed(1) : '0'

    // KC자산 (판매가격 0) / 판매 (판매가격 0이 아님) 개수
    const kcAssetCount = await prisma.kiosk.count({ where: { salePrice: 0 } })
    const soldCount = await prisma.kiosk.count({ where: { salePrice: { not: 0 } } })

    // 2. Fetch Data for Charts - Kiosk 기반 통계
    const allKiosksWithFC = await prisma.kiosk.findMany({
        select: {
            createdAt: true,
            branch: {
                select: {
                    corporation: {
                        select: {
                            fc: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    // 월별 키오스크 등록 추이
    const monthlyMap = new Map<string, number>()
    allKiosksWithFC.forEach(k => {
        const d = new Date(k.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1)
    })
    const monthlyData = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, orders]) => ({ name, orders }))

    // 브랜드(FC)별 키오스크 점유율
    const brandCountMap = new Map<string, { name: string, nameJa: string | null, value: number }>()
    allKiosksWithFC.forEach(k => {
        const fc = k.branch?.corporation?.fc
        const fcKey = fc?.id || "unassigned"
        const fcName = fc?.name || "미배정"

        const existing = brandCountMap.get(fcKey)
        if (existing) {
            existing.value += 1
        } else {
            brandCountMap.set(fcKey, {
                name: fcName,
                nameJa: null,  // FC에는 nameJa가 없으므로 null
                value: 1
            })
        }
    })
    const partnerData = Array.from(brandCountMap.values())

    // 거래처 수
    const corporationsCount = await prisma.corporation.count()

    // Regional Distribution - 지역 마스터 데이터 조회
    const regions = await prisma.region.findMany({
        select: { code: true, name: true, nameJa: true }
    })
    const regionNameMap = new Map<string, { name: string; nameJa: string | null }>()
    regions.forEach(r => {
        regionNameMap.set(r.code, { name: r.name, nameJa: r.nameJa })
    })

    // Area(관할사무실) 마스터 데이터 조회
    const areas = await prisma.area.findMany({
        select: { code: true, name: true, nameJa: true }
    })
    const areaNameMap = new Map<string, { name: string; nameJa: string | null }>()
    areas.forEach(a => {
        areaNameMap.set(a.code, { name: a.name, nameJa: a.nameJa })
    })

    const allKiosks = await prisma.kiosk.findMany({
        select: { regionCode: true, areaCode: true }
    })

    // Region별 통계 - 모든 지역 마스터 기반으로 생성 (키오스크가 없는 지역도 0으로 표시)
    const regionCountMap = new Map<string, number>()
    allKiosks.forEach(k => {
        const region = k.regionCode || "unassigned"
        regionCountMap.set(region, (regionCountMap.get(region) || 0) + 1)
    })
    // 모든 지역 마스터를 기반으로 데이터 생성
    const regionData = regions.map(region => ({
        code: region.code,
        name: region.name,
        nameJa: region.nameJa,
        value: regionCountMap.get(region.code) || 0
    }))
    // 미배정 키오스크가 있으면 추가
    const unassignedRegionCount = regionCountMap.get("unassigned") || 0
    if (unassignedRegionCount > 0) {
        regionData.push({
            code: "unassigned",
            name: "미배정",
            nameJa: "未配属",
            value: unassignedRegionCount
        })
    }

    // Area별 통계 - 모든 관할사무실 마스터 기반으로 생성
    const areaCountMap = new Map<string, number>()
    allKiosks.forEach(k => {
        const area = k.areaCode || "unassigned"
        areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1)
    })
    // 모든 관할사무실 마스터를 기반으로 데이터 생성
    const areaData = areas.map(area => ({
        code: area.code,
        name: area.name,
        nameJa: area.nameJa,
        value: areaCountMap.get(area.code) || 0
    }))
    // 미배정 키오스크가 있으면 추가
    const unassignedAreaCount = areaCountMap.get("unassigned") || 0
    if (unassignedAreaCount > 0) {
        areaData.push({
            code: "unassigned",
            name: "미배정",
            nameJa: "未配属",
            value: unassignedAreaCount
        })
    }

    // 3. 실시간 운영 통계
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    // 이번 달 발주 건수
    const monthlyOrderCount = await prisma.orderProcess.count({
        where: { createdAt: { gte: startOfMonth } }
    })

    // 진행 중인 발주 프로세스
    const pendingOrderProcesses = await prisma.orderProcess.count({
        where: { status: 'IN_PROGRESS' }
    })

    // 대기 중인 납품 (배송 대기)
    const pendingDeliveries = await prisma.kiosk.count({
        where: { deliveryStatus: 'PENDING' }
    })

    // 배송 중인 키오스크
    const shippingKiosks = await prisma.kiosk.count({
        where: { deliveryStatus: 'SHIPPED' }
    })

    // 수리 중인 키오스크
    const repairingKiosks = await prisma.kioskRepair.count({
        where: { status: { in: ['RECEIVED', 'DIAGNOSING', 'REPAIRING'] } }
    })

    // 대여 중인 샘플
    const onLoanSamples = await prisma.sampleLoan.count({
        where: { status: 'ON_LOAN' }
    })

    // 이번 주 납품 완료
    const weeklyDelivered = await prisma.kiosk.count({
        where: {
            deliveryStatus: 'DELIVERED',
            updatedAt: { gte: startOfWeek }
        }
    })

    // Quick Info 데이터
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 최근 7일 등록 자산 (TEMP- 시리얼 번호 제외 - 발주 대기 자산 제외)
    const recentAssets = await prisma.kiosk.findMany({
        where: {
            createdAt: { gte: sevenDaysAgo },
            NOT: {
                serialNumber: { startsWith: 'TEMP-' }
            }
        },
        select: {
            serialNumber: true,
            createdAt: true,
            branch: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    // 연체 샘플 대여 (반납 예정일 지남)
    const overdueLoans = await prisma.sampleLoan.count({
        where: {
            status: 'ON_LOAN',
            expectedReturnDate: { lt: now }
        }
    })

    // 수리 대기 중 (입고 상태)
    const pendingRepairs = await prisma.kioskRepair.count({
        where: { status: 'RECEIVED' }
    })

    const quickInfo = {
        recentAssets: recentAssets.map(a => ({
            serialNumber: a.serialNumber,
            branchName: a.branch?.name || null,
            createdAt: a.createdAt
        })),
        weeklyDelivered,
        overdueLoans,
        pendingRepairs
    }

    return (
        <div className="page-header d-print-none">
            <div className="container-xl">
                <div className="page-pretitle">Overview</div>
                <h2 className="page-title">{t('title')}</h2>
            </div>

            {/* Stats Cards */}
            <div className="container-xl mt-4">
                <div className="row row-deck row-cards">
                    {/* 실시간 운영 현황 */}
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <i className="ti ti-activity me-2"></i>
                                    {t('realtimeStatus')}
                                </h3>
                                <div className="card-actions">
                                    <span className="badge bg-green-lt">Live</span>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    {/* 이번 달 발주 */}
                                    <div className="col-6 col-sm-4 col-lg-2">
                                        <div className="card card-sm bg-blue-lt">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar bg-blue text-white me-3">
                                                        <i className="ti ti-calendar"></i>
                                                    </span>
                                                    <div>
                                                        <div className="h2 mb-0">{monthlyOrderCount}</div>
                                                        <div className="text-muted small">{t('monthlyOrder')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 진행 중 발주 */}
                                    <div className="col-6 col-sm-4 col-lg-2">
                                        <div className="card card-sm bg-yellow-lt">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar bg-yellow text-white me-3">
                                                        <i className="ti ti-loader"></i>
                                                    </span>
                                                    <div>
                                                        <div className="h2 mb-0">{pendingOrderProcesses}</div>
                                                        <div className="text-muted small">{t('inProgressOrder')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 대기 중 납품 */}
                                    <div className="col-6 col-sm-4 col-lg-2">
                                        <div className="card card-sm bg-orange-lt">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar bg-orange text-white me-3">
                                                        <i className="ti ti-clock"></i>
                                                    </span>
                                                    <div>
                                                        <div className="h2 mb-0">{pendingDeliveries}</div>
                                                        <div className="text-muted small">{t('pendingDelivery')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 배송 중 */}
                                    <div className="col-6 col-sm-4 col-lg-2">
                                        <div className="card card-sm bg-cyan-lt">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar bg-cyan text-white me-3">
                                                        <i className="ti ti-truck-delivery"></i>
                                                    </span>
                                                    <div>
                                                        <div className="h2 mb-0">{shippingKiosks}</div>
                                                        <div className="text-muted small">{t('shipping')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 수리 중 */}
                                    <div className="col-6 col-sm-4 col-lg-2">
                                        <div className="card card-sm bg-red-lt">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar bg-red text-white me-3">
                                                        <i className="ti ti-tool"></i>
                                                    </span>
                                                    <div>
                                                        <div className="h2 mb-0">{repairingKiosks}</div>
                                                        <div className="text-muted small">{t('repairing')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 샘플 대여 중 */}
                                    <div className="col-6 col-sm-4 col-lg-2">
                                        <div className="card card-sm bg-purple-lt">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar bg-purple text-white me-3">
                                                        <i className="ti ti-package"></i>
                                                    </span>
                                                    <div>
                                                        <div className="h2 mb-0">{onLoanSamples}</div>
                                                        <div className="text-muted small">{t('sampleLoan')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Kiosks */}
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('totalKiosks')}</div>
                                    <div className="ms-auto lh-1">
                                        <span className="badge bg-blue-lt">
                                            <i className="ti ti-device-desktop me-1"></i>
                                            Total
                                        </span>
                                    </div>
                                </div>
                                <div className="h1 mb-1">{totalKiosks}</div>
                                <div className="text-muted small mb-2">
                                    ({t('kcAsset')} {kcAssetCount} / {t('sold')} {soldCount})
                                </div>
                                <div className="d-flex mb-2">
                                    <div className="text-muted">{t('totalKiosksDesc')}</div>
                                </div>
                                <div className="progress progress-sm">
                                    <div className="progress-bar bg-blue" style={{width: '100%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deployed */}
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('deployed')}</div>
                                    <div className="ms-auto lh-1">
                                        <span className="badge bg-green-lt">
                                            <i className="ti ti-check me-1"></i>
                                            Active
                                        </span>
                                    </div>
                                </div>
                                <div className="h1 mb-3">{deployedKiosks}</div>
                                <div className="d-flex mb-2">
                                    <div className="text-muted">{t('deployedDesc')}</div>
                                </div>
                                <div className="progress progress-sm">
                                    <div className="progress-bar bg-green" style={{width: `${utilizationRate}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Corporations */}
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('totalCorporations')}</div>
                                    <div className="ms-auto lh-1">
                                        <span className="badge bg-yellow-lt">
                                            <i className="ti ti-building me-1"></i>
                                            Partners
                                        </span>
                                    </div>
                                </div>
                                <div className="h1 mb-3">{corporationsCount}</div>
                                <div className="d-flex mb-2">
                                    <div className="text-muted">{t('totalCorporationsDesc')}</div>
                                </div>
                                <div className="progress progress-sm">
                                    <div className="progress-bar bg-yellow" style={{width: '100%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Utilization */}
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('utilization')}</div>
                                    <div className="ms-auto lh-1">
                                        <span className="badge bg-purple-lt">
                                            <i className="ti ti-percentage me-1"></i>
                                            Rate
                                        </span>
                                    </div>
                                </div>
                                <div className="h1 mb-3">{utilizationRate}%</div>
                                <div className="d-flex mb-2">
                                    <div className="text-muted">{t('utilizationDesc')}</div>
                                </div>
                                <div className="progress progress-sm">
                                    <div className="progress-bar bg-purple" style={{width: `${utilizationRate}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section with Links */}
            <div className="container-xl mt-4">
                <DashboardCharts
                    monthlyData={monthlyData}
                    partnerData={partnerData}
                    regionData={regionData}
                    areaData={areaData}
                    quickInfo={quickInfo}
                />
            </div>

        </div>
    )
}
