'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 타입 정의
interface FC {
    id: string
    name: string
    nameJa: string | null
}

interface Corporation {
    id: string
    name: string
    nameJa: string | null
    fcId: string | null
    fc: FC | null
    _count?: {
        branches: number
    }
    branches?: Branch[]
}

interface Branch {
    id: string
    name: string
    nameJa: string | null
    address: string | null
    postalCode: string | null
    managerPhone: string | null
    corporation: Corporation
    _count?: {
        kiosks: number
    }
}

interface ItemForm {
    corporationId: string  // 법인 선택 (1단계)
    branchId: string       // 지점 선택 (2단계)
    locationName: string
    postalCode: string
    address: string
    contactPhone: string
    kioskCount: number
    plateCount: number
    itemNotes: string
    // 선택된 거래처 정보 표시용
    fcName: string
    corpName: string
}

const emptyItem: ItemForm = {
    corporationId: '',
    branchId: '',
    locationName: '',
    postalCode: '',
    address: '',
    contactPhone: '',
    kioskCount: 1,
    plateCount: 1,
    itemNotes: '',
    fcName: '',
    corpName: ''
}

export default function NewOrderProcessPage() {
    const t = useTranslations('deliveryRequest')
    const to = useTranslations('orderProcess')
    const tc = useTranslations('common')
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [corporations, setCorporations] = useState<Corporation[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [loadingData, setLoadingData] = useState(true)

    const [formData, setFormData] = useState({
        requesterName: '',
        title: 'キオスク端末＆決済端末の鉄板・金具',
        orderDate: new Date().toISOString().split('T')[0],
        desiredDeliveryDate: '',
        desiredDeliveryWeek: '',
        unitPrice: 240000,
        taxIncluded: false,
        acquisition: 'PURCHASE', // LEASE or PURCHASE
        leaseCompanyId: '',
        notes: ''
    })

    const [leaseCompanies, setLeaseCompanies] = useState<{ id: string; name: string; code?: string }[]>([])

    const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }])

    // 법인 및 지점 목록 조회
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 법인 목록 조회 (지점 및 키오스크 카운트 포함)
                const corpRes = await fetch('/api/corporations?include=branches,kiosks')
                if (corpRes.ok) {
                    const corpData = await corpRes.json()
                    setCorporations(corpData)
                }

                // 지점 목록 조회
                const branchRes = await fetch('/api/branches?include=corporation,fc,kiosks')
                if (branchRes.ok) {
                    const branchData = await branchRes.json()
                    setBranches(branchData)
                }

                // 리스회사 목록 조회
                const leaseRes = await fetch('/api/lease-companies')
                if (leaseRes.ok) {
                    const leaseData = await leaseRes.json()
                    setLeaseCompanies(leaseData)
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [])

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleItemChange = (index: number, field: keyof ItemForm, value: string | number) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ))
    }

    // 1단계: 법인 선택
    const handleCorporationSelect = (index: number, corporationId: string) => {
        if (!corporationId) {
            // 선택 해제 시 초기화
            setItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    corporationId: '',
                    branchId: '',
                    fcName: '',
                    corpName: '',
                    locationName: '',
                    postalCode: '',
                    address: '',
                    contactPhone: ''
                } : item
            ))
            return
        }

        const corp = corporations.find(c => c.id === corporationId)
        if (corp) {
            setItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    corporationId: corp.id,
                    branchId: '', // 법인 변경 시 지점 초기화
                    fcName: corp.fc?.nameJa || corp.fc?.name || '',
                    corpName: corp.nameJa || corp.name || '',
                    locationName: '',
                    postalCode: '',
                    address: '',
                    contactPhone: ''
                } : item
            ))
        }
    }

    // 2단계: 지점 선택
    const handleBranchSelect = (index: number, branchId: string) => {
        if (!branchId) {
            // 선택 해제 시 초기화 (법인은 유지)
            setItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    branchId: '',
                    locationName: '',
                    postalCode: '',
                    address: '',
                    contactPhone: ''
                } : item
            ))
            return
        }

        const branch = branches.find(b => b.id === branchId)
        if (branch) {
            setItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    branchId: branch.id,
                    locationName: branch.nameJa || branch.name,
                    postalCode: branch.postalCode || '',
                    address: branch.address || '',
                    contactPhone: branch.managerPhone || ''
                } : item
            ))
        }
    }

    // 선택된 법인의 지점 목록 가져오기
    const getBranchesForCorporation = (corporationId: string) => {
        return branches.filter(b => b.corporation?.id === corporationId)
    }

    const addItem = () => {
        setItems(prev => [...prev, { ...emptyItem }])
    }

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    const calculateTotals = () => {
        return items.reduce(
            (acc, item) => ({
                totalKioskCount: acc.totalKioskCount + item.kioskCount,
                totalPlateCount: acc.totalPlateCount + item.plateCount,
                totalAmount: acc.totalAmount + (item.kioskCount * formData.unitPrice)
            }),
            { totalKioskCount: 0, totalPlateCount: 0, totalAmount: 0 }
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                ...formData,
                unitPrice: Number(formData.unitPrice),
                items: items.map((item, index) => ({
                    locationName: item.locationName,
                    postalCode: item.postalCode,
                    address: item.address,
                    contactPhone: item.contactPhone,
                    kioskCount: Number(item.kioskCount),
                    plateCount: Number(item.plateCount),
                    branchId: item.branchId || null,
                    itemNotes: item.itemNotes,
                    sortOrder: index
                }))
            }

            const res = await fetch('/api/delivery-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/dashboard/delivery-request/${data.id}`)
            } else {
                const error = await res.json()
                alert(error.error || to('createFailed'))
            }
        } catch (error) {
            console.error('Failed to create:', error)
            alert(to('createError'))
        } finally {
            setLoading(false)
        }
    }

    const totals = calculateTotals()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount)
    }

    // 키오스크 아이콘 컴포넌트
    const KioskIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="6" y="2" width="12" height="16" rx="1" />
            <rect x="8" y="4" width="8" height="8" rx="0.5" />
            <line x1="9" y1="14" x2="15" y2="14" />
            <line x1="9" y1="16" x2="15" y2="16" />
            <path d="M9 18 L9 22 L15 22 L15 18" />
            <line x1="6" y1="22" x2="18" y2="22" />
        </svg>
    )

    return (
        <div className="container-xl">
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/order-process" className="btn btn-ghost-secondary btn-sm mb-2">
                            <i className="ti ti-arrow-left me-1"></i> {tc('back')}
                        </Link>
                        <h2 className="page-title">
                            <i className="ti ti-file-plus me-2"></i>
                            {to('newProcess')}
                        </h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card mt-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('basicInfo')}</h3>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label required">{t('requesterName')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="requesterName"
                                    value={formData.requesterName}
                                    onChange={handleFormChange}
                                    required
                                />
                                <small className="text-muted">{t('requesterNameDesc')}</small>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('orderDate')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="orderDate"
                                    value={formData.orderDate}
                                    onChange={handleFormChange}
                                />
                                <small className="text-muted">{t('orderDateDesc')}</small>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('desiredDeliveryDate')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="desiredDeliveryDate"
                                    value={formData.desiredDeliveryDate}
                                    onChange={handleFormChange}
                                />
                                <small className="text-muted">{t('desiredDeliveryDateDesc')}</small>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">{t('desiredDeliveryWeek')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="desiredDeliveryWeek"
                                    value={formData.desiredDeliveryWeek}
                                    onChange={handleFormChange}
                                    placeholder={t('desiredWeekPlaceholder')}
                                />
                                <small className="text-muted">{t('desiredDeliveryWeekDesc')}</small>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label required">취득유형</label>
                                <div className="btn-group w-100" role="group">
                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="acquisition"
                                        id="acquisitionPurchase"
                                        value="PURCHASE"
                                        checked={formData.acquisition === 'PURCHASE'}
                                        onChange={handleFormChange}
                                    />
                                    <label className="btn btn-outline-cyan" htmlFor="acquisitionPurchase">
                                        구매
                                    </label>
                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="acquisition"
                                        id="acquisitionLease"
                                        value="LEASE"
                                        checked={formData.acquisition === 'LEASE'}
                                        onChange={handleFormChange}
                                    />
                                    <label className="btn btn-outline-purple" htmlFor="acquisitionLease">
                                        리스
                                    </label>
                                </div>
                            </div>
                            {formData.acquisition === 'LEASE' && (
                                <div className="col-md-6">
                                    <label className="form-label required">리스회사</label>
                                    <select
                                        className="form-select"
                                        name="leaseCompanyId"
                                        value={formData.leaseCompanyId}
                                        onChange={handleFormChange}
                                        required={formData.acquisition === 'LEASE'}
                                    >
                                        <option value="">리스회사 선택</option>
                                        {leaseCompanies.map(lc => (
                                            <option key={lc.id} value={lc.id}>
                                                {lc.name} {lc.code ? `(${lc.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="text-muted">리스를 통해 취득하는 경우 리스회사를 선택하세요</small>
                                </div>
                            )}
                            <div className="col-md-12">
                                <label className="form-label">{t('titleLabel')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                />
                                <small className="text-muted">{t('titleLabelDesc')}</small>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('unitPrice')}</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="unitPrice"
                                        value={formData.unitPrice}
                                        onChange={handleFormChange}
                                    />
                                    <span className="input-group-text">{t('yen')}</span>
                                </div>
                                <small className="text-muted">{t('unitPriceDesc')}</small>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">&nbsp;</label>
                                <div className="form-check mt-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="taxIncluded"
                                        name="taxIncluded"
                                        checked={formData.taxIncluded}
                                        onChange={handleFormChange}
                                    />
                                    <label className="form-check-label" htmlFor="taxIncluded">
                                        {t('taxIncluded')}
                                    </label>
                                </div>
                                <small className="text-muted">{t('taxDesc')}</small>
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">{t('notes')}</label>
                                <textarea
                                    className="form-control"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder={t('notesPlaceholder')}
                                />
                                <small className="text-muted">{t('notesDesc')}</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items - 납품 장소 목록 */}
                <div className="card mt-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('items')}</h3>
                        <div className="card-actions">
                            <Link href="/dashboard/clients" className="btn btn-outline-secondary btn-sm me-2">
                                <i className="ti ti-building me-1"></i>
                                거래처/지점 관리
                            </Link>
                            <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>
                                <i className="ti ti-plus me-1"></i>
                                {t('addItem')}
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>No</th>
                                        <th style={{ width: '200px' }}>법인 선택</th>
                                        <th style={{ width: '180px' }}>지점 선택</th>
                                        <th style={{ width: '110px' }}>{t('postalCode')}</th>
                                        <th>{t('address')}</th>
                                        <th style={{ width: '130px' }}>{t('contactPhone')}</th>
                                        <th style={{ width: '80px' }}>키오스크</th>
                                        <th style={{ width: '80px' }}>철판</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => {
                                        const branchesForCorp = getBranchesForCorporation(item.corporationId)
                                        return (
                                            <tr key={index}>
                                                <td className="text-center">{index + 1}</td>
                                                {/* 1단계: 법인 선택 */}
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={item.corporationId}
                                                        onChange={(e) => handleCorporationSelect(index, e.target.value)}
                                                        disabled={loadingData}
                                                    >
                                                        <option value="">법인 선택</option>
                                                        {corporations.map(corp => (
                                                            <option key={corp.id} value={corp.id}>
                                                                {corp.nameJa || corp.name}
                                                                {corp._count?.branches ? ` (${corp._count.branches})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                {/* 2단계: 지점 선택 */}
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={item.branchId}
                                                        onChange={(e) => handleBranchSelect(index, e.target.value)}
                                                        disabled={!item.corporationId || loadingData}
                                                    >
                                                        <option value="">{item.corporationId ? '지점 선택' : '법인을 먼저 선택'}</option>
                                                        {branchesForCorp.map(branch => (
                                                            <option key={branch.id} value={branch.id}>
                                                                {branch.nameJa || branch.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={item.postalCode}
                                                        onChange={(e) => handleItemChange(index, 'postalCode', e.target.value)}
                                                        placeholder="〒"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={item.address}
                                                        onChange={(e) => handleItemChange(index, 'address', e.target.value)}
                                                        placeholder={t('addressPlaceholder')}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={item.contactPhone}
                                                        onChange={(e) => handleItemChange(index, 'contactPhone', e.target.value)}
                                                        placeholder="TEL"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm text-center"
                                                        value={item.kioskCount}
                                                        onChange={(e) => handleItemChange(index, 'kioskCount', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm text-center"
                                                        value={item.plateCount}
                                                        onChange={(e) => handleItemChange(index, 'plateCount', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost-danger btn-sm"
                                                        onClick={() => removeItem(index)}
                                                        disabled={items.length === 1}
                                                    >
                                                        <i className="ti ti-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="bg-light">
                                    <tr>
                                        <th colSpan={6} className="text-end">{t('total')}</th>
                                        <th className="text-center">{totals.totalKioskCount}</th>
                                        <th className="text-center">{totals.totalPlateCount}</th>
                                        <th></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    {corporations.length === 0 && !loadingData && (
                        <div className="card-footer bg-azure-lt">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-info-circle me-2 text-azure"></i>
                                <span>등록된 법인이 없습니다. </span>
                                <Link href="/dashboard/clients" className="ms-1 text-azure">
                                    거래처/지점 관리에서 법인을 먼저 등록하세요 →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="mb-0">
                                    <span className="text-muted me-2">{t('totalAmount')}:</span>
                                    <strong style={{ fontSize: '1.5rem' }}>
                                        {formatCurrency(totals.totalAmount)} {t('yen')}
                                    </strong>
                                    <small className="text-muted ms-2">
                                        ({formData.taxIncluded ? t('taxIncluded') : t('taxExcluded')})
                                    </small>
                                </div>
                            </div>
                            <div className="col-md-6 text-end">
                                <Link href="/dashboard/order-process" className="btn btn-ghost-secondary me-2">
                                    {tc('cancel')}
                                </Link>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            {tc('loading')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-device-floppy me-1"></i>
                                            {tc('save')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
