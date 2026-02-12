'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
    ArrowLeft,
    CheckCircle,
    Circle,
    Building2,
    FileText,
    ClipboardCheck,
    CheckSquare,
    Send,
    Edit,
    Trash2,
    Save,
    X
} from 'lucide-react'

type OrderProcess = {
    id: string
    processNumber: string
    title: string
    clientId: string
    client?: { id: string; name: string; contact?: string; address?: string }
    requesterName?: string
    currentStep: number
    status: string
    quantity?: number
    modelType?: string
    desiredDeliveryDate?: string
    dueDate?: string
    acquisition?: string
    leaseCompanyId?: string
    leaseMonthlyFee?: number
    leasePeriod?: number
    step1Notes?: string
    step1CompletedAt?: string
    step1CompletedBy?: string
    documentUrl?: string
    documentNumber?: string
    step2CompletedAt?: string
    step2CompletedBy?: string
    approvalRequestId?: string
    approvalTitle?: string
    step3CompletedAt?: string
    step3CompletedBy?: string
    approvalStatus?: string
    approvalDate?: string
    approvalComment?: string
    step4CompletedAt?: string
    step4CompletedBy?: string
    vendorOrderSent?: boolean
    vendorEmail?: string
    slackNotified?: boolean
    emailNotified?: boolean
    step5CompletedAt?: string
    step5CompletedBy?: string
    createdAt: string
    updatedAt: string
    deliveryProcesses?: Array<{
        id: string
        processNumber: string
        serialNumber: string
        status: string
        currentStep: number
    }>
}

type LeaseCompany = {
    id: string
    name: string
    code?: string
}

const STEPS = [
    { step: 1, key: 'step1', icon: FileText },
    { step: 2, key: 'step2', icon: FileText },
    { step: 3, key: 'step3', icon: ClipboardCheck },
    { step: 4, key: 'step4', icon: CheckSquare },
    { step: 5, key: 'step5', icon: Send },
]

