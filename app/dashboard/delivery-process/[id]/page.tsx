'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
    ArrowLeft,
    Truck,
    Package,
    CheckCircle,
    Copy,
    Download,
    FileText,
    Check,
    Loader2,
    Edit,
    Save,
    X,
    Trash2
} from 'lucide-react'

type OrderProcess = {
    id: string
    processNumber: string
    title: string
    client?: { name: string }
}

type DeliveryProcess = {
    id: string
    processNumber: string
    serialNumber: string
    modelName?: string
    orderProcessId?: string
    orderProcess?: {
        id: string
        processNumber: string
        title: string
        client?: {
            id: string
            name: string
        }
    }
    currentStep: number
    status: string
    shippedDate?: string
    expectedArrival?: string
    trackingNumber?: string
    logistics?: string
    vendorName?: string
    vendorContact?: string
    vendorNotes?: string
    step1CompletedAt?: string
    step1CompletedBy?: string
    actualArrival?: string
    inspectionPassed?: boolean
    inspectionNotes?: string
    internalNotes?: string
    step2CompletedAt?: string
    step2CompletedBy?: string
    kioskId?: string
    createdAt: string
    updatedAt: string
}

type ContractInfo = {
    partnerName: string
    partnerNameJa: string
    contractDate?: string
    contractStartDate?: string
    kioskSaleType: string
    kioskSaleTypeDisplay: string
    kioskSalePrice: string
    kioskFreeCondition: string
    saleTerms: string
    maintenanceTerms: string
    commissionTerms: string
    feeChangeTerms: string
    otaRate: string
}

type ErpRequestData = {
    success: boolean
    markdown: string
    data: {
        processNumber: string
        serialNumber: string
        userId: string
        areaCode: string
        regionCode: string
        companyName: string
        pmsRate: string
        deliveryDate?: string
        inspectionPassed?: boolean
        contractInfo?: ContractInfo
    }
}

