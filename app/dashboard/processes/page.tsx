'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Plus, Search, X, ChevronRight, FileText, Truck, Package, BarChart3,
    CheckCircle2, Circle, Clock
} from 'lucide-react'

type Partner = {
    id: string
    name: string
    type: string
}

type Process = {
    id: string
    title: string
    clientId?: string
    client?: Partner
    currentStage: string
    contractStatus?: string
    deliveryRequestStatus?: string
    deliveryCheckStatus?: string
    erpStatus?: string
    createdAt: string
    updatedAt: string
}

const STAGES = [
    { key: 'CONTRACT', icon: FileText, label: '계약', labelJa: '契約' },
    { key: 'DELIVERY_REQUEST', icon: Truck, label: '납품 의뢰', labelJa: '納品依頼' },
    { key: 'DELIVERY_CHECK', icon: Package, label: '납품 확인', labelJa: '納品確認' },
    { key: 'ERP_STATS', icon: BarChart3, label: 'ERP 통계', labelJa: 'ERP統計' },
]

export default function ProcessesPage() {
    const t = useTranslations('process')
    const tc = useTranslations('common')

    const [processes, setProcesses] = useState<Process[]>([])
    const [clients, setClients] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Create form
    const [newTitle, setNewTitle] = useState('')
    const [newClientId, setNewClientId] = useState('')

    // Selected process for detail view
    const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)

    const fetchData = async () => {
        try {
            const [processesRes, partnersRes] = await Promise.all([
                fetch('/api/processes'),
                fetch('/api/partners')
            ])

            if (processesRes.ok) setProcesses(await processesRes.json())
            if (partnersRes.ok) {
                const partners: Partner[] = await partnersRes.json()
                setClients(partners.filter(p => p.type === 'CLIENT'))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredProcesses = processes.filter(p => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            p.title.toLowerCase().includes(query) ||
            p.client?.name.toLowerCase().includes(query) ||
            p.currentStage.toLowerCase().includes(query)
        )
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/processes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    clientId: newClientId || null
                })
            })

            if (res.ok) {
                setNewTitle('')
                setNewClientId('')
                setIsCreating(false)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/processes/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
                if (selectedProcess?.id === id) setSelectedProcess(null)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const getStageIndex = (stage: string) => {
        return STAGES.findIndex(s => s.key === stage)
    }

    const getStatusIcon = (status?: string) => {
        if (status === 'COMPLETED') return <CheckCircle2 size={16} className="text-green-500" />
        if (status === 'IN_PROGRESS') return <Clock size={16} className="text-blue-500" />
        return <Circle size={16} className="text-gray-300" />
    }

    const getStageStatus = (process: Process, stageKey: string) => {
        switch (stageKey) {
            case 'CONTRACT': return process.contractStatus
            case 'DELIVERY_REQUEST': return process.deliveryRequestStatus
            case 'DELIVERY_CHECK': return process.deliveryCheckStatus
            case 'ERP_STATS': return process.erpStatus
            default: return undefined
        }
    }

    return (
        <div className="space-y-4">
            <div className="d-flex justify-content-between align-items-center">
                <h1 className="text-3xl fw-bold">{t('title')}</h1>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? tc('cancel') : <><Plus size={16} className="me-2" />{t('newProcess')}</>}
                </Button>
            </div>

            {/* Search */}
            <div className="position-relative">
                <Search size={16} className="position-absolute text-gray-400" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <Input
                    placeholder={`${tc('search')}...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="ps-5 pe-5"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="position-absolute text-gray-400 hover:text-gray-600"
                        style={{ right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Create Form */}
            {isCreating && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('newProcess')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm fw-medium">{t('processTitle')}</label>
                                <Input
                                    placeholder={t('titlePlaceholder')}
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm fw-medium">{t('client')}</label>
                                <select
                                    className="form-select"
                                    value={newClientId}
                                    onChange={e => setNewClientId(e.target.value)}
                                >
                                    <option value="">{t('selectClient')}</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" disabled={!newTitle}>{tc('create')}</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div>{tc('loading')}</div>
            ) : (
                <div className="space-y-3">
                    {filteredProcesses.length === 0 ? (
                        <Card>
                            <CardContent className="py-5 text-center text-gray-500">
                                {searchQuery ? t('noSearchResults', { query: searchQuery }) : t('noProcess')}
                            </CardContent>
                        </Card>
                    ) : (
                        filteredProcesses.map(process => (
                            <Card
                                key={process.id}
                                className={`cursor-pointer hover:shadow-md ${selectedProcess?.id === process.id ? 'border border-2 border-primary' : ''}`}
                                onClick={() => setSelectedProcess(selectedProcess?.id === process.id ? null : process)}
                            >
                                <CardContent className="py-3">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="flex-fill">
                                            <div className="d-flex align-items-center gap-2">
                                                <h3 className="fw-semibold text-lg">{process.title}</h3>
                                                {process.client && (
                                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {process.client.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {t('lastUpdated')}: {new Date(process.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Stage Progress */}
                                        <div className="d-flex align-items-center gap-2">
                                            {STAGES.map((stage, idx) => {
                                                const StageIcon = stage.icon
                                                const status = getStageStatus(process, stage.key)
                                                const isCurrent = process.currentStage === stage.key
                                                const isPast = getStageIndex(process.currentStage) > idx

                                                return (
                                                    <div key={stage.key} className="d-flex align-items-center">
                                                        <div
                                                            className={`d-flex align-items-center gap-1 px-1 py-1 rounded ${
                                                                isCurrent
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : isPast || status === 'COMPLETED'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                            }`}
                                                            title={stage.label}
                                                        >
                                                            <StageIcon size={16} />
                                                            <span className="text-xs d-none d-md-inline">{stage.label}</span>
                                                        </div>
                                                        {idx < STAGES.length - 1 && (
                                                            <ChevronRight size={16} className="text-gray-300 mx-1" />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {selectedProcess?.id === process.id && (
                                        <ProcessDetail
                                            process={process}
                                            clients={clients}
                                            onUpdate={fetchData}
                                            onDelete={() => handleDelete(process.id)}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Results count */}
            {!isLoading && (
                <div className="text-sm text-gray-500">
                    {searchQuery && `${t('searchResults')}: ${filteredProcesses.length} / `}
                    {t('total')}: {processes.length}
                </div>
            )}
        </div>
    )
}

// Process Detail Component
function ProcessDetail({
    process,
    clients,
    onUpdate,
    onDelete
}: {
    process: Process
    clients: Partner[]
    onUpdate: () => void
    onDelete: () => void
}) {
    const t = useTranslations('process')
    const tc = useTranslations('common')
    const [formData, setFormData] = useState<any>(process)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch(`/api/processes/${process.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                onUpdate()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const moveToStage = (stage: string) => {
        updateField('currentStage', stage)
    }

    return (
        <div className="mt-3 pt-3 border-top" onClick={e => e.stopPropagation()}>
            {/* Stage Tabs */}
            <div className="d-flex gap-2 mb-3 overflow-auto pb-1">
                {STAGES.map(stage => {
                    const StageIcon = stage.icon
                    return (
                        <button
                            key={stage.key}
                            onClick={() => moveToStage(stage.key)}
                            className={`btn d-flex align-items-center gap-2 whitespace-nowrap ${
                                formData.currentStage === stage.key
                                    ? 'btn-primary'
                                    : 'btn-ghost-secondary'
                            }`}
                        >
                            <StageIcon size={16} />
                            {stage.label}
                        </button>
                    )
                })}
            </div>

            {/* Stage Content */}
            <div className="space-y-3">
                {formData.currentStage === 'CONTRACT' && (
                    <ContractStage formData={formData} updateField={updateField} t={t} />
                )}
                {formData.currentStage === 'DELIVERY_REQUEST' && (
                    <DeliveryRequestStage formData={formData} updateField={updateField} t={t} />
                )}
                {formData.currentStage === 'DELIVERY_CHECK' && (
                    <DeliveryCheckStage formData={formData} updateField={updateField} t={t} />
                )}
                {formData.currentStage === 'ERP_STATS' && (
                    <ErpStatsStage formData={formData} updateField={updateField} t={t} />
                )}
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                <Button variant="destructive" onClick={onDelete}>
                    {tc('delete')}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? tc('loading') : tc('save')}
                </Button>
            </div>
        </div>
    )
}

// Stage Components
function ContractStage({ formData, updateField, t }: any) {
    return (
        <div className="row g-3">
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('contractManager')}</label>
                <Input
                    value={formData.contractManager || ''}
                    onChange={e => updateField('contractManager', e.target.value)}
                    placeholder={t('managerPlaceholder')}
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('contractDate')}</label>
                <Input
                    type="date"
                    value={formData.contractDate?.split('T')[0] || ''}
                    onChange={e => updateField('contractDate', e.target.value)}
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('status')}</label>
                <select
                    className="form-select"
                    value={formData.contractStatus || 'PENDING'}
                    onChange={e => updateField('contractStatus', e.target.value)}
                >
                    <option value="PENDING">{t('statusPending')}</option>
                    <option value="IN_PROGRESS">{t('statusInProgress')}</option>
                    <option value="COMPLETED">{t('statusCompleted')}</option>
                </select>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('checklist')}</label>
                <div className="space-y-2">
                    <CheckboxItem
                        checked={formData.legalCheckCompleted}
                        onChange={v => updateField('legalCheckCompleted', v)}
                        label={t('legalCheck')}
                    />
                    <CheckboxItem
                        checked={formData.contractSigned}
                        onChange={v => updateField('contractSigned', v)}
                        label={t('contractSigned')}
                    />
                    <CheckboxItem
                        checked={formData.contractDocUpdated}
                        onChange={v => updateField('contractDocUpdated', v)}
                        label={t('contractDocUpdated')}
                    />
                </div>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('notes')}</label>
                <textarea
                    className="form-control"
                    style={{ minHeight: '80px' }}
                    value={formData.contractNotes || ''}
                    onChange={e => updateField('contractNotes', e.target.value)}
                    placeholder={t('notesPlaceholder')}
                />
            </div>
        </div>
    )
}