export default function OrderProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const t = useTranslations('orderProcess')
    const tc = useTranslations('common')
    const tl = useTranslations('leaseCompanies')

    const [process, setProcess] = useState<OrderProcess | null>(null)
    const [leaseCompanies, setLeaseCompanies] = useState<LeaseCompany[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [activeStep, setActiveStep] = useState(1)

    // 수정용 폼 데이터
    const [formData, setFormData] = useState<Partial<OrderProcess>>({})

    const fetchProcess = async () => {
        try {
            const res = await fetch(`/api/order-process/${resolvedParams.id}`)
            if (res.ok) {
                const data = await res.json()
                setProcess(data)
                setActiveStep(data.currentStep)
                setFormData(data)
            } else {
                router.push('/dashboard/order-process')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProcess()
        // 리스 회사 목록 조회
        fetch('/api/lease-companies')
            .then(res => res.json())
            .then(data => setLeaseCompanies(data.filter((c: LeaseCompany & { isActive: boolean }) => c.isActive)))
            .catch(console.error)
    }, [resolvedParams.id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/order-process/${resolvedParams.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                const updated = await res.json()
                setProcess(updated)
                setIsEditing(false)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleStepComplete = async (step: number) => {
        const stepField = `step${step}CompletedAt`
        const stepByField = `step${step}CompletedBy`
        const now = new Date().toISOString()

        const updateData: Record<string, unknown> = {
            [stepField]: now,
            [stepByField]: 'Admin', // TODO: 실제 로그인 사용자로 대체
        }

        // 다음 단계로 이동
        if (step < 5) {
            updateData.currentStep = step + 1
        } else {
            updateData.status = 'COMPLETED'
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/order-process/${resolvedParams.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })
            if (res.ok) {
                fetchProcess()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/order-process/${resolvedParams.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                router.push('/dashboard/order-process')
            }
        } catch (e) {
            console.error(e)
        }
    }

    const getStepStatus = (step: number) => {
        if (!process) return 'pending'
        if (process.currentStep > step) return 'completed'
        if (process.currentStep === step) return 'current'
        return 'pending'
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ko-KR')
    }

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('ko-KR')
    }

    if (loading) {
        return (
            <div className="container-xl">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border" role="status"></div>
                </div>
            </div>
        )
    }

    if (!process) return null

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/order-process" className="btn btn-outline-secondary">
                            <ArrowLeft size={16} className="me-1" />
                            {tc('back')}
                        </Link>
                    </div>
                    <div className="col">
                        <div className="page-pretitle">{process.processNumber}</div>
                        <h2 className="page-title">{process.title}</h2>
                    </div>
                    <div className="col-auto">
                        <div className="btn-list">
                            {!isEditing ? (
                                <>
                                    <button className="btn btn-outline-primary" onClick={() => setIsEditing(true)}>
                                        <Edit size={16} className="me-1" />
                                        {tc('edit')}
                                    </button>
                                    <button className="btn btn-outline-danger" onClick={handleDelete}>
                                        <Trash2 size={16} className="me-1" />
                                        {tc('delete')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                        <Save size={16} className="me-1" />
                                        {saving ? tc('saving') : tc('save')}
                                    </button>
                                    <button className="btn btn-outline-secondary" onClick={() => { setIsEditing(false); setFormData(process); }}>
                                        <X size={16} className="me-1" />
                                        {tc('cancel')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 프로세스 단계 표시 */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="steps steps-counter steps-blue">
                        {STEPS.map((s) => {
                            const status = getStepStatus(s.step)
                            return (
                                <a
                                    key={s.step}
                                    href="#"
                                    className={`step-item ${status === 'completed' ? 'active' : ''} ${status === 'current' ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); setActiveStep(s.step); }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex flex-column align-items-center">
                                        {status === 'completed' ? (
                                            <CheckCircle size={24} className="text-success mb-1" />
                                        ) : status === 'current' ? (
                                            <Circle size={24} className="text-primary mb-1" fill="currentColor" />
                                        ) : (
                                            <Circle size={24} className="text-muted mb-1" />
                                        )}
                                        <span className={status === 'pending' ? 'text-muted' : ''}>{t(s.key)}</span>
                                    </div>
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="row">
                {/* 왼쪽: 단계별 상세 내용 */}
                <div className="col-lg-8">
                    {/* 1단계: 발주 정보 입력 */}
                    {activeStep === 1 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('step1')}</h3>
                                {process.step1CompletedAt && (
                                    <span className="badge bg-success ms-2">
                                        <CheckCircle size={12} className="me-1" />
                                        완료 ({formatDateTime(process.step1CompletedAt)})
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                {isEditing ? (
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('quantity')}</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.quantity || ''}
                                                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || undefined })}
                                                />
                                                <span className="input-group-text">{t('unitKiosk')}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('modelType')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.modelType || ''}
                                                onChange={e => setFormData({ ...formData, modelType: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('desiredDeliveryDate')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.desiredDeliveryDate?.split('T')[0] || ''}
                                                onChange={e => setFormData({ ...formData, desiredDeliveryDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('acquisitionType')}</label>
                                            <select
                                                className="form-select"
                                                value={formData.acquisition || 'PURCHASE'}
                                                onChange={e => setFormData({ ...formData, acquisition: e.target.value })}
                                            >
                                                <option value="PURCHASE">{t('purchase')}</option>
                                                <option value="LEASE">{t('lease')}</option>
                                            </select>
                                        </div>
                                        {formData.acquisition === 'LEASE' && (
                                            <>
                                                <div className="col-md-4">
                                                    <label className="form-label">{tl('name')}</label>
                                                    <select
                                                        className="form-select"
                                                        value={formData.leaseCompanyId || ''}
                                                        onChange={e => setFormData({ ...formData, leaseCompanyId: e.target.value })}
                                                    >
                                                        <option value="">{tc('selectPlaceholder')}</option>
                                                        {leaseCompanies.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">{tl('monthlyFee')}</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">¥</span>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={formData.leaseMonthlyFee || ''}
                                                            onChange={e => setFormData({ ...formData, leaseMonthlyFee: parseInt(e.target.value) || undefined })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">{tl('period')}</label>
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={formData.leasePeriod || ''}
                                                            onChange={e => setFormData({ ...formData, leasePeriod: parseInt(e.target.value) || undefined })}
                                                        />
                                                        <span className="input-group-text">{tl('monthUnit')}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div className="col-12">
                                            <label className="form-label">{t('notes')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={formData.step1Notes || ''}
                                                onChange={e => setFormData({ ...formData, step1Notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="datagrid">
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('quantity')}</div>
                                            <div className="datagrid-content">{process.quantity ? `${process.quantity}${t('unitKiosk')}` : '-'}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('modelType')}</div>
                                            <div className="datagrid-content">{process.modelType || '-'}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('desiredDeliveryDate')}</div>
                                            <div className="datagrid-content">{formatDate(process.desiredDeliveryDate)}</div>
                                        </div>
                                        <div className="datagrid-item">
                                            <div className="datagrid-title">{t('acquisitionType')}</div>
                                            <div className="datagrid-content">
                                                <span className={`badge ${process.acquisition === 'LEASE' ? 'bg-purple' : 'bg-blue'}`}>
                                                    {process.acquisition === 'LEASE' ? t('lease') : t('purchase')}
                                                </span>
                                            </div>
                                        </div>
                                        {process.acquisition === 'LEASE' && (
                                            <>
                                                <div className="datagrid-item">
                                                    <div className="datagrid-title">{tl('name')}</div>
                                                    <div className="datagrid-content">
                                                        {leaseCompanies.find(c => c.id === process.leaseCompanyId)?.name || '-'}
                                                    </div>
                                                </div>
                                                <div className="datagrid-item">
                                                    <div className="datagrid-title">{tl('monthlyFee')}</div>
                                                    <div className="datagrid-content">
                                                        {process.leaseMonthlyFee ? `¥${process.leaseMonthlyFee.toLocaleString()}` : '-'}
                                                    </div>
                                                </div>
                                                <div className="datagrid-item">
                                                    <div className="datagrid-title">{tl('period')}</div>
                                                    <div className="datagrid-content">
                                                        {process.leasePeriod ? `${process.leasePeriod}${tl('monthUnit')}` : '-'}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div className="datagrid-item" style={{ gridColumn: 'span 2' }}>
                                            <div className="datagrid-title">{t('notes')}</div>
                                            <div className="datagrid-content">{process.step1Notes || '-'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!process.step1CompletedAt && process.currentStep === 1 && !isEditing && (
                                <div className="card-footer">
                                    <button className="btn btn-primary" onClick={() => handleStepComplete(1)} disabled={saving}>
                                        {t('completeStep')} &rarr; {t('step2')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2단계: 의뢰서 PDF 생성 */}
                    {activeStep === 2 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('step2')}</h3>
                                {process.step2CompletedAt && (
                                    <span className="badge bg-success ms-2">
                                        <CheckCircle size={12} className="me-1" />
                                        완료 ({formatDateTime(process.step2CompletedAt)})
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                <div className="datagrid">
                                    <div className="datagrid-item">
                                        <div className="datagrid-title">{t('documentNumber')}</div>
                                        <div className="datagrid-content">{process.documentNumber || '-'}</div>
                                    </div>
                                    <div className="datagrid-item">
                                        <div className="datagrid-title">{t('documentUrl')}</div>
                                        <div className="datagrid-content">
                                            {process.documentUrl ? (
                                                <a href={process.documentUrl} target="_blank" rel="noopener noreferrer">
                                                    PDF 보기
                                                </a>
                                            ) : '-'}
                                        </div>
                                    </div>
                                </div>

                                {!process.step2CompletedAt && process.currentStep === 2 && (
                                    <div className="mt-4">
                                        <button className="btn btn-outline-primary me-2">
                                            <FileText size={16} className="me-1" />
                                            {t('generatePdf')}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!process.step2CompletedAt && process.currentStep === 2 && (
                                <div className="card-footer">
                                    <button className="btn btn-primary" onClick={() => handleStepComplete(2)} disabled={saving}>
                                        {t('completeStep')} &rarr; {t('step3')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3단계: 품의 (Jobcan) */}
                    {activeStep === 3 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('step3')}</h3>
                                {process.step3CompletedAt && (
                                    <span className="badge bg-success ms-2">
                                        <CheckCircle size={12} className="me-1" />
                                        완료 ({formatDateTime(process.step3CompletedAt)})
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                <p className="text-muted mb-3">{t('step3Desc')}</p>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">품의번호 (Jobcan)</label>
                                        {process.currentStep === 3 && !process.step3CompletedAt ? (
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Jobcan 품의번호 입력"
                                                    value={formData.approvalRequestId || ''}
                                                    onChange={e => setFormData({ ...formData, approvalRequestId: e.target.value })}
                                                />
                                                <button className="btn btn-primary" onClick={async () => {
                                                    setSaving(true)
                                                    try {
                                                        await fetch(`/api/order-process/${resolvedParams.id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ approvalRequestId: formData.approvalRequestId })
                                                        })
                                                        fetchProcess()
                                                    } finally { setSaving(false) }
                                                }} disabled={saving}>
                                                    <Save size={14} className="me-1" /> 저장
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="form-control-plaintext fw-bold">{process.approvalRequestId || '-'}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">품의 상태</label>
                                        <div>
                                            {process.approvalStatus === 'APPROVED' ? (
                                                <span className="badge bg-success">{t('approvalApproved')}</span>
                                            ) : process.approvalStatus === 'REJECTED' ? (
                                                <span className="badge bg-danger">{t('approvalRejected')}</span>
                                            ) : process.approvalRequestId ? (
                                                <span className="badge bg-warning">{t('approvalPending')}</span>
                                            ) : (
                                                <span className="text-muted">품의번호 입력 후 확인 가능</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {!process.step3CompletedAt && process.currentStep === 3 && process.approvalRequestId && (
                                <div className="card-footer">
                                    <button className="btn btn-primary" onClick={() => handleStepComplete(3)} disabled={saving}>
                                        {t('completeStep')} &rarr; {t('step4')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4단계: 품의완료 */}
                    {activeStep === 4 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('step4')}</h3>
                                {process.step4CompletedAt && (
                                    <span className="badge bg-success ms-2">
                                        <CheckCircle size={12} className="me-1" />
                                        완료 ({formatDateTime(process.step4CompletedAt)})
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                <p className="text-muted mb-3">{t('step4Desc')}</p>
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">품의번호</label>
                                        <div className="form-control-plaintext">{process.approvalRequestId || '-'}</div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">{t('approvalStatus')}</label>
                                        {process.currentStep === 4 && !process.step4CompletedAt ? (
                                            <select
                                                className="form-select"
                                                value={formData.approvalStatus || 'PENDING'}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value
                                                    setFormData({ ...formData, approvalStatus: newStatus })
                                                    setSaving(true)
                                                    try {
                                                        await fetch(`/api/order-process/${resolvedParams.id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                approvalStatus: newStatus,
                                                                approvalDate: newStatus === 'APPROVED' ? new Date().toISOString() : null
                                                            })
                                                        })
                                                        fetchProcess()
                                                    } finally { setSaving(false) }
                                                }}
                                            >
                                                <option value="PENDING">{t('approvalPending')}</option>
                                                <option value="APPROVED">{t('approvalApproved')}</option>
                                                <option value="REJECTED">{t('approvalRejected')}</option>
                                            </select>
                                        ) : (
                                            <div>
                                                {process.approvalStatus === 'APPROVED' && (
                                                    <span className="badge bg-success fs-6">{t('approvalApproved')}</span>
                                                )}
                                                {process.approvalStatus === 'REJECTED' && (
                                                    <span className="badge bg-danger fs-6">{t('approvalRejected')}</span>
                                                )}
                                                {(!process.approvalStatus || process.approvalStatus === 'PENDING') && (
                                                    <span className="badge bg-warning fs-6">{t('approvalPending')}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">승인일</label>
                                        <div className="form-control-plaintext">{formatDate(process.approvalDate)}</div>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">코멘트</label>
                                        <div className="form-control-plaintext">{process.approvalComment || '-'}</div>
                                    </div>
                                </div>
                            </div>
                            {!process.step4CompletedAt && process.currentStep === 4 && process.approvalStatus === 'APPROVED' && (
                                <div className="card-footer">
                                    <button className="btn btn-primary" onClick={() => handleStepComplete(4)} disabled={saving}>
                                        {t('completeStep')} &rarr; {t('step5')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5단계: 발주통지 */}
                    {activeStep === 5 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('step5')}</h3>
                                {process.step5CompletedAt && (
                                    <span className="badge bg-success ms-2">
                                        <CheckCircle size={12} className="me-1" />
                                        완료 ({formatDateTime(process.step5CompletedAt)})
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                <p className="text-muted mb-3">{t('step5Desc')}</p>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className={`avatar me-3 ${process.emailNotified ? 'bg-success' : 'bg-secondary'}`}>
                                                        <Send size={18} />
                                                    </span>
                                                    <div>
                                                        <div className="fw-bold">발주통지 메일</div>
                                                        <div className="text-muted small">
                                                            {process.emailNotified ? '발송 완료' : '미발송'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <span className={`avatar me-3 ${process.slackNotified ? 'bg-success' : 'bg-secondary'}`}>
                                                        <Send size={18} />
                                                    </span>
                                                    <div>
                                                        <div className="fw-bold">{t('slackNotified')}</div>
                                                        <div className="text-muted small">{process.slackNotified ? '발송 완료' : '미발송'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!process.step5CompletedAt && process.currentStep === 5 && (
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-outline-primary me-2"
                                            onClick={() => alert('메일 발송 기능은 Phase 2에서 구현됩니다 (Gmail API 연동)')}
                                        >
                                            <Send size={16} className="me-1" />
                                            발주통지 메일 발송
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => alert('Slack 알림 기능은 Phase 2에서 구현됩니다')}
                                        >
                                            <Send size={16} className="me-1" />
                                            Slack 알림
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!process.step5CompletedAt && process.currentStep === 5 && (
                                <div className="card-footer">
                                    <button className="btn btn-success" onClick={() => handleStepComplete(5)} disabled={saving}>
                                        프로세스 완료
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 오른쪽: 기본 정보 */}
                <div className="col-lg-4">
                    <div className="card mb-3">
                        <div className="card-header">
                            <h3 className="card-title">기본 정보</h3>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="text-muted small">상태</div>
                                <div>
                                    {process.status === 'IN_PROGRESS' && (
                                        <span className="badge bg-blue">{t('statusInProgress')}</span>
                                    )}
                                    {process.status === 'COMPLETED' && (
                                        <span className="badge bg-success">{t('statusCompleted')}</span>
                                    )}
                                    {process.status === 'CANCELLED' && (
                                        <span className="badge bg-danger">{t('statusCancelled')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="text-muted small">{t('client')}</div>
                                <div className="d-flex align-items-center">
                                    <Building2 size={16} className="me-2 text-muted" />
                                    {process.client?.name || '-'}
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="text-muted small">{t('requester')}</div>
                                <div>{process.requesterName || '-'}</div>
                            </div>
                            <div className="mb-3">
                                <div className="text-muted small">{t('dueDate')}</div>
                                <div>{formatDate(process.dueDate)}</div>
                            </div>
                            <div className="mb-3">
                                <div className="text-muted small">등록일</div>
                                <div>{formatDateTime(process.createdAt)}</div>
                            </div>
                        </div>
                    </div>

                    {/* 연결된 납품 프로세스 */}
                    {process.deliveryProcesses && process.deliveryProcesses.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">연결된 납품</h3>
                            </div>
                            <div className="list-group list-group-flush">
                                {process.deliveryProcesses.map(dp => (
                                    <Link
                                        key={dp.id}
                                        href={`/dashboard/delivery-process/${dp.id}`}
                                        className="list-group-item list-group-item-action"
                                    >
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <div className="fw-bold">{dp.processNumber}</div>
                                                <small className="text-muted">{dp.serialNumber}</small>
                                            </div>
                                            <span className={`badge ${dp.status === 'COMPLETED' ? 'bg-success' : 'bg-blue'}`}>
                                                {dp.status === 'COMPLETED' ? '완료' : '진행중'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
