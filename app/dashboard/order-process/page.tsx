'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ChevronRight, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type OrderProcess = {
    id: string
    processNumber: string
    title: string
    clientId: string
    client?: { name: string }
    requesterName?: string
    currentStep: number
    status: string
    acquisition?: string // LEASE or PURCHASE
    quantity?: number
    dueDate?: string
    createdAt: string
    updatedAt: string
}

const STEPS = [
    { step: 1, key: 'step1' },
    { step: 2, key: 'step2' },
    { step: 3, key: 'step3' },
    { step: 4, key: 'step4' },
    { step: 5, key: 'step5' },
]

export default function OrderProcessPage() {
    const t = useTranslations('orderProcess')
    const tc = useTranslations('common')
    const [processes, setProcesses] = useState<OrderProcess[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    const fetchProcesses = async () => {
        try {
            const res = await fetch('/api/order-process')
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

    const handleBulkSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch('/api/jobcan/sync-all', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                const msg = `Jobcan同期完了: ${data.synced}件更新 / ${data.unchanged}件変更なし` +
                    (data.failed > 0 ? ` / ${data.failed}件失敗` : '')
                alert(msg)
                fetchProcesses()
            } else {
                alert(data.error || '同期に失敗しました')
            }
        } catch {
            alert('Jobcan同期中にエラーが発生しました')
        } finally {
            setSyncing(false)
        }
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

    const getAcquisitionBadge = (acquisition?: string) => {
        switch (acquisition) {
            case 'LEASE':
                return <span className="badge bg-purple-lt text-purple">리스</span>
            case 'PURCHASE':
                return <span className="badge bg-cyan-lt text-cyan">구매</span>
            default:
                return <span className="badge bg-secondary-lt">-</span>
        }
    }

    const getStepProgress = (currentStep: number) => {
        return (
            <div className="d-flex align-items-center gap-1">
                {STEPS.map((s, idx) => (
                    <div key={s.step} className="d-flex align-items-center">
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${
                                currentStep > s.step
                                    ? 'bg-success text-white'
                                    : currentStep === s.step
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary-subtle text-muted'
                            }`}
                            style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
                            title={t(s.key)}
                        >
                            {currentStep > s.step ? <CheckCircle size={12} /> : s.step}
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div
                                className={`mx-1 ${currentStep > s.step ? 'bg-success' : 'bg-secondary-subtle'}`}
                                style={{ width: '16px', height: '2px' }}
                            />
                        )}
                    </div>
                ))}
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
                        <button
                            className="btn btn-outline-secondary"
                            onClick={handleBulkSync}
                            disabled={syncing}
                        >
                            <RefreshCw size={16} className={`me-1 ${syncing ? 'spinner-border spinner-border-sm' : ''}`} />
                            {syncing ? '同期中...' : 'Jobcan一括同期'}
                        </button>
                        <Link href="/dashboard/order-process/new" className="btn btn-primary">
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
                        {STEPS.map((s, idx) => (
                            <div key={s.step} className="col">
                                <div className="d-flex align-items-start">
                                    <div
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 me-2"
                                        style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                                    >
                                        {s.step}
                                    </div>
                                    <div>
                                        <div className="fw-bold small">{t(s.key)}</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t(`${s.key}Desc`)}</div>
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
                                <th>{t('processNumber')}</th>
                                <th>{t('processTitle')}</th>
                                <th>{t('client')}</th>
                                <th>취득유형</th>
                                <th>수량</th>
                                <th>{t('currentStep')}</th>
                                <th>{t('status')}</th>
                                <th>{t('dueDate')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm" role="status"></div>
                                        <span className="ms-2">{tc('loading')}</span>
                                    </td>
                                </tr>
                            ) : processes.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-4 text-muted">
                                        {t('noProcess')}
                                    </td>
                                </tr>
                            ) : (
                                processes.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <span className="text-muted">{p.processNumber}</span>
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/order-process/${p.id}`} className="text-decoration-none fw-bold">
                                                {p.title}
                                            </Link>
                                        </td>
                                        <td>{p.client?.name || '-'}</td>
                                        <td>{getAcquisitionBadge(p.acquisition)}</td>
                                        <td className="text-center">{p.quantity || '-'}</td>
                                        <td>{getStepProgress(p.currentStep)}</td>
                                        <td>{getStatusBadge(p.status)}</td>
                                        <td>
                                            {p.dueDate ? (
                                                <span className="d-flex align-items-center gap-1">
                                                    <Clock size={14} className="text-muted" />
                                                    {new Date(p.dueDate).toLocaleDateString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/order-process/${p.id}`} className="btn btn-sm btn-outline-primary">
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
        </div>
    )
}
