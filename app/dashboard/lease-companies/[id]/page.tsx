'use client'

import { useEffect, useState, use } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, Building2, Monitor, Calendar, Banknote } from 'lucide-react'

type LeasedKiosk = {
    id: string
    serialNumber: string
    kioskNumber?: string
    branchName?: string
    status: string
    leaseMonthlyFee?: number
    leasePeriod?: number
    leaseStartDate?: string
    leaseEndDate?: string
    leaseContractNo?: string
    currentPartner?: {
        id: string
        name: string
    }
}

type LeaseCompany = {
    id: string
    name: string
    code?: string
    contact?: string
    email?: string
    address?: string
    managerName?: string
    managerPhone?: string
    managerEmail?: string
    defaultMonthlyFee?: number
    defaultPeriod?: number
    contractTerms?: string
    isActive: boolean
    leasedKiosks: LeasedKiosk[]
    _count?: { leasedKiosks: number }
    createdAt: string
}

export default function LeaseCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const t = useTranslations('leaseCompanies')
    const tc = useTranslations('common')
    const ta = useTranslations('assets')

    const [company, setCompany] = useState<LeaseCompany | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchCompany = async () => {
        try {
            const res = await fetch(`/api/lease-companies/${resolvedParams.id}`)
            if (res.ok) {
                setCompany(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompany()
    }, [resolvedParams.id])

    const formatYen = (value?: number) => {
        if (!value) return '-'
        return `¥${value.toLocaleString()}`
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ko-KR')
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IN_STOCK':
                return <span className="badge bg-secondary">{ta('statusInStock')}</span>
            case 'DEPLOYED':
                return <span className="badge bg-success">{ta('statusDeployed')}</span>
            case 'MAINTENANCE':
                return <span className="badge bg-warning">{ta('statusMaintenance')}</span>
            case 'RETIRED':
                return <span className="badge bg-danger">{ta('statusRetired')}</span>
            default:
                return <span className="badge bg-secondary">{status}</span>
        }
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

    if (!company) {
        return (
            <div className="container-xl">
                <div className="alert alert-danger">리스 회사를 찾을 수 없습니다</div>
            </div>
        )
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/lease-companies" className="btn btn-outline-secondary me-3">
                            <ArrowLeft size={16} className="me-1" />
                            목록으로
                        </Link>
                    </div>
                    <div className="col">
                        <div className="d-flex align-items-center">
                            <Building2 size={24} className="me-2 text-primary" />
                            <h2 className="page-title mb-0">{company.name}</h2>
                        </div>
                    </div>
                    <div className="col-auto">
                        {company.isActive ? (
                            <span className="badge bg-success">{t('active')}</span>
                        ) : (
                            <span className="badge bg-secondary">{t('inactive')}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="row">
                {/* 회사 정보 */}
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3 className="card-title">회사 정보</h3>
                        </div>
                        <div className="card-body">
                            <div className="datagrid">
                                {company.code && (
                                    <div className="datagrid-item">
                                        <div className="datagrid-title">{t('code')}</div>
                                        <div className="datagrid-content">
                                            <span className="badge bg-secondary">{company.code}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('contact')}</div>
                                    <div className="datagrid-content">{company.contact || '-'}</div>
                                </div>
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('email')}</div>
                                    <div className="datagrid-content">{company.email || '-'}</div>
                                </div>
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('address')}</div>
                                    <div className="datagrid-content">{company.address || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-header">
                            <h3 className="card-title">담당자 정보</h3>
                        </div>
                        <div className="card-body">
                            <div className="datagrid">
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('managerName')}</div>
                                    <div className="datagrid-content">{company.managerName || '-'}</div>
                                </div>
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('managerPhone')}</div>
                                    <div className="datagrid-content">{company.managerPhone || '-'}</div>
                                </div>
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('managerEmail')}</div>
                                    <div className="datagrid-content">{company.managerEmail || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">기본 리스 조건</h3>
                        </div>
                        <div className="card-body">
                            <div className="datagrid">
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('defaultMonthlyFee')}</div>
                                    <div className="datagrid-content fw-bold text-primary">
                                        {formatYen(company.defaultMonthlyFee)}
                                    </div>
                                </div>
                                <div className="datagrid-item">
                                    <div className="datagrid-title">{t('defaultPeriod')}</div>
                                    <div className="datagrid-content">
                                        {company.defaultPeriod ? `${company.defaultPeriod}${t('monthUnit')}` : '-'}
                                    </div>
                                </div>
                                {company.contractTerms && (
                                    <div className="datagrid-item">
                                        <div className="datagrid-title">{t('contractTerms')}</div>
                                        <div className="datagrid-content">
                                            <small>{company.contractTerms}</small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 리스 키오스크 목록 */}
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title d-flex align-items-center">
                                <Monitor size={18} className="me-2" />
                                {t('leasedKiosks')}
                                <span className="badge bg-blue-lt ms-2">{company._count?.leasedKiosks || 0}</span>
                            </h3>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table">
                                <thead>
                                    <tr>
                                        <th>시리얼번호</th>
                                        <th>상태</th>
                                        <th>거래처</th>
                                        <th>{t('monthlyFee')}</th>
                                        <th>{t('leaseStartDate')}</th>
                                        <th>{t('leaseEndDate')}</th>
                                        <th>{t('leaseContractNo')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {company.leasedKiosks.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4 text-muted">
                                                리스된 키오스크가 없습니다
                                            </td>
                                        </tr>
                                    ) : (
                                        company.leasedKiosks.map((kiosk) => (
                                            <tr key={kiosk.id}>
                                                <td>
                                                    <Link
                                                        href={`/dashboard/assets/${kiosk.id}`}
                                                        className="text-decoration-none fw-bold"
                                                    >
                                                        {kiosk.serialNumber}
                                                    </Link>
                                                    {kiosk.kioskNumber && (
                                                        <div className="text-muted small">{kiosk.kioskNumber}</div>
                                                    )}
                                                </td>
                                                <td>{getStatusBadge(kiosk.status)}</td>
                                                <td>
                                                    {kiosk.currentPartner ? (
                                                        <div>
                                                            <div>{kiosk.currentPartner.name}</div>
                                                            {kiosk.branchName && (
                                                                <small className="text-muted">{kiosk.branchName}</small>
                                                            )}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td>{formatYen(kiosk.leaseMonthlyFee)}</td>
                                                <td>{formatDate(kiosk.leaseStartDate)}</td>
                                                <td>{formatDate(kiosk.leaseEndDate)}</td>
                                                <td>
                                                    {kiosk.leaseContractNo || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
