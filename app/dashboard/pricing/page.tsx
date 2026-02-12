'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, DollarSign, Percent, X, Search, Edit, Trash2 } from 'lucide-react'

type Partner = {
    id: string
    name: string
}

type Kiosk = {
    id: string
    serialNumber: string
}

type KioskPricing = {
    id: string
    kioskId: string
    serialNumber: string
    costPrice?: number
    salePrice?: number
    margin?: number
    marginRate?: number
    purchaseDate?: string
    saleDate?: string
    supplierId?: string
    supplierName?: string
    clientId?: string
    clientName?: string
    saleType?: string
    leaseMonthlyFee?: number
    leasePeriodMonths?: number
    notes?: string
    createdAt: string
}

export default function PricingPage() {
    const t = useTranslations('pricing')
    const tc = useTranslations('common')
    const [pricings, setPricings] = useState<KioskPricing[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [saleTypeFilter, setSaleTypeFilter] = useState('')

    // 드롭다운 데이터
    const [kiosks, setKiosks] = useState<Kiosk[]>([])
    const [suppliers, setSuppliers] = useState<Partner[]>([])
    const [clients, setClients] = useState<Partner[]>([])

    // 폼 데이터
    const [formData, setFormData] = useState({
        kioskId: '',
        serialNumber: '',
        costPrice: '',
        purchaseDate: '',
        supplierId: '',
        salePrice: '',
        saleDate: '',
        clientId: '',
        saleType: 'PAID',
        leaseMonthlyFee: '',
        leasePeriodMonths: '',
        notes: ''
    })

    const [editingId, setEditingId] = useState<string | null>(null)

    const fetchPricings = async () => {
        try {
            const res = await fetch('/api/pricing')
            if (res.ok) {
                const data = await res.json()
                setPricings(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchDropdownData = async () => {
        try {
            // 키오스크 목록 (assets API 사용)
            const kioskRes = await fetch('/api/assets')
            if (kioskRes.ok) {
                const data = await kioskRes.json()
                // assets API는 data 배열을 반환
                setKiosks((data.data || data).map((k: { id: string; serialNumber: string }) => ({
                    id: k.id,
                    serialNumber: k.serialNumber
                })))
            }

            // 공급업체 (SUPPLIER)
            const supplierRes = await fetch('/api/partners?type=SUPPLIER')
            if (supplierRes.ok) {
                setSuppliers(await supplierRes.json())
            }

            // 거래처 (CLIENT)
            const clientRes = await fetch('/api/partners?type=CLIENT')
            if (clientRes.ok) {
                setClients(await clientRes.json())
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchPricings()
        fetchDropdownData()
    }, [])

    const handleKioskSelect = (kioskId: string) => {
        const kiosk = kiosks.find(k => k.id === kioskId)
        setFormData(prev => ({
            ...prev,
            kioskId,
            serialNumber: kiosk?.serialNumber || ''
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingId ? `/api/pricing/${editingId}` : '/api/pricing'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowModal(false)
                resetForm()
                fetchPricings()
            } else {
                alert(editingId ? t('updateFailed') : t('createFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(t('error'))
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (pricing: KioskPricing) => {
        setEditingId(pricing.id)
        setFormData({
            kioskId: pricing.kioskId,
            serialNumber: pricing.serialNumber,
            costPrice: pricing.costPrice?.toString() || '',
            purchaseDate: pricing.purchaseDate ? pricing.purchaseDate.split('T')[0] : '',
            supplierId: pricing.supplierId || '',
            salePrice: pricing.salePrice?.toString() || '',
            saleDate: pricing.saleDate ? pricing.saleDate.split('T')[0] : '',
            clientId: pricing.clientId || '',
            saleType: pricing.saleType || 'PAID',
            leaseMonthlyFee: pricing.leaseMonthlyFee?.toString() || '',
            leasePeriodMonths: pricing.leasePeriodMonths?.toString() || '',
            notes: pricing.notes || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/pricing/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchPricings()
            } else {
                alert(t('deleteFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({
            kioskId: '',
            serialNumber: '',
            costPrice: '',
            purchaseDate: '',
            supplierId: '',
            salePrice: '',
            saleDate: '',
            clientId: '',
            saleType: 'PAID',
            leaseMonthlyFee: '',
            leasePeriodMonths: '',
            notes: ''
        })
    }

    const getSaleTypeBadge = (saleType?: string) => {
        switch (saleType) {
            case 'PAID':
                return <span className="badge bg-green text-white">{t('paid')}</span>
            case 'FREE':
                return <span className="badge bg-secondary">{t('free')}</span>
            case 'LEASE':
                return <span className="badge bg-blue text-white">{t('lease')}</span>
            default:
                return <span className="badge bg-secondary">-</span>
        }
    }

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '-'
        return `¥${value.toLocaleString()}`
    }

    const getMarginClass = (margin?: number) => {
        if (margin === undefined || margin === null) return ''
        return margin >= 0 ? 'text-success' : 'text-danger'
    }

    // 필터링
    const filteredPricings = pricings.filter(p => {
        const matchesSearch = !searchQuery ||
            p.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesSaleType = !saleTypeFilter || p.saleType === saleTypeFilter

        return matchesSearch && matchesSaleType
    })

    // 통계 계산
    const totalCost = filteredPricings.reduce((sum, p) => sum + (p.costPrice || 0), 0)
    const totalSale = filteredPricings.reduce((sum, p) => sum + (p.salePrice || 0), 0)
    const totalMargin = totalSale - totalCost
    const avgMarginRate = filteredPricings.length > 0
        ? filteredPricings.reduce((sum, p) => sum + (p.marginRate || 0), 0) / filteredPricings.length
        : 0

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">{t('title')}</h2>
                    </div>
                    <div className="col-auto ms-auto">
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={16} className="me-1" />
                            {t('newPricing')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-blue-lt p-3 me-3">
                                    <DollarSign size={24} className="text-blue" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('totalCost')}</div>
                                    <div className="h3 mb-0">{formatCurrency(totalCost)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-green-lt p-3 me-3">
                                    <TrendingUp size={24} className="text-green" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('totalSale')}</div>
                                    <div className="h3 mb-0">{formatCurrency(totalSale)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className={`rounded-circle p-3 me-3 ${totalMargin >= 0 ? 'bg-success-lt' : 'bg-danger-lt'}`}>
                                    {totalMargin >= 0 ? (
                                        <TrendingUp size={24} className="text-success" />
                                    ) : (
                                        <TrendingDown size={24} className="text-danger" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-muted small">{t('totalMargin')}</div>
                                    <div className={`h3 mb-0 ${getMarginClass(totalMargin)}`}>
                                        {formatCurrency(totalMargin)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-purple-lt p-3 me-3">
                                    <Percent size={24} className="text-purple" />
                                </div>
                                <div>
                                    <div className="text-muted small">{t('avgMarginRate')}</div>
                                    <div className={`h3 mb-0 ${getMarginClass(avgMarginRate)}`}>
                                        {avgMarginRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 필터 */}
            <div className="card mb-4">
                <div className="card-body py-2">
                    <div className="row g-2 align-items-center">
                        <div className="col-auto">
                            <div className="input-icon">
                                <span className="input-icon-addon">
                                    <Search size={16} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={tc('search')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-auto">
                            <select
                                className="form-select"
                                value={saleTypeFilter}
                                onChange={(e) => setSaleTypeFilter(e.target.value)}
                            >
                                <option value="">{t('allSaleTypes')}</option>
                                <option value="PAID">{t('paid')}</option>
                                <option value="FREE">{t('free')}</option>
                                <option value="LEASE">{t('lease')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 가격 정보 목록 */}
            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-hover">
                        <thead>
                            <tr>
                                <th>{t('serialNumber')}</th>
                                <th>{t('supplier')}</th>
                                <th>{t('client')}</th>
                                <th>{t('saleType')}</th>
                                <th className="text-end">{t('costPrice')}</th>
                                <th className="text-end">{t('salePrice')}</th>
                                <th className="text-end">{t('margin')}</th>
                                <th className="text-end">{t('marginRate')}</th>
                                <th>{t('purchaseDate')}</th>
                                <th>{t('saleDate')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm" role="status"></div>
                                        <span className="ms-2">{tc('loading')}</span>
                                    </td>
                                </tr>
                            ) : filteredPricings.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-4 text-muted">
                                        {t('noPricing')}
                                    </td>
                                </tr>
                            ) : (
                                filteredPricings.map((p) => (
                                    <tr key={p.id}>
                                        <td className="fw-bold">{p.serialNumber}</td>
                                        <td>{p.supplierName || '-'}</td>
                                        <td>{p.clientName || '-'}</td>
                                        <td>{getSaleTypeBadge(p.saleType)}</td>
                                        <td className="text-end">{formatCurrency(p.costPrice)}</td>
                                        <td className="text-end">{formatCurrency(p.salePrice)}</td>
                                        <td className={`text-end ${getMarginClass(p.margin)}`}>
                                            {formatCurrency(p.margin)}
                                        </td>
                                        <td className={`text-end ${getMarginClass(p.marginRate)}`}>
                                            {p.marginRate !== undefined ? `${p.marginRate.toFixed(1)}%` : '-'}
                                        </td>
                                        <td>
                                            {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td>
                                            {p.saleDate ? new Date(p.saleDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td>
                                            <div className="btn-list flex-nowrap">
                                                <button
                                                    className="btn btn-sm btn-ghost-primary"
                                                    onClick={() => handleEdit(p)}
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-ghost-danger"
                                                    onClick={() => handleDelete(p.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 모달 */}
            {showModal && (
                <div className="modal modal-blur fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingId ? t('editPricing') : t('newPricing')}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        {/* 키오스크 선택 */}
                                        <div className="col-md-6">
                                            <label className="form-label">{t('kiosk')} *</label>
                                            <select
                                                className="form-select"
                                                value={formData.kioskId}
                                                onChange={(e) => handleKioskSelect(e.target.value)}
                                                required
                                                disabled={!!editingId}
                                            >
                                                <option value="">{tc('selectPlaceholder')}</option>
                                                {kiosks.map(k => (
                                                    <option key={k.id} value={k.id}>{k.serialNumber}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">{t('serialNumber')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.serialNumber}
                                                readOnly
                                            />
                                        </div>

                                        {/* 원가 정보 */}
                                        <div className="col-12">
                                            <h4 className="mb-0">{t('costInfo')}</h4>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('costPrice')}</label>
                                            <div className="input-group">
                                                <span className="input-group-text">¥</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.costPrice}
                                                    onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('purchaseDate')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.purchaseDate}
                                                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('supplier')}</label>
                                            <select
                                                className="form-select"
                                                value={formData.supplierId}
                                                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                                            >
                                                <option value="">{tc('selectPlaceholder')}</option>
                                                {suppliers.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 판매 정보 */}
                                        <div className="col-12">
                                            <h4 className="mb-0">{t('saleInfo')}</h4>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('saleType')}</label>
                                            <select
                                                className="form-select"
                                                value={formData.saleType}
                                                onChange={(e) => setFormData({...formData, saleType: e.target.value})}
                                            >
                                                <option value="PAID">{t('paid')}</option>
                                                <option value="FREE">{t('free')}</option>
                                                <option value="LEASE">{t('lease')}</option>
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('salePrice')}</label>
                                            <div className="input-group">
                                                <span className="input-group-text">¥</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.salePrice}
                                                    onChange={(e) => setFormData({...formData, salePrice: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('saleDate')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.saleDate}
                                                onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">{t('client')}</label>
                                            <select
                                                className="form-select"
                                                value={formData.clientId}
                                                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                                            >
                                                <option value="">{tc('selectPlaceholder')}</option>
                                                {clients.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 리스 정보 */}
                                        {formData.saleType === 'LEASE' && (
                                            <>
                                                <div className="col-md-4">
                                                    <label className="form-label">{t('leaseMonthlyFee')}</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">¥</span>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={formData.leaseMonthlyFee}
                                                            onChange={(e) => setFormData({...formData, leaseMonthlyFee: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">{t('leasePeriod')}</label>
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={formData.leasePeriodMonths}
                                                            onChange={(e) => setFormData({...formData, leasePeriodMonths: e.target.value})}
                                                        />
                                                        <span className="input-group-text">{t('months')}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* 비고 */}
                                        <div className="col-12">
                                            <label className="form-label">{t('notes')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={formData.notes}
                                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                    >
                                        {tc('cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                {tc('saving')}
                                            </>
                                        ) : (
                                            tc('save')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
