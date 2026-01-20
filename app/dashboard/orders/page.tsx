'use client'

import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Order = {
    id: string
    orderNumber: string
    client: { name: string }
    status: string
    orderDate: string
    trackingNo?: string
    logistics?: string
}

type Partner = {
    id: string
    name: string
    type: string
}

export default function OrdersPage() {
    const t = useTranslations('orders')
    const tc = useTranslations('common')

    const [orders, setOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    const [selectedClientId, setSelectedClientId] = useState('')

    // Search State
    const [searchQuery, setSearchQuery] = useState('')

    // Update State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTracking, setEditTracking] = useState('')
    const [editLogistics, setEditLogistics] = useState('')

    const fetchData = async () => {
        try {
            const [ordersRes, partnersRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/partners')
            ])

            if (ordersRes.ok) setOrders(await ordersRes.json())
            if (partnersRes.ok) {
                const partners: Partner[] = await partnersRes.json()
                setClients(partners.filter(p => p.type === 'CLIENT'))
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

    // Filter orders based on search query
    const filteredOrders = orders.filter(order => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            order.orderNumber.toLowerCase().includes(query) ||
            order.client?.name.toLowerCase().includes(query) ||
            order.status.toLowerCase().includes(query) ||
            order.trackingNo?.toLowerCase().includes(query) ||
            order.logistics?.toLowerCase().includes(query)
        )
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                })
            })

            if (res.ok) {
                setSelectedClientId('')
                setIsCreating(false)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdateShipping = async (id: string) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: 'SHIPPED',
                    trackingNo: editTracking,
                    logistics: editLogistics
                })
            })
            if (res.ok) {
                setEditingId(null)
                setEditTracking('')
                setEditLogistics('')
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchData()
            } else {
                alert(t('deleteFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(t('deleteError'))
        }
    }

    // CSV Template Download
    const handleDownloadTemplate = () => {
        const csv = Papa.unparse([
            { clientName: "テスト株式会社", orderNumber: "ORD-20240101", status: "REQUESTED", trackingNo: "", logistics: "" },
            { clientName: "テストクライアント", orderNumber: "ORD-20240102", status: "SHIPPED", trackingNo: "1234567890", logistics: "ヤマト運輸" }
        ])
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', 'orders_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // CSV Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const data = results.data
                if (data.length === 0) return
                const validData = data.filter((row: any) => row.clientName)

                if (confirm(t('importConfirm', { count: validData.length }))) {
                    try {
                        const res = await fetch('/api/orders/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(validData)
                        })
                        const result = await res.json()
                        if (res.ok && result.success) {
                            alert(t('importSuccess', { success: result.count, failed: result.failed }))
                            fetchData()
                        } else {
                            alert(t('importFailed'))
                        }
                    } catch (err) {
                        console.error(err)
                        alert(t('uploadError'))
                    }
                }
            }
        })
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            REQUESTED: 'bg-yellow text-dark',
            SHIPPED: 'bg-blue text-white',
            COMPLETED: 'bg-green text-white'
        }
        const labels: Record<string, string> = {
            REQUESTED: t('statusRequested'),
            SHIPPED: t('statusShipped'),
            COMPLETED: t('statusCompleted')
        }
        return (
            <span className={`badge ${styles[status] || 'bg-secondary text-white'}`}>
                {labels[status] || status}
            </span>
        )
    }

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
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleDownloadTemplate}>
                        <i className="ti ti-download me-1"></i>
                        {t('templateDownload')}
                    </button>
                    <div className="position-relative d-inline-block">
                        <input
                            type="file"
                            accept=".csv"
                            className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                            style={{ cursor: 'pointer' }}
                            onChange={handleFileUpload}
                        />
                        <button className="btn btn-outline-secondary btn-sm">
                            <i className="ti ti-upload me-1"></i>
                            {t('csvUpload')}
                        </button>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(!isCreating)}>
                        {isCreating ? tc('cancel') : <><i className="ti ti-plus me-1"></i>{t('newOrder')}</>}
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div className="mb-3">
                <div className="input-icon">
                    <span className="input-icon-addon">
                        <i className="ti ti-search"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={`${tc('search')}... (${t('orderNumber')}, ${t('client')}, ${t('status')})`}
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

            {isCreating && (
                <div className="card mb-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('newOrder')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">{t('client')}</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedClientId}
                                        onChange={e => setSelectedClientId(e.target.value)}
                                        required
                                    >
                                        <option value="">{t('selectClient')}</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm" disabled={!selectedClientId}>
                                    <i className="ti ti-check me-1"></i>
                                    {t('submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-sm">
                        <thead>
                            <tr>
                                <th>{t('orderNumber')}</th>
                                <th>{t('client')}</th>
                                <th>{t('orderDate')}</th>
                                <th>{t('status')}</th>
                                <th>{t('logistics')}</th>
                                <th>{t('trackingNo')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-4">
                                        {searchQuery ? t('noSearchResults', { query: searchQuery }) : t('noOrders')}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="fw-medium">{order.orderNumber}</td>
                                        <td>{order.client?.name}</td>
                                        <td className="text-muted">
                                            {new Date(order.orderDate).toLocaleDateString()}
                                        </td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td className="text-muted">
                                            {editingId === order.id ? (
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder={t('logisticsPlaceholder')}
                                                    value={editLogistics}
                                                    onChange={e => setEditLogistics(e.target.value)}
                                                    style={{ width: '120px' }}
                                                />
                                            ) : (
                                                order.logistics || '-'
                                            )}
                                        </td>
                                        <td className="text-muted">
                                            {editingId === order.id ? (
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder={t('trackingPlaceholder')}
                                                    value={editTracking}
                                                    onChange={e => setEditTracking(e.target.value)}
                                                    style={{ width: '120px' }}
                                                />
                                            ) : (
                                                order.trackingNo || '-'
                                            )}
                                        </td>
                                        <td>
                                            <div className="btn-list flex-nowrap">
                                                {editingId === order.id ? (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleUpdateShipping(order.id)}
                                                        >
                                                            {t('ship')}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-ghost-secondary"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            {tc('cancel')}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {order.status === 'REQUESTED' && (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => setEditingId(order.id)}
                                                            >
                                                                {t('shippingInfo')}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-sm btn-icon btn-ghost-danger"
                                                            onClick={() => handleDelete(order.id)}
                                                            title={tc('delete')}
                                                        >
                                                            <i className="ti ti-trash"></i>
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
                <div className="card-footer text-muted">
                    {searchQuery && `${t('searchResults')}: ${filteredOrders.length} / `}
                    {t('total')}: {orders.length}
                </div>
            </div>
        </div>
    )
}
