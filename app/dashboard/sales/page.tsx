'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type Partner = {
    id: string
    name: string
    nameJa?: string
}

type KioskSale = {
    id: string
    partnerId: string
    partner: Partner
    saleDate: string
    saleType: string
    quantity: number
    unitPrice?: number
    totalPrice?: number
    notes?: string
}

type MonthlyStats = {
    period: string
    free: number
    paid: number
    freeToPaid: number
    totalQuantity: number
    freeRevenue: number
    paidRevenue: number
    freeToPaidRevenue: number
    totalRevenue: number
}

type SalesStats = {
    monthly: MonthlyStats[]
    totals: {
        free: number
        paid: number
        freeToPaid: number
        totalQuantity: number
        freeRevenue: number
        paidRevenue: number
        freeToPaidRevenue: number
        totalRevenue: number
    }
}

const SALE_TYPES = [
    { value: 'FREE', labelKo: '무상', labelJa: '無償', color: '#3B82F6' },
    { value: 'PAID', labelKo: '유상', labelJa: '有償', color: '#F59E0B' },
    { value: 'FREE_TO_PAID', labelKo: '무상→유상', labelJa: '無償→有償', color: '#EF4444' }
]

export default function SalesPage() {
    const t = useTranslations('sales')
    const tc = useTranslations('common')

    const [sales, setSales] = useState<KioskSale[]>([])
    const [stats, setStats] = useState<SalesStats | null>(null)
    const [partners, setPartners] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

    // Form state
    const [form, setForm] = useState({
        partnerId: '',
        saleDate: new Date().toISOString().split('T')[0],
        saleType: 'FREE',
        quantity: 1,
        unitPrice: '',
        notes: ''
    })

    const resetForm = () => {
        setForm({
            partnerId: '',
            saleDate: new Date().toISOString().split('T')[0],
            saleType: 'FREE',
            quantity: 1,
            unitPrice: '',
            notes: ''
        })
    }

    const fetchData = async () => {
        try {
            const [salesRes, statsRes, partnersRes] = await Promise.all([
                fetch('/api/sales'),
                fetch('/api/sales/stats'),
                fetch('/api/partners')
            ])

            if (salesRes.ok) setSales(await salesRes.json())
            if (statsRes.ok) setStats(await statsRes.json())
            if (partnersRes.ok) {
                const allPartners = await partnersRes.json()
                setPartners(allPartners.filter((p: Partner & { type: string }) => p.type === 'CLIENT'))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredSales = sales.filter(s => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            s.partner?.name.toLowerCase().includes(query) ||
            s.partner?.nameJa?.toLowerCase().includes(query) ||
            s.saleType.toLowerCase().includes(query)
        )
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    unitPrice: form.unitPrice ? parseInt(form.unitPrice) : null
                })
            })

            if (res.ok) {
                resetForm()
                setIsCreating(false)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const getSaleTypeLabel = (type: string) => {
        const found = SALE_TYPES.find(t => t.value === type)
        return found ? found.labelKo : type
    }

    const getSaleTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            FREE: 'bg-blue text-white',
            PAID: 'bg-yellow text-dark',
            FREE_TO_PAID: 'bg-red text-white'
        }
        return (
            <span className={`badge ${styles[type] || 'bg-secondary text-white'}`}>
                {getSaleTypeLabel(type)}
            </span>
        )
    }

    // 차트 데이터 준비
    const quantityChartData = stats?.monthly.map(m => ({
        period: m.period,
        [t('free')]: m.free,
        [t('paid')]: m.paid,
        [t('freeToPaid')]: m.freeToPaid
    })) || []

    const revenueChartData = stats?.monthly.map(m => ({
        period: m.period,
        [t('paidRevenue')]: m.paidRevenue,
        [t('freeToPaidRevenue')]: m.freeToPaidRevenue,
        [t('totalRevenue')]: m.totalRevenue
    })) || []

    if (isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{tc('loading')}</span>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="page-title mb-0">{t('title')}</h2>
                <div className="btn-list">
                    <button
                        className={`btn btn-sm ${viewMode === 'chart' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('chart')}
                    >
                        <i className="ti ti-chart-bar me-1"></i>
                        {t('chartView')}
                    </button>
                    <button
                        className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('table')}
                    >
                        <i className="ti ti-list me-1"></i>
                        {t('tableView')}
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setIsCreating(!isCreating); resetForm() }}
                    >
                        {isCreating ? tc('cancel') : <><i className="ti ti-plus me-1"></i>{t('newSale')}</>}
                    </button>
                </div>
            </div>

            {/* 요약 카드 */}
            {stats && (
                <div className="row row-deck row-cards mb-3">
                    <div className="col-6 col-md-3">
                        <div className="card card-sm">
                            <div className="card-body">
                                <div className="text-muted small">{t('totalQuantity')}</div>
                                <div className="h2 mb-0">{stats.totals.totalQuantity}{t('unit')}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card card-sm">
                            <div className="card-body">
                                <div className="text-muted small">{t('freeQuantity')}</div>
                                <div className="h2 mb-0 text-blue">{stats.totals.free}{t('unit')}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card card-sm">
                            <div className="card-body">
                                <div className="text-muted small">{t('paidQuantity')}</div>
                                <div className="h2 mb-0 text-yellow">{stats.totals.paid}{t('unit')}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card card-sm">
                            <div className="card-body">
                                <div className="text-muted small">{t('totalRevenue')}</div>
                                <div className="h2 mb-0 text-green">{stats.totals.totalRevenue.toLocaleString()}{t('manYen')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 입력 폼 */}
            {isCreating && (
                <div className="card mb-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('newSale')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">{t('partner')} *</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.partnerId}
                                        onChange={e => setForm({ ...form, partnerId: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('selectPartner')}</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.nameJa && `(${p.nameJa})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('saleDate')} *</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={form.saleDate}
                                        onChange={e => setForm({ ...form, saleDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('saleType')} *</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.saleType}
                                        onChange={e => setForm({ ...form, saleType: e.target.value })}
                                        required
                                    >
                                        {SALE_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.labelKo} ({type.labelJa})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('quantity')} *</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        min="1"
                                        value={form.quantity}
                                        onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('unitPrice')} ({t('manYen')})</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder={t('unitPricePlaceholder')}
                                        value={form.unitPrice}
                                        onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('notes')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder={t('notesPlaceholder')}
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2" disabled={!form.partnerId || !form.saleDate}>
                                    <i className="ti ti-check me-1"></i>
                                    {t('registerSale')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsCreating(false)}>
                                    {tc('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewMode === 'chart' ? (
                <div className="row row-deck row-cards">
                    {/* 판매 대수 차트 */}
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('quantityChart')}</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={quantityChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey={t('free')} stackId="a" fill="#3B82F6" />
                                            <Bar dataKey={t('freeToPaid')} stackId="a" fill="#EF4444" />
                                            <Bar dataKey={t('paid')} stackId="a" fill="#F59E0B" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 매출 차트 */}
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('revenueChart')}</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey={t('freeToPaidRevenue')} stackId="a" fill="#3B82F6" />
                                            <Bar dataKey={t('paidRevenue')} stackId="a" fill="#EF4444" />
                                            <Bar dataKey={t('totalRevenue')} fill="#F59E0B" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 월별 집계 테이블 */}
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('monthlySummary')}</h3>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-vcenter card-table table-sm">
                                    <thead>
                                        <tr>
                                            <th>{t('period')}</th>
                                            <th className="text-end">{t('free')}</th>
                                            <th className="text-end">{t('freeToPaid')}</th>
                                            <th className="text-end">{t('paid')}</th>
                                            <th className="text-end">{t('totalQuantity')}</th>
                                            <th className="text-end">{t('totalRevenue')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.monthly.map(m => (
                                            <tr key={m.period}>
                                                <td className="fw-medium">{m.period}</td>
                                                <td className="text-end text-blue">{m.free || '-'}</td>
                                                <td className="text-end text-red">{m.freeToPaid || '-'}</td>
                                                <td className="text-end text-yellow">{m.paid || '-'}</td>
                                                <td className="text-end fw-medium">{m.totalQuantity}</td>
                                                <td className="text-end fw-medium">{m.totalRevenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {stats && (
                                            <tr className="bg-light fw-bold">
                                                <td>{t('total')}</td>
                                                <td className="text-end text-blue">{stats.totals.free}</td>
                                                <td className="text-end text-red">{stats.totals.freeToPaid}</td>
                                                <td className="text-end text-yellow">{stats.totals.paid}</td>
                                                <td className="text-end">{stats.totals.totalQuantity}</td>
                                                <td className="text-end">{stats.totals.totalRevenue.toLocaleString()}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Search */}
                    <div className="mb-3">
                        <div className="input-icon">
                            <span className="input-icon-addon">
                                <i className="ti ti-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={`${tc('search')}...`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <span
                                    className="input-icon-addon"
                                    style={{ cursor: 'pointer', right: 0, left: 'auto' }}
                                    onClick={() => setSearchQuery('')}
                                >
                                    <i className="ti ti-x"></i>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Sales Table */}
                    <div className="card">
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table table-sm">
                                <thead>
                                    <tr>
                                        <th>{t('saleDate')}</th>
                                        <th>{t('partner')}</th>
                                        <th>{t('saleType')}</th>
                                        <th className="text-end">{t('quantity')}</th>
                                        <th className="text-end">{t('unitPrice')}</th>
                                        <th className="text-end">{t('totalPrice')}</th>
                                        <th>{t('notes')}</th>
                                        <th className="w-1"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-muted py-4">
                                                {searchQuery ? t('noSearchResults', { query: searchQuery }) : t('noSales')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSales.map(sale => (
                                            <tr key={sale.id}>
                                                <td className="text-muted">
                                                    {new Date(sale.saleDate).toLocaleDateString()}
                                                </td>
                                                <td className="fw-medium">
                                                    {sale.partner?.name}
                                                    {sale.partner?.nameJa && (
                                                        <span className="text-muted ms-1">({sale.partner.nameJa})</span>
                                                    )}
                                                </td>
                                                <td>{getSaleTypeBadge(sale.saleType)}</td>
                                                <td className="text-end">{sale.quantity}</td>
                                                <td className="text-end text-muted">
                                                    {sale.unitPrice ? `${sale.unitPrice}${t('manYen')}` : '-'}
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {sale.totalPrice ? `${sale.totalPrice.toLocaleString()}${t('manYen')}` : '-'}
                                                </td>
                                                <td className="text-muted" style={{ maxWidth: '150px' }}>
                                                    <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                                                        {sale.notes || '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-icon btn-ghost-danger"
                                                        onClick={() => handleDelete(sale.id)}
                                                        title={tc('delete')}
                                                    >
                                                        <i className="ti ti-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer text-muted">
                            {searchQuery && `${t('searchResults')}: ${filteredSales.length} / `}
                            {t('total')}: {sales.length}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
