'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type DeliveryItem = {
    id: string
    orderProcessId: string
    orderProcess?: {
        processNumber: string
        title: string
        client?: { name: string; nameJa?: string }
    }
    branchName: string
    slipNumber: string | null
    serialNumber: string | null
    anydeskNo: string | null
    quantity: number
    shippedDate: string | null
    expectedDeliveryDate: string | null
    actualDeliveryDate: string | null
    status: 'PENDING' | 'SHIPPING' | 'DELIVERED'
    vendorName: string | null
    vendorContact: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export default function DeliveryStatusPage() {
    const t = useTranslations('deliveryStatus')
    const tc = useTranslations('common')
    const [items, setItems] = useState<DeliveryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SHIPPING' | 'DELIVERED'>('ALL')
    const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null)
    const [showModal, setShowModal] = useState(false)

    // 폼 데이터
    const [formData, setFormData] = useState({
        slipNumber: '',
        serialNumber: '',
        anydeskNo: '',
        shippedDate: '',
        notes: ''
    })

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/delivery-status')
            if (res.ok) {
                const data = await res.json()
                setItems(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span
                        className="badge"
                        style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}
                    >
                        {t('statusPending')}
                    </span>
                )
            case 'SHIPPING':
                return (
                    <span
                        className="badge"
                        style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}
                    >
                        {t('statusShipping')}
                    </span>
                )
            case 'DELIVERED':
                return (
                    <span
                        className="badge"
                        style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}
                    >
                        {t('statusDelivered')}
                    </span>
                )
            default:
                return <span className="badge bg-secondary">{status}</span>
        }
    }

    const filteredItems = items.filter(item => {
        if (filter === 'ALL') return true
        return item.status === filter
    })

    const handleEdit = (item: DeliveryItem) => {
        setEditingItem(item)
        setFormData({
            slipNumber: item.slipNumber || '',
            serialNumber: item.serialNumber || '',
            anydeskNo: item.anydeskNo || '',
            shippedDate: item.shippedDate ? item.shippedDate.split('T')[0] : '',
            notes: item.notes || ''
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!editingItem) return

        try {
            const res = await fetch(`/api/delivery-status/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: formData.slipNumber && formData.serialNumber ? 'SHIPPING' : 'PENDING'
                })
            })
            if (res.ok) {
                fetchItems()
                setShowModal(false)
                setEditingItem(null)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkDelivered = async (item: DeliveryItem) => {
        try {
            const res = await fetch(`/api/delivery-status/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'DELIVERED',
                    actualDeliveryDate: new Date().toISOString()
                })
            })
            if (res.ok) {
                fetchItems()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ja-JP')
    }

    const isOverdue = (expectedDate: string | null) => {
        if (!expectedDate) return false
        return new Date(expectedDate) < new Date()
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">{t('title')}</h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
                    </div>
                </div>
            </div>

            {/* 단계 설명 카드 */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="d-flex align-items-start">
                                <div
                                    className="rounded-circle bg-blue text-white d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                                    style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
                                >
                                    1
                                </div>
                                <div>
                                    <div className="fw-bold">{t('step1')}</div>
                                    <div className="text-muted small">{t('step1Desc')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-start">
                                <div
                                    className="rounded-circle bg-green text-white d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                                    style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
                                >
                                    2
                                </div>
                                <div>
                                    <div className="fw-bold">{t('step2')}</div>
                                    <div className="text-muted small">{t('step2Desc')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 상태별 요약 카드 */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div
                        className={`card cursor-pointer ${filter === 'ALL' ? 'border-primary border-2' : ''}`}
                        onClick={() => setFilter('ALL')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                >
                                    <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>{items.length}</span>
                                </div>
                                <div>
                                    <div className="text-muted small">{t('filterAll')}</div>
                                    <div className="fw-bold">{t('labelTotal')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div
                        className={`card cursor-pointer ${filter === 'PENDING' ? 'border-warning border-2' : ''}`}
                        onClick={() => setFilter('PENDING')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                                >
                                    <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>{items.filter(i => i.status === 'PENDING').length}</span>
                                </div>
                                <div>
                                    <div className="text-muted small">{t('filterPending')}</div>
                                    <div className="fw-bold text-danger">{t('labelPending')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div
                        className={`card cursor-pointer ${filter === 'SHIPPING' ? 'border-info border-2' : ''}`}
                        onClick={() => setFilter('SHIPPING')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                                >
                                    <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>{items.filter(i => i.status === 'SHIPPING').length}</span>
                                </div>
                                <div>
                                    <div className="text-muted small">{t('filterShipping')}</div>
                                    <div className="fw-bold text-info">{t('labelShipping')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div
                        className={`card cursor-pointer ${filter === 'DELIVERED' ? 'border-success border-2' : ''}`}
                        onClick={() => setFilter('DELIVERED')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
                                >
                                    <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>{items.filter(i => i.status === 'DELIVERED').length}</span>
                                </div>
                                <div>
                                    <div className="text-muted small">{t('filterDelivered')}</div>
                                    <div className="fw-bold text-success">{t('labelDelivered')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 테이블 */}
            <div className="card mb-4">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-hover">
                        <thead>
                            <tr>
                                <th>{t('orderNumber')}</th>
                                <th>{t('clientName')}</th>
                                <th>{t('branchName')}</th>
                                <th>{t('slipNumber')}</th>
                                <th>{t('serialNumber')}</th>
                                <th>{t('anydeskNo')}</th>
                                <th>{t('quantity')}</th>
                                <th>{t('expectedDeliveryDate')}</th>
                                <th>{t('status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm" role="status"></div>
                                        <span className="ms-2">{tc('loading')}</span>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-4 text-muted">
                                        {t('noData')}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className={isOverdue(item.expectedDeliveryDate) && item.status !== 'DELIVERED' ? 'bg-warning-lt' : ''}>
                                        <td>
                                            <span className="text-muted">{item.orderProcess?.processNumber || '-'}</span>
                                        </td>
                                        <td>{item.orderProcess?.client?.name || '-'}</td>
                                        <td className="fw-bold">{item.branchName}</td>
                                        <td>{item.slipNumber || <span className="text-muted">-</span>}</td>
                                        <td>{item.serialNumber || <span className="text-muted">-</span>}</td>
                                        <td>{item.anydeskNo || <span className="text-muted">-</span>}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td>
                                            <span className={isOverdue(item.expectedDeliveryDate) && item.status !== 'DELIVERED' ? 'text-danger fw-bold' : ''}>
                                                {formatDate(item.expectedDeliveryDate)}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(item.status)}</td>
                                        <td>
                                            <div className="btn-list">
                                                {item.status === 'PENDING' && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <i className="ti ti-edit me-1"></i>
                                                        {t('inputShippingInfo')}
                                                    </button>
                                                )}
                                                {item.status === 'SHIPPING' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleEdit(item)}
                                                        >
                                                            <i className="ti ti-edit me-1"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleMarkDelivered(item)}
                                                        >
                                                            <i className="ti ti-check me-1"></i>
                                                            {t('markAsDelivered')}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 발송정보 입력 모달 */}
            {showModal && (
                <div className="modal modal-blur fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('inputShippingInfo')}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">{t('slipNumber')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.slipNumber}
                                        onChange={(e) => setFormData({ ...formData, slipNumber: e.target.value })}
                                        placeholder="전표번호를 입력하세요"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('serialNumber')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                        placeholder="Serial No를 입력하세요"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('anydeskNo')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.anydeskNo}
                                        onChange={(e) => setFormData({ ...formData, anydeskNo: e.target.value })}
                                        placeholder="Anydesk No를 입력하세요"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('shippedDate')}</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formData.shippedDate}
                                        onChange={(e) => setFormData({ ...formData, shippedDate: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('notes')}</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="비고 사항을 입력하세요"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    {tc('cancel')}
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleSave}>
                                    {tc('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
