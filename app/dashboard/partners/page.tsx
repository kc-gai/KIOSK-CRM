'use client'

import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Partner = {
    id: string
    code: string | null
    name: string
    nameJa: string | null
    type: string
    contact: string | null
    address: string | null
}

export default function PartnersPage() {
    const t = useTranslations('partners')
    const tc = useTranslations('common')

    const [partners, setPartners] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Form State
    const [newCode, setNewCode] = useState('')
    const [newName, setNewName] = useState('')
    const [newNameJa, setNewNameJa] = useState('')
    const [newType, setNewType] = useState('CLIENT')
    const [newContact, setNewContact] = useState('')
    const [newAddress, setNewAddress] = useState('')

    const fetchPartners = async () => {
        try {
            const res = await fetch('/api/partners')
            if (res.ok) {
                const data = await res.json()
                setPartners(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPartners()
    }, [])

    const filteredPartners = partners.filter(p => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            p.code?.toLowerCase().includes(query) ||
            p.name.toLowerCase().includes(query) ||
            p.nameJa?.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query) ||
            p.contact?.toLowerCase().includes(query) ||
            p.address?.toLowerCase().includes(query)
        )
    })

    const resetForm = () => {
        setNewCode('')
        setNewName('')
        setNewNameJa('')
        setNewType('CLIENT')
        setNewContact('')
        setNewAddress('')
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: newCode || null,
                    name: newName,
                    nameJa: newNameJa || null,
                    type: newType,
                    contact: newContact,
                    address: newAddress
                })
            })

            if (res.ok) {
                resetForm()
                setIsCreating(false)
                fetchPartners()
            } else {
                const data = await res.json()
                alert(data.error || '등록 실패')
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (partner: Partner) => {
        setEditingPartner(partner)
        setNewCode(partner.code || '')
        setNewName(partner.name)
        setNewNameJa(partner.nameJa || '')
        setNewType(partner.type)
        setNewContact(partner.contact || '')
        setNewAddress(partner.address || '')
        setIsCreating(false)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingPartner) return

        try {
            const res = await fetch(`/api/partners/${editingPartner.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: newCode || null,
                    name: newName,
                    nameJa: newNameJa || null,
                    type: newType,
                    contact: newContact || null,
                    address: newAddress || null
                })
            })

            if (res.ok) {
                resetForm()
                setEditingPartner(null)
                fetchPartners()
            } else {
                const data = await res.json()
                alert(data.error || '수정 실패')
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
            if (res.ok) fetchPartners()
        } catch (error) {
            console.error(error)
        }
    }

    const handleCancelEdit = () => {
        setEditingPartner(null)
        resetForm()
    }

    const handleDownloadTemplate = () => {
        const csv = Papa.unparse([
            { name: "테스ト 주식회사", type: "CLIENT", contact: "010-1234-5678", address: "서울시 강남구..." },
            { name: "테스트 공급업체", type: "SUPPLIER", contact: "02-1234-5678", address: "부산시 해운대구..." }
        ])
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', 'partners_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const data = results.data
                if (data.length === 0) return
                const validData = data.filter((row: any) => row.name && row.type)

                if (confirm(t('importConfirm', { count: validData.length }))) {
                    try {
                        const res = await fetch('/api/partners/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(validData)
                        })
                        if (res.ok) {
                            alert(t('importSuccess'))
                            fetchPartners()
                        } else {
                            alert(t('importFailed'))
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        })
    }

    const getTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            'CLIENT': t('typeClient'),
            'SUPPLIER': t('typeSupplier'),
            'LOGISTICS': t('typeLogistics')
        }
        return map[type] || type
    }

    const getTypeBadgeClass = (type: string) => {
        const map: Record<string, string> = {
            'CLIENT': 'bg-blue text-white',
            'SUPPLIER': 'bg-green text-white',
            'LOGISTICS': 'bg-purple text-white'
        }
        return map[type] || 'bg-secondary text-white'
    }

    if (isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{tc('loading')}</span>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="page-title mb-0">{t('title')}</h2>
                <div className="btn-list">
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleDownloadTemplate}>
                        <i className="ti ti-download me-1"></i>
                        {t('templateDownload')}
                    </button>
                    <div className="position-relative d-inline-block">
                        <input
                            type="file"
                            accept=".csv"
                            className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                            style={{ cursor: 'pointer' }}
                            onChange={handleFileUpload}
                        />
                        <button className="btn btn-outline-secondary btn-sm">
                            <i className="ti ti-upload me-1"></i>
                            {t('csvUpload')}
                        </button>
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setIsCreating(!isCreating); setEditingPartner(null); resetForm(); }}
                    >
                        {isCreating ? tc('cancel') : <><i className="ti ti-plus me-1"></i>{t('newPartner')}</>}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-3">
                <div className="input-icon">
                    <span className="input-icon-addon">
                        <i className="ti ti-search"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={`${tc('search')}... (${t('name')}, ${t('type')})`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <span
                            className="input-icon-addon"
                            style={{ cursor: 'pointer', right: 0, left: 'auto' }}
                            onClick={() => setSearchQuery('')}
                        >
                            <i className="ti ti-x"></i>
                        </span>
                    )}
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="card mb-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('newPartner')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label">{tc('code')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newCode}
                                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="ORIX, YAMATO..."
                                    />
                                    <small className="text-muted">{tc('codeHint')}</small>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{t('type')}</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                    >
                                        <option value="CLIENT">{t('typeClient')}</option>
                                        <option value="SUPPLIER">{t('typeSupplier')}</option>
                                        <option value="LOGISTICS">{t('typeLogistics')}</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{tc('nameKo')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                        placeholder="한국어 회사명"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{tc('nameJa')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newNameJa}
                                        onChange={e => setNewNameJa(e.target.value)}
                                        placeholder="日本語会社名"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('contact')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newContact}
                                        onChange={e => setNewContact(e.target.value)}
                                        placeholder={t('contactPlaceholder')}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('address')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newAddress}
                                        onChange={e => setNewAddress(e.target.value)}
                                        placeholder={t('addressPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm">
                                    <i className="ti ti-check me-1"></i>
                                    {tc('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Form */}
            {editingPartner && (
                <div className="card mb-3 border-primary">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">{tc('edit')}</h3>
                        <button className="btn btn-ghost-secondary btn-icon btn-sm" onClick={handleCancelEdit}>
                            <i className="ti ti-x"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleUpdate}>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label">{tc('code')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newCode}
                                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="ORIX, YAMATO..."
                                    />
                                    <small className="text-muted">{tc('codeHint')}</small>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{t('type')}</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                    >
                                        <option value="CLIENT">{t('typeClient')}</option>
                                        <option value="SUPPLIER">{t('typeSupplier')}</option>
                                        <option value="LOGISTICS">{t('typeLogistics')}</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{tc('nameKo')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                        placeholder="한국어 회사명"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{tc('nameJa')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newNameJa}
                                        onChange={e => setNewNameJa(e.target.value)}
                                        placeholder="日本語会社名"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('contact')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newContact}
                                        onChange={e => setNewContact(e.target.value)}
                                        placeholder={t('contactPlaceholder')}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('address')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={newAddress}
                                        onChange={e => setNewAddress(e.target.value)}
                                        placeholder={t('addressPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2">
                                    <i className="ti ti-check me-1"></i>
                                    {tc('save')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCancelEdit}>
                                    {tc('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-sm">
                        <thead>
                            <tr>
                                <th>{t('name')}</th>
                                <th>{t('type')}</th>
                                <th>{t('contact')}</th>
                                <th>{t('address')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPartners.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다` : t('noPartners')}
                                    </td>
                                </tr>
                            ) : (
                                filteredPartners.map(partner => (
                                    <tr key={partner.id}>
                                        <td className="fw-medium">{partner.name}</td>
                                        <td>
                                            <span className={`badge ${getTypeBadgeClass(partner.type)}`}>
                                                {getTypeLabel(partner.type)}
                                            </span>
                                        </td>
                                        <td className="text-muted">{partner.contact || '-'}</td>
                                        <td className="text-muted" style={{ maxWidth: '200px' }}>
                                            <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                                {partner.address || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="btn-list flex-nowrap">
                                                <button
                                                    className="btn btn-sm btn-icon btn-ghost-primary"
                                                    onClick={() => handleEdit(partner)}
                                                    title={tc('edit')}
                                                >
                                                    <i className="ti ti-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-icon btn-ghost-danger"
                                                    onClick={() => handleDelete(partner.id)}
                                                    title={tc('delete')}
                                                >
                                                    <i className="ti ti-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="card-footer text-muted">
                    {searchQuery && `검색 결과: ${filteredPartners.length}건 / `}
                    총 {partners.length}건
                </div>
            </div>
        </div>
    )
}
