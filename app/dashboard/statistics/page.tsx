'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { TrendingUp, MapPin, Truck, Monitor, Calendar, Download, RefreshCw, BarChart2, Table } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, LabelList
} from 'recharts'

type PartnerStat = {
    name: string
    count: number
    percent: number
}

type MonthlyOrder = {
    month: string
    count: number
}

type MonthlyKioskStat = {
    month: string
    freeCount: number
    leaseCount: number
    paidCount: number
    rentalCount: number
    totalCount: number
    freeSales: number
    leaseSales: number
    paidSales: number
    rentalSales: number
    totalSales: number
    // 하위호환용
    freeToPayCount: number
    freeToPaySales: number
}

type StatsData = {
    totalKiosks: number
    deployedKiosks: number
    inStockKiosks: number
    maintenanceKiosks: number
    retiredKiosks: number
    // acquisition 필드 기준 (기존 호환용)
    purchaseKiosks: number
    leaseKiosks: number
    leaseFreeKiosks: number
    freeKiosks: number
    paidKiosks: number
    rentalKiosks: number
    // Effective 취득형태별 (자산관리 페이지와 동일 로직)
    effectiveFreeKiosks?: number      // 무상: FREE/PURCHASE with salePrice=0
    effectiveLeaseKiosks?: number     // 리스: LEASE + LEASE_FREE
    effectivePaidKiosks?: number      // 유상: salePrice > 0
    effectivePaidRevenue?: number     // 유상 매출
    effectiveRentalKiosks?: number    // 렌탈: RENTAL
    totalOrders: number
    totalDeliveries: number
    completedDeliveries: number
    topPartners?: PartnerStat[]
    regionCount?: number
    monthlyOrders?: MonthlyOrder[]
    monthlyKioskStats?: MonthlyKioskStat[]
}

