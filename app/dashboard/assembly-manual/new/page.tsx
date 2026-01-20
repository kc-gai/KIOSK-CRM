'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SectionForm {
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

export default function NewAssemblyManualPage() {
    const t = useTranslations('assemblyManual')
    const tc = useTranslations('common')
    const router = useRouter()

    const [loading, setLoading] = useState(false)
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
        setLoading(true)

        try {
            const payload = {
                ...formData,
                sections: sections.map((section, index) => ({
                    ...section,
                    sortOrder: index
                }))
            }

            const res = await fetch('/api/assembly-manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/dashboard/assembly-manual/${data.slug}`)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to create')
            }
        } catch (error) {
            console.error('Failed to create:', error)
            alert('Failed to create manual')
        } finally {
            setLoading(false)
        }
    }

    // 제목에서 slug 자동 생성
    const generateSlug = () => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龯\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50)
        setFormData(prev => ({ ...prev, slug: slug + '-v' + formData.version.replace('.', '') }))
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
                            <i className="ti ti-file-plus me-2"></i>
                            {t('newManual')}
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
                                    placeholder="キオスク組立マニュアル"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label required">{t('slug')}</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleFormChange}
                                        required
                                        placeholder={t('slugPlaceholder')}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={generateSlug}
                                    >
                                        Auto
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-8">
                                <label className="form-label">{t('titleKo')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="titleKo"
                                    value={formData.titleKo}
                                    onChange={handleFormChange}
                                    placeholder="키오스크 조립 매뉴얼"
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
                                    placeholder="Standard Model"
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
                                    placeholder={t('versionPlaceholder')}
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
                                    placeholder={t('tagsPlaceholder')}
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
                                    placeholder={t('changeLogPlaceholder')}
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
                                            key={index}
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
                                                    placeholder="セクションタイトル"
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
                                                    placeholder="한국어 제목"
                                                />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">{t('sectionContent')} (日本語)</label>
                                                <textarea
                                                    className="form-control"
                                                    value={sections[activeSection].content}
                                                    onChange={(e) => handleSectionChange(activeSection, 'content', e.target.value)}
                                                    rows={6}
                                                    placeholder={t('sectionContentPlaceholder')}
                                                />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">{t('sectionContent')} (한국어)</label>
                                                <textarea
                                                    className="form-control"
                                                    value={sections[activeSection].contentKo}
                                                    onChange={(e) => handleSectionChange(activeSection, 'contentKo', e.target.value)}
                                                    rows={6}
                                                    placeholder="한국어 내용..."
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
                                                    placeholder={t('imageUrlPlaceholder')}
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
