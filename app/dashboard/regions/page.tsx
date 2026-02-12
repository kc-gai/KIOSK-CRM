'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, Building2 } from 'lucide-react'

type Area = {
    id: string
    code: string
    name: string
    nameJa: string | null
    addressKeywords: string | null
    isActive: boolean
    sortOrder: number
}

type Region = {
    id: string
    code: string
    name: string
    nameJa: string | null
    prefectures: string
    isActive: boolean
    sortOrder: number
    areas: Area[]
}

// 지역명 한국어 번역 매핑
const regionNameKo: Record<string, string> = {
    '北海道 (Hokkaido)': '홋카이도',
    '東北 (Tohoku)': '도호쿠',
    '関東 (Kanto)': '관동',
    '中部 (Chubu)': '중부',
    '北陸信越 (Hokuriku-Shinetsu)': '호쿠리쿠신에츠',
    '近畿 (Kinki)': '긴키',
    '中国 (Chugoku)': '주고쿠',
    '四国 (Shikoku)': '시코쿠',
    '九州 (Kyushu)': '규슈',
    '沖縄 (Okinawa)': '오키나와',
}

// 사무실명 한국어 번역 매핑
const areaNameKo: Record<string, string> = {
    'Sapporo Office': '삿포로 사무소',
    'Tokyo Office': '도쿄 사무소',
    'Osaka Office': '오사카 사무소',
    'Fukuoka Office': '후쿠오카 사무소',
    'Okinawa Office': '오키나와 사무소',
}

// 지역별 색상
const regionColors: Record<string, string> = {
    'A_HK': '#3b82f6', // 홋카이도 - 파랑
    'B_TH': '#22c55e', // 도호쿠 - 초록
    'B_KT': '#f59e0b', // 관동 - 주황
    'B_CB': '#8b5cf6', // 중부 - 보라
    'C_HR': '#06b6d4', // 호쿠리쿠신에츠 - 청록
    'C_KK': '#ec4899', // 긴키 - 분홍
    'C_CG': '#14b8a6', // 주고쿠 - 민트
    'C_SK': '#f97316', // 시코쿠 - 오렌지
    'D_KS': '#ef4444', // 규슈 - 빨강
    'E_OK': '#84cc16', // 오키나와 - 라임
}

// 사무소 위치 (지도상 좌표)
const officePositions: Record<string, { x: number; y: number; name: string }> = {
    'A': { x: 280, y: 85, name: 'Sapporo' },
    'B': { x: 305, y: 185, name: 'Tokyo' },
    'C': { x: 180, y: 260, name: 'Osaka' },
    'D': { x: 85, y: 340, name: 'Fukuoka' },
    'E': { x: 45, y: 430, name: 'Okinawa' },
}

