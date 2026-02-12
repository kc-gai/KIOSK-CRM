'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SectionForm {
    id?: string
    sectionNumber: number
    title: string
    titleKo: string
    content: string
    contentKo: string
    imageUrl: string
    imageUrls: string
    layout: string
    notes: string
    isVisible: boolean
}

const emptySection: SectionForm = {
    sectionNumber: 1,
    title: '',
    titleKo: '',
    content: '',
    contentKo: '',
    imageUrl: '',
    imageUrls: '',
    layout: 'TEXT_IMAGE',
    notes: '',
    isVisible: true
}

export default function EditAssemblyManualPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const t = useTranslations('assemblyManual')
    const tc = useTranslations('common')
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        titleKo: '',
        subtitle: '',
        version: '1.0',
        versionDate: new Date().toISOString().split('T')[0],
        changeLog: '',
        docType: 'ASSEMBLY',
        status: 'DRAFT',
        isLatest: true,
        authorName: '',
        tags: '',
        notes: ''
    })

    const [sections, setSections] = useState<SectionForm[]>([{ ...emptySection }])
    const [activeSection, setActiveSection] = useState(0)

    const fetchManual = useCallback(async () => {
        try {
            const res = await fetch(`/api/assembly-manual/${slug}`)
            if (res.ok) {
                const data = await res.json()
                setFormData({
                    slug: data.slug,
                    title: data.title,
                    titleKo: data.titleKo || '',
                    subtitle: data.subtitle || '',
                    version: data.version,
                    versionDate: data.versionDate ? data.versionDate.split('T')[0] : '',
                    changeLog: data.changeLog || '',
                    docType: data.docType,
                    status: data.status,
                    isLatest: data.isLatest,
                    authorName: data.authorName || '',
                    tags: data.tags || '',
                    notes: data.notes || ''
                })
                if (data.sections && data.sections.length > 0) {
                    setSections(data.sections.map((s: SectionForm) => ({
                        id: s.id,
                        sectionNumber: s.sectionNumber,
                        title: s.title,
                        titleKo: s.titleKo || '',
                        content: s.content || '',
                        contentKo: s.contentKo || '',
                        imageUrl: s.imageUrl || '',
                        imageUrls: s.imageUrls || '',
                        layout: s.layout,
                        notes: s.notes || '',
                        isVisible: s.isVisible
                    })))
                }
            }
        } catch (error) {
            console.error('Failed to fetch manual:', error)
        } finally {
            setLoading(false)
        }
    }, [slug])

    useEffect(() => {
        fetchManual()
    }, [fetchManual])

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSectionChange = (index: number, field: keyof SectionForm, value: string | number | boolean) => {
        setSections(prev => prev.map((section, i) =>
            i === index ? { ...section, [field]: value } : section
        ))
    }

    const addSection = () => {
        setSections(prev => [...prev, {
            ...emptySection,
            sectionNumber: prev.length + 1
        }])
        setActiveSection(sections.length)
    }

    const removeSection = (index: number) => {
        if (sections.length === 1) return
        setSections(prev => {
            const newSections = prev.filter((_, i) => i !== index)
            return newSections.map((s, i) => ({ ...s, sectionNumber: i + 1 }))
        })
        setActiveSection(Math.max(0, activeSection - 1))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const payload = {
                ...formData,
                sections: sections.map((section, index) => ({
                    ...section,
                    sortOrder: index
                }))
            }

            const res = await fetch(`/api/assembly-manual/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/dashboard/assembly-manual/${data.slug}`)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to update')
            }
        } catch (error) {
            console.error('Failed to update:', error)
            alert('Failed to update manual')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="container-xl">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{tc('loading')}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container-xl">
            <div className="page-header d-print-none">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/assembly-manual" className="btn btn-ghost-secondary btn-sm mb-2">
                            <i className="ti ti-arrow-left me-1"></i> Back
                        </Link>
                        <h2 className="page-title">
                            <i className="ti ti-edit me-2"></i>
                            {t('editManual')}
                        </h2>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div className="card mt-3">
                    <div className="card-header">
                        <h3 className="card-title">基本情報</h3>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-8">
                                <label className="form-label required">{t('manualTitle')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label required">{t('slug')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label">{t('titleKo')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="titleKo"
                                    value={formData.titleKo}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">{t('subtitle')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label required">{t('version')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="version"
                                    value={formData.version}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">{t('versionDate')}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="versionDate"
                                    value={formData.versionDate}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">{t('docType')}</label>
                                <select
                                    className="form-select"
                                    name="docType"
                                    value={formData.docType}
                                    onChange={handleFormChange}
                                >
                                    <option value="ASSEMBLY">{t('typeAssembly')}</option>
                                    <option value="OPERATION">{t('typeOperation')}</option>
                                    <option value="MAINTENANCE">{t('typeMaintenance')}</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">{t('status')}</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                >
                                    <option value="DRAFT">{t('statusDraft')}</option>
                                    <option value="PUBLISHED">{t('statusPublished')}</option>
                                    <option value="ARCHIVED">{t('statusArchived')}</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">{t('authorName')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="authorName"
                                    value={formData.authorName}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">{t('tags')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">{t('changeLog')}</label>
                                <textarea
                                    className="form-control"
                                    name="changeLog"
                                    value={formData.changeLog}
                                    onChange={handleFormChange}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div className="card mt-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('sections')}</h3>
                        <div className="card-actions">
                            <button type="button" className="btn btn-primary btn-sm" onClick={addSection}>
                                <i className="ti ti-plus me-1"></i>
                                {t('addSection')}
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {/* Section List */}
                            <div className="col-md-3">
                                <div className="list-group">
                                    {sections.map((section, index) => (
                                        <button
                                            key={section.id || index}
                                            type="button"
                                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${index === activeSection ? 'active' : ''}`}
                                            onClick={() => setActiveSection(index)}
                                        >
                                            <span>
                                                <span className="badge bg-secondary me-2">{section.sectionNumber}</span>
                                                {section.title || `Section ${index + 1}`}
                                            </span>
                                            {sections.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost-danger p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeSection(index)
                                                    }}
                                                >
                                                    <i className="ti ti-x"></i>
                                                </button>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section Editor */}
                            <div className="col-md-9">
                                {sections[activeSection] && (
                                    <div className="border rounded p-3">
                                        <div className="row g-3">
                                            <div className="col-md-2">
                                                <label className="form-label">{t('sectionNumber')}</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={sections[activeSection].sectionNumber}
                                                    onChange={(e) => handleSectionChange(activeSection, 'sectionNumber', parseInt(e.target.value) || 1)}
                                                    min={1}
                                                />
                                            </div>
                                            <div className="col-md-5">
                                                <label className="form-label required">{t('sectionTitle')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={sections[activeSection].title}
                                                    onChange={(e) => handleSectionChange(activeSection, 'title', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-5">
                                                <label className="form-label">{t('titleKo')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={sections[activeSection].titleKo}
                                                    onChange={(e) => handleSectionChange(activeSection, 'titleKo', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">{t('sectionContent')} (日本語)</label>
                                                <textarea
                                                    className="form-control"
                                                    value={sections[activeSection].content}
                                                    onChange={(e) => handleSectionChange(activeSection, 'content', e.target.value)}
                                                    rows={6}
                                                />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">{t('sectionContent')} (한국어)</label>
                                                <textarea
                                                    className="form-control"
                                                    value={sections[activeSection].contentKo}
                                                    onChange={(e) => handleSectionChange(activeSection, 'contentKo', e.target.value)}
                                                    rows={6}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">{t('layout')}</label>
                                                <select
                                                    className="form-select"
                                                    value={sections[activeSection].layout}
                                                    onChange={(e) => handleSectionChange(activeSection, 'layout', e.target.value)}
                                                >
                                                    <option value="TEXT_ONLY">{t('layoutTextOnly')}</option>
                                                    <option value="IMAGE_ONLY">{t('layoutImageOnly')}</option>
                                                    <option value="TEXT_IMAGE">{t('layoutTextImage')}</option>
                                                    <option value="GALLERY">{t('layoutGallery')}</option>
                                                </select>
                                            </div>
                                            <div className="col-md-8">
                                                <label className="form-label">{t('imageUrl')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={sections[activeSection].imageUrl}
                                                    onChange={(e) => handleSectionChange(activeSection, 'imageUrl', e.target.value)}
                                                />
                                            </div>
                                            {sections[activeSection].layout === 'GALLERY' && (
                                                <div className="col-md-12">
                                                    <label className="form-label">추가 이미지 URLs (쉼표 구분)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={sections[activeSection].imageUrls}
                                                        onChange={(e) => handleSectionChange(activeSection, 'imageUrls', e.target.value)}
                                                        placeholder="url1, url2, url3"
                                                    />
                                                </div>
                                            )}
                                            <div className="col-md-12">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`visible-${activeSection}`}
                                                        checked={sections[activeSection].isVisible}
                                                        onChange={(e) => handleSectionChange(activeSection, 'isVisible', e.target.checked)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`visible-${activeSection}`}>
                                                        {t('isVisible')}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col">
                                <span className="text-muted">
                                    {sections.length} {t('sections')}
                                </span>
                            </div>
                            <div className="col-auto">
                                <Link href="/dashboard/assembly-manual" className="btn btn-ghost-secondary me-2">
                                    {tc('cancel')}
                                </Link>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            {tc('saving')}
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
