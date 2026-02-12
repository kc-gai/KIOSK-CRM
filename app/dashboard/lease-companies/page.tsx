'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Edit, Trash2, Building2, Star, Calendar, AlertCircle, ChevronRight, Phone, Mail, MapPin, User } from 'lucide-react'

// 키오스크 아이콘 컴포넌트
const KioskIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="4" y="2" width="16" height="16" rx="2" />
        <rect x="8" y="6" width="8" height="6" rx="1" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
)

type Region = {
    id: string
    code: string
    name: string
    nameJa?: string
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
    _count?: { leasedKiosks: number }
    leasedKiosks?: Array<{
        id: string
        serialNumber: string
        kioskNumber?: string
        anydeskId?: string
        brandName?: string
        branchName?: string
        regionCode?: string
        deliveryDate?: string
        leaseStartDate?: string
        leaseEndDate?: string
        leaseMonthlyFee?: number
        branch?: {
            name: string
            nameJa?: string
            regionCode?: string
            areaCode?: string
            corporation?: {
                name: string
                nameJa?: string
                fc?: {
                    code: string
                    name: string
                }
            }
        }
    }>
    createdAt: string
}

export default function LeaseCompaniesPage() {
    const t = useTranslations('leaseCompanies')
    const tc = useTranslations('common')
    const locale = useLocale()

    const [companies, setCompanies] = useState<LeaseCompany[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCompany, setSelectedCompany] = useState<LeaseCompany | null>(null)

    // 모달 상태
    const [showModal, setShowModal] = useState(false)
    const [editingCompany, setEditingCompany] = useState<LeaseCompany | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        contact: '',
        email: '',
        address: '',
        managerName: '',
        managerPhone: '',
        managerEmail: '',
        defaultMonthlyFee: '',
        defaultPeriod: '',
        contractTerms: '',
        isActive: true
    })

    const fetchCompanies = async () => {
        try {
            const [companiesRes, regionsRes] = await Promise.all([
                fetch('/api/lease-companies'),
                fetch('/api/regions')
            ])
            if (companiesRes.ok) {
                const data = await companiesRes.json()
                setCompanies(data)
                // 선택된 회사가 있으면 업데이트
                if (selectedCompany) {
                    const updated = data.find((c: LeaseCompany) => c.id === selectedCompany.id)
                    if (updated) setSelectedCompany(updated)
                }
            }
            if (regionsRes.ok) {
                setRegions(await regionsRes.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    // 첫 번째 회사 자동 선택
    useEffect(() => {
        if (!loading && companies.length > 0 && !selectedCompany) {
            setSelectedCompany(companies[0])
        }
    }, [loading, companies])

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            contact: '',
            email: '',
            address: '',
            managerName: '',
            managerPhone: '',
            managerEmail: '',
            defaultMonthlyFee: '',
            defaultPeriod: '',
            contractTerms: '',
            isActive: true
        })
        setEditingCompany(null)
    }

    const openModal = (company?: LeaseCompany) => {
        if (company) {
            setEditingCompany(company)
            setFormData({
                name: company.name,
                code: company.code || '',
                contact: company.contact || '',
                email: company.email || '',
                address: company.address || '',
                managerName: company.managerName || '',
                managerPhone: company.managerPhone || '',
                managerEmail: company.managerEmail || '',
                defaultMonthlyFee: company.defaultMonthlyFee?.toString() || '',
                defaultPeriod: company.defaultPeriod?.toString() || '',
                contractTerms: company.contractTerms || '',
                isActive: company.isActive
            })
        } else {
            resetForm()
        }
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingCompany
                ? `/api/lease-companies/${editingCompany.id}`
                : '/api/lease-companies'
            const method = editingCompany ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                resetForm()
                setShowModal(false)
                fetchCompanies()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/lease-companies/${id}`, { method: 'DELETE' })
            if (res.ok) {
                if (selectedCompany?.id === id) {
                    setSelectedCompany(null)
                }
                fetchCompanies()
            } else if (res.status === 400) {
                alert(t('hasKiosksError'))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const formatYen = (value?: number) => {
        if (!value) return '-'
        return `¥${value.toLocaleString()}`
    }

    // 날짜 포맷
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ja-JP')
    }

    // 지역 코드를 지역명으로 변환
    const getRegionName = (regionCode: string | null | undefined) => {
        if (!regionCode) return null
        const region = regions.find(r => r.code === regionCode)
        if (!region) return regionCode
        return locale === 'ja' ? (region.nameJa || region.name) : region.name
    }

    // 리스 만료 체크 (30일 이내 만료)
    const isExpiringSoon = (endDate?: string) => {
        if (!endDate) return false
        const end = new Date(endDate)
        const now = new Date()
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays > 0 && diffDays <= 30
    }

    // 이미 만료됨
    const isExpired = (endDate?: string) => {
        if (!endDate) return false
        return new Date(endDate) < new Date()
    }

    return (
        <div className="container-fluid p-0" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            {/* 상단 헤더 */}
            <div className="bg-white border-bottom px-4 py-3">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
                            <Building2 size={20} color="white" />
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>{t('title')}</h5>
                            <small className="text-muted">리스 계약 및 키오스크 관리</small>
                        </div>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal()}>
                        <span>+</span>
                        {t('newCompany')}
                    </button>
                </div>
            </div>

            <div className="d-flex" style={{ height: 'calc(100% - 70px)' }}>
                {/* 좌측: 리스 회사 목록 */}
                <div className="bg-light border-end" style={{ width: 280, minWidth: 280, overflowY: 'auto' }}>
                    <div className="p-3">
                        <div className="text-muted small fw-medium mb-2 px-2">리스 회사 ({companies.length})</div>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                <Building2 size={32} className="mb-2 opacity-50" />
                                <p className="mb-0 small">{t('noCompanies')}</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {companies.map(company => {
                                    const isSelected = selectedCompany?.id === company.id
                                    const kioskCount = company._count?.leasedKiosks || 0
                                    return (
                                        <div
                                            key={company.id}
                                            className="card border-0 shadow-sm cursor-pointer"
                                            style={{
                                                backgroundColor: isSelected ? '#7c3aed' : '#fff',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSelectedCompany(company)}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            {company.code && (
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        fontSize: '0.65rem',
                                                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#e0e7ff',
                                                                        color: isSelected ? '#fff' : '#4f46e5'
                                                                    }}
                                                                >
                                                                    {company.code}
                                                                </span>
                                                            )}
                                                            {company.isActive && (
                                                                <Star size={12} className={isSelected ? 'text-warning' : 'text-warning'} fill="#f59f00" />
                                                            )}
                                                        </div>
                                                        <div className={`fw-semibold ${isSelected ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>
                                                            {company.name}
                                                        </div>
                                                        <div className={`d-flex align-items-center gap-1 mt-2 ${isSelected ? 'text-white opacity-75' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                                                            <KioskIcon size={12} />
                                                            <span className={kioskCount > 0 ? 'fw-bold' : ''}>{kioskCount}대 리스</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className={isSelected ? 'text-white' : 'text-muted'} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 우측: 선택된 회사 상세 */}
                <div className="flex-grow-1" style={{ overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                    {selectedCompany ? (
                        <div className="p-4">
                            {/* 회사 정보 헤더 */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-3"
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                                    fontSize: '1.2rem',
                                                    fontWeight: 700,
                                                    color: 'white'
                                                }}
                                            >
                                                {selectedCompany.code || selectedCompany.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <h4 className="mb-0 fw-bold">{selectedCompany.name}</h4>
                                                    <span className={`badge ${selectedCompany.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                        {selectedCompany.isActive ? t('active') : t('inactive')}
                                                    </span>
                                                </div>
                                                {selectedCompany.address && (
                                                    <div className="text-muted small d-flex align-items-center gap-1">
                                                        <MapPin size={12} />
                                                        {selectedCompany.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                onClick={() => openModal(selectedCompany)}
                                            >
                                                <Edit size={14} />
                                                {tc('edit')}
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                                onClick={() => handleDelete(selectedCompany.id)}
                                            >
                                                <Trash2 size={14} />
                                                {tc('delete')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 정보 그리드 */}
                                    <div className="row g-4">
                                        {/* 연락처 정보 */}
                                        <div className="col-md-4">
                                            <div className="p-3 rounded-3" style={{ backgroundColor: '#f1f5f9' }}>
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <Phone size={16} className="text-primary" />
                                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>연락처 정보</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                                                    <div>
                                                        <div className="text-muted small">{t('contact')}</div>
                                                        <div className="fw-medium">{selectedCompany.contact || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small">{t('email')}</div>
                                                        <div className="fw-medium">{selectedCompany.email || '-'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 담당자 정보 */}
                                        <div className="col-md-4">
                                            <div className="p-3 rounded-3" style={{ backgroundColor: '#f1f5f9' }}>
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <User size={16} className="text-success" />
                                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>담당자</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                                                    <div>
                                                        <div className="text-muted small">{t('managerName')}</div>
                                                        <div className="fw-medium">{selectedCompany.managerName || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small">{t('managerPhone')}</div>
                                                        <div className="fw-medium">{selectedCompany.managerPhone || '-'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 리스 조건 */}
                                        <div className="col-md-4">
                                            <div className="p-3 rounded-3" style={{ backgroundColor: '#f1f5f9' }}>
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <Calendar size={16} className="text-warning" />
                                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>기본 리스 조건</span>
                                                </div>
                                                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                                                    <div>
                                                        <div className="text-muted small">{t('defaultMonthlyFee')}</div>
                                                        <div className="fw-medium">{formatYen(selectedCompany.defaultMonthlyFee)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small">{t('defaultPeriod')}</div>
                                                        <div className="fw-medium">{selectedCompany.defaultPeriod ? `${selectedCompany.defaultPeriod}${t('monthUnit')}` : '-'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 리스 키오스크 목록 */}
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white border-bottom py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2">
                                            <KioskIcon size={20} className="text-purple" />
                                            <span className="fw-semibold">리스 키오스크 현황</span>
                                        </div>
                                        <span
                                            className="badge px-3 py-2"
                                            style={{ backgroundColor: '#7c3aed', color: 'white', fontSize: '0.85rem' }}
                                        >
                                            {selectedCompany._count?.leasedKiosks || 0}대
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {selectedCompany.leasedKiosks && selectedCompany.leasedKiosks.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover table-vcenter mb-0" style={{ fontSize: '0.85rem' }}>
                                                <thead style={{ backgroundColor: '#f8fafc' }}>
                                                    <tr>
                                                        <th className="text-center" style={{ width: 40 }}>#</th>
                                                        <th>리스시작일</th>
                                                        <th>브랜드명</th>
                                                        <th>계약법인명</th>
                                                        <th>지점명</th>
                                                        <th>지역</th>
                                                        <th>납품일</th>
                                                        <th>Serial No</th>
                                                        <th>Anydesk No</th>
                                                        <th className="text-center" style={{ width: 80 }}>상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedCompany.leasedKiosks.map((kiosk, idx) => (
                                                        <tr key={kiosk.id}>
                                                            <td className="text-center text-muted">{idx + 1}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <Calendar size={12} className="text-primary" />
                                                                    <span className="fw-medium">{formatDate(kiosk.leaseStartDate)}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const fcCode = kiosk.branch?.corporation?.fc?.code
                                                                    const brandName = kiosk.brandName || kiosk.branch?.corporation?.fc?.name
                                                                    if (fcCode && brandName) {
                                                                        // brandName에 이미 코드가 포함되어 있으면 그대로 표시
                                                                        if (brandName.includes('/')) return brandName
                                                                        return `${fcCode} / ${brandName}`
                                                                    }
                                                                    return brandName || '-'
                                                                })()}
                                                            </td>
                                                            <td>
                                                                {kiosk.branch?.corporation
                                                                    ? (locale === 'ja' ? kiosk.branch.corporation.nameJa || kiosk.branch.corporation.name : kiosk.branch.corporation.name)
                                                                    : '-'
                                                                }
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const branchName = kiosk.branch
                                                                        ? (locale === 'ja' ? kiosk.branch.nameJa || kiosk.branch.name : kiosk.branch.name)
                                                                        : kiosk.branchName || '-'
                                                                    const areaCode = kiosk.branch?.areaCode
                                                                    return areaCode ? (
                                                                        <>{branchName} <span className="text-muted small">({areaCode})</span></>
                                                                    ) : branchName
                                                                })()}
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const regionCode = kiosk.branch?.regionCode || kiosk.regionCode
                                                                    const regionName = getRegionName(regionCode)
                                                                    return regionName ? (
                                                                        <span className="badge bg-azure-lt">{regionName}</span>
                                                                    ) : '-'
                                                                })()}
                                                            </td>
                                                            <td>{formatDate(kiosk.deliveryDate)}</td>
                                                            <td className="fw-medium" style={{ fontFamily: 'monospace' }}>{kiosk.serialNumber}</td>
                                                            <td style={{ fontFamily: 'monospace' }}>{kiosk.anydeskId || '-'}</td>
                                                            <td className="text-center">
                                                                {isExpired(kiosk.leaseEndDate) ? (
                                                                    <span className="badge bg-danger-lt text-danger d-inline-flex align-items-center gap-1">
                                                                        <AlertCircle size={10} />
                                                                        만료
                                                                    </span>
                                                                ) : isExpiringSoon(kiosk.leaseEndDate) ? (
                                                                    <span className="badge bg-warning-lt text-warning d-inline-flex align-items-center gap-1">
                                                                        <AlertCircle size={10} />
                                                                        임박
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-success-lt text-success">
                                                                        정상
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5">
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                                                style={{ width: 64, height: 64, backgroundColor: '#f1f5f9' }}
                                            >
                                                <KioskIcon size={28} className="opacity-50" />
                                            </div>
                                            <p className="mb-1 fw-medium">리스 중인 키오스크가 없습니다</p>
                                            <p className="mb-0 small text-muted">자산관리에서 키오스크를 이 리스 회사로 등록하세요</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle mb-4"
                                style={{ width: 80, height: 80, backgroundColor: '#f1f5f9' }}
                            >
                                <Building2 size={36} className="opacity-50" />
                            </div>
                            <h5 className="text-dark mb-2">리스 회사를 선택하세요</h5>
                            <p className="mb-0 text-center">
                                좌측에서 리스 회사를 선택하면<br />
                                상세 정보와 리스 키오스크 현황이 표시됩니다
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 등록/수정 모달 */}
            {showModal && (
                <div className="modal modal-blur fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title d-flex align-items-center gap-2">
                                    <Building2 size={20} className="text-primary" />
                                    {editingCompany ? tc('edit') : t('newCompany')}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        {/* 기본 정보 */}
                                        <div className="col-12">
                                            <div className="fw-semibold text-primary mb-2 small">기본 정보</div>
                                        </div>
                                        <div className="col-md-8">
                                            <label className="form-label">{t('name')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('code')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                placeholder={t('codePlaceholder')}
                                            />
                                        </div>

                                        {/* 연락처 정보 */}
                                        <div className="col-12 mt-4">
                                            <div className="fw-semibold text-primary mb-2 small">연락처</div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('contact')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.contact}
                                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('email')}</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">{t('address')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>

                                        {/* 담당자 정보 */}
                                        <div className="col-12 mt-4">
                                            <div className="fw-semibold text-primary mb-2 small">담당자</div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('managerName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.managerName}
                                                onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('managerPhone')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.managerPhone}
                                                onChange={e => setFormData({ ...formData, managerPhone: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('managerEmail')}</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={formData.managerEmail}
                                                onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                                            />
                                        </div>

                                        {/* 리스 조건 */}
                                        <div className="col-12 mt-4">
                                            <div className="fw-semibold text-primary mb-2 small">리스 조건</div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('defaultMonthlyFee')}</label>
                                            <div className="input-group">
                                                <span className="input-group-text">¥</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.defaultMonthlyFee}
                                                    onChange={e => setFormData({ ...formData, defaultMonthlyFee: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('defaultPeriod')}</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.defaultPeriod}
                                                    onChange={e => setFormData({ ...formData, defaultPeriod: e.target.value })}
                                                />
                                                <span className="input-group-text">{t('monthUnit')}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('isActive')}</label>
                                            <select
                                                className="form-select"
                                                value={formData.isActive ? 'true' : 'false'}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                            >
                                                <option value="true">{t('active')}</option>
                                                <option value="false">{t('inactive')}</option>
                                            </select>
                                        </div>

                                        {/* 계약 조건 */}
                                        <div className="col-12">
                                            <label className="form-label">{t('contractTerms')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={formData.contractTerms}
                                                onChange={e => setFormData({ ...formData, contractTerms: e.target.value })}
                                                placeholder={t('contractTermsPlaceholder')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                    >
                                        {tc('cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                                        {tc('save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
