'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface ManualSection {
    id: string
    sectionNumber: number
    title: string
    titleKo: string | null
    content: string
    contentKo: string | null
    imageUrl: string | null
    imageUrls: string | null
    layout: string
    sortOrder: number
    isVisible: boolean
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

export default function AssemblyManualViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const t = useTranslations('assemblyManual')
    const tc = useTranslations('common')
    const locale = useLocale()

    const [manual, setManual] = useState<AssemblyManual | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [showToc, setShowToc] = useState(true)

    const fetchManual = useCallback(async () => {
        try {
            const res = await fetch(`/api/assembly-manual/${slug}`)
            if (res.ok) {
                const data = await res.json()
                setManual(data)
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

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!manual) return
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setCurrentSectionIndex(prev => Math.max(0, prev - 1))
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setCurrentSectionIndex(prev => Math.min(manual.sections.length - 1, prev + 1))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [manual])

    const getLocalizedTitle = (section: ManualSection) => {
        if (locale === 'ko' && section.titleKo) return section.titleKo
        return section.title
    }

    const getLocalizedContent = (section: ManualSection) => {
        if (locale === 'ko' && section.contentKo) return section.contentKo
        return section.content
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ja-JP')
    }

    // 마크다운을 간단히 HTML로 변환 (기본 지원)
    const renderMarkdown = (content: string) => {
        // 간단한 마크다운 변환
        let html = content
            // 헤딩
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 볼드
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // 이탤릭
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // 리스트
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // 줄바꿈
            .replace(/\n/g, '<br/>')

        // li 태그를 ul로 감싸기
        html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')

        return html
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

    if (!manual) {
        return (
            <div className="container-xl">
                <div className="alert alert-danger">Manual not found</div>
            </div>
        )
    }

    const visibleSections = manual.sections.filter(s => s.isVisible)
    const currentSection = visibleSections[currentSectionIndex]

    return (
        <div className="container-xl">
            {/* Header */}
            <div className="page-header d-print-none mb-3">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <Link href="/dashboard/assembly-manual" className="btn btn-ghost-secondary btn-sm mb-2">
                            <i className="ti ti-arrow-left me-1"></i> Back
                        </Link>
                    </div>
                    <div className="col">
                        <h2 className="page-title mb-0">
                            {locale === 'ko' && manual.titleKo ? manual.titleKo : manual.title}
                        </h2>
                        <div className="text-muted small mt-1">
                            <span className="badge bg-blue-lt me-2">v{manual.version}</span>
                            <span>{formatDate(manual.versionDate)}</span>
                            {manual.authorName && (
                                <>
                                    <span className="mx-2">·</span>
                                    <span>{manual.authorName}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="col-auto">
                        <button
                            className={`btn btn-sm ${showToc ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowToc(!showToc)}
                        >
                            <i className="ti ti-list me-1"></i>
                            {t('tableOfContents')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Table of Contents */}
                {showToc && (
                    <div className="col-md-3">
                        <div className="card sticky-top" style={{ top: '1rem' }}>
                            <div className="card-header">
                                <h4 className="card-title">{t('tableOfContents')}</h4>
                            </div>
                            <div className="list-group list-group-flush">
                                {visibleSections.map((section, index) => (
                                    <button
                                        key={section.id}
                                        className={`list-group-item list-group-item-action d-flex align-items-center ${index === currentSectionIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentSectionIndex(index)}
                                    >
                                        <span className="badge bg-secondary me-2">{section.sectionNumber}</span>
                                        <span className="text-truncate">{getLocalizedTitle(section)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className={showToc ? 'col-md-9' : 'col-12'}>
                    <div className="card">
                        {/* Section Header */}
                        <div className="card-header">
                            <div className="row align-items-center w-100">
                                <div className="col">
                                    <span className="badge bg-blue me-2">
                                        {currentSection?.sectionNumber || 1}
                                    </span>
                                    <span className="fw-semibold">
                                        {currentSection ? getLocalizedTitle(currentSection) : ''}
                                    </span>
                                </div>
                                <div className="col-auto">
                                    <span className="text-muted small">
                                        {t('sectionOf', { current: currentSectionIndex + 1, total: visibleSections.length })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Content */}
                        <div className="card-body">
                            {currentSection ? (
                                <div className="row">
                                    {/* Text Content */}
                                    {(currentSection.layout === 'TEXT_ONLY' || currentSection.layout === 'TEXT_IMAGE') && (
                                        <div className={currentSection.layout === 'TEXT_IMAGE' && currentSection.imageUrl ? 'col-md-6' : 'col-12'}>
                                            <div
                                                className="manual-content"
                                                dangerouslySetInnerHTML={{
                                                    __html: renderMarkdown(getLocalizedContent(currentSection))
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Image Content */}
                                    {(currentSection.layout === 'IMAGE_ONLY' || currentSection.layout === 'TEXT_IMAGE') && currentSection.imageUrl && (
                                        <div className={currentSection.layout === 'TEXT_IMAGE' ? 'col-md-6' : 'col-12'}>
                                            <div className="text-center">
                                                <img
                                                    src={currentSection.imageUrl}
                                                    alt={getLocalizedTitle(currentSection)}
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: '500px' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Gallery Layout */}
                                    {currentSection.layout === 'GALLERY' && currentSection.imageUrls && (
                                        <div className="col-12">
                                            <div className="row g-3">
                                                {currentSection.imageUrls.split(',').map((url, idx) => (
                                                    <div key={idx} className="col-md-4">
                                                        <img
                                                            src={url.trim()}
                                                            alt={`${getLocalizedTitle(currentSection)} ${idx + 1}`}
                                                            className="img-fluid rounded"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    No content available
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="card-footer">
                            <div className="row align-items-center">
                                <div className="col">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentSectionIndex === 0}
                                    >
                                        <i className="ti ti-chevron-left me-1"></i>
                                        {t('prevSection')}
                                    </button>
                                </div>
                                <div className="col-auto">
                                    <div className="btn-group">
                                        {visibleSections.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`btn btn-sm ${index === currentSectionIndex ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => setCurrentSectionIndex(index)}
                                                style={{ minWidth: '36px' }}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col text-end">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setCurrentSectionIndex(prev => Math.min(visibleSections.length - 1, prev + 1))}
                                        disabled={currentSectionIndex === visibleSections.length - 1}
                                    >
                                        {t('nextSection')}
                                        <i className="ti ti-chevron-right ms-1"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Keyboard Navigation Hint */}
                    <div className="text-muted text-center mt-3 small">
                        <i className="ti ti-keyboard me-1"></i>
                        Use <kbd>←</kbd> <kbd>→</kbd> arrow keys to navigate
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx global>{`
                .manual-content h1, .manual-content h2, .manual-content h3 {
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                }
                .manual-content ul {
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }
                .manual-content li {
                    margin-bottom: 0.25rem;
                }
                .manual-content strong {
                    color: #206bc4;
                }
            `}</style>
        </div>
    )
}
