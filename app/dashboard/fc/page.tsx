'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Branch = {
    id: string
    name: string
    nameJa: string | null
    address: string | null
    regionCode: string | null
    areaCode: string | null
    managerName: string | null
    managerPhone: string | null
    isActive: boolean
    _count?: { kiosks: number }
}

type Corporation = {
    id: string
    name: string
    nameJa: string | null
    contact: string | null
    address: string | null
    isActive: boolean
    branches: Branch[]
    _count?: { branches: number }
}

type FC = {
    id: string
    name: string
    nameJa: string | null
    fcType: string
    contact: string | null
    address: string | null
    contractDate: string | null
    commissionRate: number | null
    isActive: boolean
    corporations: Corporation[]
    _count?: { corporations: number }
}

type Region = {
    id: string
    code: string
    name: string
}

type Area = {
    id: string
    code: string
    name: string
    regionId: string
}

export default function FCPage() {
    const t = useTranslations('fc')
    const tc = useTranslations('common')

    const [fcs, setFcs] = useState<FC[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'fc' | 'corporation' | 'branch'>('fc')

    // Expanded states
    const [expandedFcs, setExpandedFcs] = useState<Set<string>>(new Set())
    const [expandedCorps, setExpandedCorps] = useState<Set<string>>(new Set())

    // Form states
    const [showFcForm, setShowFcForm] = useState(false)
    const [showCorpForm, setShowCorpForm] = useState(false)
    const [showBranchForm, setShowBranchForm] = useState(false)
    const [editingFc, setEditingFc] = useState<FC | null>(null)
    const [editingCorp, setEditingCorp] = useState<Corporation | null>(null)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [selectedFcId, setSelectedFcId] = useState<string>('')
    const [selectedCorpId, setSelectedCorpId] = useState<string>('')

    const [fcForm, setFcForm] = useState({
        name: '', nameJa: '', fcType: 'RENTAL_CAR', contact: '', address: '',
        contractDate: '', commissionRate: '', isActive: true
    })

    const [corpForm, setCorpForm] = useState({
        name: '', nameJa: '', fcId: '', contact: '', address: '', isActive: true
    })

    const [branchForm, setBranchForm] = useState({
        name: '', nameJa: '', corporationId: '', address: '', postalCode: '',
        regionCode: '', areaCode: '', managerName: '', managerPhone: '', isActive: true
    })

    const fetchData = async () => {
        try {
            const [fcRes, regRes, areaRes] = await Promise.all([
                fetch('/api/fc'),
                fetch('/api/regions'),
                fetch('/api/areas')
            ])
            if (fcRes.ok) setFcs(await fcRes.json())
            if (regRes.ok) setRegions(await regRes.json())
            if (areaRes.ok) setAreas(await areaRes.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Auto-detect region/area from address
    const handleAddressChange = async (address: string) => {
        setBranchForm(prev => ({ ...prev, address }))
        if (address.length > 5) {
            try {
                const res = await fetch('/api/areas/match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address })
                })
                if (res.ok) {
                    const data = await res.json()
                    setBranchForm(prev => ({
                        ...prev,
                        regionCode: data.regionCode || prev.regionCode,
                        areaCode: data.areaCode || prev.areaCode
                    }))
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    const resetFcForm = () => setFcForm({ name: '', nameJa: '', fcType: 'RENTAL_CAR', contact: '', address: '', contractDate: '', commissionRate: '', isActive: true })
    const resetCorpForm = () => setCorpForm({ name: '', nameJa: '', fcId: '', contact: '', address: '', isActive: true })
    const resetBranchForm = () => setBranchForm({ name: '', nameJa: '', corporationId: '', address: '', postalCode: '', regionCode: '', areaCode: '', managerName: '', managerPhone: '', isActive: true })

    // FC CRUD
    const handleFcSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingFc ? `/api/fc/${editingFc.id}` : '/api/fc'
        const method = editingFc ? 'PUT' : 'POST'
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...fcForm,
                    commissionRate: fcForm.commissionRate ? parseFloat(fcForm.commissionRate) : null,
                    contractDate: fcForm.contractDate || null
                })
            })
            if (res.ok) {
                resetFcForm()
                setShowFcForm(false)
                setEditingFc(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteFc = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/fc/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    // Corporation CRUD
    const handleCorpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingCorp ? `/api/corporations/${editingCorp.id}` : '/api/corporations'
        const method = editingCorp ? 'PUT' : 'POST'
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(corpForm)
            })
            if (res.ok) {
                resetCorpForm()
                setShowCorpForm(false)
                setEditingCorp(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteCorp = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/corporations/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    // Branch CRUD
    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches'
        const method = editingBranch ? 'PUT' : 'POST'
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(branchForm)
            })
            if (res.ok) {
                resetBranchForm()
                setShowBranchForm(false)
                setEditingBranch(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteBranch = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const toggleFc = (id: string) => {
        const newExpanded = new Set(expandedFcs)
        if (newExpanded.has(id)) newExpanded.delete(id)
        else newExpanded.add(id)
        setExpandedFcs(newExpanded)
    }

    const toggleCorp = (id: string) => {
        const newExpanded = new Set(expandedCorps)
        if (newExpanded.has(id)) newExpanded.delete(id)
        else newExpanded.add(id)
        setExpandedCorps(newExpanded)
    }

    const getFcTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            'RENTAL_CAR': t('typeRentalCar'),
            'HOTEL': t('typeHotel'),
            'OTHER': t('typeOther')
        }
        return map[type] || type
    }

    const getFcTypeBadge = (type: string) => {
        const map: Record<string, string> = {
            'RENTAL_CAR': 'bg-blue text-white',
            'HOTEL': 'bg-purple text-white',
            'OTHER': 'bg-secondary text-white'
        }
        return map[type] || 'bg-secondary text-white'
    }

    // Get all corporations (flat list from all FCs + standalone)
    const allCorporations = fcs.flatMap(fc => fc.corporations.map(c => ({ ...c, fcName: fc.name })))

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
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => { setShowBranchForm(true); setEditingBranch(null); resetBranchForm() }}
                    >
                        <i className="ti ti-plus me-1"></i>{t('newBranch')}
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => { setShowCorpForm(true); setEditingCorp(null); resetCorpForm() }}
                    >
                        <i className="ti ti-plus me-1"></i>{t('newCorporation')}
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setShowFcForm(true); setEditingFc(null); resetFcForm() }}
                    >
                        <i className="ti ti-plus me-1"></i>{t('newFc')}
                    </button>
                </div>
            </div>

            {/* FC Form */}
            {(showFcForm || editingFc) && (
                <div className="card mb-3 border-primary">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">{editingFc ? tc('edit') : t('newFc')}</h3>
                        <button className="btn btn-ghost-secondary btn-icon btn-sm" onClick={() => { setShowFcForm(false); setEditingFc(null); resetFcForm() }}>
                            <i className="ti ti-x"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleFcSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">{t('name')} *</label>
                                    <input className="form-control form-control-sm" value={fcForm.name} onChange={e => setFcForm({ ...fcForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('nameJa')}</label>
                                    <input className="form-control form-control-sm" value={fcForm.nameJa} onChange={e => setFcForm({ ...fcForm, nameJa: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('fcType')}</label>
                                    <select className="form-select form-select-sm" value={fcForm.fcType} onChange={e => setFcForm({ ...fcForm, fcType: e.target.value })}>
                                        <option value="RENTAL_CAR">{t('typeRentalCar')}</option>
                                        <option value="HOTEL">{t('typeHotel')}</option>
                                        <option value="OTHER">{t('typeOther')}</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('contact')}</label>
                                    <input className="form-control form-control-sm" value={fcForm.contact} onChange={e => setFcForm({ ...fcForm, contact: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('contractDate')}</label>
                                    <input type="date" className="form-control form-control-sm" value={fcForm.contractDate} onChange={e => setFcForm({ ...fcForm, contractDate: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('commissionRate')} (%)</label>
                                    <input type="number" step="0.1" className="form-control form-control-sm" value={fcForm.commissionRate} onChange={e => setFcForm({ ...fcForm, commissionRate: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">{t('address')}</label>
                                    <input className="form-control form-control-sm" value={fcForm.address} onChange={e => setFcForm({ ...fcForm, address: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-check">
                                        <input type="checkbox" className="form-check-input" checked={fcForm.isActive} onChange={e => setFcForm({ ...fcForm, isActive: e.target.checked })} />
                                        <span className="form-check-label">{t('isActive')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2"><i className="ti ti-check me-1"></i>{tc('save')}</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setShowFcForm(false); setEditingFc(null); resetFcForm() }}>{tc('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Corporation Form */}
            {(showCorpForm || editingCorp) && (
                <div className="card mb-3 border-info">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">{editingCorp ? tc('edit') : t('newCorporation')}</h3>
                        <button className="btn btn-ghost-secondary btn-icon btn-sm" onClick={() => { setShowCorpForm(false); setEditingCorp(null); resetCorpForm() }}>
                            <i className="ti ti-x"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCorpSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">{t('corporationName')} *</label>
                                    <input className="form-control form-control-sm" value={corpForm.name} onChange={e => setCorpForm({ ...corpForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('nameJa')}</label>
                                    <input className="form-control form-control-sm" value={corpForm.nameJa} onChange={e => setCorpForm({ ...corpForm, nameJa: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('selectFc')}</label>
                                    <select className="form-select form-select-sm" value={corpForm.fcId} onChange={e => setCorpForm({ ...corpForm, fcId: e.target.value })}>
                                        <option value="">- {t('selectFc')} -</option>
                                        {fcs.map(fc => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('contact')}</label>
                                    <input className="form-control form-control-sm" value={corpForm.contact} onChange={e => setCorpForm({ ...corpForm, contact: e.target.value })} />
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label">{t('address')}</label>
                                    <input className="form-control form-control-sm" value={corpForm.address} onChange={e => setCorpForm({ ...corpForm, address: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-check">
                                        <input type="checkbox" className="form-check-input" checked={corpForm.isActive} onChange={e => setCorpForm({ ...corpForm, isActive: e.target.checked })} />
                                        <span className="form-check-label">{t('isActive')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2"><i className="ti ti-check me-1"></i>{tc('save')}</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setShowCorpForm(false); setEditingCorp(null); resetCorpForm() }}>{tc('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Branch Form */}
            {(showBranchForm || editingBranch) && (
                <div className="card mb-3 border-success">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">{editingBranch ? tc('edit') : t('newBranch')}</h3>
                        <button className="btn btn-ghost-secondary btn-icon btn-sm" onClick={() => { setShowBranchForm(false); setEditingBranch(null); resetBranchForm() }}>
                            <i className="ti ti-x"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleBranchSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">{t('branchName')} *</label>
                                    <input className="form-control form-control-sm" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('nameJa')}</label>
                                    <input className="form-control form-control-sm" value={branchForm.nameJa} onChange={e => setBranchForm({ ...branchForm, nameJa: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('selectCorporation')} *</label>
                                    <select className="form-select form-select-sm" value={branchForm.corporationId} onChange={e => setBranchForm({ ...branchForm, corporationId: e.target.value })} required>
                                        <option value="">- {t('selectCorporation')} -</option>
                                        {allCorporations.map(c => <option key={c.id} value={c.id}>{c.name} ({c.fcName})</option>)}
                                    </select>
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label">{t('address')}</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={branchForm.address}
                                        onChange={e => handleAddressChange(e.target.value)}
                                        placeholder="東京都渋谷区..."
                                    />
                                    {(branchForm.regionCode || branchForm.areaCode) && (
                                        <small className="text-success">
                                            <i className="ti ti-check me-1"></i>
                                            {t('autoDetected')}: {branchForm.regionCode} / {branchForm.areaCode}
                                        </small>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{t('postalCode')}</label>
                                    <input className="form-control form-control-sm" value={branchForm.postalCode} onChange={e => setBranchForm({ ...branchForm, postalCode: e.target.value })} placeholder="123-4567" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{t('regionCode')}</label>
                                    <select className="form-select form-select-sm" value={branchForm.regionCode} onChange={e => setBranchForm({ ...branchForm, regionCode: e.target.value, areaCode: '' })}>
                                        <option value="">-</option>
                                        {regions.map(r => <option key={r.id} value={r.code}>{r.name} ({r.code})</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{t('areaCode')}</label>
                                    <select className="form-select form-select-sm" value={branchForm.areaCode} onChange={e => setBranchForm({ ...branchForm, areaCode: e.target.value })}>
                                        <option value="">-</option>
                                        {areas.filter(a => !branchForm.regionCode || regions.find(r => r.code === branchForm.regionCode)?.id === a.regionId).map(a => (
                                            <option key={a.id} value={a.code}>{a.name} ({a.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{t('managerName')}</label>
                                    <input className="form-control form-control-sm" value={branchForm.managerName} onChange={e => setBranchForm({ ...branchForm, managerName: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">{t('managerPhone')}</label>
                                    <input className="form-control form-control-sm" value={branchForm.managerPhone} onChange={e => setBranchForm({ ...branchForm, managerPhone: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-check">
                                        <input type="checkbox" className="form-check-input" checked={branchForm.isActive} onChange={e => setBranchForm({ ...branchForm, isActive: e.target.checked })} />
                                        <span className="form-check-label">{t('isActive')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2"><i className="ti ti-check me-1"></i>{tc('save')}</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setShowBranchForm(false); setEditingBranch(null); resetBranchForm() }}>{tc('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FC List - Tree View */}
            {fcs.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center text-muted py-4">
                        {t('noFcs')}
                    </div>
                </div>
            ) : (
                fcs.map(fc => (
                    <div key={fc.id} className="card mb-2">
                        <div
                            className="card-header d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleFc(fc.id)}
                        >
                            <div className="d-flex align-items-center">
                                <i className={`ti ti-chevron-${expandedFcs.has(fc.id) ? 'down' : 'right'} me-2`}></i>
                                <span className={`badge ${getFcTypeBadge(fc.fcType)} me-2`}>{getFcTypeLabel(fc.fcType)}</span>
                                <h3 className="card-title mb-0">
                                    {fc.name}
                                    {fc.nameJa && <span className="text-muted ms-1">({fc.nameJa})</span>}
                                </h3>
                                <span className="badge bg-secondary text-white ms-2">{fc._count?.corporations || 0} {t('corporations')}</span>
                            </div>
                            <div className="btn-list" onClick={e => e.stopPropagation()}>
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => { setShowCorpForm(true); setCorpForm({ ...corpForm, fcId: fc.id }) }}
                                >
                                    <i className="ti ti-plus me-1"></i>{t('newCorporation')}
                                </button>
                                <button
                                    className="btn btn-sm btn-icon btn-ghost-primary"
                                    onClick={() => { setEditingFc(fc); setFcForm({ name: fc.name, nameJa: fc.nameJa || '', fcType: fc.fcType, contact: fc.contact || '', address: fc.address || '', contractDate: fc.contractDate?.split('T')[0] || '', commissionRate: fc.commissionRate?.toString() || '', isActive: fc.isActive }) }}
                                >
                                    <i className="ti ti-edit"></i>
                                </button>
                                <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => handleDeleteFc(fc.id)}>
                                    <i className="ti ti-trash"></i>
                                </button>
                            </div>
                        </div>

                        {expandedFcs.has(fc.id) && (
                            <div className="card-body pt-0">
                                {fc.corporations.length === 0 ? (
                                    <div className="text-muted text-center py-2">{t('noCorporations')}</div>
                                ) : (
                                    fc.corporations.map(corp => (
                                        <div key={corp.id} className="border rounded mb-2">
                                            <div
                                                className="p-2 bg-light d-flex justify-content-between align-items-center"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleCorp(corp.id)}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <i className={`ti ti-chevron-${expandedCorps.has(corp.id) ? 'down' : 'right'} me-2 text-muted`}></i>
                                                    <i className="ti ti-building me-2 text-primary"></i>
                                                    <span className="fw-medium">{corp.name}</span>
                                                    {corp.nameJa && <span className="text-muted ms-1">({corp.nameJa})</span>}
                                                    <span className="badge bg-secondary text-white ms-2">{corp._count?.branches || 0} {t('branches')}</span>
                                                </div>
                                                <div className="btn-list" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        onClick={() => { setShowBranchForm(true); setBranchForm({ ...branchForm, corporationId: corp.id }) }}
                                                    >
                                                        <i className="ti ti-plus me-1"></i>{t('newBranch')}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-icon btn-ghost-primary"
                                                        onClick={() => { setEditingCorp(corp); setCorpForm({ name: corp.name, nameJa: corp.nameJa || '', fcId: fc.id, contact: corp.contact || '', address: corp.address || '', isActive: corp.isActive }) }}
                                                    >
                                                        <i className="ti ti-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => handleDeleteCorp(corp.id)}>
                                                        <i className="ti ti-trash"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedCorps.has(corp.id) && corp.branches.length > 0 && (
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-vcenter mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th>{t('branchName')}</th>
                                                                <th>{t('address')}</th>
                                                                <th>{t('regionCode')}</th>
                                                                <th>{t('areaCode')}</th>
                                                                <th>{t('managerName')}</th>
                                                                <th>{t('kioskCount')}</th>
                                                                <th className="w-1"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {corp.branches.map(branch => (
                                                                <tr key={branch.id}>
                                                                    <td className="fw-medium">
                                                                        <i className="ti ti-map-pin me-1 text-success"></i>
                                                                        {branch.name}
                                                                    </td>
                                                                    <td className="text-muted" style={{ maxWidth: '200px' }}>
                                                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                                                            {branch.address || '-'}
                                                                        </span>
                                                                    </td>
                                                                    <td><code>{branch.regionCode || '-'}</code></td>
                                                                    <td><code>{branch.areaCode || '-'}</code></td>
                                                                    <td className="text-muted">{branch.managerName || '-'}</td>
                                                                    <td>
                                                                        <span className="badge bg-blue text-white">{branch._count?.kiosks || 0}</span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="btn-list flex-nowrap">
                                                                            <button
                                                                                className="btn btn-sm btn-icon btn-ghost-primary"
                                                                                onClick={() => {
                                                                                    setEditingBranch(branch)
                                                                                    setBranchForm({
                                                                                        name: branch.name,
                                                                                        nameJa: branch.nameJa || '',
                                                                                        corporationId: corp.id,
                                                                                        address: branch.address || '',
                                                                                        postalCode: '',
                                                                                        regionCode: branch.regionCode || '',
                                                                                        areaCode: branch.areaCode || '',
                                                                                        managerName: branch.managerName || '',
                                                                                        managerPhone: branch.managerPhone || '',
                                                                                        isActive: branch.isActive
                                                                                    })
                                                                                }}
                                                                            >
                                                                                <i className="ti ti-edit"></i>
                                                                            </button>
                                                                            <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => handleDeleteBranch(branch.id)}>
                                                                                <i className="ti ti-trash"></i>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {expandedCorps.has(corp.id) && corp.branches.length === 0 && (
                                                <div className="text-muted text-center py-2">{t('noBranches')}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    )
}
