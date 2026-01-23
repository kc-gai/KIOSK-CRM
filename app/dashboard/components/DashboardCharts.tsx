'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LabelList
} from "recharts"
import { useTranslations, useLocale } from 'next-intl'

type RegionDataItem = {
    code: string
    name: string
    nameJa: string | null
    value: number
}

type AreaDataItem = {
    code: string
    name: string
    nameJa: string | null
    value: number
}

type PartnerDataItem = {
    name: string
    nameJa: string | null
    value: number
}

type QuickInfoItem = {
    serialNumber: string | null
    branchName: string | null
    createdAt: Date
}

type QuickInfoData = {
    recentAssets: QuickInfoItem[]
    weeklyDelivered: number
    overdueLoans: number
    pendingRepairs: number
}

type DashboardChartsProps = {
    monthlyData: any[]
    partnerData: PartnerDataItem[]
    regionData: RegionDataItem[]
    areaData: AreaDataItem[]
    quickInfo: QuickInfoData
}

const COLORS = ['#206bc4', '#4299e1', '#45aaf2', '#5eba00', '#fab005', '#f76707', '#ae3ec9', '#d63939', '#0ca678', '#74b816']

// 관할사무실별 고유 색상
const AREA_COLORS = [
    '#206bc4', // 파랑
    '#5eba00', // 초록
    '#f76707', // 주황
    '#ae3ec9', // 보라
    '#d63939', // 빨강
    '#0ca678', // 청록
    '#fab005', // 노랑
    '#74b816', // 연두
    '#4299e1', // 하늘
    '#e91e63', // 분홍
]

