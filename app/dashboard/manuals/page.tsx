'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2, Book, Info, Lightbulb, ChevronRight, Plus, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Manual = {
    id: string
    title: string
    content: string
    version: string
    updatedAt: string
    isPublished: boolean
}

type TabType = 'guide' | 'manuals'

export default function ManualsPage() {
    const t = useTranslations('manuals')
    const tg = useTranslations('guide')
    const tc = useTranslations('common')
    const [activeTab, setActiveTab] = useState<TabType>('guide')
    const [manuals, setManuals] = useState<Manual[]>([])
    const [selected, setSelected] = useState<Manual | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [showMobileDetail, setShowMobileDetail] = useState(false)

    // Form
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [version, setVersion] = useState('1.0.0')

    const fetchManuals = async () => {
        try {
            const res = await fetch('/api/manuals')
            if (res.ok) setManuals(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchManuals()
    }, [])

    const resetForm = () => {
        setTitle('')
        setContent('')
        setVersion('1.0.0')
    }

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/manuals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, version })
            })
            if (res.ok) {
                setIsCreating(false)
                resetForm()
                fetchManuals()
                setShowMobileDetail(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEdit = (manual: Manual) => {
        setSelected(manual)
        setTitle(manual.title)
        setContent(manual.content)
        setVersion(manual.version)
        setIsEditing(true)
        setIsCreating(false)
        setShowMobileDetail(true)
    }

    const handleUpdate = async () => {
        if (!selected) return

        try {
            const res = await fetch(`/api/manuals/${selected.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, version })
            })
            if (res.ok) {
                const updated = await res.json()
                setSelected(updated)
                setIsEditing(false)
                fetchManuals()
            } else {
                alert(t('updateFailed'))
            }
        } catch (e) {
            console.error(e)
            alert(t('updateError'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/manuals/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                if (selected?.id === id) {
                    setSelected(null)
                    setShowMobileDetail(false)
                }
                fetchManuals()
            } else {
                alert(t('deleteFailed'))
            }
        } catch (e) {
            console.error(e)
            alert(t('deleteError'))
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setIsCreating(false)
        if (selected) {
            setTitle(selected.title)
            setContent(selected.content)
            setVersion(selected.version)
        } else {
            resetForm()
            setShowMobileDetail(false)
        }
    }

    const handleNewManual = () => {
        setIsCreating(true)
        setIsEditing(false)
        setSelected(null)
        resetForm()
        setShowMobileDetail(true)
    }

    const handleSelectManual = (manual: Manual) => {
        setSelected(manual)
        setIsEditing(false)
        setIsCreating(false)
        setShowMobileDetail(true)
    }

    const handleBackToList = () => {
        setShowMobileDetail(false)
        setIsEditing(false)
        setIsCreating(false)
    }

    // 빠른 시작 단계
    const quickStartSteps = [
        { key: 'step1', icon: 'ti-building' },
        { key: 'step2', icon: 'ti-list-check' },
        { key: 'step3', icon: 'ti-truck-delivery' },
        { key: 'step4', icon: 'ti-device-desktop' },
    ]

    // 가이드 메뉴 아이템 (그룹별)
    const guideGroups = [
        {
            title: '프로세스 관리',
            items: [
                { key: 'orderProcess', icon: 'ti-list-check' },
                { key: 'deliveryProcess', icon: 'ti-truck-delivery' },
            ]
        },
        {
            title: '자산 관리',
            items: [
                { key: 'assets', icon: 'ti-device-desktop' },
                { key: 'history', icon: 'ti-history' },
            ]
        },
        {
            title: '거래처 관리',
            items: [
                { key: 'partners', icon: 'ti-building' },
                { key: 'fc', icon: 'ti-building-store' },
                { key: 'regions', icon: 'ti-map-pin' },
            ]
        },
        {
            title: '시스템',
            items: [
                { key: 'dashboard', icon: 'ti-dashboard' },
                { key: 'aiSearch', icon: 'ti-sparkles' },
                { key: 'statistics', icon: 'ti-chart-bar' },
                { key: 'accounts', icon: 'ti-users' },
                { key: 'apiSettings', icon: 'ti-plug' },
            ]
        },
    ]

    return (
        <div className="container-xl">
            {/* 페이지 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col">
                        <h2 className="page-title">
                            <i className="ti ti-book me-2"></i>
                            가이드 & 매뉴얼
                        </h2>
                        <div className="text-muted mt-1">시스템 사용 가이드 및 업무 매뉴얼</div>
                    </div>
                </div>
            </div>

            {/* 탭 헤더 */}
            <div className="card mb-4">
                <div className="card-header p-0">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'guide' ? 'active' : ''}`}
                                onClick={() => setActiveTab('guide')}
                            >
                                <Info className="inline-block w-4 h-4 me-2" />
                                {tg('title')}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'manuals' ? 'active' : ''}`}
                                onClick={() => setActiveTab('manuals')}
                            >
                                <Book className="inline-block w-4 h-4 me-2" />
                                {t('title')}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* 가이드 탭 */}
            {activeTab === 'guide' && (
                <div className="space-y-4">
                    {/* 시스템 개요 */}
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h2 className="card-title text-white">{tg('overview')}</h2>
                            <p className="text-white-50 mb-0">{tg('overviewDesc')}</p>
                        </div>
                    </div>

                    {/* 빠른 시작 가이드 */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <Lightbulb className="w-5 h-5 me-2 text-warning" />
                                {tg('quickStart')}
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {quickStartSteps.map((step, idx) => (
                                    <div key={step.key} className="col-12 col-sm-6 col-lg-3">
                                        <div className="card card-sm h-100">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center mb-3">
                                                    <span className="avatar avatar-sm bg-primary text-white me-2">
                                                        {idx + 1}
                                                    </span>
                                                    <i className={`ti ${step.icon} fs-2 text-muted`}></i>
                                                </div>
                                                <h4 className="card-title mb-1">{tg(`${step.key}Title`)}</h4>
                                                <p className="text-muted small mb-0">{tg(`${step.key}Desc`)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 메뉴별 가이드 - 그룹화 */}
                    {guideGroups.map((group) => (
                        <div key={group.title} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{group.title}</h3>
                            </div>
                            <div className="list-group list-group-flush">
                                {group.items.map((item) => (
                                    <div key={item.key} className="list-group-item">
                                        <div className="row align-items-center">
                                            <div className="col-auto">
                                                <span className="avatar avatar-sm bg-primary-lt">
                                                    <i className={`ti ${item.icon}`}></i>
                                                </span>
                                            </div>
                                            <div className="col">
                                                <div className="fw-semibold">{tg(`${item.key}Guide`)}</div>
                                                <div className="text-muted small">{tg(`${item.key}Desc`)}</div>
                                            </div>
                                            <div className="col-auto">
                                                <ChevronRight className="w-4 h-4 text-muted" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* 사용 팁 */}
                    <div className="card bg-warning-lt">
                        <div className="card-body">
                            <h3 className="card-title d-flex align-items-center">
                                <Lightbulb className="w-5 h-5 me-2 text-warning" />
                                {tg('tips')}
                            </h3>
                            <ul className="list-unstyled mb-0 space-y-2">
                                <li className="d-flex align-items-start">
                                    <span className="badge bg-warning me-2">TIP</span>
                                    <span>{tg('tip1')}</span>
                                </li>
                                <li className="d-flex align-items-start mt-2">
                                    <span className="badge bg-warning me-2">TIP</span>
                                    <span>{tg('tip2')}</span>
                                </li>
                                <li className="d-flex align-items-start mt-2">
                                    <span className="badge bg-warning me-2">TIP</span>
                                    <span>{tg('tip3')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 매뉴얼 탭 */}
            {activeTab === 'manuals' && (
                <div className="row g-4">
                    {/* 사이드바 - 매뉴얼 목록 */}
                    <div className={`col-12 col-lg-4 ${showMobileDetail ? 'd-none d-lg-block' : ''}`}>
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{t('title')}</h3>
                                <div className="card-actions">
                                    <Button size="sm" onClick={handleNewManual}>
                                        <Plus className="w-4 h-4 me-1" />
                                        {t('newManual')}
                                    </Button>
                                </div>
                            </div>
                            <div className="list-group list-group-flush" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {manuals.length === 0 ? (
                                    <div className="list-group-item text-center text-muted py-4">
                                        등록된 매뉴얼이 없습니다
                                    </div>
                                ) : (
                                    manuals.map(m => (
                                        <div
                                            key={m.id}
                                            className={`list-group-item list-group-item-action cursor-pointer ${selected?.id === m.id ? 'active' : ''}`}
                                            onClick={() => handleSelectManual(m)}
                                        >
                                            <div className="d-flex w-100 justify-content-between align-items-start">
                                                <div className="flex-grow-1 me-2">
                                                    <h5 className={`mb-1 ${selected?.id === m.id ? 'text-white' : ''}`}>
                                                        {m.title}
                                                    </h5>
                                                    <small className={selected?.id === m.id ? 'text-white-50' : 'text-muted'}>
                                                        v{m.version} · {new Date(m.updatedAt).toLocaleDateString('ja-JP')}
                                                    </small>
                                                </div>
                                                <div className="btn-list flex-nowrap">
                                                    <button
                                                        className={`btn btn-sm ${selected?.id === m.id ? 'btn-light' : 'btn-ghost-secondary'}`}
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(m); }}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${selected?.id === m.id ? 'btn-light text-danger' : 'btn-ghost-danger'}`}
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 메인 컨텐츠 영역 */}
                    <div className={`col-12 col-lg-8 ${!showMobileDetail ? 'd-none d-lg-block' : ''}`}>
                        <div className="card">
                            {/* 모바일 뒤로가기 버튼 */}
                            <div className="card-header d-lg-none">
                                <button className="btn btn-ghost-secondary btn-sm" onClick={handleBackToList}>
                                    <ArrowLeft className="w-4 h-4 me-1" />
                                    목록으로
                                </button>
                            </div>

                            <div className="card-body">
                                {(isEditing || isCreating) ? (
                                    <div className="space-y-4">
                                        <h2 className="h2 mb-4">{isCreating ? t('newManual') : t('editManual')}</h2>
                                        <div className="mb-3">
                                            <label className="form-label">{t('manualTitle')}</label>
                                            <Input
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder={t('titlePlaceholder')}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('version')}</label>
                                            <Input
                                                value={version}
                                                onChange={e => setVersion(e.target.value)}
                                                placeholder={t('versionPlaceholder')}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('content')}</label>
                                            <Textarea
                                                className="form-control font-mono"
                                                style={{ minHeight: '300px' }}
                                                value={content}
                                                onChange={e => setContent(e.target.value)}
                                                placeholder={t('contentPlaceholder')}
                                            />
                                        </div>
                                        <div className="btn-list">
                                            <Button onClick={isCreating ? handleCreate : handleUpdate}>
                                                {isCreating ? tc('create') : tc('save')}
                                            </Button>
                                            <Button variant="outline" onClick={handleCancelEdit}>
                                                {tc('cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : selected ? (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                                            <div>
                                                <h1 className="h2 mb-1">{selected.title}</h1>
                                                <div className="text-muted">
                                                    v{selected.version} · 최종 수정: {new Date(selected.updatedAt).toLocaleString('ja-JP')}
                                                </div>
                                            </div>
                                            <div className="btn-list d-none d-sm-flex">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(selected)}>
                                                    <Pencil className="w-3 h-3 me-1" /> {tc('edit')}
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-danger" onClick={() => handleDelete(selected.id)}>
                                                    <Trash2 className="w-3 h-3 me-1" /> {tc('delete')}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="prose max-w-none" style={{ whiteSpace: 'pre-wrap' }}>
                                            {selected.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '300px' }}>
                                        <div className="text-center">
                                            <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>{t('selectManual')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