function DeliveryRequestStage({ formData, updateField, t }: any) {
    return (
        <div className="row g-3">
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('deliveryManager')}</label>
                <Input
                    value={formData.deliveryManager || ''}
                    onChange={e => updateField('deliveryManager', e.target.value)}
                    placeholder={t('managerPlaceholder')}
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('deliveryDate')}</label>
                <Input
                    type="date"
                    value={formData.deliveryDate?.split('T')[0] || ''}
                    onChange={e => updateField('deliveryDate', e.target.value)}
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('status')}</label>
                <select
                    className="form-select"
                    value={formData.deliveryRequestStatus || 'PENDING'}
                    onChange={e => updateField('deliveryRequestStatus', e.target.value)}
                >
                    <option value="PENDING">{t('statusPending')}</option>
                    <option value="IN_PROGRESS">{t('statusInProgress')}</option>
                    <option value="COMPLETED">{t('statusCompleted')}</option>
                </select>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('checklist')}</label>
                <div className="space-y-2">
                    <CheckboxItem
                        checked={formData.stockConfirmed}
                        onChange={v => updateField('stockConfirmed', v)}
                        label={t('stockConfirmed')}
                    />
                    <CheckboxItem
                        checked={formData.manufacturingRequested}
                        onChange={v => updateField('manufacturingRequested', v)}
                        label={t('manufacturingRequested')}
                    />
                    <CheckboxItem
                        checked={formData.orderRequested}
                        onChange={v => updateField('orderRequested', v)}
                        label={t('orderRequested')}
                    />
                    <CheckboxItem
                        checked={formData.leaseContacted}
                        onChange={v => updateField('leaseContacted', v)}
                        label={t('leaseContacted')}
                    />
                    <CheckboxItem
                        checked={formData.externalPartsOrdered}
                        onChange={v => updateField('externalPartsOrdered', v)}
                        label={t('externalPartsOrdered')}
                    />
                </div>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('notes')}</label>
                <textarea
                    className="form-control"
                    style={{ minHeight: '80px' }}
                    value={formData.deliveryNotes || ''}
                    onChange={e => updateField('deliveryNotes', e.target.value)}
                    placeholder={t('notesPlaceholder')}
                />
            </div>
        </div>
    )
}