export default function DeliveryProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const t = useTranslations('deliveryProcess')
    const tc = useTranslations('common')

    const [process, setProcess] = useState<DeliveryProcess | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [erpData, setErpData] = useState<ErpRequestData | null>(null)
    const [erpLoading, setErpLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState<'info' | 'erp'>('info')
    const [activeStep, setActiveStep] = useState(1)
    const [editMode, setEditMode] = useState(false)
    const [orderProcesses, setOrderProcesses] = useState<OrderProcess[]>([])

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
        vendorNotes: '',
        actualArrival: '',
        inspectionPassed: null as boolean | null,
        inspectionNotes: '',
        internalNotes: ''
    })

    const fetchProcess = async () => {
        try {
            const res = await fetch(`/api/delivery-process/${resolvedParams.id}`)
            if (res.ok) {
                const data = await res.json()
                setProcess(data)
                setActiveStep(data.currentStep || 1)
                setFormData({
                    serialNumber: data.serialNumber || '',
                    modelName: data.modelName || '',
                    orderProcessId: data.orderProcessId || '',
                    shippedDate: data.shippedDate ? data.shippedDate.split('T')[0] : '',
                    expectedArrival: data.expectedArrival ? data.expectedArrival.split('T')[0] : '',
                    trackingNumber: data.trackingNumber || '',
                    logistics: data.logistics || '',
                    vendorName: data.vendorName || '',
                    vendorContact: data.vendorContact || '',
                    vendorNotes: data.vendorNotes || '',
                    actualArrival: data.actualArrival ? data.actualArrival.split('T')[0] : '',
                    inspectionPassed: data.inspectionPassed,
                    inspectionNotes: data.inspectionNotes || '',
                    internalNotes: data.internalNotes || ''
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrderProcesses = async () => {
        try {
            const res = await fetch('/api/order-process')
            if (res.ok) {
                const data = await res.json()
                setOrderProcesses(data.filter((p: OrderProcess & { status: string }) =>
                    p.status === 'IN_PROGRESS' || p.status === 'COMPLETED'
                ))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSave = async () => {
        if (!process) return
        setSaving(true)

        try {
            const res = await fetch(`/api/delivery-process/${process.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                await fetchProcess()
                setEditMode(false)
            } else {
                alert(t('updateFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(t('updateError'))
        } finally {
            setSaving(false)
        }
    }

    const handleCompleteStep = async (step: number) => {
        if (!process) return
        setSaving(true)

        try {
            const updateData: Record<string, unknown> = {}
            const now = new Date().toISOString()

            if (step === 1) {
                updateData.step1CompletedAt = now
                updateData.step1CompletedBy = 'Current User' // TODO: Replace with actual user
                updateData.currentStep = 2
                // Also save step 1 form data
                updateData.shippedDate = formData.shippedDate || null
                updateData.expectedArrival = formData.expectedArrival || null
                updateData.trackingNumber = formData.trackingNumber
                updateData.logistics = formData.logistics
                updateData.vendorName = formData.vendorName
                updateData.vendorContact = formData.vendorContact
                updateData.vendorNotes = formData.vendorNotes
            } else if (step === 2) {
                updateData.step2CompletedAt = now
                updateData.step2CompletedBy = 'Current User'
                updateData.status = 'COMPLETED'
                // Also save step 2 form data
                updateData.actualArrival = formData.actualArrival || null
                updateData.inspectionPassed = formData.inspectionPassed
                updateData.inspectionNotes = formData.inspectionNotes
                updateData.internalNotes = formData.internalNotes
            }

            const res = await fetch(`/api/delivery-process/${process.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            if (res.ok) {
                await fetchProcess()
            } else {
                alert(t('updateFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(t('updateError'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!process) return
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/delivery-process/${process.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                router.push('/dashboard/delivery-process')
            } else {
                alert(t('deleteFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(t('deleteError'))
        }
    }

    const generateErpRequest = async () => {
        if (!process) return
        setErpLoading(true)
        try {
            const res = await fetch(`/api/delivery-process/${process.id}/erp-request`)
            if (res.ok) {
                const data = await res.json()
                setErpData(data)
                setActiveTab('erp')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setErpLoading(false)
        }
    }

    const copyToClipboard = async () => {
        if (!erpData?.markdown) return
        try {
            await navigator.clipboard.writeText(erpData.markdown)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    const downloadMarkdown = () => {
        if (!erpData?.markdown || !process) return
        const blob = new Blob([erpData.markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `erp-request-${process.processNumber}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    useEffect(() => {
        fetchProcess()
        fetchOrderProcesses()
    }, [resolvedParams.id])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS':
                return <span className="badge bg-blue text-white">{t('statusInProgress')}</span>
            case 'COMPLETED':
                return <span className="badge bg-green text-white">{t('statusCompleted')}</span>
            case 'CANCELLED':
                return <span className="badge bg-red text-white">{t('statusCancelled')}</span>
            default:
                return <span className="badge bg-secondary">{status}</span>
        }
    }

    const getInspectionBadge = (passed?: boolean | null) => {
        if (passed === undefined || passed === null) {
            return <span className="badge bg-secondary">{t('pending')}</span>
        }
        return passed
            ? <span className="badge bg-green text-white">{t('passed')}</span>
            : <span className="badge bg-red text-white">{t('failed')}</span>
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ko-KR')
    }

    if (loading) {
        return (
            <div className="container-xl">
                <div className="text-center py-5">
                    <div className="spinner-border" role="status"></div>
                    <div className="mt-2">{tc('loading')}</div>
                </div>
            </div>
        )
    }

    if (!process) {
        return (
            <div className="container-xl">
                <div className="alert alert-danger">{t('notFound')}</div>
            </div>
        )
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/delivery-process" className="btn btn-outline-secondary me-3">
                            <ArrowLeft size={16} className="me-1" />
                            {t('backToList')}
                        </Link>
                    </div>
                    <div className="col">
                        <h2 className="page-title">
                            {t('processDetail')}: {process.processNumber}
                        </h2>
                        <div className="text-muted mt-1">
                            {process.serialNumber} {process.modelName && `(${process.modelName})`}
                        </div>
                    </div>
                    <div className="col-auto d-flex gap-2 align-items-center">
                        {getStatusBadge(process.status)}
                        <button
                            className="btn btn-outline-danger"
                            onClick={handleDelete}
                            title={tc('delete')}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 진행 상태 */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row">
                        {/* Step 1 */}
                        <div
                            className="col-md-6 d-flex align-items-center cursor-pointer"
                            onClick={() => setActiveStep(1)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div
                                className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                    activeStep === 1
                                        ? 'bg-primary text-white'
                                        : process.step1CompletedAt
                                            ? 'bg-success text-white'
                                            : 'bg-secondary-subtle text-muted'
                                }`}
                                style={{ width: '48px', height: '48px' }}
                            >
                                {process.step1CompletedAt ? <CheckCircle size={24} /> : <Truck size={24} />}
                            </div>
                            <div>
                                <div className="fw-bold">{t('step1')}</div>
                                <div className="text-muted small">
                                    {process.step1CompletedAt
                                        ? formatDate(process.step1CompletedAt)
                                        : t('notStarted')}
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div
                            className="col-md-6 d-flex align-items-center cursor-pointer"
                            onClick={() => setActiveStep(2)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div
                                className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                    activeStep === 2
                                        ? 'bg-primary text-white'
                                        : process.step2CompletedAt
                                            ? 'bg-success text-white'
                                            : 'bg-secondary-subtle text-muted'
                                }`}
                                style={{ width: '48px', height: '48px' }}
                            >
                                {process.step2CompletedAt ? <CheckCircle size={24} /> : <Package size={24} />}
                            </div>
                            <div>
                                <div className="fw-bold">{t('step2')}</div>
                                <div className="text-muted small">
                                    {process.step2CompletedAt
                                        ? formatDate(process.step2CompletedAt)
                                        : t('notStarted')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 탭 */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        {t('processInfo')}
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'erp' ? 'active' : ''}`}
                        onClick={() => setActiveTab('erp')}
                    >
                        {t('erpRequest')}
                    </button>
                </li>
            </ul>

            {/* 정보 탭 */}
            {activeTab === 'info' && (
                <>
                    {/* Step 1 Content */}
                    {activeStep === 1 && (
                        <div className="card mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0">{t('step1Info')}</h3>
                                {!process.step1CompletedAt && (
                                    <div className="d-flex gap-2">
                                        {editMode ? (
                                            <>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <Loader2 size={14} className="me-1 spin" />
                                                    ) : (
                                                        <Save size={14} className="me-1" />
                                                    )}
                                                    {tc('save')}
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => setEditMode(false)}
                                                >
                                                    <X size={14} className="me-1" />
                                                    {tc('cancel')}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => setEditMode(true)}
                                            >
                                                <Edit size={14} className="me-1" />
                                                {tc('edit')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="card-body">
                                {editMode ? (
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('serialNumber')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.serialNumber}
                                                onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('modelName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.modelName}
                                                onChange={e => setFormData({...formData, modelName: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('orderProcess')}</label>
                                            <select
                                                className="form-select"
                                                value={formData.orderProcessId}
                                                onChange={e => setFormData({...formData, orderProcessId: e.target.value})}
                                            >
                                                <option value="">{t('selectOrderProcess')}</option>
                                                {orderProcesses.map(op => (
                                                    <option key={op.id} value={op.id}>
                                                        {op.processNumber} - {op.title} ({op.client?.name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('shippedDate')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.shippedDate}
                                                onChange={e => setFormData({...formData, shippedDate: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('expectedArrival')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.expectedArrival}
                                                onChange={e => setFormData({...formData, expectedArrival: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('trackingNumber')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.trackingNumber}
                                                onChange={e => setFormData({...formData, trackingNumber: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('logistics')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.logistics}
                                                onChange={e => setFormData({...formData, logistics: e.target.value})}
                                                placeholder={t('logisticsPlaceholder')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('vendorName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.vendorName}
                                                onChange={e => setFormData({...formData, vendorName: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('vendorContact')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.vendorContact}
                                                onChange={e => setFormData({...formData, vendorContact: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">{t('vendorNotes')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={formData.vendorNotes}
                                                onChange={e => setFormData({...formData, vendorNotes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="datagrid">
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('serialNumber')}</div>
                                            <div className="datagrid-content">{process.serialNumber}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('modelName')}</div>
                                            <div className="datagrid-content">{process.modelName || '-'}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('orderProcess')}</div>
                                            <div className="datagrid-content">
                                                {process.orderProcess ? (
                                                    <Link href={`/dashboard/order-process/${process.orderProcess.id}`}>
                                                        {process.orderProcess.processNumber} - {process.orderProcess.title}
                                                    </Link>
                                                ) : '-'}
                                            </div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('shippedDate')}</div>
                                            <div className="datagrid-content">{formatDate(process.shippedDate)}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('expectedArrival')}</div>
                                            <div className="datagrid-content">{formatDate(process.expectedArrival)}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('trackingNumber')}</div>
                                            <div className="datagrid-content">{process.trackingNumber || '-'}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('logistics')}</div>
                                            <div className="datagrid-content">{process.logistics || '-'}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('vendorName')}</div>
                                            <div className="datagrid-content">{process.vendorName || '-'}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('vendorContact')}</div>
                                            <div className="datagrid-content">{process.vendorContact || '-'}</div>
                                        </div>
                                        {process.vendorNotes && (
                                            <div className="datagrid-item">
                                                <div className="datagrid-title">{t('vendorNotes')}</div>
                                                <div className="datagrid-content">{process.vendorNotes}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 1 Complete Button */}
                                {!process.step1CompletedAt && !editMode && (
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleCompleteStep(1)}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 size={16} className="me-2 spin" />
                                                    {tc('saving')}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} className="me-2" />
                                                    {t('completeStep1')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2 Content */}
                    {activeStep === 2 && (
                        <div className="card mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0">{t('step2Info')}</h3>
                                {process.step1CompletedAt && !process.step2CompletedAt && (
                                    <div className="d-flex gap-2">
                                        {editMode ? (
                                            <>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <Loader2 size={14} className="me-1 spin" />
                                                    ) : (
                                                        <Save size={14} className="me-1" />
                                                    )}
                                                    {tc('save')}
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => setEditMode(false)}
                                                >
                                                    <X size={14} className="me-1" />
                                                    {tc('cancel')}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => setEditMode(true)}
                                            >
                                                <Edit size={14} className="me-1" />
                                                {tc('edit')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="card-body">
                                {!process.step1CompletedAt ? (
                                    <div className="text-center text-muted py-4">
                                        {t('completeStep1First')}
                                    </div>
                                ) : editMode ? (
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('actualArrival')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.actualArrival}
                                                onChange={e => setFormData({...formData, actualArrival: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('inspectionPassed')}</label>
                                            <div className="btn-group w-100">
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="inspectionPassed"
                                                    id="inspection-passed"
                                                    checked={formData.inspectionPassed === true}
                                                    onChange={() => setFormData({...formData, inspectionPassed: true})}
                                                />
                                                <label className="btn btn-outline-success" htmlFor="inspection-passed">
                                                    {t('passed')}
                                                </label>
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="inspectionPassed"
                                                    id="inspection-failed"
                                                    checked={formData.inspectionPassed === false}
                                                    onChange={() => setFormData({...formData, inspectionPassed: false})}
                                                />
                                                <label className="btn btn-outline-danger" htmlFor="inspection-failed">
                                                    {t('failed')}
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">{t('inspectionNotes')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={formData.inspectionNotes}
                                                onChange={e => setFormData({...formData, inspectionNotes: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">{t('internalNotes')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={formData.internalNotes}
                                                onChange={e => setFormData({...formData, internalNotes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="datagrid">
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('actualArrival')}</div>
                                            <div className="datagrid-content">{formatDate(process.actualArrival)}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('inspectionPassed')}</div>
                                            <div className="datagrid-content">
                                                {getInspectionBadge(process.inspectionPassed)}
                                            </div>
                                        </div>
                                        {process.inspectionNotes && (
                                            <div className="datagrid-item">
                                                <div className="datagrid-title">{t('inspectionNotes')}</div>
                                                <div className="datagrid-content">{process.inspectionNotes}</div>
                                            </div>
                                        )}
                                        {process.internalNotes && (
                                            <div className="datagrid-item">
                                                <div className="datagrid-title">{t('internalNotes')}</div>
                                                <div className="datagrid-content">{process.internalNotes}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2 Complete Button */}
                                {process.step1CompletedAt && !process.step2CompletedAt && !editMode && (
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleCompleteStep(2)}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 size={16} className="me-2 spin" />
                                                    {tc('saving')}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} className="me-2" />
                                                    {t('completeStep2')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Completed Message */}
                                {process.step2CompletedAt && (
                                    <div className="alert alert-success mt-4">
                                        <CheckCircle size={20} className="me-2" />
                                        {t('deliveryComplete')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ERP 요청 탭 */}
            {activeTab === 'erp' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('erpRequestTitle')}</h3>
                    </div>
                    <div className="card-body">
                        {!erpData ? (
                            <div className="text-center py-4">
                                <p className="text-muted mb-3">{t('erpRequestDesc')}</p>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={generateErpRequest}
                                    disabled={erpLoading}
                                >
                                    {erpLoading ? (
                                        <>
                                            <Loader2 size={20} className="me-2 spin" />
                                            {tc('loading')}
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={20} className="me-2" />
                                            {t('generateErpRequest')}
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* 액션 버튼 */}
                                <div className="mb-3 d-flex gap-2">
                                    <button
                                        className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={16} className="me-1" />
                                                {t('copied')}
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={16} className="me-1" />
                                                {t('copyToClipboard')}
                                            </>
                                        )}
                                    </button>
                                    <button className="btn btn-outline-secondary" onClick={downloadMarkdown}>
                                        <Download size={16} className="me-1" />
                                        {t('downloadMarkdown')}
                                    </button>
                                </div>

                                {/* 마크다운 미리보기 */}
                                <div className="border rounded p-3 bg-light">
                                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                        {erpData.markdown}
                                    </pre>
                                </div>

                                {/* 데이터 요약 */}
                                <div className="mt-4">
                                    <h4 className="mb-3">{t('dataSummary')}</h4>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h5 className="text-muted mb-2">{t('basicInfoSummary')}</h5>
                                            <table className="table table-sm">
                                                <tbody>
                                                    <tr>
                                                        <th style={{ width: '140px' }}>{t('userId')}</th>
                                                        <td>{erpData.data.userId}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{t('areaCode')}</th>
                                                        <td>{erpData.data.areaCode}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{t('regionCode')}</th>
                                                        <td>{erpData.data.regionCode}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{t('companyName')}</th>
                                                        <td>{erpData.data.companyName}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{t('pmsRate')}</th>
                                                        <td>{erpData.data.pmsRate}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        {erpData.data.contractInfo && (
                                            <div className="col-md-6">
                                                <h5 className="text-muted mb-2">{t('contractConditions')}</h5>
                                                <table className="table table-sm">
                                                    <tbody>
                                                        <tr>
                                                            <th style={{ width: '140px' }}>{t('kioskSale')}</th>
                                                            <td>{erpData.data.contractInfo.kioskSaleTypeDisplay} / {erpData.data.contractInfo.kioskSalePrice}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>{t('freeCondition')}</th>
                                                            <td>{erpData.data.contractInfo.kioskFreeCondition}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>{t('maintenanceTerms')}</th>
                                                            <td>{erpData.data.contractInfo.maintenanceTerms}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>{t('erpCommission')}</th>
                                                            <td>PMS {erpData.data.pmsRate} / OTA {erpData.data.contractInfo.otaRate}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>{t('commissionTerms')}</th>
                                                            <td>{erpData.data.contractInfo.commissionTerms}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>{t('feeChangeTerms')}</th>
                                                            <td>{erpData.data.contractInfo.feeChangeTerms}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