// 도도부현 경로 데이터 (간략화된 SVG paths)
const prefecturePaths: Record<string, { d: string; regionCode: string }> = {
    // 홋카이도
    '北海道': { d: 'M240,30 L320,30 L340,60 L330,100 L290,120 L250,100 L240,60 Z', regionCode: 'A_HK' },

    // 도호쿠
    '青森県': { d: 'M280,130 L310,130 L315,150 L280,155 Z', regionCode: 'B_TH' },
    '岩手県': { d: 'M285,155 L315,150 L320,180 L285,185 Z', regionCode: 'B_TH' },
    '宮城県': { d: 'M285,185 L320,180 L325,200 L290,205 Z', regionCode: 'B_TH' },
    '秋田県': { d: 'M265,155 L285,155 L285,185 L265,185 Z', regionCode: 'B_TH' },
    '山形県': { d: 'M265,185 L285,185 L290,205 L270,210 Z', regionCode: 'B_TH' },
    '福島県': { d: 'M270,210 L325,200 L330,230 L275,235 Z', regionCode: 'B_TH' },

    // 관동
    '茨城県': { d: 'M310,230 L330,230 L335,250 L315,255 Z', regionCode: 'B_KT' },
    '栃木県': { d: 'M295,220 L315,220 L320,240 L300,245 Z', regionCode: 'B_KT' },
    '群馬県': { d: 'M275,220 L295,220 L300,245 L280,250 Z', regionCode: 'B_KT' },
    '埼玉県': { d: 'M285,250 L310,250 L315,265 L290,270 Z', regionCode: 'B_KT' },
    '千葉県': { d: 'M315,255 L340,260 L345,290 L320,285 Z', regionCode: 'B_KT' },
    '東京都': { d: 'M290,270 L315,270 L320,285 L295,290 Z', regionCode: 'B_KT' },
    '神奈川県': { d: 'M290,290 L320,285 L325,305 L295,310 Z', regionCode: 'B_KT' },

    // 중부
    '新潟県': { d: 'M245,195 L275,190 L280,220 L250,225 Z', regionCode: 'C_HR' },
    '富山県': { d: 'M220,220 L245,215 L250,235 L225,240 Z', regionCode: 'C_HR' },
    '石川県': { d: 'M205,230 L225,225 L230,255 L210,260 Z', regionCode: 'C_HR' },
    '福井県': { d: 'M195,255 L220,250 L225,275 L200,280 Z', regionCode: 'C_HR' },
    '山梨県': { d: 'M270,270 L290,265 L295,285 L275,290 Z', regionCode: 'B_CB' },
    '長野県': { d: 'M250,240 L275,235 L280,275 L255,280 Z', regionCode: 'C_HR' },
    '岐阜県': { d: 'M220,260 L250,255 L255,290 L225,295 Z', regionCode: 'B_CB' },
    '静岡県': { d: 'M260,295 L295,290 L300,320 L265,325 Z', regionCode: 'B_CB' },
    '愛知県': { d: 'M230,295 L260,290 L265,320 L235,325 Z', regionCode: 'B_CB' },

    // 긴키
    '三重県': { d: 'M215,310 L235,305 L240,340 L220,345 Z', regionCode: 'C_KK' },
    '滋賀県': { d: 'M200,280 L220,275 L225,300 L205,305 Z', regionCode: 'C_KK' },
    '京都府': { d: 'M180,270 L205,265 L210,295 L185,300 Z', regionCode: 'C_KK' },
    '大阪府': { d: 'M185,305 L210,300 L215,325 L190,330 Z', regionCode: 'C_KK' },
    '兵庫県': { d: 'M160,285 L185,280 L190,320 L165,325 Z', regionCode: 'C_KK' },
    '奈良県': { d: 'M195,320 L215,315 L220,345 L200,350 Z', regionCode: 'C_KK' },
    '和歌山県': { d: 'M180,340 L205,335 L210,370 L185,375 Z', regionCode: 'C_KK' },

    // 주고쿠
    '鳥取県': { d: 'M145,275 L170,270 L175,290 L150,295 Z', regionCode: 'C_CG' },
    '島根県': { d: 'M115,280 L145,275 L150,300 L120,305 Z', regionCode: 'C_CG' },
    '岡山県': { d: 'M140,300 L165,295 L170,325 L145,330 Z', regionCode: 'C_CG' },
    '広島県': { d: 'M110,305 L140,300 L145,335 L115,340 Z', regionCode: 'C_CG' },
    '山口県': { d: 'M80,315 L110,310 L115,345 L85,350 Z', regionCode: 'C_CG' },

    // 시코쿠
    '徳島県': { d: 'M175,345 L195,340 L200,365 L180,370 Z', regionCode: 'C_SK' },
    '香川県': { d: 'M160,335 L180,330 L185,350 L165,355 Z', regionCode: 'C_SK' },
    '愛媛県': { d: 'M130,345 L160,340 L165,375 L135,380 Z', regionCode: 'C_SK' },
    '高知県': { d: 'M140,375 L175,370 L180,405 L145,410 Z', regionCode: 'C_SK' },

    // 규슈
    '福岡県': { d: 'M70,350 L95,345 L100,370 L75,375 Z', regionCode: 'D_KS' },
    '佐賀県': { d: 'M55,360 L75,355 L80,380 L60,385 Z', regionCode: 'D_KS' },
    '長崎県': { d: 'M35,365 L60,360 L65,395 L40,400 Z', regionCode: 'D_KS' },
    '熊本県': { d: 'M65,385 L90,380 L95,415 L70,420 Z', regionCode: 'D_KS' },
    '大分県': { d: 'M95,360 L115,355 L120,390 L100,395 Z', regionCode: 'D_KS' },
    '宮崎県': { d: 'M100,400 L120,395 L125,435 L105,440 Z', regionCode: 'D_KS' },
    '鹿児島県': { d: 'M65,425 L95,420 L100,460 L70,465 Z', regionCode: 'D_KS' },

    // 오키나와
    '沖縄県': { d: 'M25,480 L55,475 L60,510 L30,515 Z', regionCode: 'E_OK' },
}