function DeliveryCheckStage({ formData, updateField, t }: any) {
    return (
        <div className="row g-3">
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('trackingNumber')}</label>
                <Input
                    value={formData.trackingNumber || ''}
                    onChange={e => updateField('trackingNumber', e.target.value)}
                    placeholder={t('trackingPlaceholder')}
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('anydeskNo')}</label>
                <Input
                    value={formData.anydeskNo || ''}
                    onChange={e => updateField('anydeskNo', e.target.value)}
                    placeholder="123 456 789"
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('serialNo')}</label>
                <Input
                    value={formData.serialNo || ''}
                    onChange={e => updateField('serialNo', e.target.value)}
                    placeholder="KIOSK-2024-001"
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('status')}</label>
                <select
                    className="form-select"
                    value={formData.deliveryCheckStatus || 'PENDING'}
                    onChange={e => updateField('deliveryCheckStatus', e.target.value)}
                >
                    <option value="PENDING">{t('statusPending')}</option>
                    <option value="IN_PROGRESS">{t('statusInProgress')}</option>
                    <option value="COMPLETED">{t('statusCompleted')}</option>
                </select>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('checklist')}</label>
                <div className="space-y-2">
                    <CheckboxItem
                        checked={formData.kioskShipped}
                        onChange={v => updateField('kioskShipped', v)}
                        label={t('kioskShipped')}
                    />
                    <CheckboxItem
                        checked={formData.deliveryConfirmed}
                        onChange={v => updateField('deliveryConfirmed', v)}
                        label={t('deliveryConfirmed')}
                    />
                    <CheckboxItem
                        checked={formData.kioskInfoUpdated}
                        onChange={v => updateField('kioskInfoUpdated', v)}
                        label={t('kioskInfoUpdated')}
                    />
                </div>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('notes')}</label>
                <textarea
                    className="form-control"
                    style={{ minHeight: '80px' }}
                    value={formData.deliveryCheckNotes || ''}
                    onChange={e => updateField('deliveryCheckNotes', e.target.value)}
                    placeholder={t('notesPlaceholder')}
                />
            </div>
        </div>
    )
}

