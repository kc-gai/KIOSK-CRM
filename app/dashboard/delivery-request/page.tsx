'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface DeliveryRequestItem {
    id: string
    locationName: string
    postalCode: string | null
    address: string
    contactPhone: string | null
    quantity: number
    kioskCount: number
    plateCount: number
    sortOrder: number
}

interface DeliveryRequest {
    id: string
    requestNumber: string
    orderDate: string
    requesterName: string
    title: string
    desiredDeliveryDate: string | null
    desiredDeliveryWeek: string | null
    unitPrice: number
    taxIncluded: boolean
    status: string
    notes: string | null
    items: DeliveryRequestItem[]
    totalQuantity: number
    totalKioskCount: number
    totalPlateCount: number
    totalAmount: number
    createdAt: string
}

export default function DeliveryRequestPage() {
    const t = useTranslations('deliveryRequest')
    const tc = useTranslations('common')

    const [requests, setRequests] = useState<DeliveryRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter) params.append('status', statusFilter)

            const res = await fetch(`/api/delivery-request?${params.toString()}`)
            const data = await res.json()
            setRequests(data.data || [])
        } catch (error) {
            console.error('Failed to fetch delivery requests:', error)
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/delivery-request/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchRequests()
            }
        } catch (error) {
            console.error('Failed to delete:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            'DRAFT': { color: 'secondary', label: t('statusDraft') },
            'SUBMITTED': { color: 'info', label: t('statusSubmitted') },
            'CONFIRMED': { color: 'primary', label: t('statusConfirmed') },
            'COMPLETED': { color: 'success', label: t('statusCompleted') },
            'CANCELLED': { color: 'danger', label: t('statusCancelled') }
        }
        const { color, label } = statusMap[status] || { color: 'secondary', label: status }
        return <span className={`badge bg-${color}`}>{label}</span>
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ja-JP')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount)
    }

    const filteredRequests = requests.filter(req => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            req.requestNumber.toLowerCase().includes(query) ||
            req.requesterName.toLowerCase().includes(query) ||
            req.title.toLowerCase().includes(query) ||
            req.items.some(item => item.locationName.toLowerCase().includes(query))
        )
    })

    return (
        <div className="container-xl">
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">
                            <i className="ti ti-file-invoice me-2"></i>
                            {t('title')}
                        </h2>
                    </div>
                    <div className="col-auto ms-auto">
                        <Link href="/dashboard/delivery-request/new" className="btn btn-primary">
                            <i className="ti ti-plus me-1"></i>
                            {t('newRequest')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="card mt-3">
                <div className="card-header">
                    <div className="row g-2 align-items-center">
                        <div className="col-auto">
                            <div className="input-icon">
                                <span className="input-icon-addon">
                                    <i className="ti ti-search"></i>
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
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">{t('status')}: All</option>
                                <option value="DRAFT">{t('statusDraft')}</option>
                                <option value="SUBMITTED">{t('statusSubmitted')}</option>
                                <option value="CONFIRMED">{t('statusConfirmed')}</option>
                                <option value="COMPLETED">{t('statusCompleted')}</option>
                                <option value="CANCELLED">{t('statusCancelled')}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{tc('loading')}</span>
                            </div>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="empty py-5">
                            <div className="empty-icon">
                                <i className="ti ti-file-off" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <p className="empty-title">{t('noRequests')}</p>
                            <div className="empty-action">
                                <Link href="/dashboard/delivery-request/new" className="btn btn-primary">
                                    <i className="ti ti-plus me-1"></i>
                                    {t('newRequest')}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('requestNumber')}</th>
                                        <th>{t('orderDate')}</th>
                                        <th>{t('requesterName')}</th>
                                        <th>{t('desiredDeliveryDate')}</th>
                                        <th className="text-center">{t('totalKioskCount')}</th>
                                        <th className="text-end">{t('unitPrice')}</th>
                                        <th className="text-end">{t('totalAmount')}</th>
                                        <th>{t('status')}</th>
                                        <th className="w-1"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((req) => (
                                        <tr key={req.id}>
                                            <td>
                                                <Link href={`/dashboard/delivery-request/${req.id}`} className="text-reset">
                                                    <strong>No.{req.requestNumber}</strong>
                                                </Link>
                                            </td>
                                            <td>{formatDate(req.orderDate)}</td>
                                            <td>{req.requesterName}</td>
                                            <td>
                                                {req.desiredDeliveryWeek || formatDate(req.desiredDeliveryDate)}
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-blue-lt">{req.totalKioskCount}台</span>
                                            </td>
                                            <td className="text-end">
                                                {formatCurrency(req.unitPrice)}{t('yen')}
                                                <small className="text-muted ms-1">
                                                    ({req.taxIncluded ? t('taxIncluded') : t('taxExcluded')})
                                                </small>
                                            </td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(req.totalAmount)}{t('yen')}</strong>
                                            </td>
                                            <td>{getStatusBadge(req.status)}</td>
                                            <td>
                                                <div className="btn-list flex-nowrap">
                                                    <Link
                                                        href={`/dashboard/delivery-request/${req.id}`}
                                                        className="btn btn-sm btn-ghost-primary"
                                                    >
                                                        <i className="ti ti-eye"></i>
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/delivery-request/${req.id}/edit`}
                                                        className="btn btn-sm btn-ghost-warning"
                                                    >
                                                        <i className="ti ti-edit"></i>
                                                    </Link>
                                                    <button
                                                        className="btn btn-sm btn-ghost-danger"
                                                        onClick={() => handleDelete(req.id)}
                                                    >
                                                        <i className="ti ti-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
