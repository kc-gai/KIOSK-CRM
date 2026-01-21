'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { TrendingUp, MapPin, Building2, Truck, Monitor, Calendar, Download, RefreshCw } from 'lucide-react'

type PartnerStat = {
    name: string
    count: number
    percent: number
}

type MonthlyOrder = {
    month: string
    count: number
}

type StatsData = {
    totalKiosks: number
    deployedKiosks: number
    inStockKiosks: number
    maintenanceKiosks: number
    retiredKiosks: number
    purchaseKiosks: number
    leaseKiosks: number
    leaseFreeKiosks: number
    freeKiosks: number
    paidKiosks: number
    rentalKiosks: number
    totalOrders: number
    totalDeliveries: number
    completedDeliveries: number
    topPartners?: PartnerStat[]
    regionCount?: number
    monthlyOrders?: MonthlyOrder[]
}

export default function StatisticsPage() {
    const t = useTranslations('statistics')
    const tc = useTranslations('common')
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

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

                {/* 취득형태별 현황 */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('byAcquisition')}</h3>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-4">
                                    <div className="card bg-green-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-green">{(stats?.freeKiosks || 0) + (stats?.leaseFreeKiosks || 0)}</div>
                                            <div className="text-muted small">무상</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="card bg-purple-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-purple">{stats?.leaseKiosks || 0}</div>
                                            <div className="text-muted small">리스</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="card bg-orange-lt">
                                        <div className="card-body text-center py-3">
                                            <div className="h2 mb-1 text-orange">{(stats?.paidKiosks || 0) + (stats?.purchaseKiosks || 0)}</div>
                                            <div className="text-muted small">유상</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-green" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        무상 (FREE + LEASE_FREE)
                                    </span>
                                    <span>{Math.round((((stats?.freeKiosks || 0) + (stats?.leaseFreeKiosks || 0)) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-purple" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        리스 (LEASE)
                                    </span>
                                    <span>{Math.round(((stats?.leaseKiosks || 0) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1">
                                        <span className="badge bg-orange" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                        유상 (PAID + PURCHASE)
                                    </span>
                                    <span>{Math.round((((stats?.paidKiosks || 0) + (stats?.purchaseKiosks || 0)) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                </div>
                                {(stats?.rentalKiosks || 0) > 0 && (
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="d-flex align-items-center gap-1">
                                            <span className="badge bg-cyan" style={{ width: '10px', height: '10px', padding: 0 }}></span>
                                            렌탈 (RENTAL)
                                        </span>
                                        <span>{Math.round(((stats?.rentalKiosks || 0) / (stats?.totalKiosks || 1)) * 100)}%</span>
                                    </div>
                                )}
                                <div className="progress" style={{ height: '8px' }}>
                                    <div
                                        className="progress-bar bg-green"
                                        style={{ width: `${(((stats?.freeKiosks || 0) + (stats?.leaseFreeKiosks || 0)) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                    <div
                                        className="progress-bar bg-purple"
                                        style={{ width: `${((stats?.leaseKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                    <div
                                        className="progress-bar bg-orange"
                                        style={{ width: `${(((stats?.paidKiosks || 0) + (stats?.purchaseKiosks || 0)) / (stats?.totalKiosks || 1)) * 100}%` }}
                                    />
                                    {(stats?.rentalKiosks || 0) > 0 && (
                                        <div
                                            className="progress-bar bg-cyan"
                                            style={{ width: `${((stats?.rentalKiosks || 0) / (stats?.totalKiosks || 1)) * 100}%` }}
                                        />
                                    )}
                                </div>
                            </div>
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
