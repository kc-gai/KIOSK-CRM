'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ItemForm {
    locationName: string
    postalCode: string
    address: string
    contactPhone: string
    quantity: number
    kioskCount: number
    plateCount: number
    itemNotes: string
}

const emptyItem: ItemForm = {
    locationName: '',
    postalCode: '',
    address: '',
    contactPhone: '',
    quantity: 1,
    kioskCount: 1,
    plateCount: 1,
    itemNotes: ''
}

export default function NewDeliveryRequestPage() {
    const t = useTranslations('deliveryRequest')
    const tc = useTranslations('common')
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        requesterName: '',
        title: 'キオスク端末＆決済端末の鉄板・金具',
        orderDate: new Date().toISOString().split('T')[0],
        desiredDeliveryDate: '',
        desiredDeliveryWeek: '',
        unitPrice: 240000,
        taxIncluded: false,
        notes: ''
    })

    const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }])

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleItemChange = (index: number, field: keyof ItemForm, value: string | number) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ))
    }

    const addItem = () => {
        setItems(prev => [...prev, { ...emptyItem }])
    }

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    const calculateTotals = () => {
        return items.reduce(
            (acc, item) => ({
                totalQuantity: acc.totalQuantity + item.quantity,
                totalKioskCount: acc.totalKioskCount + item.kioskCount,
                totalPlateCount: acc.totalPlateCount + item.plateCount,
                totalAmount: acc.totalAmount + (item.kioskCount * formData.unitPrice)
            }),
            { totalQuantity: 0, totalKioskCount: 0, totalPlateCount: 0, totalAmount: 0 }
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                ...formData,
                unitPrice: Number(formData.unitPrice),
                items: items.map((item, index) => ({
                    ...item,
                    quantity: Number(item.quantity),
                    kioskCount: Number(item.kioskCount),
                    plateCount: Number(item.plateCount),
                    sortOrder: index
                }))
            }

            const res = await fetch('/api/delivery-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/dashboard/delivery-request/${data.id}`)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to create')
            }
        } catch (error) {
            console.error('Failed to create:', error)
            alert('Failed to create delivery request')
        } finally {
            setLoading(false)
        }
    }

    const totals = calculateTotals()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount)
    }

    return (
        <div className="container-xl">
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/delivery-request" className="btn btn-ghost-secondary btn-sm mb-2">
                            <i className="ti ti-arrow-left me-1"></i> Back
                        </Link>
                        <h2 className="page-title">
                            <i className="ti ti-file-plus me-2"></i>
                            {t('newRequest')}
                        </h2>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card mt-3">
                    <div className="card-header">
                        <h3 className="card-title">基本情報</h3>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label required">{t('requesterName')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="requesterName"
                                    value={formData.requesterName}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="田中太郎"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('orderDate')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="orderDate"
                                    value={formData.orderDate}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('desiredDeliveryDate')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="desiredDeliveryDate"
                                    value={formData.desiredDeliveryDate}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">{t('desiredDeliveryWeek')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="desiredDeliveryWeek"
                                    value={formData.desiredDeliveryWeek}
                                    onChange={handleFormChange}
                                    placeholder={t('desiredWeekPlaceholder')}
                                />
                                <small className="text-muted">정확한 날짜 대신 주간으로 입력 가능</small>
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">{t('titleLabel')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('unitPrice')}</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="unitPrice"
                                        value={formData.unitPrice}
                                        onChange={handleFormChange}
                                    />
                                    <span className="input-group-text">{t('yen')}</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">&nbsp;</label>
                                <div className="form-check mt-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="taxIncluded"
                                        name="taxIncluded"
                                        checked={formData.taxIncluded}
                                        onChange={handleFormChange}
                                    />
                                    <label className="form-check-label" htmlFor="taxIncluded">
                                        {t('taxIncluded')}
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">{t('notes')}</label>
                                <textarea
                                    className="form-control"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder={t('notesPlaceholder')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="card mt-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('items')}</h3>
                        <div className="card-actions">
                            <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>
                                <i className="ti ti-plus me-1"></i>
                                {t('addItem')}
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>No</th>
                                        <th>{t('locationName')}</th>
                                        <th style={{ width: '120px' }}>{t('postalCode')}</th>
                                        <th>{t('address')}</th>
                                        <th style={{ width: '120px' }}>{t('contactPhone')}</th>
                                        <th style={{ width: '80px' }}>{t('quantity')}</th>
                                        <th style={{ width: '80px' }}>{t('kioskCount')}</th>
                                        <th style={{ width: '80px' }}>{t('plateCount')}</th>
                                        <th style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.locationName}
                                                    onChange={(e) => handleItemChange(index, 'locationName', e.target.value)}
                                                    placeholder={t('locationPlaceholder')}
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.postalCode}
                                                    onChange={(e) => handleItemChange(index, 'postalCode', e.target.value)}
                                                    placeholder={t('postalCodePlaceholder')}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.address}
                                                    onChange={(e) => handleItemChange(index, 'address', e.target.value)}
                                                    placeholder={t('addressPlaceholder')}
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.contactPhone}
                                                    onChange={(e) => handleItemChange(index, 'contactPhone', e.target.value)}
                                                    placeholder={t('contactPlaceholder')}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    min={1}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm text-center"
                                                    value={item.kioskCount}
                                                    onChange={(e) => handleItemChange(index, 'kioskCount', parseInt(e.target.value) || 1)}
                                                    min={1}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm text-center"
                                                    value={item.plateCount}
                                                    onChange={(e) => handleItemChange(index, 'plateCount', parseInt(e.target.value) || 1)}
                                                    min={1}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost-danger btn-sm"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length === 1}
                                                >
                                                    <i className="ti ti-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-light">
                                    <tr>
                                        <th colSpan={5} className="text-end">合計</th>
                                        <th className="text-center">{totals.totalQuantity}</th>
                                        <th className="text-center">{totals.totalKioskCount}</th>
                                        <th className="text-center">{totals.totalPlateCount}</th>
                                        <th></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="mb-0">
                                    <span className="text-muted me-2">{t('totalAmount')}:</span>
                                    <strong style={{ fontSize: '1.5rem' }}>
                                        {formatCurrency(totals.totalAmount)} {t('yen')}
                                    </strong>
                                    <small className="text-muted ms-2">
                                        ({formData.taxIncluded ? t('taxIncluded') : t('taxExcluded')})
                                    </small>
                                </div>
                            </div>
                            <div className="col-md-6 text-end">
                                <Link href="/dashboard/delivery-request" className="btn btn-ghost-secondary me-2">
                                    {tc('cancel')}
                                </Link>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            {tc('loading')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-device-floppy me-1"></i>
                                            {tc('save')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