export default function RegionsPage() {
    const t = useTranslations('regions')
    const ta = useTranslations('areas')
    const tc = useTranslations('common')

    const [regions, setRegions] = useState<Region[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showRegionForm, setShowRegionForm] = useState(false)
    const [showAreaForm, setShowAreaForm] = useState(false)
    const [editingRegion, setEditingRegion] = useState<Region | null>(null)
    const [editingArea, setEditingArea] = useState<Area | null>(null)
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
    const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null)

    // 현재 언어 감지 (next-intl locale)
    const [locale, setLocale] = useState('ja')

    useEffect(() => {
        // 로컬스토리지에서 언어 설정 가져오기
        const savedLocale = localStorage.getItem('locale') || 'ja'
        setLocale(savedLocale)
    }, [])

    // Region Form State
    const [regionForm, setRegionForm] = useState({
        code: '',
        name: '',
        prefectures: '',
        isActive: true,
        sortOrder: 0
    })

    // Area Form State
    const [areaForm, setAreaForm] = useState({
        code: '',
        name: '',
        regionId: '',
        addressKeywords: '',
        isActive: true,
        sortOrder: 0
    })

    const fetchData = async () => {
        try {
            const res = await fetch('/api/regions')
            if (res.ok) setRegions(await res.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // 지역명 표시 (언어에 따라)
    const getRegionDisplayName = (name: string) => {
        if (locale === 'ko' && regionNameKo[name]) {
            return `${regionNameKo[name]} (${name})`
        }
        return name
    }

    // 사무실명 표시 (언어에 따라)
    const getAreaDisplayName = (name: string) => {
        if (locale === 'ko' && areaNameKo[name]) {
            return `${areaNameKo[name]} (${name})`
        }
        return name
    }

    const resetRegionForm = () => {
        setRegionForm({ code: '', name: '', prefectures: '', isActive: true, sortOrder: 0 })
    }

    const resetAreaForm = () => {
        setAreaForm({ code: '', name: '', regionId: '', addressKeywords: '', isActive: true, sortOrder: 0 })
    }

    const handleCreateRegion = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/regions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regionForm)
            })
            if (res.ok) {
                resetRegionForm()
                setShowRegionForm(false)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdateRegion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingRegion) return
        try {
            const res = await fetch(`/api/regions/${editingRegion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regionForm)
            })
            if (res.ok) {
                resetRegionForm()
                setEditingRegion(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteRegion = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/regions/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const handleEditRegion = (region: Region) => {
        setEditingRegion(region)
        setRegionForm({
            code: region.code,
            name: region.name,
            prefectures: region.prefectures,
            isActive: region.isActive,
            sortOrder: region.sortOrder
        })
        setShowRegionForm(false)
    }

    const handleCreateArea = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(areaForm)
            })
            if (res.ok) {
                resetAreaForm()
                setShowAreaForm(false)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdateArea = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingArea) return
        try {
            const res = await fetch(`/api/areas/${editingArea.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(areaForm)
            })
            if (res.ok) {
                resetAreaForm()
                setEditingArea(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteArea = async (id: string) => {
        if (!confirm(ta('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const handleEditArea = (area: Area, regionId: string) => {
        setEditingArea(area)
        setAreaForm({
            code: area.code,
            name: area.name,
            regionId: regionId,
            addressKeywords: area.addressKeywords || '',
            isActive: area.isActive,
            sortOrder: area.sortOrder
        })
        setShowAreaForm(false)
    }

    const handleAddArea = (regionId: string) => {
        resetAreaForm()
        setAreaForm(prev => ({ ...prev, regionId }))
        setShowAreaForm(true)
        setEditingArea(null)
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

    // 지역 코드로 활성 지역 찾기
    const getActiveRegionCodes = () => regions.filter(r => r.isActive).map(r => r.code)

    // 사무소 코드로 활성 사무소 찾기
    const getActiveAreaCodes = () => regions.flatMap(r => r.areas.filter(a => a.isActive).map(a => a.code))

    // 일본 지도 컴포넌트
    const JapanMap = () => {
        const activeRegionCodes = getActiveRegionCodes()
        const activeAreaCodes = getActiveAreaCodes()

        return (
            <div className="card h-100">
                <div className="card-header">
                    <h3 className="card-title d-flex align-items-center gap-2">
                        <MapPin size={18} />
                        일본 관할지역 지도
                    </h3>
                </div>
                <div className="card-body p-2">
                    <svg viewBox="0 0 380 540" className="w-100" style={{ maxHeight: '500px' }}>
                        {/* 배경 */}
                        <rect x="0" y="0" width="380" height="540" fill="#f8fafc" />

                        {/* 도도부현 */}
                        {Object.entries(prefecturePaths).map(([name, { d, regionCode }]) => {
                            const isActive = activeRegionCodes.includes(regionCode)
                            const isHovered = hoveredRegion === regionCode
                            const isSelected = selectedRegionCode === regionCode
                            const color = regionColors[regionCode] || '#94a3b8'

                            return (
                                <path
                                    key={name}
                                    d={d}
                                    fill={isActive ? (isHovered || isSelected ? color : `${color}99`) : '#e2e8f0'}
                                    stroke={isSelected ? '#1e293b' : '#94a3b8'}
                                    strokeWidth={isSelected ? 2 : 0.5}
                                    style={{
                                        cursor: isActive ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={() => isActive && setHoveredRegion(regionCode)}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => isActive && setSelectedRegionCode(selectedRegionCode === regionCode ? null : regionCode)}
                                >
                                    <title>{name} ({regionCode})</title>
                                </path>
                            )
                        })}

                        {/* 사무소 마커 */}
                        {Object.entries(officePositions).map(([code, pos]) => {
                            const isActive = activeAreaCodes.includes(code)
                            const area = regions.flatMap(r => r.areas).find(a => a.code === code)

                            if (!isActive) return null

                            return (
                                <g key={code}>
                                    {/* 마커 배경 */}
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={12}
                                        fill="#fff"
                                        stroke="#1e40af"
                                        strokeWidth={2}
                                    />
                                    {/* 건물 아이콘 대신 텍스트 */}
                                    <text
                                        x={pos.x}
                                        y={pos.y + 4}
                                        textAnchor="middle"
                                        fontSize={10}
                                        fontWeight="bold"
                                        fill="#1e40af"
                                    >
                                        {code}
                                    </text>
                                    {/* 라벨 */}
                                    <rect
                                        x={pos.x + 15}
                                        y={pos.y - 8}
                                        width={65}
                                        height={16}
                                        rx={3}
                                        fill="#1e40af"
                                    />
                                    <text
                                        x={pos.x + 20}
                                        y={pos.y + 4}
                                        fontSize={9}
                                        fill="#fff"
                                    >
                                        {area?.name || pos.name}
                                    </text>
                                </g>
                            )
                        })}
                    </svg>

                    {/* 범례 */}
                    <div className="mt-3 pt-3 border-top">
                        <div className="d-flex flex-wrap gap-2">
                            {regions.filter(r => r.isActive).map(region => (
                                <div
                                    key={region.code}
                                    className={`d-flex align-items-center gap-1 px-2 py-1 rounded cursor-pointer ${selectedRegionCode === region.code ? 'bg-primary-lt' : ''}`}
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => setSelectedRegionCode(selectedRegionCode === region.code ? null : region.code)}
                                    onMouseEnter={() => setHoveredRegion(region.code)}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                >
                                    <span
                                        className="rounded-circle"
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: regionColors[region.code] || '#94a3b8'
                                        }}
                                    />
                                    <span>{region.name.split(' ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="page-title mb-0">{t('title')}</h2>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setShowRegionForm(!showRegionForm); setEditingRegion(null); resetRegionForm() }}
                >
                    {showRegionForm ? tc('cancel') : <><i className="ti ti-plus me-1"></i>{t('newRegion')}</>}
                </button>
            </div>

            {/* 지도 + 테이블 레이아웃 */}
            <div className="row g-3 mb-3">
                {/* 좌측: 일본 지도 */}
                <div className="col-lg-4">
                    <JapanMap />
                </div>

                {/* 우측: 관할지역 및 사무실 테이블 */}
                <div className="col-lg-8">

            {/* Region Create Form */}
            {showRegionForm && (
                <div className="card mb-3">
                    <div className="card-header">
                        <h3 className="card-title">{t('newRegion')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreateRegion}>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label">{t('code')} *</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={regionForm.code}
                                        onChange={e => setRegionForm({ ...regionForm, code: e.target.value })}
                                        placeholder="B_KT"
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('name')} *</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={regionForm.name}
                                        onChange={e => setRegionForm({ ...regionForm, name: e.target.value })}
                                        placeholder="関東 (Kanto)"
                                        required
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">{t('sortOrder')}</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        value={regionForm.sortOrder}
                                        onChange={e => setRegionForm({ ...regionForm, sortOrder: parseInt(e.target.value) || 0 })}
                                        style={{ minWidth: '80px' }}
                                        min="0"
                                    />
                                </div>
                                <div className="col-md-9">
                                    <label className="form-label">{t('prefectures')} *</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={regionForm.prefectures}
                                        onChange={e => setRegionForm({ ...regionForm, prefectures: e.target.value })}
                                        placeholder={t('prefecturesPlaceholder')}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-check mt-4">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={regionForm.isActive}
                                            onChange={e => setRegionForm({ ...regionForm, isActive: e.target.checked })}
                                        />
                                        <span className="form-check-label">{t('isActive')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm">
                                    <i className="ti ti-check me-1"></i>{tc('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Region Edit Form */}
            {editingRegion && (
                <div className="card mb-3 border-primary">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">{tc('edit')}: {editingRegion.name}</h3>
                        <button className="btn btn-ghost-secondary btn-icon btn-sm" onClick={() => { setEditingRegion(null); resetRegionForm() }}>
                            <i className="ti ti-x"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleUpdateRegion}>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label">{t('code')} *</label>
                                    <input className="form-control form-control-sm" value={regionForm.code} onChange={e => setRegionForm({ ...regionForm, code: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('name')} *</label>
                                    <input className="form-control form-control-sm" value={regionForm.name} onChange={e => setRegionForm({ ...regionForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">{t('sortOrder')}</label>
                                    <input type="number" className="form-control form-control-sm" value={regionForm.sortOrder} onChange={e => setRegionForm({ ...regionForm, sortOrder: parseInt(e.target.value) || 0 })} style={{ minWidth: '80px' }} min="0" />
                                </div>
                                <div className="col-md-9">
                                    <label className="form-label">{t('prefectures')} *</label>
                                    <input className="form-control form-control-sm" value={regionForm.prefectures} onChange={e => setRegionForm({ ...regionForm, prefectures: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-check mt-4">
                                        <input type="checkbox" className="form-check-input" checked={regionForm.isActive} onChange={e => setRegionForm({ ...regionForm, isActive: e.target.checked })} />
                                        <span className="form-check-label">{t('isActive')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2"><i className="ti ti-check me-1"></i>{tc('save')}</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setEditingRegion(null); resetRegionForm() }}>{tc('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Area Create/Edit Form */}
            {(showAreaForm || editingArea) && (
                <div className="card mb-3 border-info">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">{editingArea ? `${tc('edit')}: ${editingArea.name}` : ta('newArea')}</h3>
                        <button className="btn btn-ghost-secondary btn-icon btn-sm" onClick={() => { setShowAreaForm(false); setEditingArea(null); resetAreaForm() }}>
                            <i className="ti ti-x"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={editingArea ? handleUpdateArea : handleCreateArea}>
                            <div className="row g-3">
                                <div className="col-md-2">
                                    <label className="form-label">{ta('code')} *</label>
                                    <input className="form-control form-control-sm" value={areaForm.code} onChange={e => setAreaForm({ ...areaForm, code: e.target.value })} placeholder="A" required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{ta('name')} *</label>
                                    <input className="form-control form-control-sm" value={areaForm.name} onChange={e => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="Tokyo Office" required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">{ta('region')} *</label>
                                    <select className="form-select form-select-sm" value={areaForm.regionId} onChange={e => setAreaForm({ ...areaForm, regionId: e.target.value })} required>
                                        <option value="">{ta('selectRegion')}</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">{ta('sortOrder')}</label>
                                    <input type="number" className="form-control form-control-sm" value={areaForm.sortOrder} onChange={e => setAreaForm({ ...areaForm, sortOrder: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="col-md-10">
                                    <label className="form-label">{ta('addressKeywords')}</label>
                                    <input className="form-control form-control-sm" value={areaForm.addressKeywords} onChange={e => setAreaForm({ ...areaForm, addressKeywords: e.target.value })} placeholder={ta('addressKeywordsPlaceholder')} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-check mt-4">
                                        <input type="checkbox" className="form-check-input" checked={areaForm.isActive} onChange={e => setAreaForm({ ...areaForm, isActive: e.target.checked })} />
                                        <span className="form-check-label">{ta('isActive')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2"><i className="ti ti-check me-1"></i>{tc('save')}</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setShowAreaForm(false); setEditingArea(null); resetAreaForm() }}>{tc('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Regions Table */}
            {regions.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center text-muted py-4">{t('noRegions')}</div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('title')}</h3>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-vcenter card-table table-sm">
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}>{t('code')}</th>
                                    <th>{t('name')}</th>
                                    <th>{t('prefectures')}</th>
                                    <th style={{ width: '80px' }}>{t('isActive')}</th>
                                    <th className="w-1"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {regions.map(region => (
                                    <tr key={region.id}>
                                        <td><code className="text-primary">{region.code}</code></td>
                                        <td className="fw-medium">{getRegionDisplayName(region.name)}</td>
                                        <td className="text-muted" style={{ maxWidth: '300px' }}>
                                            <span className="text-truncate d-inline-block" style={{ maxWidth: '300px' }}>{region.prefectures}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${region.isActive ? 'bg-green text-white' : 'bg-secondary text-white'}`}>
                                                {region.isActive ? 'ON' : 'OFF'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="btn-list flex-nowrap">
                                                <button className="btn btn-sm btn-icon btn-ghost-primary" onClick={() => handleEditRegion(region)} title={tc('edit')}>
                                                    <i className="ti ti-edit"></i>
                                                </button>
                                                <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => handleDeleteRegion(region.id)} title={tc('delete')}>
                                                    <i className="ti ti-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Areas Section */}
            <div className="card mt-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h3 className="card-title">{ta('title')}</h3>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => { setShowAreaForm(true); setEditingArea(null); resetAreaForm() }}>
                        <i className="ti ti-plus me-1"></i>{ta('newArea')}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-sm">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>{ta('code')}</th>
                                <th>{ta('name')}</th>
                                <th>{ta('region')}</th>
                                <th>{ta('addressKeywords')}</th>
                                <th style={{ width: '80px' }}>{ta('isActive')}</th>
                                <th className="w-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {regions.flatMap(r => r.areas.map(area => (
                                <tr key={area.id}>
                                    <td><code className="text-info">{area.code}</code></td>
                                    <td className="fw-medium">{getAreaDisplayName(area.name)}</td>
                                    <td><span className="badge bg-secondary text-white">{r.code}</span> {r.name}</td>
                                    <td className="text-muted" style={{ maxWidth: '250px' }}>
                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '250px' }}>{area.addressKeywords || '-'}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${area.isActive ? 'bg-green text-white' : 'bg-secondary text-white'}`}>
                                            {area.isActive ? 'ON' : 'OFF'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="btn-list flex-nowrap">
                                            <button className="btn btn-sm btn-icon btn-ghost-primary" onClick={() => handleEditArea(area, r.id)} title={tc('edit')}>
                                                <i className="ti ti-edit"></i>
                                            </button>
                                            <button className="btn btn-sm btn-icon btn-ghost-danger" onClick={() => handleDeleteArea(area.id)} title={tc('delete')}>
                                                <i className="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                            {regions.every(r => r.areas.length === 0) && (
                                <tr><td colSpan={6} className="text-center text-muted py-4">{ta('noAreas')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

                </div>{/* col-lg-8 끝 */}
            </div>{/* row 끝 */}
        </div>
    )
}