export default function StatisticsPage() {
    const t = useTranslations('statistics')
    const tc = useTranslations('common')
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [countViewMode, setCountViewMode] = useState<'chart' | 'table'>('chart')
    const [salesViewMode, setSalesViewMode] = useState<'chart' | 'table'>('chart')

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (dateFrom) params.append('dateFrom', dateFrom)
            if (dateTo) params.append('dateTo', dateTo)

            const res = await fetch(`/api/statistics?${params.toString()}`)
            if (res.ok) {
                setStats(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [dateFrom, dateTo])

    useEffect(() => {
        fetchStats()
    }, [])

    const handleApplyFilter = () => {
        fetchStats()
    }

    const handleExport = () => {
        if (!stats) return

        const csvContent = [
            [t('csvItem'), t('csvValue')],
            [t('csvTotalKiosks'), stats.totalKiosks],
            [t('csvDeployed'), stats.deployedKiosks],
            [t('csvInStock'), stats.inStockKiosks],
            [t('csvMaintenance'), stats.maintenanceKiosks],
            [t('csvRetired'), stats.retiredKiosks],
            [t('csvPurchase'), stats.purchaseKiosks],
            [t('csvLease'), stats.leaseKiosks],
            [t('csvTotalOrders'), stats.totalOrders],
            [t('csvTotalDeliveries'), stats.totalDeliveries],
            [t('csvCompletedDeliveries'), stats.completedDeliveries]
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `statistics-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const StatCard = ({ icon: Icon, title, value, subValue, color }: {
        icon: React.ElementType
        title: string
        value: string | number
        subValue?: string
        color: string
    }) => (
        <div className="card">
            <div className="card-body">
                <div className="d-flex align-items-center">
                    <div className={`rounded-circle bg-${color}-lt p-3 me-3`}>
                        <Icon size={24} className={`text-${color}`} />
                    </div>
                    <div>
                        <div className="text-muted small">{title}</div>
                        <div className="h2 mb-0">{value}</div>
                        {subValue && <div className="text-muted small">{subValue}</div>}
                    </div>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="container-xl">
                <div className="text-center py-5">
                    <div className="spinner-border" role="status"></div>
                    <div className="mt-2">{tc('loading')}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <div>
                            <h2 className="page-title">{t('title')}</h2>
                            <p className="text-muted">{t('salesMonitoring')}</p>
                        </div>
                    </div>
                    <div className="col-auto ms-auto d-flex gap-2 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <Calendar size={16} className="text-muted" />
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <span className="text-muted">~</span>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={handleApplyFilter}
                                disabled={loading}
                            >
                                {loading && <RefreshCw size={14} className="me-1" />}
                                {t('apply')}
                            </button>
                        </div>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={handleExport}
                            disabled={!stats}
                        >
                            <Download size={16} className="me-1" />
                            {t('export')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-sm-6 col-lg-3">
                    <StatCard
                        icon={Monitor}
                        title={t('assetCount')}
                        value={stats?.totalKiosks || 0}
                        subValue={`${t('deployed')}: ${stats?.deployedKiosks || 0}`}
                        color="blue"
                    />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard
                        icon={TrendingUp}
                        title={t('orderCount')}
                        value={stats?.totalOrders || 0}
                        color="green"
                    />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard
                        icon={Truck}
                        title={t('deliveryRate')}
                        value={stats?.totalDeliveries ? `${Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)}%` : '0%'}
                        subValue={`${stats?.completedDeliveries || 0}/${stats?.totalDeliveries || 0}`}
                        color="orange"
                    />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard
                        icon={MapPin}
                        title={t('byRegion')}
                        value={stats?.regionCount || 0}
                        subValue={t('regionUnit')}
                        color="purple"
                    />
                </div>
            </div>

            {/* 상세 통계 그리드 */}
            <div className="row row-deck row-cards">
                {/* 키오스크 상태별 현황 */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('kioskStatus')}</h3>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="border rounded p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted">{t('inStock')}</span>
                                            <span className="badge bg-secondary">{stats?.inStockKiosks || 0}</span>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar bg-secondary"
                                                style={{ width: `${((stats?.inStockKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="border rounded p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted">{t('deployed')}</span>
                                            <span className="badge bg-success">{stats?.deployedKiosks || 0}</span>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar bg-success"
                                                style={{ width: `${((stats?.deployedKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="border rounded p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted">{t('maintenance')}</span>
                                            <span className="badge bg-warning">{stats?.maintenanceKiosks || 0}</span>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar bg-warning"
                                                style={{ width: `${((stats?.maintenanceKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="border rounded p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted">{t('retired')}</span>
                                            <span className="badge bg-danger">{stats?.retiredKiosks || 0}</span>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar bg-danger"
                                                style={{ width: `${((stats?.retiredKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 취득형태별 현황 (자산관리 페이지와 동일 로직) */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('byAcquisition')}</h3>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-3">
                                    <div className="card bg-green-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-green">{stats?.effectiveFreeKiosks || 0}</div>
                                            <div className="text-muted small">무상</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="card bg-purple-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-purple">{stats?.effectiveLeaseKiosks || 0}</div>
                                            <div className="text-muted small">리스</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="card bg-orange-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-orange">{stats?.effectivePaidKiosks || 0}</div>
                                            <div className="text-muted small">유상</div>
                                            <div className="text-success small fw-bold">{(stats?.effectivePaidRevenue || 0).toLocaleString()}万円</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="card bg-cyan-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-cyan">{stats?.effectiveRentalKiosks || 0}</div>
                                            <div className="text-muted small">렌탈</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-green" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        무상
                                    </span>
                                    <span>{Math.round(((stats?.effectiveFreeKiosks || 0) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-purple" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        리스
                                    </span>
                                    <span>{Math.round(((stats?.effectiveLeaseKiosks || 0) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-orange" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        유상
                                    </span>
                                    <span>{Math.round(((stats?.effectivePaidKiosks || 0) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-cyan" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        렌탈
                                    </span>
                                    <span>{Math.round(((stats?.effectiveRentalKiosks || 0) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div
                                        className="progress-bar bg-green"
                                        style={{ width: `${((stats?.effectiveFreeKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                    <div
                                        className="progress-bar bg-purple"
                                        style={{ width: `${((stats?.effectiveLeaseKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                    <div
                                        className="progress-bar bg-orange"
                                        style={{ width: `${((stats?.effectivePaidKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                    <div
                                        className="progress-bar bg-cyan"
                                        style={{ width: `${((stats?.effectiveRentalKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 월별 키오스크 판매 현황 (대수) - 스택 바 차트 */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="card-title mb-0">{t('monthlyKioskSalesCount')}</h3>
                            <div className="btn-group btn-group-sm">
                                <button
                                    className={`btn ${countViewMode === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setCountViewMode('chart')}
                                >
                                    <BarChart2 size={16} />
                                </button>
                                <button
                                    className={`btn ${countViewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setCountViewMode('table')}
                                >
                                    <Table size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {stats?.monthlyKioskStats && stats.monthlyKioskStats.length > 0 ? (
                                countViewMode === 'chart' ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={stats.monthlyKioskStats}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="month"
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    const labels: Record<string, string> = {
                                                        paidCount: t('paid'),
                                                        leaseCount: t('lease'),
                                                        freeCount: t('free'),
                                                        rentalCount: t('rental')
                                                    }
                                                    return [value, labels[String(name)] || name]
                                                }}
                                                labelFormatter={(label) => `${label}`}
                                            />
                                            <Legend
                                                formatter={(value) => {
                                                    const labels: Record<string, string> = {
                                                        paidCount: t('paid'),
                                                        leaseCount: t('lease'),
                                                        freeCount: t('free'),
                                                        rentalCount: t('rental')
                                                    }
                                                    return labels[value] || value
                                                }}
                                            />
                                            <Bar dataKey="freeCount" stackId="a" fill="#2fb344" name="freeCount">
                                                <LabelList dataKey="freeCount" position="center" fill="#fff" fontSize={10} formatter={(value) => Number(value) > 0 ? value : ''} />
                                            </Bar>
                                            <Bar dataKey="leaseCount" stackId="a" fill="#ae3ec9" name="leaseCount">
                                                <LabelList dataKey="leaseCount" position="center" fill="#fff" fontSize={10} formatter={(value) => Number(value) > 0 ? value : ''} />
                                            </Bar>
                                            <Bar dataKey="paidCount" stackId="a" fill="#f59f00" name="paidCount">
                                                <LabelList dataKey="paidCount" position="center" fill="#fff" fontSize={10} formatter={(value) => Number(value) > 0 ? value : ''} />
                                            </Bar>
                                            <Bar dataKey="rentalCount" stackId="a" fill="#17a2b8" name="rentalCount">
                                                <LabelList dataKey="rentalCount" position="center" fill="#fff" fontSize={10} formatter={(value) => Number(value) > 0 ? value : ''} />
                                                <LabelList dataKey="totalCount" position="top" fill="#333" fontSize={11} fontWeight="bold" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="table table-sm table-bordered table-hover">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th className="text-center">{t('month')}</th>
                                                    <th className="text-end bg-success-lt">{t('free')}</th>
                                                    <th className="text-end bg-purple-lt">{t('lease')}</th>
                                                    <th className="text-end bg-warning-lt">{t('paid')}</th>
                                                    <th className="text-end bg-info-lt">{t('rental')}</th>
                                                    <th className="text-end bg-dark text-white">{t('total')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.monthlyKioskStats.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="text-center">{item.month}</td>
                                                        <td className="text-end">{item.freeCount || '-'}</td>
                                                        <td className="text-end">{item.leaseCount || '-'}</td>
                                                        <td className="text-end">{item.paidCount || '-'}</td>
                                                        <td className="text-end">{item.rentalCount || '-'}</td>
                                                        <td className="text-end fw-bold">{item.totalCount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                {/* 납품일 없는 키오스크 (월별 합계와 전체 합계의 차이) */}
                                                {(() => {
                                                    const monthlyFree = stats.monthlyKioskStats.reduce((sum, i) => sum + i.freeCount, 0)
                                                    const monthlyLease = stats.monthlyKioskStats.reduce((sum, i) => sum + (i.leaseCount || 0), 0)
                                                    const monthlyPaid = stats.monthlyKioskStats.reduce((sum, i) => sum + i.paidCount, 0)
                                                    const monthlyRental = stats.monthlyKioskStats.reduce((sum, i) => sum + (i.rentalCount || 0), 0)
                                                    const monthlyTotal = stats.monthlyKioskStats.reduce((sum, i) => sum + i.totalCount, 0)

                                                    const missingFree = (stats.effectiveFreeKiosks || 0) - monthlyFree
                                                    const missingLease = (stats.effectiveLeaseKiosks || 0) - monthlyLease
                                                    const missingPaid = (stats.effectivePaidKiosks || 0) - monthlyPaid
                                                    const missingRental = (stats.effectiveRentalKiosks || 0) - monthlyRental
                                                    const missingTotal = stats.totalKiosks - monthlyTotal

                                                    if (missingTotal > 0) {
                                                        return (
                                                            <tr className="table-warning">
                                                                <td className="text-center text-muted">(납품일 없음)</td>
                                                                <td className="text-end">{missingFree > 0 ? missingFree : '-'}</td>
                                                                <td className="text-end">{missingLease > 0 ? missingLease : '-'}</td>
                                                                <td className="text-end">{missingPaid > 0 ? missingPaid : '-'}</td>
                                                                <td className="text-end">{missingRental > 0 ? missingRental : '-'}</td>
                                                                <td className="text-end fw-bold">{missingTotal}</td>
                                                            </tr>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                                <tr className="table-dark">
                                                    <th className="text-center">{t('total')}</th>
                                                    <th className="text-end">{stats.effectiveFreeKiosks || 0}</th>
                                                    <th className="text-end">{stats.effectiveLeaseKiosks || 0}</th>
                                                    <th className="text-end">{stats.effectivePaidKiosks || 0}</th>
                                                    <th className="text-end">{stats.effectiveRentalKiosks || 0}</th>
                                                    <th className="text-end">{stats.totalKiosks}</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <TrendingUp size={48} className="mb-3 opacity-50" />
                                    <div>{t('noData')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 월별 키오스크 판매 현황 (매출) - 스택 바 + 라인 차트 */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="card-title mb-0">{t('monthlyKioskSalesAmount')}</h3>
                            <div className="btn-group btn-group-sm">
                                <button
                                    className={`btn ${salesViewMode === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSalesViewMode('chart')}
                                >
                                    <BarChart2 size={16} />
                                </button>
                                <button
                                    className={`btn ${salesViewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSalesViewMode('table')}
                                >
                                    <Table size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {stats?.monthlyKioskStats && stats.monthlyKioskStats.length > 0 ? (
                                salesViewMode === 'chart' ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart
                                            data={stats.monthlyKioskStats.map((item, idx, arr) => ({
                                                ...item,
                                                // salePrice가 이미 만엔 단위로 저장되어 있음
                                                paidSalesMan: item.paidSales,
                                                totalSalesMan: item.totalSales,
                                                // 누적 매출
                                                cumulativeSales: arr.slice(0, idx + 1).reduce((sum, i) => sum + i.totalSales, 0)
                                            }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="month"
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    const labels: Record<string, string> = {
                                                        paidSalesMan: t('paidSales'),
                                                        cumulativeSales: t('cumulativeSales')
                                                    }
                                                    return [`${Number(value).toLocaleString()}${t('manYen')}`, labels[String(name)] || name]
                                                }}
                                                labelFormatter={(label) => `${label}`}
                                            />
                                            <Legend
                                                formatter={(value) => {
                                                    const labels: Record<string, string> = {
                                                        paidSalesMan: t('paidSales'),
                                                        cumulativeSales: t('cumulativeSales')
                                                    }
                                                    return labels[value] || value
                                                }}
                                            />
                                            <Bar yAxisId="left" dataKey="paidSalesMan" fill="#f59f00" name="paidSalesMan">
                                                <LabelList dataKey="paidSalesMan" position="top" fill="#333" fontSize={10} formatter={(value) => Number(value) > 0 ? Number(value).toLocaleString() : ''} />
                                            </Bar>
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="cumulativeSales"
                                                stroke="#d63939"
                                                strokeWidth={2}
                                                dot={{ fill: '#d63939' }}
                                                name="cumulativeSales"
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="table table-sm table-bordered table-hover">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th className="text-center">{t('month')}</th>
                                                    <th className="text-end bg-warning-lt">{t('paidSales')}</th>
                                                    <th className="text-end bg-danger-lt">{t('cumulativeSales')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.monthlyKioskStats.map((item, idx, arr) => {
                                                    const cumulative = arr.slice(0, idx + 1).reduce((sum, i) => sum + i.totalSales, 0)
                                                    return (
                                                        <tr key={idx}>
                                                            <td className="text-center">{item.month}</td>
                                                            <td className="text-end">{item.paidSales ? item.paidSales.toLocaleString() : '-'}</td>
                                                            <td className="text-end fw-bold">{cumulative.toLocaleString()}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                            <tfoot>
                                                {/* 납품일 없는 유상 키오스크 매출 */}
                                                {(() => {
                                                    const monthlyPaidSales = stats.monthlyKioskStats.reduce((sum, i) => sum + i.paidSales, 0)
                                                    const missingSales = (stats.effectivePaidRevenue || 0) - monthlyPaidSales
                                                    if (missingSales > 0) {
                                                        return (
                                                            <tr className="table-warning">
                                                                <td className="text-center text-muted">(납품일 없음)</td>
                                                                <td className="text-end">{missingSales.toLocaleString()}</td>
                                                                <td className="text-end">-</td>
                                                            </tr>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                                <tr className="table-dark">
                                                    <th className="text-center">{t('total')}</th>
                                                    <th className="text-end">
                                                        {(stats.effectivePaidRevenue || 0).toLocaleString()}万円
                                                    </th>
                                                    <th className="text-end">-</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <TrendingUp size={48} className="mb-3 opacity-50" />
                                    <div>{t('noData')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 월별 발주 추이 */}
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('monthlyOrders')}</h3>
                        </div>
                        <div className="card-body">
                            {stats?.monthlyOrders && stats.monthlyOrders.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>{t('month')}</th>
                                                <th className="text-end">{t('orderCount')}</th>
                                                <th style={{ width: '50%' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.monthlyOrders.map((item, idx) => {
                                                const maxCount = Math.max(...stats.monthlyOrders!.map(o => o.count))
                                                return (
                                                    <tr key={idx}>
                                                        <td>{item.month}</td>
                                                        <td className="text-end">{item.count}</td>
                                                        <td>
                                                            <div className="progress" style={{ height: '16px' }}>
                                                                <div
                                                                    className="progress-bar bg-primary"
                                                                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <TrendingUp size={48} className="mb-3 opacity-50" />
                                    <div>{t('noData')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 상위 거래처 */}
                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('topPartners')}</h3>
                        </div>
                        <div className="list-group list-group-flush">
                            {stats?.topPartners && stats.topPartners.length > 0 ? (
                                stats.topPartners.map((partner, idx) => (
                                    <div key={idx} className="list-group-item d-flex align-items-center">
                                        <div className="flex-fill">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span>{partner.name}</span>
                                                <span className="text-muted small">
                                                    {partner.count}{t('unitKiosk')} ({partner.percent}%)
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '4px' }}>
                                                <div
                                                    className="progress-bar bg-primary"
                                                    style={{ width: `${partner.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="list-group-item text-center text-muted py-4">
                                    {t('noData')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
