'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

type OrderProcess = {
    id: string
    processNumber: string
    title: string
    client?: { name: string }
}

export default function NewDeliveryProcessPage() {
    const router = useRouter()
    const t = useTranslations('deliveryProcess')
    const tc = useTranslations('common')

    const [orderProcesses, setOrderProcesses] = useState<OrderProcess[]>([])
    const [loading, setLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        serialNumber: '',
        modelName: '',
        orderProcessId: '',
        shippedDate: '',
        expectedArrival: '',
        trackingNumber: '',
        logistics: '',
        vendorName: '',
        vendorContact: '',
        vendorNotes: ''
    })

    useEffect(() => {
        // 연결 가능한 발주 프로세스 목록 조회
        fetch('/api/order-process')
            .then(res => res.json())
            .then(data => setOrderProcesses(data.filter((p: OrderProcess & { status: string }) => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED')))
            .catch(console.error)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/delivery-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/dashboard/delivery-process/${data.id}`)
            } else {
                alert(t('createFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(t('createError'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/delivery-process" className="btn btn-outline-secondary me-3">
                            <ArrowLeft size={16} className="me-1" />
                            {tc('back')}
                        </Link>
                    </div>
                    <div className="col">
                        <h2 className="page-title">{t('newProcess')}</h2>
                    </div>
                </div>
            </div>

            {/* 폼 */}
            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            {/* 기본 정보 섹션 */}
                            <div className="col-12">
                                <h4 className="mb-3">{t('step1Info')}</h4>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('serialNumber')} *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.serialNumber}
                                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                    placeholder="KC-XXXXXXXX"
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('modelName')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.modelName}
                                    onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('orderProcess')}</label>
                                <select
                                    className="form-select"
                                    value={formData.orderProcessId}
                                    onChange={e => setFormData({ ...formData, orderProcessId: e.target.value })}
                                >
                                    <option value="">{t('selectOrderProcess')}</option>
                                    {orderProcesses.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.processNumber} - {op.title} ({op.client?.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 배송 정보 섹션 */}
                            <div className="col-12 mt-4">
                                <h4 className="mb-3">{t('shippingInfo')}</h4>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('shippedDate')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.shippedDate}
                                    onChange={e => setFormData({ ...formData, shippedDate: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('expectedArrival')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.expectedArrival}
                                    onChange={e => setFormData({ ...formData, expectedArrival: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('trackingNumber')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.trackingNumber}
                                    onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('logistics')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.logistics}
                                    onChange={e => setFormData({ ...formData, logistics: e.target.value })}
                                    placeholder={t('logisticsPlaceholder')}
                                />
                            </div>

                            {/* 외주업체 정보 섹션 */}
                            <div className="col-12 mt-4">
                                <h4 className="mb-3">{t('vendorInfo')}</h4>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('vendorName')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.vendorName}
                                    onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">{t('vendorContact')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.vendorContact}
                                    onChange={e => setFormData({ ...formData, vendorContact: e.target.value })}
                                />
                            </div>

                            <div className="col-12">
                                <label className="form-label">{t('vendorNotes')}</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={formData.vendorNotes}
                                    onChange={e => setFormData({ ...formData, vendorNotes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {tc('saving')}
                                    </>
                                ) : (
                                    tc('create')
                                )}
                            </button>
                            <Link href="/dashboard/delivery-process" className="btn btn-outline-secondary">
                                {tc('cancel')}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