export function DashboardCharts({ monthlyData, partnerData, regionData, areaData, quickInfo }: DashboardChartsProps) {
    const t = useTranslations('dashboard')
    const locale = useLocale()
    const [isMounted, setIsMounted] = useState(false)
    const [regionTab, setRegionTab] = useState<'region' | 'area'>('area')

    // 지역 데이터를 locale에 맞게 변환
    const localizedRegionData = useMemo(() => {
        return regionData.map(item => ({
            ...item,
            displayName: locale === 'ja' ? (item.nameJa || item.name) : item.name
        }))
    }, [regionData, locale])

    // Area 데이터를 locale에 맞게 변환
    const localizedAreaData = useMemo(() => {
        return areaData.map(item => ({
            ...item,
            displayName: locale === 'ja' ? (item.nameJa || item.name) : item.name
        }))
    }, [areaData, locale])

    // 거래처 데이터를 locale에 맞게 변환
    const localizedPartnerData = useMemo(() => {
        const unassignedLabel = locale === 'ja' ? '未配属' : '미배정'
        return partnerData.map(item => ({
            ...item,
            displayName: item.name === '미배정' ? unassignedLabel : (locale === 'ja' ? (item.nameJa || item.name) : item.name)
        }))
    }, [partnerData, locale])

    useEffect(() => {
        setIsMounted(true)
    }, [])

    return (
        <div className="row row-deck row-cards">
            {/* Monthly Orders Chart */}
            <div className="col-lg-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="ti ti-chart-line me-2"></i>
                            {t('monthlyOrders')}
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ height: '300px', minHeight: '300px' }}>
                            {!isMounted ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-blue" role="status"></div>
                                </div>
                            ) : monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                                        <XAxis dataKey="name" stroke="#626976" />
                                        <YAxis stroke="#626976" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="orders"
                                            stroke="#206bc4"
                                            strokeWidth={2}
                                            name={t('assetsCount')}
                                            activeDot={{ r: 6, fill: '#206bc4' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <span className="text-muted">{t('noData')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets by Region/Area Chart */}
            <div className="col-lg-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="ti ti-map-pin me-2"></i>
                            {regionTab === 'region' ? t('assetsByRegion') : t('assetsByArea')}
                        </h3>
                        <div className="card-actions">
                            <ul className="nav nav-pills nav-pills-sm">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${regionTab === 'region' ? 'active' : ''}`}
                                        onClick={() => setRegionTab('region')}
                                    >
                                        {t('regionTab')}
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${regionTab === 'area' ? 'active' : ''}`}
                                        onClick={() => setRegionTab('area')}
                                    >
                                        {t('areaTab')}
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="card-body">
                        <div style={{ height: '300px', minHeight: '300px' }}>
                            {!isMounted ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-green" role="status"></div>
                                </div>
                            ) : regionTab === 'region' ? (
                                localizedRegionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={localizedRegionData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                                            <XAxis type="number" stroke="#626976" />
                                            <YAxis dataKey="displayName" type="category" width={100} stroke="#626976" tick={{ fontSize: 11 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="value" name={t('assetsCount')} radius={[0, 4, 4, 0]}>
                                                {localizedRegionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                                                ))}
                                                <LabelList dataKey="value" position="right" style={{ fill: '#666', fontSize: 12, fontWeight: 500 }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                        <span className="text-muted">{t('noData')}</span>
                                    </div>
                                )
                            ) : (
                                localizedAreaData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={localizedAreaData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                                            <XAxis type="number" stroke="#626976" />
                                            <YAxis dataKey="displayName" type="category" width={100} stroke="#626976" tick={{ fontSize: 11 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="value" name={t('assetsCount')} radius={[0, 4, 4, 0]}>
                                                {localizedAreaData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                                                ))}
                                                <LabelList dataKey="value" position="right" style={{ fill: '#666', fontSize: 12, fontWeight: 500 }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                        <span className="text-muted">{t('noData')}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Partner Share Table with Progress Bars */}
            <div className="col-lg-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="ti ti-chart-bar me-2"></i>
                            {t('ordersByPartner')}
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ minHeight: '300px', maxHeight: '350px', overflowY: 'auto' }}>
                            {!isMounted ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-orange" role="status"></div>
                                </div>
                            ) : localizedPartnerData.length > 0 ? (
                                (() => {
                                    const sortedData = [...localizedPartnerData].sort((a, b) => b.value - a.value)
                                    const total = sortedData.reduce((sum, item) => sum + item.value, 0)
                                    const unit = locale === 'ja' ? '台' : '대'

                                    return (
                                        <table className="table table-vcenter card-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '30%' }}>{t('brandName')}</th>
                                                    <th style={{ width: '50%' }}>{t('shareChart')}</th>
                                                    <th style={{ width: '20%' }} className="text-end">{t('assetsCount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedData.map((item, index) => {
                                                    const percent = total > 0 ? (item.value / total) * 100 : 0
                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <span
                                                                        className="avatar avatar-xs me-2"
                                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                                    ></span>
                                                                    <span className="text-truncate" style={{ maxWidth: '100px' }} title={item.displayName}>
                                                                        {item.displayName}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="progress flex-grow-1" style={{ height: '20px' }}>
                                                                        <div
                                                                            className="progress-bar"
                                                                            style={{
                                                                                width: `${percent}%`,
                                                                                backgroundColor: COLORS[index % COLORS.length]
                                                                            }}
                                                                        >
                                                                            {percent >= 10 && (
                                                                                <span className="small">{percent.toFixed(1)}%</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {percent < 10 && (
                                                                        <span className="ms-2 text-muted small">{percent.toFixed(1)}%</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="text-end">
                                                                <strong>{item.value}</strong>
                                                                <span className="text-muted ms-1">{unit}</span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-light">
                                                    <td><strong>{t('total')}</strong></td>
                                                    <td>
                                                        <div className="progress" style={{ height: '20px' }}>
                                                            <div
                                                                className="progress-bar bg-primary"
                                                                style={{ width: '100%' }}
                                                            >
                                                                <span className="small">100%</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end">
                                                        <strong>{total}</strong>
                                                        <span className="text-muted ms-1">{unit}</span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )
                                })()
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <span className="text-muted">{t('noData')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Card */}
            <div className="col-lg-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="ti ti-info-circle me-2"></i>
                            {t('quickInfo')}
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ minHeight: '300px' }}>
                            {/* Quick Stats Grid */}
                            <div className="row g-3 mb-4">
                                <div className="col-6">
                                    <div className="card card-sm bg-green-lt">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <span className="avatar bg-green text-white me-2">
                                                    <i className="ti ti-truck-delivery"></i>
                                                </span>
                                                <div>
                                                    <div className="h3 mb-0">{quickInfo.weeklyDelivered}</div>
                                                    <div className="text-muted small">{t('weeklyDelivered')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className={`card card-sm ${quickInfo.overdueLoans > 0 ? 'bg-red-lt' : 'bg-azure-lt'}`}>
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <span className={`avatar ${quickInfo.overdueLoans > 0 ? 'bg-red' : 'bg-azure'} text-white me-2`}>
                                                    <i className="ti ti-alert-triangle"></i>
                                                </span>
                                                <div>
                                                    <div className="h3 mb-0">{quickInfo.overdueLoans}</div>
                                                    <div className="text-muted small">{t('overdueLoans')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className={`card card-sm ${quickInfo.pendingRepairs > 0 ? 'bg-yellow-lt' : 'bg-azure-lt'}`}>
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <span className={`avatar ${quickInfo.pendingRepairs > 0 ? 'bg-yellow' : 'bg-azure'} text-white me-2`}>
                                                    <i className="ti ti-tool"></i>
                                                </span>
                                                <div>
                                                    <div className="h3 mb-0">{quickInfo.pendingRepairs}</div>
                                                    <div className="text-muted small">{t('pendingRepairs')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card card-sm bg-blue-lt">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                <span className="avatar bg-blue text-white me-2">
                                                    <i className="ti ti-plus"></i>
                                                </span>
                                                <div>
                                                    <div className="h3 mb-0">{quickInfo.recentAssets.length}</div>
                                                    <div className="text-muted small">{t('recentAssets')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Assets List */}
                            <div>
                                <h4 className="mb-2 fs-5">{t('recentAssetsList')}</h4>
                                {quickInfo.recentAssets.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {quickInfo.recentAssets.slice(0, 5).map((asset, idx) => (
                                            <div key={idx} className="list-group-item px-0 py-2">
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar avatar-sm bg-primary-lt me-2">
                                                        <i className="ti ti-device-desktop"></i>
                                                    </span>
                                                    <div className="flex-fill">
                                                        <div className="fw-semibold">{asset.serialNumber}</div>
                                                        <div className="text-muted small">{asset.branchName || t('unassigned')}</div>
                                                    </div>
                                                    <div className="text-muted small">
                                                        {new Date(asset.createdAt).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-muted text-center py-3">{t('noRecentAssets')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
