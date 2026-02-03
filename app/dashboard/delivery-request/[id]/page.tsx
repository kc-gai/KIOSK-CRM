'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DeliveryRequestItem {
    id: string
    locationName: string
    postalCode: string | null
    address: string
    contactPhone: string | null
    kioskCount: number
    plateCount: number
    itemNotes: string | null
    sortOrder: number
    branchId?: string | null
}

// notes에 저장된 JSON에서 파싱되는 아이템 타입
interface ParsedItem {
    id?: number
    corporationId?: string
    branchId?: string
    brandName?: string
    postalCode?: string
    address?: string
    contact?: string
    kioskCount?: number
    plateCount?: number
    acquisition?: string
    leaseCompanyId?: string
    desiredDeliveryDate?: string
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
    totalKioskCount: number
    totalPlateCount: number
    totalAmount: number
    createdAt: string
    updatedAt: string
}

export default function DeliveryRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const t = useTranslations('deliveryRequest')
    const tc = useTranslations('common')
    const router = useRouter()

    const [request, setRequest] = useState<DeliveryRequest | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchRequest = useCallback(async () => {
        try {
            const res = await fetch(`/api/delivery-request/${id}`)
            if (res.ok) {
                const data = await res.json()
                setRequest(data)
            }
        } catch (error) {
            console.error('Failed to fetch delivery request:', error)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchRequest()
    }, [fetchRequest])

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/delivery-request/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                fetchRequest()
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const handleDelete = async () => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/delivery-request/${id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/dashboard/delivery-request')
            }
        } catch (error) {
            console.error('Failed to delete:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; label: string }> = {
            'DRAFT': { bg: '#6c757d', text: '#fff', label: t('statusDraft') },
            'SUBMITTED': { bg: '#0dcaf0', text: '#000', label: t('statusSubmitted') },
            'CONFIRMED': { bg: '#0d6efd', text: '#fff', label: t('statusConfirmed') },
            'COMPLETED': { bg: '#198754', text: '#fff', label: t('statusCompleted') },
            'CANCELLED': { bg: '#dc3545', text: '#fff', label: t('statusCancelled') }
        }
        const { bg, text, label } = statusMap[status] || { bg: '#6c757d', text: '#fff', label: status }
        return (
            <span
                className="badge"
                style={{
                    backgroundColor: bg,
                    color: text,
                    fontSize: '0.9rem',
                    padding: '6px 12px',
                    fontWeight: 600
                }}
            >
                {label}
            </span>
        )
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ja-JP')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount)
    }

    // notes 필드에서 JSON 파싱 시도
    const parseNotesData = (notes: string | null): { actualNotes: string; parsedItems: ParsedItem[] } => {
        if (!notes) return { actualNotes: '', parsedItems: [] }

        try {
            const parsed = JSON.parse(notes)
            return {
                actualNotes: parsed.notes || '',
                parsedItems: parsed.items || []
            }
        } catch {
            // JSON이 아닌 경우 일반 텍스트로 처리
            return { actualNotes: notes, parsedItems: [] }
        }
    }

    const { actualNotes, parsedItems } = request ? parseNotesData(request.notes) : { actualNotes: '', parsedItems: [] }

    // 아이템별로 파싱된 데이터 매핑
    const getItemExtras = (index: number): ParsedItem | null => {
        return parsedItems[index] || null
    }

    if (loading) {
        return (
            <div className="container-xl">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{tc('loading')}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!request) {
        return (
            <div className="container-xl">
                <div className="alert alert-danger">Request not found</div>
            </div>
        )
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
                            {t('title')} - No.{request.requestNumber}
                        </h2>
                    </div>
                    <div className="col-auto ms-auto d-print-none">
                        <div className="btn-list">
                            <button
                                className="btn btn-outline-info"
                                onClick={() => window.print()}
                            >
                                <i className="ti ti-printer me-1"></i>
                                {t('printPdf')}
                            </button>
                            <Link
                                href={`/dashboard/delivery-request/${id}/edit`}
                                className="btn btn-warning"
                            >
                                <i className="ti ti-edit me-1"></i>
                                {tc('edit')}
                            </Link>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                <i className="ti ti-trash me-1"></i>
                                {tc('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print View - 納品依頼書 Form */}
            <div className="card mt-3">
                <div className="card-body p-4">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <h1 className="mb-0" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            納品依頼書
                        </h1>
                    </div>

                    {/* Top Info - 4열 구성 */}
                    <div className="mb-4">
                        <table className="table table-bordered mb-0">
                            <tbody>
                                <tr>
                                    <th className="bg-light" style={{ width: '100px' }}>No</th>
                                    <td style={{ width: '20%' }}><strong>{request.requestNumber}</strong></td>
                                    <th className="bg-light" style={{ width: '100px' }}>{t('orderDate')}</th>
                                    <td style={{ width: '20%' }}>{formatDate(request.orderDate)}</td>
                                    <th className="bg-light" style={{ width: '100px' }}>{t('requesterName')}</th>
                                    <td>{request.requesterName}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">{t('status')}</th>
                                    <td colSpan={3}>
                                        {getStatusBadge(request.status)}
                                        <div className="dropdown d-inline-block ms-2 d-print-none">
                                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                                変更
                                            </button>
                                            <div className="dropdown-menu">
                                                <button className="dropdown-item" onClick={() => handleStatusChange('DRAFT')}>
                                                    {t('statusDraft')}
                                                </button>
                                                <button className="dropdown-item" onClick={() => handleStatusChange('SUBMITTED')}>
                                                    {t('statusSubmitted')}
                                                </button>
                                                <button className="dropdown-item" onClick={() => handleStatusChange('CONFIRMED')}>
                                                    {t('statusConfirmed')}
                                                </button>
                                                <button className="dropdown-item" onClick={() => handleStatusChange('COMPLETED')}>
                                                    {t('statusCompleted')}
                                                </button>
                                                <button className="dropdown-item" onClick={() => handleStatusChange('CANCELLED')}>
                                                    {t('statusCancelled')}
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <th className="bg-light">{t('unitPrice')}</th>
                                    <td>
                                        {formatCurrency(request.unitPrice)} {t('yen')}
                                        <small className="text-muted ms-1">
                                            ({request.taxIncluded ? t('taxIncluded') : t('taxExcluded')})
                                        </small>
                                    </td>
                                </tr>
                                <tr>
                                    <th className="bg-light">{t('titleLabel')}</th>
                                    <td colSpan={5}>{request.title}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Items Table */}
                    <div className="mb-4">
                        <h4 className="mb-3">{t('items')}</h4>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-center" style={{ width: '40px' }}>No</th>
                                        <th>{t('corporationName')}</th>
                                        <th>{t('locationName')}</th>
                                        <th style={{ width: '100px' }}>{t('postalCode')}</th>
                                        <th>{t('address')}</th>
                                        <th style={{ width: '100px' }}>{t('contactPhone')}</th>
                                        <th className="text-center" style={{ width: '70px' }}>{t('kioskCount')}</th>
                                        <th className="text-center" style={{ width: '70px' }}>{t('plateCount')}</th>
                                        <th style={{ width: '100px' }}>{t('itemDeliveryDate')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.items.map((item, index) => {
                                        const extras = getItemExtras(index)
                                        return (
                                            <tr key={item.id}>
                                                <td className="text-center">{index + 1}</td>
                                                <td>{extras?.brandName || '-'}</td>
                                                <td>{item.locationName}</td>
                                                <td>{item.postalCode || '-'}</td>
                                                <td>{item.address}</td>
                                                <td>{item.contactPhone || '-'}</td>
                                                <td className="text-center">{item.kioskCount}</td>
                                                <td className="text-center">{item.plateCount}</td>
                                                <td>{extras?.desiredDeliveryDate || '-'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="bg-light">
                                    <tr>
                                        <th colSpan={6} className="text-end">合計</th>
                                        <th className="text-center">{request.totalKioskCount}</th>
                                        <th className="text-center">{request.totalPlateCount}</th>
                                        <th></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="row mb-4">
                        <div className="col-md-6 offset-md-6">
                            <table className="table table-bordered mb-0">
                                <tbody>
                                    <tr>
                                        <th className="bg-light">{t('totalAmount')}</th>
                                        <td className="text-end">
                                            <strong style={{ fontSize: '1.5rem' }}>
                                                {formatCurrency(request.totalAmount)} {t('yen')}
                                            </strong>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {actualNotes && (
                        <div className="mb-4">
                            <table className="table table-bordered mb-0">
                                <tbody>
                                    <tr>
                                        <th className="bg-light" style={{ width: '120px' }}>{t('notes')}</th>
                                        <td style={{ whiteSpace: 'pre-wrap' }}>{actualNotes}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="row mt-5 d-print-only">
                        <div className="col-6">
                            <p className="text-muted mb-0">
                                発行日: {new Date().toLocaleDateString('ja-JP')}
                            </p>
                        </div>
                        <div className="col-6 text-end">
                            <p className="text-muted mb-0">
                                株式会社AntiGravity
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }
                @media print {
                    .d-print-none {
                        display: none !important;
                    }
                    .d-print-only {
                        display: block !important;
                    }
                    .card {
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .navbar, .aside, .page-header, .navbar-vertical, .sidebar-nav {
                        display: none !important;
                    }
                    .page-wrapper, .main-content {
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }
                    body {
                        padding: 0 !important;
                    }
                    .container-xl {
                        max-width: 100% !important;
                        padding: 0 !important;
                    }
                }
                @media screen {
                    .d-print-only {
                        display: none;
                    }
                }
            `}</style>
        </div>
    )
}
