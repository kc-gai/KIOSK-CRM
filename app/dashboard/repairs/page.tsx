'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Wrench, Search, AlertCircle, CheckCircle, Clock, ArrowRight, Trash2, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Repair = {
    id: string
    kioskId: string
    serialNumber: string
    receiptDate: string
    receiptReason: string
    symptom?: string
    reportedBy?: string
    repairStartDate?: string
    repairEndDate?: string
    repairVendor?: string
    repairCost?: number
    repairDetails?: string
    partsReplaced?: string
    releaseDate?: string
    releasedTo?: string
    status: string
    notes?: string
}

const STATUS_OPTIONS = ['all', 'RECEIVED', 'DIAGNOSING', 'REPAIRING', 'COMPLETED', 'RELEASED']

export default function RepairsPage() {
    const t = useTranslations('repairs')
    const tc = useTranslations('common')
    const [repairs, setRepairs] = useState<Repair[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [editingRepair, setEditingRepair] = useState<Repair | null>(null)

    const [formData, setFormData] = useState({
        kioskId: '',
        serialNumber: '',
        receiptReason: '',
        symptom: '',
        reportedBy: '',
        repairVendor: '',
        repairCost: '',
        repairDetails: '',
        partsReplaced: '',
        releasedTo: '',
        status: 'RECEIVED',
        notes: ''
    })

    const fetchRepairs = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (searchQuery) params.append('search', searchQuery)

            const res = await fetch(`/api/repairs?${params.toString()}`)
            if (res.ok) {
                setRepairs(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRepairs()
    }, [statusFilter])

    const handleSearch = () => {
        fetchRepairs()
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            RECEIVED: 'bg-yellow',
            DIAGNOSING: 'bg-orange',
            REPAIRING: 'bg-blue',
            COMPLETED: 'bg-green',
            RELEASED: 'bg-secondary'
        }
        const labels: Record<string, string> = {
            RECEIVED: t('statusReceived'),
            DIAGNOSING: t('statusDiagnosing'),
            REPAIRING: t('statusRepairing'),
            COMPLETED: t('statusCompleted'),
            RELEASED: t('statusReleased')
        }
        return <span className={`badge ${colors[status] || 'bg-secondary'} text-white`}>{labels[status] || status}</span>
    }

    const handleSubmit = async () => {
        try {
            const url = editingRepair ? `/api/repairs/${editingRepair.id}` : '/api/repairs'
            const method = editingRepair ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    repairCost: formData.repairCost ? parseInt(formData.repairCost) : null
                })
            })

            if (res.ok) {
                setShowModal(false)
                setEditingRepair(null)
                resetForm()
                fetchRepairs()
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
            const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchRepairs()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEdit = (repair: Repair) => {
        setEditingRepair(repair)
        setFormData({
            kioskId: repair.kioskId,
            serialNumber: repair.serialNumber,
            receiptReason: repair.receiptReason,
            symptom: repair.symptom || '',
            reportedBy: repair.reportedBy || '',
            repairVendor: repair.repairVendor || '',
            repairCost: repair.repairCost?.toString() || '',
            repairDetails: repair.repairDetails || '',
            partsReplaced: repair.partsReplaced || '',
            releasedTo: repair.releasedTo || '',
            status: repair.status,
            notes: repair.notes || ''
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setFormData({
            kioskId: '',
            serialNumber: '',
            receiptReason: '',
            symptom: '',
            reportedBy: '',
            repairVendor: '',
            repairCost: '',
            repairDetails: '',
            partsReplaced: '',
            releasedTo: '',
            status: 'RECEIVED',
            notes: ''
        })
    }

    // 통계
    const stats = {
        total: repairs.length,
        received: repairs.filter(r => r.status === 'RECEIVED').length,
        repairing: repairs.filter(r => r.status === 'REPAIRING' || r.status === 'DIAGNOSING').length,
        completed: repairs.filter(r => r.status === 'COMPLETED' || r.status === 'RELEASED').length
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">
                            <Wrench className="me-2" size={24} />
                            {t('title')}
                        </h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
                    </div>
                    <div className="col-auto ms-auto">
                        <Button onClick={() => { resetForm(); setEditingRepair(null); setShowModal(true); }}>
                            <Plus size={16} className="me-1" />
                            {t('newRepair')}
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
                                <div className="subheader">{t('totalRepairs')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.total}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card bg-yellow-lt">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <AlertCircle size={20} className="me-2 text-yellow" />
                                <div className="subheader">{t('waitingRepair')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.received}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card bg-blue-lt">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <Clock size={20} className="me-2 text-blue" />
                                <div className="subheader">{t('inProgress')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.repairing}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card bg-green-lt">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <CheckCircle size={20} className="me-2 text-green" />
                                <div className="subheader">{t('completed')}</div>
                            </div>
                            <div className="h1 mb-0">{stats.completed}</div>
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
                                        {status === 'all' ? tc('all') : t(`status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
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
                                <th>{t('serialNumber')}</th>
                                <th>{t('receiptDate')}</th>
                                <th>{t('receiptReason')}</th>
                                <th>{t('repairVendor')}</th>
                                <th>{t('status')}</th>
                                <th>{t('repairCost')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4">
                                        <div className="spinner-border" role="status"></div>
                                    </td>
                                </tr>
                            ) : repairs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-muted">
                                        <Wrench size={48} className="mb-2 opacity-50" />
                                        <div>{t('noRepairs')}</div>
                                    </td>
                                </tr>
                            ) : (
                                repairs.map((repair) => (
                                    <tr key={repair.id}>
                                        <td>
                                            <strong>{repair.serialNumber}</strong>
                                        </td>
                                        <td>{new Date(repair.receiptDate).toLocaleDateString()}</td>
                                        <td>
                                            <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                                {repair.receiptReason}
                                            </div>
                                        </td>
                                        <td>{repair.repairVendor || '-'}</td>
                                        <td>{getStatusBadge(repair.status)}</td>
                                        <td>
                                            {repair.repairCost ? `¥${repair.repairCost.toLocaleString()}` : '-'}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(repair)}>
                                                    <Edit size={14} />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(repair.id)}>
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
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingRepair ? t('editRepair') : t('newRepair')}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">{t('serialNumber')} *</label>
                                        <Input
                                            value={formData.serialNumber}
                                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('status')}</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="RECEIVED">{t('statusReceived')}</option>
                                            <option value="DIAGNOSING">{t('statusDiagnosing')}</option>
                                            <option value="REPAIRING">{t('statusRepairing')}</option>
                                            <option value="COMPLETED">{t('statusCompleted')}</option>
                                            <option value="RELEASED">{t('statusReleased')}</option>
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('receiptReason')} *</label>
                                        <Input
                                            value={formData.receiptReason}
                                            onChange={(e) => setFormData({ ...formData, receiptReason: e.target.value })}
                                            placeholder={t('receiptReasonPlaceholder')}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('symptom')}</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={formData.symptom}
                                            onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                                            placeholder={t('symptomPlaceholder')}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('reportedBy')}</label>
                                        <Input
                                            value={formData.reportedBy}
                                            onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('repairVendor')}</label>
                                        <Input
                                            value={formData.repairVendor}
                                            onChange={(e) => setFormData({ ...formData, repairVendor: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('repairCost')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text">¥</span>
                                            <Input
                                                type="number"
                                                value={formData.repairCost}
                                                onChange={(e) => setFormData({ ...formData, repairCost: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('releasedTo')}</label>
                                        <Input
                                            value={formData.releasedTo}
                                            onChange={(e) => setFormData({ ...formData, releasedTo: e.target.value })}
                                            placeholder={t('releasedToPlaceholder')}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('repairDetails')}</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={formData.repairDetails}
                                            onChange={(e) => setFormData({ ...formData, repairDetails: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('partsReplaced')}</label>
                                        <Input
                                            value={formData.partsReplaced}
                                            onChange={(e) => setFormData({ ...formData, partsReplaced: e.target.value })}
                                            placeholder={t('partsReplacedPlaceholder')}
                                        />
                                    </div>
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