function ErpStatsStage({ formData, updateField, t }: any) {
    return (
        <div className="row g-3">
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('erpManager')}</label>
                <Input
                    value={formData.erpManager || ''}
                    onChange={e => updateField('erpManager', e.target.value)}
                    placeholder={t('managerPlaceholder')}
                />
            </div>
            <div className="col-12 col-md-6 space-y-2">
                <label className="text-sm fw-medium">{t('status')}</label>
                <select
                    className="form-select"
                    value={formData.erpStatus || 'PENDING'}
                    onChange={e => updateField('erpStatus', e.target.value)}
                >
                    <option value="PENDING">{t('statusPending')}</option>
                    <option value="IN_PROGRESS">{t('statusInProgress')}</option>
                    <option value="COMPLETED">{t('statusCompleted')}</option>
                </select>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('checklist')}</label>
                <div className="space-y-2">
                    <CheckboxItem
                        checked={formData.operationInfoCollected}
                        onChange={v => updateField('operationInfoCollected', v)}
                        label={t('operationInfoCollected')}
                    />
                    <CheckboxItem
                        checked={formData.statsRequested}
                        onChange={v => updateField('statsRequested', v)}
                        label={t('statsRequested')}
                    />
                    <CheckboxItem
                        checked={formData.dashboardUpdated}
                        onChange={v => updateField('dashboardUpdated', v)}
                        label={t('dashboardUpdated')}
                    />
                    <CheckboxItem
                        checked={formData.statsReportCreated}
                        onChange={v => updateField('statsReportCreated', v)}
                        label={t('statsReportCreated')}
                    />
                </div>
            </div>
            <div className="col-12 space-y-2">
                <label className="text-sm fw-medium">{t('notes')}</label>
                <textarea
                    className="form-control"
                    style={{ minHeight: '80px' }}
                    value={formData.erpNotes || ''}
                    onChange={e => updateField('erpNotes', e.target.value)}
                    placeholder={t('notesPlaceholder')}
                />
            </div>
        </div>
    )
}

function CheckboxItem({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) {
    return (
        <label className="d-flex align-items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={checked || false}
                onChange={e => onChange(e.target.checked)}
                className="form-check-input"
            />
            <span className="text-sm">{label}</span>
        </label>
    )
}
