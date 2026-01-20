'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ChevronRight, Package, CheckCircle, Truck, FileText, Copy, Download, Check, X } from 'lucide-react'
import Link from 'next/link'

type DeliveryProcess = {
    id: string
    processNumber: string
    serialNumber: string
    modelName?: string
    orderProcess?: { processNumber: string; title: string }
    currentStep: number
    status: string
    shippedDate?: string
    expectedArrival?: string
    actualArrival?: string
    vendorName?: string
    createdAt: string
    updatedAt: string
}

const STEPS = [
    { step: 1, key: 'step1' },
    { step: 2, key: 'step2' },
]

export default function DeliveryProcessPage() {
    const t = useTranslations('deliveryProcess')
    const tc = useTranslations('common')
    const [processes, setProcesses] = useState<DeliveryProcess[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [showErpModal, setShowErpModal] = useState(false)
    const [erpMarkdown, setErpMarkdown] = useState('')
    const [erpLoading, setErpLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const fetchProcesses = async () => {
        try {
            const res = await fetch('/api/delivery-process')
            if (res.ok) {
                setProcesses(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProcesses()
    }, [])

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === processes.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(processes.map(p => p.id)))
        }
    }

    const generateBulkErpRequest = async () => {
        if (selectedIds.size === 0) return
        setErpLoading(true)
        try {
            const res = await fetch('/api/delivery-process/erp-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            })
            if (res.ok) {
                const data = await res.json()
                setErpMarkdown(data.markdown)
                setShowErpModal(true)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setErpLoading(false)
        }
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(erpMarkdown)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    const downloadMarkdown = () => {
        const blob = new Blob([erpMarkdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const today = new Date()
        a.download = `erp-request-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

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

    const getStepProgress = (currentStep: number, status: string) => {
        if (status === 'COMPLETED') {
            return (
                <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                         style={{ width: '24px', height: '24px' }}>
                        <CheckCircle size={14} />
                    </div>
                    <div className="bg-success" style={{ width: '24px', height: '2px' }} />
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                         style={{ width: '24px', height: '24px' }}>
                        <CheckCircle size={14} />
                    </div>
                </div>
            )
        }

        return (
            <div className="d-flex align-items-center gap-2">
                <div
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                        currentStep >= 1 ? 'bg-primary text-white' : 'bg-secondary-subtle text-muted'
                    }`}
                    style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
                    title={t('step1')}
                >
                    {currentStep > 1 ? <CheckCircle size={12} /> : <Truck size={12} />}
                </div>
                <div
                    className={currentStep > 1 ? 'bg-success' : 'bg-secondary-subtle'}
                    style={{ width: '24px', height: '2px' }}
                />
                <div
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                        currentStep >= 2 ? 'bg-primary text-white' : 'bg-secondary-subtle text-muted'
                    }`}
                    style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
                    title={t('step2')}
                >
                    {currentStep > 2 ? <CheckCircle size={12} /> : <Package size={12} />}
                </div>
            </div>
        )
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">{t('title')}</h2>
                    </div>
                    <div className="col-auto ms-auto d-flex gap-2">
                        {selectedIds.size > 0 && (
                            <button
                                className="btn btn-outline-primary"
                                onClick={generateBulkErpRequest}
                                disabled={erpLoading}
                            >
                                <FileText size={16} className="me-1" />
                                {t('erpRequest')} ({selectedIds.size})
                            </button>
                        )}
                        <Link href="/dashboard/delivery-process/new" className="btn btn-primary">
                            <Plus size={16} className="me-1" />
                            {t('newProcess')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* 단계 설명 카드 */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        {STEPS.map((s) => (
                            <div key={s.step} className="col-md-6">
                                <div className="d-flex align-items-start">
                                    <div
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                                        style={{ width: '40px', height: '40px', fontSize: '1rem' }}
                                    >
                                        {s.step === 1 ? <Truck size={20} /> : <Package size={20} />}
                                    </div>
                                    <div>
                                        <div className="fw-bold">{t(s.key)}</div>
                                        <div className="text-muted small">{t(`${s.key}Desc`)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 프로세스 목록 */}
            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-hover">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={processes.length > 0 && selectedIds.size === processes.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>{t('processNumber')}</th>
                                <th>{t('serialNumber')}</th>
                                <th>{t('modelName')}</th>
                                <th>{t('orderProcess')}</th>
                                <th>{t('vendorName')}</th>
                                <th>{t('currentStep')}</th>
                                <th>{t('status')}</th>
                                <th>{t('expectedArrival')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm" role="status"></div>
                                        <span className="ms-2">{tc('loading')}</span>
                                    </td>
                                </tr>
                            ) : processes.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-4 text-muted">
                                        {t('noProcess')}
                                    </td>
                                </tr>
                            ) : (
                                processes.map((p) => (
                                    <tr key={p.id} className={selectedIds.has(p.id) ? 'table-active' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.has(p.id)}
                                                onChange={() => toggleSelect(p.id)}
                                            />
                                        </td>
                                        <td>
                                            <span className="text-muted">{p.processNumber}</span>
                                        </td>
                                        <td className="fw-bold">{p.serialNumber}</td>
                                        <td>{p.modelName || '-'}</td>
                                        <td>
                                            {p.orderProcess ? (
                                                <Link href={`/dashboard/order-process/${p.orderProcess}`} className="text-decoration-none">
                                                    {p.orderProcess.processNumber}
                                                </Link>
                                            ) : '-'}
                                        </td>
                                        <td>{p.vendorName || '-'}</td>
                                        <td>{getStepProgress(p.currentStep, p.status)}</td>
                                        <td>{getStatusBadge(p.status)}</td>
                                        <td>
                                            {p.expectedArrival
                                                ? new Date(p.expectedArrival).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/delivery-process/${p.id}`} className="btn btn-sm btn-outline-primary">
                                                <ChevronRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ERP 요청 모달 */}
            {showErpModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('erpRequestTitle')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowErpModal(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">{t('erpRequestDesc')}</p>

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
                                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {erpMarkdown}
                                    </pre>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowErpModal(false)}
                                >
                                    {tc('cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
