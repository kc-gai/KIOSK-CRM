'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface ManualSection {
    id: string
    sectionNumber: number
    title: string
    titleKo: string | null
    sortOrder: number
}

interface AssemblyManual {
    id: string
    slug: string
    title: string
    titleKo: string | null
    subtitle: string | null
    version: string
    versionDate: string
    changeLog: string | null
    docType: string
    status: string
    isLatest: boolean
    authorName: string | null
    tags: string | null
    sections: ManualSection[]
    createdAt: string
    updatedAt: string
}

export default function AssemblyManualPage() {
    const t = useTranslations('assemblyManual')
    const tc = useTranslations('common')

    const [manuals, setManuals] = useState<AssemblyManual[]>([])
    const [loading, setLoading] = useState(true)
    const [docTypeFilter, setDocTypeFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')

    const fetchManuals = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (docTypeFilter) params.append('docType', docTypeFilter)
            if (statusFilter) params.append('status', statusFilter)

            const res = await fetch(`/api/assembly-manual?${params.toString()}`)
            const data = await res.json()
            setManuals(data)
        } catch (error) {
            console.error('Failed to fetch manuals:', error)
        } finally {
            setLoading(false)
        }
    }, [docTypeFilter, statusFilter])

    useEffect(() => {
        fetchManuals()
    }, [fetchManuals])

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/assembly-manual/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchManuals()
            }
        } catch (error) {
            console.error('Failed to delete:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            'DRAFT': { color: 'secondary', label: t('statusDraft') },
            'PUBLISHED': { color: 'success', label: t('statusPublished') },
            'ARCHIVED': { color: 'warning', label: t('statusArchived') }
        }
        const { color, label } = statusMap[status] || { color: 'secondary', label: status }
        return <span className={`badge bg-${color}`}>{label}</span>
    }

    const getDocTypeBadge = (docType: string) => {
        const typeMap: Record<string, { color: string; label: string }> = {
            'ASSEMBLY': { color: 'blue', label: t('typeAssembly') },
            'OPERATION': { color: 'green', label: t('typeOperation') },
            'MAINTENANCE': { color: 'orange', label: t('typeMaintenance') }
        }
        const { color, label } = typeMap[docType] || { color: 'secondary', label: docType }
        return <span className={`badge bg-${color}-lt`}>{label}</span>
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ja-JP')
    }

    return (
        <div className="container-xl">
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">
                            <i className="ti ti-tool me-2"></i>
                            {t('title')}
                        </h2>
                    </div>
                    <div className="col-auto ms-auto">
                        <Link href="/dashboard/assembly-manual/new" className="btn btn-primary">
                            <i className="ti ti-plus me-1"></i>
                            {t('newManual')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="card mt-3">
                <div className="card-header">
                    <div className="row g-2 align-items-center">
                        <div className="col-auto">
                            <select
                                className="form-select"
                                value={docTypeFilter}
                                onChange={(e) => setDocTypeFilter(e.target.value)}
                            >
                                <option value="">{t('docType')}: All</option>
                                <option value="ASSEMBLY">{t('typeAssembly')}</option>
                                <option value="OPERATION">{t('typeOperation')}</option>
                                <option value="MAINTENANCE">{t('typeMaintenance')}</option>
                            </select>
                        </div>
                        <div className="col-auto">
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">{t('status')}: All</option>
                                <option value="DRAFT">{t('statusDraft')}</option>
                                <option value="PUBLISHED">{t('statusPublished')}</option>
                                <option value="ARCHIVED">{t('statusArchived')}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{tc('loading')}</span>
                            </div>
                        </div>
                    ) : manuals.length === 0 ? (
                        <div className="empty py-5">
                            <div className="empty-icon">
                                <i className="ti ti-book-off" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <p className="empty-title">{t('noManuals')}</p>
                            <div className="empty-action">
                                <Link href="/dashboard/assembly-manual/new" className="btn btn-primary">
                                    <i className="ti ti-plus me-1"></i>
                                    {t('newManual')}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush">
                            {manuals.map((manual) => (
                                <div key={manual.id} className="list-group-item">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <span className="avatar bg-blue-lt">
                                                <i className="ti ti-book"></i>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="d-flex align-items-center mb-1">
                                                <Link href={`/dashboard/assembly-manual/${manual.slug}`} className="text-reset fw-semibold me-2">
                                                    {manual.title}
                                                </Link>
                                                {manual.isLatest && (
                                                    <span className="badge bg-primary-lt me-2">{t('latestVersion')}</span>
                                                )}
                                                {getStatusBadge(manual.status)}
                                            </div>
                                            <div className="text-muted small">
                                                {getDocTypeBadge(manual.docType)}
                                                <span className="mx-2">·</span>
                                                <span>v{manual.version}</span>
                                                <span className="mx-2">·</span>
                                                <span>{formatDate(manual.versionDate)}</span>
                                                <span className="mx-2">·</span>
                                                <span>{manual.sections.length} sections</span>
                                                {manual.authorName && (
                                                    <>
                                                        <span className="mx-2">·</span>
                                                        <span>{manual.authorName}</span>
                                                    </>
                                                )}
                                            </div>
                                            {manual.titleKo && (
                                                <div className="text-muted small mt-1">
                                                    <i className="ti ti-language me-1"></i>
                                                    {manual.titleKo}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-auto">
                                            <div className="btn-list flex-nowrap">
                                                <Link
                                                    href={`/dashboard/assembly-manual/${manual.slug}`}
                                                    className="btn btn-sm btn-ghost-primary"
                                                    title={t('viewManual')}
                                                >
                                                    <i className="ti ti-eye"></i>
                                                </Link>
                                                <Link
                                                    href={`/dashboard/assembly-manual/${manual.id}/edit`}
                                                    className="btn btn-sm btn-ghost-warning"
                                                    title={t('editManual')}
                                                >
                                                    <i className="ti ti-edit"></i>
                                                </Link>
                                                <button
                                                    className="btn btn-sm btn-ghost-danger"
                                                    onClick={() => handleDelete(manual.id)}
                                                    title={tc('delete')}
                                                >
                                                    <i className="ti ti-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
