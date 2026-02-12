'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type SearchResult = {
    type: string
    items: Record<string, unknown>[]
    count: number
}

type Stats = {
    counts: Record<string, number>
    kioskStatuses: Record<string, number>
    deliveryStatuses: Record<string, number>
}

export default function AISearchPage() {
    const t = useTranslations('aiSearch')
    const tc = useTranslations('common')

    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<SearchResult[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [stats, setStats] = useState<Stats | null>(null)
    const [searchHistory, setSearchHistory] = useState<string[]>([])

    // 통계 데이터 로드
    useEffect(() => {
        fetch('/api/ai-search')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(console.error)

        // 검색 히스토리 로드
        const saved = localStorage.getItem('aiSearchHistory')
        if (saved) {
            setSearchHistory(JSON.parse(saved))
        }
    }, [])

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery || query
        if (!q || q.trim().length < 2) return

        setIsSearching(true)
        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            })
            if (res.ok) {
                const data = await res.json()
                setResults(data.results)
                setTotalCount(data.totalCount)

                // 검색 히스토리 저장
                const newHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 10)
                setSearchHistory(newHistory)
                localStorage.setItem('aiSearchHistory', JSON.stringify(newHistory))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            kiosk: 'ti-device-desktop',
            partner: 'ti-building',
            fc: 'ti-building-store',
            corporation: 'ti-briefcase',
            branch: 'ti-map-pin',
            delivery: 'ti-truck-delivery',
            region: 'ti-map'
        }
        return icons[type] || 'ti-file'
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            kiosk: t('typeKiosk'),
            partner: t('typePartner'),
            fc: t('typeFc'),
            corporation: t('typeCorporation'),
            branch: t('typeBranch'),
            delivery: t('typeDelivery'),
            region: t('typeRegion')
        }
        return labels[type] || type
    }

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            kiosk: 'bg-blue',
            partner: 'bg-green',
            fc: 'bg-purple',
            corporation: 'bg-orange',
            branch: 'bg-cyan',
            delivery: 'bg-yellow',
            region: 'bg-pink'
        }
        return colors[type] || 'bg-secondary'
    }

    const renderResultItem = (type: string, item: Record<string, unknown>) => {
        switch (type) {
            case 'kiosk':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">
                                <code className="text-primary">{String(item.serialNumber || '')}</code>
                                {item.kioskNumber ? <span className="ms-2 text-muted">#{String(item.kioskNumber)}</span> : null}
                            </div>
                            <small className="text-muted">
                                {item.branchName ? <span className="me-2"><i className="ti ti-map-pin me-1"></i>{String(item.branchName)}</span> : null}
                                {item.fcName ? <span><i className="ti ti-building-store me-1"></i>{String(item.fcName)}</span> : null}
                            </small>
                        </div>
                        <div className="text-end">
                            <span className={`badge ${item.status === 'DEPLOYED' ? 'bg-green' : item.status === 'IN_STOCK' ? 'bg-blue' : 'bg-secondary'} text-white`}>
                                {String(item.status || '')}
                            </span>
                            {item.regionCode ? <div className="small text-muted mt-1">{String(item.regionCode)}/{String(item.areaCode || '')}</div> : null}
                        </div>
                    </div>
                )

            case 'partner':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">{String(item.name || '')}</div>
                            {item.nameJa ? <small className="text-muted">{String(item.nameJa)}</small> : null}
                        </div>
                        <div className="text-end">
                            <span className={`badge ${item.type === 'CLIENT' ? 'bg-blue' : item.type === 'SUPPLIER' ? 'bg-green' : 'bg-orange'} text-white`}>
                                {String(item.type || '')}
                            </span>
                            <div className="small text-muted mt-1">{t('kioskCount')}: {Number(item.kioskCount || 0)}</div>
                        </div>
                    </div>
                )

            case 'fc':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">{String(item.name || '')}</div>
                            {item.nameJa ? <small className="text-muted">{String(item.nameJa)}</small> : null}
                        </div>
                        <div className="text-end">
                            <span className={`badge ${item.fcType === 'RENTAL_CAR' ? 'bg-blue' : item.fcType === 'HOTEL' ? 'bg-purple' : 'bg-secondary'} text-white`}>
                                {String(item.fcType || '')}
                            </span>
                            <div className="small text-muted mt-1">{t('corporationCount')}: {Number(item.corporationCount || 0)}</div>
                        </div>
                    </div>
                )

            case 'corporation':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">{String(item.name || '')}</div>
                            {item.fcName ? <small className="text-muted"><i className="ti ti-building-store me-1"></i>{String(item.fcName)}</small> : null}
                        </div>
                        <div className="text-end">
                            <div className="small text-muted">{t('branchCount')}: {Number(item.branchCount || 0)}</div>
                        </div>
                    </div>
                )

            case 'branch':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">{String(item.name || '')}</div>
                            <small className="text-muted">
                                {item.corporationName ? <span className="me-2"><i className="ti ti-briefcase me-1"></i>{String(item.corporationName)}</span> : null}
                                {item.address ? <span><i className="ti ti-map-pin me-1"></i>{String(item.address)}</span> : null}
                            </small>
                        </div>
                        <div className="text-end">
                            {item.regionCode ? <code className="small">{String(item.regionCode)}/{String(item.areaCode || '')}</code> : null}
                            <div className="small text-muted mt-1">{t('kioskCount')}: {Number(item.kioskCount || 0)}</div>
                        </div>
                    </div>
                )

            case 'delivery':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">
                                <code className="text-primary">{String(item.serialNumber || '')}</code>
                            </div>
                            <small className="text-muted">
                                {item.destination ? <span><i className="ti ti-truck me-1"></i>{String(item.destination)}</span> : null}
                            </small>
                        </div>
                        <div className="text-end">
                            <span className={`badge ${item.status === 'DELIVERED' ? 'bg-green' : item.status === 'SHIPPED' ? 'bg-blue' : 'bg-secondary'} text-white`}>
                                {String(item.status || '')}
                            </span>
                        </div>
                    </div>
                )

            case 'region':
                return (
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-medium">
                                <code className="text-primary me-2">{String(item.code || '')}</code>
                                {String(item.name || '')}
                            </div>
                            <small className="text-muted">{String(item.prefectures || '')}</small>
                        </div>
                    </div>
                )

            default:
                return <div>{JSON.stringify(item)}</div>
        }
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="page-title mb-0">
                    <i className="ti ti-search me-2"></i>
                    {t('title')}
                </h2>
            </div>

            {/* 검색 박스 */}
            <div className="card mb-3">
                <div className="card-body">
                    <div className="row g-2 align-items-end">
                        <div className="col">
                            <label className="form-label">{t('searchLabel')}</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="ti ti-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    placeholder={t('searchPlaceholder')}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleSearch()}
                                    disabled={isSearching || query.length < 2}
                                >
                                    {isSearching ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                        <>{t('searchButton')}</>
                                    )}
                                </button>
                            </div>
                            <small className="text-muted">{t('searchHint')}</small>
                        </div>
                    </div>

                    {/* 검색 히스토리 */}
                    {searchHistory.length > 0 && (
                        <div className="mt-3">
                            <small className="text-muted me-2">{t('recentSearches')}:</small>
                            {searchHistory.map((h, idx) => (
                                <button
                                    key={idx}
                                    className="btn btn-sm btn-outline-secondary me-1 mb-1"
                                    onClick={() => { setQuery(h); handleSearch(h) }}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 통계 카드 */}
            {stats && !results.length && (
                <div className="row row-deck row-cards mb-3">
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('totalKiosks')}</div>
                                </div>
                                <div className="h1 mb-0">{stats.counts.kiosks}</div>
                                <div className="d-flex mt-2">
                                    {Object.entries(stats.kioskStatuses).map(([status, count]) => (
                                        <span key={status} className="badge bg-secondary text-white me-1">{status}: {count}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('totalPartners')}</div>
                                </div>
                                <div className="h1 mb-0">{stats.counts.partners}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('totalBranches')}</div>
                                </div>
                                <div className="h1 mb-0">{stats.counts.branches}</div>
                                <div className="text-muted small">
                                    {stats.counts.fcs} FC / {stats.counts.corporations} {t('corporations')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="subheader">{t('totalDeliveries')}</div>
                                </div>
                                <div className="h1 mb-0">{stats.counts.deliveries}</div>
                                <div className="d-flex mt-2">
                                    {Object.entries(stats.deliveryStatuses).map(([status, count]) => (
                                        <span key={status} className="badge bg-secondary text-white me-1">{status}: {count}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 검색 결과 */}
            {results.length > 0 && (
                <div className="mb-3">
                    <div className="text-muted mb-2">
                        <i className="ti ti-search me-1"></i>
                        {t('resultCount', { count: totalCount })}
                    </div>

                    {results.map((result, idx) => (
                        <div key={idx} className="card mb-3">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <i className={`ti ${getTypeIcon(result.type)} me-2`}></i>
                                    {getTypeLabel(result.type)}
                                    <span className={`badge ${getTypeBadgeColor(result.type)} text-white ms-2`}>{result.count}</span>
                                </h3>
                            </div>
                            <div className="list-group list-group-flush">
                                {result.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="list-group-item">
                                        {renderResultItem(result.type, item)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 검색 결과 없음 */}
            {query && !isSearching && results.length === 0 && totalCount === 0 && (
                <div className="card">
                    <div className="card-body text-center text-muted py-5">
                        <i className="ti ti-search-off mb-3" style={{ fontSize: '3rem' }}></i>
                        <div>{t('noResults')}</div>
                    </div>
                </div>
            )}

            {/* 검색 전 안내 */}
            {!query && !results.length && (
                <div className="card">
                    <div className="card-body">
                        <h4 className="mb-3">{t('searchGuideTitle')}</h4>
                        <div className="row">
                            <div className="col-md-6">
                                <h5 className="text-muted mb-2">{t('searchExamples')}</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <i className="ti ti-device-desktop me-2 text-blue"></i>
                                        <strong>{t('exampleKiosk')}</strong>
                                        <div className="small text-muted">{t('exampleKioskDesc')}</div>
                                    </li>
                                    <li className="mb-2">
                                        <i className="ti ti-building me-2 text-green"></i>
                                        <strong>{t('examplePartner')}</strong>
                                        <div className="small text-muted">{t('examplePartnerDesc')}</div>
                                    </li>
                                    <li className="mb-2">
                                        <i className="ti ti-map-pin me-2 text-cyan"></i>
                                        <strong>{t('exampleAddress')}</strong>
                                        <div className="small text-muted">{t('exampleAddressDesc')}</div>
                                    </li>
                                </ul>
                            </div>
                            <div className="col-md-6">
                                <h5 className="text-muted mb-2">{t('searchTips')}</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-2">
                                        <i className="ti ti-check me-2 text-success"></i>
                                        {t('tip1')}
                                    </li>
                                    <li className="mb-2">
                                        <i className="ti ti-check me-2 text-success"></i>
                                        {t('tip2')}
                                    </li>
                                    <li className="mb-2">
                                        <i className="ti ti-check me-2 text-success"></i>
                                        {t('tip3')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
