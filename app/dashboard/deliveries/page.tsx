'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Delivery = {
    id: string
    deliveryDate: string
    invoiceNumber?: string
    serialNumber: string
    anydeskId?: string
    modelName?: string
    destination?: string
    recipientName?: string
    recipientPhone?: string
    status: string
    supplierName?: string
    supplierContact?: string
    notes?: string
    notificationSent: boolean
    createdAt: string
}

export default function DeliveriesPage() {
    const t = useTranslations('delivery')
    const tc = useTranslations('common')

    const [deliveries, setDeliveries] = useState<Delivery[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form state
    const [form, setForm] = useState({
        deliveryDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        serialNumber: '',
        anydeskId: '',
        modelName: '',
        destination: '',
        recipientName: '',
        recipientPhone: '',
        supplierName: '',
        supplierContact: '',
        notes: ''
    })

    const resetForm = () => {
        setForm({
            deliveryDate: new Date().toISOString().split('T')[0],
            invoiceNumber: '',
            serialNumber: '',
            anydeskId: '',
            modelName: '',
            destination: '',
            recipientName: '',
            recipientPhone: '',
            supplierName: '',
            supplierContact: '',
            notes: ''
        })
    }

    const fetchData = async () => {
        try {
            const res = await fetch('/api/deliveries')
            if (res.ok) setDeliveries(await res.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredDeliveries = deliveries.filter(d => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            d.serialNumber.toLowerCase().includes(query) ||
            d.anydeskId?.toLowerCase().includes(query) ||
            d.invoiceNumber?.toLowerCase().includes(query) ||
            d.destination?.toLowerCase().includes(query) ||
            d.supplierName?.toLowerCase().includes(query)
        )
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                resetForm()
                setIsCreating(false)
                fetchData()
                alert(t('createSuccess'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (id: string, data: Partial<Delivery>) => {
        try {
            const res = await fetch(`/api/deliveries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setEditingId(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/deliveries/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { bg: string, text: string, icon: string, label: string }> = {
            SHIPPED: { bg: 'bg-blue', text: 'text-white', icon: 'ti-truck', label: t('statusShipped') },
            DELIVERED: { bg: 'bg-yellow', text: 'text-dark', icon: 'ti-package', label: t('statusDelivered') },
            CONFIRMED: { bg: 'bg-green', text: 'text-white', icon: 'ti-circle-check', label: t('statusConfirmed') }
        }
        const { bg, text, icon, label } = config[status] || config.SHIPPED
        return (
            <span className={`badge ${bg} ${text}`}>
                <i className={`ti ${icon} me-1`}></i>
                {label}
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
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setIsCreating(!isCreating); resetForm() }}
                >
                    {isCreating ? tc('cancel') : <><i className="ti ti-plus me-1"></i>{t('newDelivery')}</>}
                </button>
            </div>

            {/* Search */}
            <div className="mb-3">
                <div className="input-icon">
                    <span className="input-icon-addon">
                        <i className="ti ti-search"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={`${tc('search')}... (${t('serialNumber')}, AnyDesk, ${t('invoiceNumber')})`}
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

            {/* Create Form */}
            {isCreating && (
                <div className="card mb-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('newDelivery')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">{t('deliveryDate')} *</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={form.deliveryDate}
                                        onChange={e => setForm({ ...form, deliveryDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('invoiceNumber')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder={t('invoicePlaceholder')}
                                        value={form.invoiceNumber}
                                        onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('serialNumber')} *</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder="KIOSK-2024-001"
                                        value={form.serialNumber}
                                        onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">AnyDesk ID</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder="123 456 789"
                                        value={form.anydeskId}
                                        onChange={e => setForm({ ...form, anydeskId: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('modelName')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder="Kiosk Model X"
                                        value={form.modelName}
                                        onChange={e => setForm({ ...form, modelName: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('destination')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder={t('destinationPlaceholder')}
                                        value={form.destination}
                                        onChange={e => setForm({ ...form, destination: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('recipientName')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder={t('recipientPlaceholder')}
                                        value={form.recipientName}
                                        onChange={e => setForm({ ...form, recipientName: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('recipientPhone')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder="010-0000-0000"
                                        value={form.recipientPhone}
                                        onChange={e => setForm({ ...form, recipientPhone: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('supplierName')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder={t('supplierPlaceholder')}
                                        value={form.supplierName}
                                        onChange={e => setForm({ ...form, supplierName: e.target.value })}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">{t('notes')}</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        placeholder={t('notesPlaceholder')}
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2" disabled={!form.serialNumber}>
                                    <i className="ti ti-truck me-1"></i>
                                    {t('registerDelivery')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsCreating(false)}>
                                    {tc('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deliveries Table */}
            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-sm">
                        <thead>
                            <tr>
                                <th>{t('deliveryDate')}</th>
                                <th>{t('invoiceNumber')}</th>
                                <th>{t('serialNumber')}</th>
                                <th>AnyDesk</th>
                                <th>{t('destination')}</th>
                                <th>{t('status')}</th>
                                <th>{t('supplier')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeliveries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted py-4">
                                        {searchQuery ? t('noSearchResults', { query: searchQuery }) : t('noDeliveries')}
                                    </td>
                                </tr>
                            ) : (
                                filteredDeliveries.map(delivery => (
                                    <tr key={delivery.id}>
                                        <td className="text-muted">
                                            {new Date(delivery.deliveryDate).toLocaleDateString()}
                                        </td>
                                        <td className="text-muted">
                                            {delivery.invoiceNumber || '-'}
                                        </td>
                                        <td className="fw-medium">
                                            {delivery.serialNumber}
                                        </td>
                                        <td className="text-muted">
                                            {delivery.anydeskId || '-'}
                                        </td>
                                        <td className="text-muted">
                                            {delivery.destination || '-'}
                                        </td>
                                        <td>
                                            {editingId === delivery.id ? (
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={delivery.status}
                                                    onChange={e => handleUpdate(delivery.id, { status: e.target.value })}
                                                    style={{ width: '120px' }}
                                                >
                                                    <option value="SHIPPED">{t('statusShipped')}</option>
                                                    <option value="DELIVERED">{t('statusDelivered')}</option>
                                                    <option value="CONFIRMED">{t('statusConfirmed')}</option>
                                                </select>
                                            ) : (
                                                getStatusBadge(delivery.status)
                                            )}
                                        </td>
                                        <td className="text-muted">
                                            {delivery.supplierName || '-'}
                                        </td>
                                        <td>
                                            <div className="btn-list flex-nowrap">
                                                <button
                                                    className="btn btn-sm btn-icon btn-ghost-primary"
                                                    onClick={() => setEditingId(editingId === delivery.id ? null : delivery.id)}
                                                    title={tc('edit')}
                                                >
                                                    <i className="ti ti-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-icon btn-ghost-danger"
                                                    onClick={() => handleDelete(delivery.id)}
                                                    title={tc('delete')}
                                                >
                                                    <i className="ti ti-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="card-footer text-muted">
                    {searchQuery && `${t('searchResults')}: ${filteredDeliveries.length} / `}
                    {t('total')}: {deliveries.length}
                </div>
            </div>
        </div>
    )
}
