'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Package, Search, Clock, CheckCircle, AlertTriangle, ShoppingCart, Trash2, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SampleLoan = {
    id: string
    sampleNumber: string
    serialNumber?: string
    modelName?: string
    description?: string
    lenderName: string
    lenderContact?: string
    lenderPhone?: string
    lenderEmail?: string
    loanDate: string
    expectedReturnDate?: string
    actualReturnDate?: string
    purpose?: string
    usageLocation?: string
    status: string
    responsiblePerson?: string
    returnCondition?: string
    returnNotes?: string
    convertedToKioskId?: string
    notes?: string
}

const STATUS_OPTIONS = ['all', 'ON_LOAN', 'RETURNED', 'OVERDUE', 'PURCHASED']

export default function SampleLoansPage() {
    const t = useTranslations('sampleLoans')
    const tc = useTranslations('common')
    const [samples, setSamples] = useState<SampleLoan[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [editingSample, setEditingSample] = useState<SampleLoan | null>(null)

    const [formData, setFormData] = useState({
        serialNumber: '',
        modelName: '',
        description: '',
        lenderName: '',
        lenderContact: '',
        lenderPhone: '',
        lenderEmail: '',
        loanDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: '',
        purpose: '',
        usageLocation: '',
        responsiblePerson: '',
        status: 'ON_LOAN',
        returnCondition: '',
        returnNotes: '',
        notes: ''
    })

    const fetchSamples = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (searchQuery) params.append('search', searchQuery)

            const res = await fetch(`/api/sample-loans?${params.toString()}`)
            if (res.ok) {
                setSamples(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSamples()
    }, [statusFilter])

    const handleSearch = () => {
        fetchSamples()
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ON_LOAN: 'bg-blue',
            RETURNED: 'bg-green',
            OVERDUE: 'bg-red',
            PURCHASED: 'bg-purple'
        }
        const labels: Record<string, string> = {
            ON_LOAN: t('statusOnLoan'),
            RETURNED: t('statusReturned'),
            OVERDUE: t('statusOverdue'),
            PURCHASED: t('statusPurchased')
        }
        return <span className={`badge ${colors[status] || 'bg-secondary'} text-white`}>{labels[status] || status}</span>
    }

    const handleSubmit = async () => {
        try {
            const url = editingSample ? `/api/sample-loans/${editingSample.id}` : '/api/sample-loans'
            const method = editingSample ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingSample(null)
                resetForm()
                fetchSamples()
            } else {
                alert(t('saveFailed'))
            }
        } catch (e) {
            console.error(e)
            alert(tc('error'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/sample-loans/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchSamples()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEdit = (sample: SampleLoan) => {
        setEditingSample(sample)
        setFormData({
            serialNumber: sample.serialNumber || '',
            modelName: sample.modelName || '',
            description: sample.description || '',
            lenderName: sample.lenderName,
            lenderContact: sample.lenderContact || '',
            lenderPhone: sample.lenderPhone || '',
            lenderEmail: sample.lenderEmail || '',
            loanDate: sample.loanDate.split('T')[0],
            expectedReturnDate: sample.expectedReturnDate?.split('T')[0] || '',
            purpose: sample.purpose || '',
            usageLocation: sample.usageLocation || '',
            responsiblePerson: sample.responsiblePerson || '',
            status: sample.status,
            returnCondition: sample.returnCondition || '',
            returnNotes: sample.returnNotes || '',
            notes: sample.notes || ''
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setFormData({
            serialNumber: '',
            modelName: '',
            description: '',
            lenderName: '',
            lenderContact: '',
            lenderPhone: '',
            lenderEmail: '',
            loanDate: new Date().toISOString().split('T')[0],
            expectedReturnDate: '',
            purpose: '',
            usageLocation: '',
            responsiblePerson: '',
            status: 'ON_LOAN',
            returnCondition: '',
            returnNotes: '',
            notes: ''
        })
    }

    // 통계
    const stats = {
        total: samples.length,
        onLoan: samples.filter(s => s.status === 'ON_LOAN').length,
        overdue: samples.filter(s => s.status === 'OVERDUE').length,
        returned: samples.filter(s => s.status === 'RETURNED').length,
        purchased: samples.filter(s => s.status === 'PURCHASED').length
    }

    // 연체 체크 (반납예정일 지난 경우)
    const checkOverdue = (sample: SampleLoan) => {
        if (sample.status !== 'ON_LOAN' || !sample.expectedReturnDate) return false
        return new Date(sample.expectedReturnDate) < new Date()
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">
                            <Package className="me-2" size={24} />
                            {t('title')}
                        </h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
                    </div>
                    <div className="col-auto ms-auto">
                        <Button onClick={() => { resetForm(); setEditingSample(null); setShowModal(true); }}>
                            <Plus size={16} className="me-1" />
                            {t('newSample')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="subheader">{t('totalSamples')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.total}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card bg-blue-lt">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <Clock size={20} className="me-2 text-blue" />
                                <div className="subheader">{t('onLoan')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.onLoan}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card bg-red-lt">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <AlertTriangle size={20} className="me-2 text-red" />
                                <div className="subheader">{t('overdue')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.overdue}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card bg-purple-lt">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <ShoppingCart size={20} className="me-2 text-purple" />
                                <div className="subheader">{t('purchased')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.purchased}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 필터 */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="input-icon">
                                <span className="input-icon-addon"><Search size={16} /></span>
                                <Input
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="ps-5"
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {STATUS_OPTIONS.map(status => (
                                    <option key={status} value={status}>
                                        {status === 'all' ? tc('all') : t(`status${status.split('_').map(s => s.charAt(0) + s.slice(1).toLowerCase()).join('')}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <Button variant="outline" onClick={handleSearch}>
                                <Search size={16} className="me-1" />
                                {tc('search')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 목록 */}
            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table">
                        <thead>
                            <tr>
                                <th>{t('sampleNumber')}</th>
                                <th>{t('lenderName')}</th>
                                <th>{t('modelName')}</th>
                                <th>{t('loanDate')}</th>
                                <th>{t('expectedReturnDate')}</th>
                                <th>{t('status')}</th>
                                <th>{t('responsiblePerson')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        <div className="spinner-border" role="status"></div>
                                    </td>
                                </tr>
                            ) : samples.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">
                                        <Package size={48} className="mb-2 opacity-50" />
                                        <div>{t('noSamples')}</div>
                                    </td>
                                </tr>
                            ) : (
                                samples.map((sample) => (
                                    <tr key={sample.id} className={checkOverdue(sample) ? 'bg-red-lt' : ''}>
                                        <td>
                                            <strong>{sample.sampleNumber}</strong>
                                            {sample.serialNumber && (
                                                <div className="text-muted small">{sample.serialNumber}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div>{sample.lenderName}</div>
                                            {sample.lenderContact && (
                                                <div className="text-muted small">{sample.lenderContact}</div>
                                            )}
                                        </td>
                                        <td>{sample.modelName || '-'}</td>
                                        <td>{new Date(sample.loanDate).toLocaleDateString()}</td>
                                        <td>
                                            {sample.expectedReturnDate ? (
                                                <span className={checkOverdue(sample) ? 'text-danger fw-bold' : ''}>
                                                    {new Date(sample.expectedReturnDate).toLocaleDateString()}
                                                    {checkOverdue(sample) && <AlertTriangle size={14} className="ms-1" />}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>{getStatusBadge(sample.status)}</td>
                                        <td>{sample.responsiblePerson || '-'}</td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(sample)}>
                                                    <Edit size={14} />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(sample.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
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
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingSample ? t('editSample') : t('newSample')}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {/* 대여처 정보 */}
                                    <div className="col-12">
                                        <h4 className="mb-3">{t('lenderInfo')}</h4>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('lenderName')} *</label>
                                        <Input
                                            value={formData.lenderName}
                                            onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                                            placeholder={t('lenderNamePlaceholder')}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('lenderContact')}</label>
                                        <Input
                                            value={formData.lenderContact}
                                            onChange={(e) => setFormData({ ...formData, lenderContact: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('lenderPhone')}</label>
                                        <Input
                                            value={formData.lenderPhone}
                                            onChange={(e) => setFormData({ ...formData, lenderPhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('lenderEmail')}</label>
                                        <Input
                                            type="email"
                                            value={formData.lenderEmail}
                                            onChange={(e) => setFormData({ ...formData, lenderEmail: e.target.value })}
                                        />
                                    </div>

                                    {/* 장비 정보 */}
                                    <div className="col-12 mt-4">
                                        <h4 className="mb-3">{t('equipmentInfo')}</h4>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('serialNumber')}</label>
                                        <Input
                                            value={formData.serialNumber}
                                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('modelName')}</label>
                                        <Input
                                            value={formData.modelName}
                                            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('description')}</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* 대여 정보 */}
                                    <div className="col-12 mt-4">
                                        <h4 className="mb-3">{t('loanInfo')}</h4>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('loanDate')} *</label>
                                        <Input
                                            type="date"
                                            value={formData.loanDate}
                                            onChange={(e) => setFormData({ ...formData, loanDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('expectedReturnDate')}</label>
                                        <Input
                                            type="date"
                                            value={formData.expectedReturnDate}
                                            onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('status')}</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="ON_LOAN">{t('statusOnLoan')}</option>
                                            <option value="RETURNED">{t('statusReturned')}</option>
                                            <option value="OVERDUE">{t('statusOverdue')}</option>
                                            <option value="PURCHASED">{t('statusPurchased')}</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('purpose')}</label>
                                        <Input
                                            value={formData.purpose}
                                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                            placeholder={t('purposePlaceholder')}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('usageLocation')}</label>
                                        <Input
                                            value={formData.usageLocation}
                                            onChange={(e) => setFormData({ ...formData, usageLocation: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('responsiblePerson')}</label>
                                        <Input
                                            value={formData.responsiblePerson}
                                            onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                                        />
                                    </div>

                                    {/* 반납 정보 (편집 시) */}
                                    {editingSample && (
                                        <>
                                            <div className="col-12 mt-4">
                                                <h4 className="mb-3">{t('returnInfo')}</h4>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">{t('returnCondition')}</label>
                                                <Input
                                                    value={formData.returnCondition}
                                                    onChange={(e) => setFormData({ ...formData, returnCondition: e.target.value })}
                                                    placeholder={t('returnConditionPlaceholder')}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">{t('returnNotes')}</label>
                                                <Input
                                                    value={formData.returnNotes}
                                                    onChange={(e) => setFormData({ ...formData, returnNotes: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="col-12">
                                        <label className="form-label">{tc('notes')}</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="outline" onClick={() => setShowModal(false)}>
                                    {tc('cancel')}
                                </Button>
                                <Button onClick={handleSubmit}>{tc('save')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
