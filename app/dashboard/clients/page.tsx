'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Plus, ChevronRight, ChevronDown, ChevronLeft, Building2, Store, MapPin, Edit, Trash2, Search,
    Upload, Download, FileSpreadsheet, Check, AlertCircle, X, Code2, RefreshCw,
    Star, MoreVertical, Settings, History, Users
} from 'lucide-react'

// 키오스크 아이콘 컴포넌트
const KioskIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* 키오스크 본체 (세로로 긴 직사각형) */}
        <rect x="6" y="2" width="12" height="16" rx="1" />
        {/* 화면 */}
        <rect x="8" y="4" width="8" height="8" rx="0.5" />
        {/* 버튼/키패드 영역 */}
        <line x1="9" y1="14" x2="15" y2="14" />
        <line x1="9" y1="16" x2="15" y2="16" />
        {/* 스탠드 */}
        <path d="M9 18 L9 22 L15 22 L15 18" />
        <line x1="6" y1="22" x2="18" y2="22" />
    </svg>
)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Branch = {
    id: string
    code: string
    name: string
    nameJa?: string
    address?: string
    postalCode?: string
    managerName?: string
    managerPhone?: string
    contact?: string
    regionCode?: string
    areaCode?: string
    isActive: boolean
    createdAt?: string
    updatedAt?: string
    corporationId?: string
    _count?: { kiosks: number }
    _acquisitionCount?: { free: number; leaseFree: number; paid: number; rental: number }
}

type Corporation = {
    id: string
    code: string
    name: string
    nameJa?: string
    contact?: string
    address?: string
    isActive: boolean
    fcId?: string | null
    contractDate?: string
    erpFeeRate?: number
    kioskMaintenanceCost?: number
    kioskSaleCost?: number
    createdAt?: string
    updatedAt?: string
    branches: Branch[]
    _count?: { branches: number }
}

type FC = {
    id: string
    code: string
    name: string
    nameJa?: string
    fcType: string
    contact?: string
    address?: string
    contractDate?: string
    commissionRate?: number
    memo?: string
    isActive: boolean
    createdAt?: string
    updatedAt?: string
    corporations: Corporation[]
}

// 히스토리 항목 타입
type HistoryItem = {
    id: string
    date: Date
    action: 'created' | 'updated'
    type: 'fc' | 'corp' | 'branch'
    target: string
    detail: string
}

type Partner = {
    id: string
    name: string
    nameJa?: string
    type: string
    contact?: string
    address?: string
    storeCount?: number
    _count?: { currentKiosks: number }
}

type CodeItem = {
    code: string
    type: string
    name: string
    nameJa: string | null
    parentCode: string | null
    parentName: string | null
    isActive: boolean
}

type Region = {
    id: string
    code: string
    name: string
    nameJa: string | null
    prefectures: string
}

type Area = {
    id: string
    code: string
    name: string
    nameJa: string | null
    regionId: string
    addressKeywords: string | null
    region?: {
        id: string
        code: string
        name: string
    }
}

// 다양한 날짜 형식을 YYYY-MM-DD로 변환하는 함수
const parseDateInput = (input: string): string => {
    if (!input) return ''

    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input

    // 공백, 슬래시, 점, 하이픈 등으로 분리
    const cleaned = input.trim()

    // 다양한 구분자 처리: 2025/05/07, 2025.05.07, 2025-05-07, 2025 05 07
    const datePatterns = [
        /^(\d{4})[\/\.\-\s](\d{1,2})[\/\.\-\s](\d{1,2})$/, // YYYY/MM/DD, YYYY.MM.DD, YYYY-MM-DD
        /^(\d{1,2})[\/\.\-\s](\d{1,2})[\/\.\-\s](\d{4})$/, // MM/DD/YYYY, DD/MM/YYYY
        /^(\d{4})(\d{2})(\d{2})$/, // YYYYMMDD
    ]

    // YYYY/MM/DD 또는 YYYY.MM.DD 또는 YYYY-MM-DD
    let match = cleaned.match(datePatterns[0])
    if (match) {
        const year = match[1]
        const month = match[2].padStart(2, '0')
        const day = match[3].padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // YYYYMMDD
    match = cleaned.match(datePatterns[2])
    if (match) {
        const year = match[1]
        const month = match[2]
        const day = match[3]
        return `${year}-${month}-${day}`
    }

    return input
}

export default function ClientsPage() {
    const t = useTranslations('fc')
    const tp = useTranslations('partners')
    const tc = useTranslations('common')
    const tcl = useTranslations('clients')
    const locale = useLocale()
    const isJa = locale === 'ja'
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const router = useRouter()

    // 슈퍼관리자 여부 확인 (role이 SUPER_ADMIN이거나 email이 admin 이메일인 경우)
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.email === 'admin@example.com'

    // 로케일에 따라 이름 표시 (한국어면 name, 일본어면 nameJa 우선)
    const getDisplayName = (item: { name: string; nameJa?: string }) => {
        if (isJa) {
            return item.nameJa || item.name
        }
        return item.name || item.nameJa || ''
    }

    const [fcs, setFcs] = useState<FC[]>([])
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCorps, setExpandedCorps] = useState<Set<string>>(new Set())
    const [selectedFcFilter, setSelectedFcFilter] = useState<string | 'all'>('all')
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'fc' | 'corp' | 'branch' | 'partner'>('fc')
    const [saving, setSaving] = useState(false)
    const [selectedFcId, setSelectedFcId] = useState<string | null>(null)
    const [selectedCorpId, setSelectedCorpId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

    // 선택된 FC (우측 패널용)
    const [selectedFc, setSelectedFc] = useState<FC | null>(null)
    // 선택된 독립법인 (우측 패널용)
    const [selectedIndependentCorp, setSelectedIndependentCorp] = useState<Corporation | null>(null)
    // 우측 패널 탭
    const [detailTab, setDetailTab] = useState<'corp' | 'branch' | 'settings' | 'history'>('corp')
    // 즐겨찾기 FC (localStorage에서 초기값 로드)
    const [pinnedFcs, setPinnedFcs] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pinnedFcs')
            if (saved) {
                try {
                    return new Set(JSON.parse(saved))
                } catch {
                    return new Set()
                }
            }
        }
        return new Set()
    })
    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 9

    // CSV 업로드 관련
    const [showCsvModal, setShowCsvModal] = useState(false)
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [autoTranslate, setAutoTranslate] = useState(true)
    const [csvUploading, setCsvUploading] = useState(false)
    const [csvResult, setCsvResult] = useState<{
        message: string
        results?: {
            success: number
            failed: number
            errors: string[]
            created: { fc: number; corporation: number; branch: number; partner: number }
        }
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 코드 관리 관련
    const [codes, setCodes] = useState<CodeItem[]>([])
    const [codesLoading, setCodesLoading] = useState(false)
    const [codeSearch, setCodeSearch] = useState('')
    const [codeTypeFilter, setCodeTypeFilter] = useState<'all' | 'fc' | 'corp' | 'branch'>('all')

    // 지역/관할지역 관련
    const [regions, setRegions] = useState<Region[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [mappingRegion, setMappingRegion] = useState(false)

    // FC 설정 저장 관련
    const [fcSettings, setFcSettings] = useState<{
        contractDate: string
        commissionRate: string
        erpFeeRate: string
        kioskMaintenanceCost: string
        kioskSaleCost: string
        memo: string
    }>({ contractDate: '', commissionRate: '', erpFeeRate: '', kioskMaintenanceCost: '', kioskSaleCost: '', memo: '' })
    const [savingSettings, setSavingSettings] = useState(false)

    // 지점 탭 법인 필터
    const [branchCorpFilter, setBranchCorpFilter] = useState<string>('all')

    // 지점 코드 인라인 편집 (슈퍼관리자 전용)
    const [editingCodeBranchId, setEditingCodeBranchId] = useState<string | null>(null)
    const [editingCodeValue, setEditingCodeValue] = useState<string>('')
    const [savingCode, setSavingCode] = useState(false)

    // FC 코드 인라인 편집
    const [editingFcCodeId, setEditingFcCodeId] = useState<string | null>(null)
    const [editingFcCodeValue, setEditingFcCodeValue] = useState<string>('')
    const [savingFcCode, setSavingFcCode] = useState(false)

    // FC 메뉴 드롭다운
    const [showFcMenu, setShowFcMenu] = useState(false)

    // 새로 생성된 FC ID (자동 선택용)
    const [newlyCreatedFcId, setNewlyCreatedFcId] = useState<string | null>(null)

    // 독립법인 코드 인라인 편집
    const [editingCorpCodeId, setEditingCorpCodeId] = useState<string | null>(null)
    const [editingCorpCodeValue, setEditingCorpCodeValue] = useState<string>('')
    const [savingCorpCode, setSavingCorpCode] = useState(false)

    // 인라인 편집 관련
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null)
    const [editingBranchData, setEditingBranchData] = useState<{
        code: string
        name: string
        nameJa: string
        postalCode: string
        address: string
        managerPhone: string
    }>({ code: '', name: '', nameJa: '', postalCode: '', address: '', managerPhone: '' })
    const [savingBranch, setSavingBranch] = useState(false)

    // 우편번호 검색 관련
    type PostalResult = {
        id: number
        postalCode: string
        prefecture: string
        city: string
        town: string
        fullAddress: string
    }
    const [showPostalModal, setShowPostalModal] = useState(false)
    const [postalSearching, setPostalSearching] = useState(false)
    const [postalResults, setPostalResults] = useState<PostalResult[]>([])
    const [selectedPostalId, setSelectedPostalId] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        nameJa: '',
        corpName: '',      // FC 등록 시 자동 생성될 법인명 (한국어)
        corpNameJa: '',    // FC 등록 시 자동 생성될 법인명 (일본어)
        type: 'CLIENT',
        contact: '',
        postalCode: '',
        prefecture: '',
        city: '',
        town: '',
        address: '',
        managerName: '',
        managerPhone: '',
        commissionRate: '',
        contractDate: '',
        erpFeeRate: '',
        erpFeeNotes: '',
        kioskMaintenanceCost: '',
        kioskSaleCost: '',
        kioskSaleNotes: '',
        fcId: '',
        regionCode: '',
        areaCode: ''
    })

    // 독립 법인 목록
    const [independentCorps, setIndependentCorps] = useState<Corporation[]>([])
    // 법인 목록 전체 보기 여부
    const [showAllCorps, setShowAllCorps] = useState(false)
    // 지점 등록 시 기존 지점 코드 목록
    const [existingBranchCodes, setExistingBranchCodes] = useState<string[]>([])
    // 법인 등록 시 기존 법인 코드 목록
    const [existingCorpCodes, setExistingCorpCodes] = useState<string[]>([])

    // 다음 코드 계산 헬퍼 함수
    const getNextCode = (existingCodes: string[]): string => {
        if (existingCodes.length === 0) return '001'
        const numericCodes = existingCodes
            .map(code => {
                const match = code.match(/(\d+)$/)
                return match ? parseInt(match[1], 10) : 0
            })
            .filter(n => n > 0)
        const nextNumber = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 1
        return String(nextNumber).padStart(3, '0')
    }

    const fetchData = async () => {
        try {
            const fcRes = await fetch('/api/fc')
            if (fcRes.ok) {
                const fcData = await fcRes.json()
                setFcs(fcData)
                // 현재 선택된 FC가 있으면 새 데이터에서 동일 ID로 갱신
                if (selectedFc) {
                    const updatedFc = fcData.find((fc: FC) => fc.id === selectedFc.id)
                    if (updatedFc) {
                        setSelectedFc(updatedFc)
                    }
                } else if (isInitialLoad && fcData.length > 0 && !selectedIndependentCorp) {
                    // 초기 로드 시에만 첫 번째 FC 자동 선택 (독립법인이 선택되지 않은 경우)
                    setSelectedFc(fcData[0])
                }
            }

            const corpRes = await fetch('/api/corporations?independent=true')
            if (corpRes.ok) {
                const corpData = await corpRes.json()
                setIndependentCorps(corpData)
                // 현재 선택된 독립법인이 있으면 새 데이터에서 동일 ID로 갱신
                if (selectedIndependentCorp) {
                    const updatedCorp = corpData.find((c: Corporation) => c.id === selectedIndependentCorp.id)
                    if (updatedCorp) {
                        setSelectedIndependentCorp(updatedCorp)
                    }
                }
            }

            const partnerRes = await fetch('/api/partners?type=CLIENT')
            if (partnerRes.ok) {
                const partnerData = await partnerRes.json()
                setPartners(partnerData)
            }

            // 지역/관할지역 데이터 가져오기
            const [regionsRes, areasRes] = await Promise.all([
                fetch('/api/regions'),
                fetch('/api/areas')
            ])
            if (regionsRes.ok) setRegions(await regionsRes.json())
            if (areasRes.ok) setAreas(await areasRes.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            if (isInitialLoad) {
                setIsInitialLoad(false)
            }
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // URL 파라미터 처리 (자산관리에서 신규 점포 추가로 이동 시)
    useEffect(() => {
        if (loading || fcs.length === 0) return

        const fcIdParam = searchParams.get('fcId')
        const corpIdParam = searchParams.get('corpId')
        const tabParam = searchParams.get('tab')
        const actionParam = searchParams.get('action')
        const independentParam = searchParams.get('independent')

        if (fcIdParam && tabParam === 'branch') {
            // FC 소속 법인인 경우
            const targetFc = fcs.find(fc => fc.id === fcIdParam)
            if (targetFc) {
                setSelectedFc(targetFc)
                setDetailTab('branch')

                // 신규 지점 추가 액션인 경우 모달 열기
                if (actionParam === 'addBranch' && corpIdParam) {
                    setTimeout(() => {
                        openModal('branch', fcIdParam, corpIdParam)
                    }, 300)
                }
            }
            // URL 파라미터 정리 (한 번만 처리)
            router.replace('/dashboard/clients', { scroll: false })
        } else if (independentParam === 'true' && corpIdParam && tabParam === 'branch') {
            // 독립 법인인 경우 - 향후 독립 법인 선택 로직 추가 가능
            // 현재는 거래처 페이지로만 이동
            router.replace('/dashboard/clients', { scroll: false })
        }
    }, [loading, fcs, searchParams])

    // selectedFc 변경 시 설정 값 로드
    useEffect(() => {
        if (selectedFc) {
            // FC의 법인들에서 계약 정보 가져오기 (첫 번째로 값이 있는 법인 기준)
            let contractDate = selectedFc.contractDate?.split('T')[0] || ''
            let erpFeeRate = ''
            let kioskMaintenanceCost = ''
            let kioskSaleCost = ''

            for (const corp of selectedFc.corporations) {
                if (!contractDate && corp.contractDate) {
                    contractDate = corp.contractDate.split('T')[0]
                }
                if (!erpFeeRate && corp.erpFeeRate !== undefined && corp.erpFeeRate !== null) {
                    erpFeeRate = corp.erpFeeRate.toString()
                }
                if (!kioskMaintenanceCost && corp.kioskMaintenanceCost !== undefined && corp.kioskMaintenanceCost !== null) {
                    kioskMaintenanceCost = corp.kioskMaintenanceCost.toString()
                }
                if (!kioskSaleCost && corp.kioskSaleCost !== undefined && corp.kioskSaleCost !== null) {
                    kioskSaleCost = corp.kioskSaleCost.toString()
                }
            }

            setFcSettings({
                contractDate,
                commissionRate: selectedFc.commissionRate?.toString() || '',
                erpFeeRate,
                kioskMaintenanceCost,
                kioskSaleCost,
                memo: selectedFc.memo || ''
            })
        }
    }, [selectedFc])

    // FC 설정 저장
    const saveFcSettings = async () => {
        if (!selectedFc) return
        setSavingSettings(true)
        try {
            // FC 설정 저장
            const res = await fetch(`/api/fc/${selectedFc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contractDate: fcSettings.contractDate || null,
                    commissionRate: fcSettings.commissionRate ? parseFloat(fcSettings.commissionRate) : null,
                    memo: fcSettings.memo || null
                })
            })

            if (res.ok) {
                // FC에 속한 모든 Corporation에 계약정보 전파
                // selectedFc.corporations가 없으면 직접 API로 FC 데이터를 가져와서 처리
                let corporations = selectedFc.corporations || []
                if (corporations.length === 0) {
                    const fcRes = await fetch(`/api/fc/${selectedFc.id}`)
                    if (fcRes.ok) {
                        const fcData = await fcRes.json()
                        corporations = fcData.corporations || []
                    }
                }

                for (const corp of corporations) {
                    await fetch(`/api/corporations/${corp.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contractDate: fcSettings.contractDate || null,
                            erpFeeRate: fcSettings.erpFeeRate ? parseFloat(fcSettings.erpFeeRate) : null,
                            kioskMaintenanceCost: fcSettings.kioskMaintenanceCost ? parseFloat(fcSettings.kioskMaintenanceCost) : null,
                            kioskSaleCost: fcSettings.kioskSaleCost ? parseFloat(fcSettings.kioskSaleCost) : null
                        })
                    })
                }
                alert(tc('settingsSaved'))
                // 데이터 새로고침 후 selectedFc도 업데이트
                await fetchData()
                // selectedFc 갱신을 위해 FC 데이터 다시 로드
                const updatedFcRes = await fetch(`/api/fc/${selectedFc.id}`)
                if (updatedFcRes.ok) {
                    const updatedFc = await updatedFcRes.json()
                    setSelectedFc(updatedFc)
                }
            } else {
                const err = await res.json()
                alert(err.error || tc('savingError'))
            }
        } catch (e) {
            console.error(e)
            alert(tc('savingError'))
        } finally {
            setSavingSettings(false)
        }
    }

    const fetchCodes = async () => {
        setCodesLoading(true)
        try {
            const params = new URLSearchParams()
            if (codeSearch) params.set('search', codeSearch)
            if (codeTypeFilter !== 'all') params.set('type', codeTypeFilter)

            const res = await fetch(`/api/codes?${params.toString()}`)
            if (res.ok) {
                setCodes(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setCodesLoading(false)
        }
    }

    useEffect(() => {
        fetchCodes()
    }, [codeTypeFilter])

    const searchPostalCode = async () => {
        if (!formData.postalCode) return

        setPostalSearching(true)
        setPostalResults([])
        setSelectedPostalId(null)

        try {
            const res = await fetch(`/api/postal-code?code=${formData.postalCode}`)
            const data = await res.json()
            if (data.results && data.results.length > 0) {
                setPostalResults(data.results)
                setShowPostalModal(true)
            } else {
                alert(tcl('postalNotFound') || '검색 결과가 없습니다')
            }
        } catch (e) {
            console.error(e)
            alert(tcl('postalSearchError') || '검색 중 오류가 발생했습니다')
        } finally {
            setPostalSearching(false)
        }
    }

    // 주소 기반 지역/관할지역 자동 매핑 함수
    const mapAddressToRegion = (address: string): { regionCode: string, areaCode: string } => {
        let regionCode = ''
        let areaCode = ''

        if (!address) return { regionCode, areaCode }

        console.log('mapAddressToRegion called with:', address)
        console.log('Available areas:', areas.length, 'regions:', regions.length)

        // 먼저 Area의 addressKeywords로 매칭 시도
        for (const area of areas) {
            if (area.addressKeywords) {
                const keywords = area.addressKeywords.split(',').map(k => k.trim())
                for (const keyword of keywords) {
                    if (keyword && address.includes(keyword)) {
                        // area.region이 있으면 사용, 없으면 regions에서 찾기
                        const regionCodeFound = area.region?.code || regions.find(r => r.id === area.regionId)?.code
                        if (regionCodeFound) {
                            console.log('Matched by area keyword:', keyword, '-> region:', regionCodeFound, 'area:', area.code)
                            return { regionCode: regionCodeFound, areaCode: area.code }
                        }
                    }
                }
            }
        }

        // Area에서 못 찾으면 Region의 prefectures로 매칭 시도
        for (const region of regions) {
            if (region.prefectures) {
                const prefectures = region.prefectures.split(',').map(p => p.trim())
                for (const pref of prefectures) {
                    if (pref && address.includes(pref)) {
                        // 해당 region의 첫 번째 area를 기본값으로
                        const defaultArea = areas.find(a => a.regionId === region.id)
                        console.log('Matched by region prefecture:', pref, '-> region:', region.code, 'area:', defaultArea?.code)
                        return {
                            regionCode: region.code,
                            areaCode: defaultArea?.code || ''
                        }
                    }
                }
            }
        }

        console.log('No match found for address:', address)
        return { regionCode, areaCode }
    }

    // 지역코드로 지역명 가져오기
    const getRegionName = (regionCode: string | null) => {
        if (!regionCode) return ''
        const region = regions.find(r => r.code === regionCode)
        return region?.name || regionCode
    }

    // 관할코드로 관할지역명 가져오기
    const getAreaName = (areaCode: string | null) => {
        if (!areaCode) return ''
        const area = areas.find(a => a.code === areaCode)
        return area?.name || areaCode
    }

    const selectPostalResult = () => {
        const selected = postalResults.find(r => r.id === selectedPostalId)
        if (selected) {
            // 전체 주소 조합
            const fullAddress = `${selected.prefecture}${selected.city}${selected.town}`
            // 주소 기반 지역/관할지역 자동 매핑
            const { regionCode, areaCode } = mapAddressToRegion(fullAddress)
            setFormData({
                ...formData,
                postalCode: selected.postalCode,
                prefecture: selected.prefecture,
                city: selected.city,
                town: selected.town,
                address: fullAddress,
                regionCode,
                areaCode,
            })
            setShowPostalModal(false)
        }
    }

    const toggleCorp = (corpId: string) => {
        const newExpanded = new Set(expandedCorps)
        if (newExpanded.has(corpId)) {
            newExpanded.delete(corpId)
        } else {
            newExpanded.add(corpId)
        }
        setExpandedCorps(newExpanded)
    }

    const togglePinFc = (fcId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newPinned = new Set(pinnedFcs)
        if (newPinned.has(fcId)) {
            newPinned.delete(fcId)
        } else {
            newPinned.add(fcId)
        }
        setPinnedFcs(newPinned)
        // localStorage에 저장
        localStorage.setItem('pinnedFcs', JSON.stringify([...newPinned]))
    }

    // 필터링된 데이터
    const filteredFcs = fcs.filter(fc => {
        if (selectedFcFilter === 'independent') {
            return false
        }
        if (selectedFcFilter !== 'all' && fc.id !== selectedFcFilter) {
            return false
        }
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return fc.name.toLowerCase().includes(query) ||
            fc.nameJa?.toLowerCase().includes(query) ||
            fc.code?.toLowerCase().includes(query) ||
            fc.corporations.some(corp =>
                corp.name.toLowerCase().includes(query) ||
                corp.code?.toLowerCase().includes(query) ||
                corp.nameJa?.toLowerCase().includes(query) ||
                corp.branches.some(branch =>
                    branch.name.toLowerCase().includes(query) ||
                    branch.code?.toLowerCase().includes(query) ||
                    branch.nameJa?.toLowerCase().includes(query) ||
                    branch.address?.toLowerCase().includes(query)
                )
            )
    })

    const filteredIndependentCorps = independentCorps.filter(corp => {
        if (selectedFcFilter !== 'all' && selectedFcFilter !== 'independent') {
            return false
        }
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return corp.name.toLowerCase().includes(query) ||
            corp.code?.toLowerCase().includes(query) ||
            corp.nameJa?.toLowerCase().includes(query) ||
            corp.branches.some(branch =>
                branch.name.toLowerCase().includes(query) ||
                branch.code?.toLowerCase().includes(query) ||
                branch.nameJa?.toLowerCase().includes(query) ||
                branch.address?.toLowerCase().includes(query)
            )
    })

    // 활성/비활성 분리
    const activeFcs = filteredFcs.filter(fc => fc.isActive)
    const inactiveFcs = filteredFcs.filter(fc => !fc.isActive)
    const activeIndependentCorps = filteredIndependentCorps.filter(corp => corp.isActive)
    const inactiveIndependentCorps = filteredIndependentCorps.filter(corp => !corp.isActive)

    // 고정된 FC를 상단에, KAFLIXCLOUD(FC024)를 최우선으로 (활성 FC만)
    const pinnedFcsList = activeFcs
        .filter(fc => pinnedFcs.has(fc.id))
        .sort((a, b) => {
            // KAFLIXCLOUD를 맨 앞으로
            const aIsKaflix = a.code === 'FC024' || a.name?.includes('KAFLIXCLOUD')
            const bIsKaflix = b.code === 'FC024' || b.name?.includes('KAFLIXCLOUD')
            if (aIsKaflix && !bIsKaflix) return -1
            if (!aIsKaflix && bIsKaflix) return 1
            return 0
        })
    const unpinnedFcsList = activeFcs
        .filter(fc => !pinnedFcs.has(fc.id))
        .sort((a, b) => {
            // KAFLIXCLOUD를 맨 앞으로
            const aIsKaflix = a.code === 'FC024' || a.name?.includes('KAFLIXCLOUD')
            const bIsKaflix = b.code === 'FC024' || b.name?.includes('KAFLIXCLOUD')
            if (aIsKaflix && !bIsKaflix) return -1
            if (!aIsKaflix && bIsKaflix) return 1
            return 0
        })

    // 페이지네이션
    const totalPages = Math.ceil(unpinnedFcsList.length / itemsPerPage)
    const paginatedFcs = unpinnedFcsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const openModal = async (type: 'fc' | 'corp' | 'branch' | 'partner', fcId?: string, corpId?: string) => {
        setModalType(type)
        setSelectedFcId(fcId || null)
        setSelectedCorpId(corpId || null)
        setEditingId(null)

        // FC 또는 법인 추가 시 추천 코드 가져오기
        let suggestedCode = ''
        if (type === 'fc') {
            try {
                const res = await fetch('/api/fc/next-code')
                if (res.ok) {
                    const data = await res.json()
                    suggestedCode = data.nextCode || ''
                }
            } catch (e) {
                console.error('추천 FC 코드 조회 실패:', e)
            }
        } else if (type === 'corp') {
            try {
                // fcId가 있으면 해당 FC 소속 법인, 없으면 독립법인
                const url = fcId
                    ? `/api/corporations/next-code?fcId=${fcId}`
                    : '/api/corporations/next-code'
                const res = await fetch(url)
                if (res.ok) {
                    const data = await res.json()
                    suggestedCode = data.nextCode || ''
                    setExistingCorpCodes(data.existingCodes || [])
                }
            } catch (e) {
                console.error('추천 법인 코드 조회 실패:', e)
            }
        }

        // 법인 등록이 아닌 경우 기존 법인 코드 목록 초기화
        if (type !== 'corp') {
            setExistingCorpCodes([])
        }

        if (type === 'branch' && corpId) {
            try {
                const res = await fetch(`/api/branches/next-code?corporationId=${corpId}`)
                if (res.ok) {
                    const data = await res.json()
                    suggestedCode = data.nextCode || ''
                    setExistingBranchCodes(data.existingCodes || [])
                }
            } catch (e) {
                console.error('추천 지점 코드 조회 실패:', e)
            }
        }

        // 지점 등록 시 법인이 선택되지 않은 경우 빈 코드 목록 초기화
        if (type === 'branch' && !corpId) {
            setExistingBranchCodes([])
        }

        // 법인 추가 시 FC의 계약정보를 자동으로 상속
        let inheritedContractDate = ''
        let inheritedErpFeeRate = ''
        let inheritedKioskMaintenanceCost = ''
        let inheritedKioskSaleCost = ''

        if (type === 'corp' && fcId) {
            const parentFc = fcs.find(fc => fc.id === fcId)
            if (parentFc) {
                // FC 자체의 계약일자
                if (parentFc.contractDate) {
                    inheritedContractDate = parentFc.contractDate.split('T')[0]
                }
                // 기존 법인들에서 계약정보 가져오기
                for (const corp of parentFc.corporations) {
                    if (!inheritedContractDate && corp.contractDate) {
                        inheritedContractDate = corp.contractDate.split('T')[0]
                    }
                    if (!inheritedErpFeeRate && corp.erpFeeRate !== undefined && corp.erpFeeRate !== null) {
                        inheritedErpFeeRate = corp.erpFeeRate.toString()
                    }
                    if (!inheritedKioskMaintenanceCost && corp.kioskMaintenanceCost !== undefined && corp.kioskMaintenanceCost !== null) {
                        inheritedKioskMaintenanceCost = corp.kioskMaintenanceCost.toString()
                    }
                    if (!inheritedKioskSaleCost && corp.kioskSaleCost !== undefined && corp.kioskSaleCost !== null) {
                        inheritedKioskSaleCost = corp.kioskSaleCost.toString()
                    }
                    // 모든 값을 찾았으면 루프 종료
                    if (inheritedContractDate && inheritedErpFeeRate && inheritedKioskMaintenanceCost && inheritedKioskSaleCost) {
                        break
                    }
                }
            }
        }

        setFormData({
            code: suggestedCode,
            name: '',
            nameJa: '',
            corpName: '',
            corpNameJa: '',
            type: 'CLIENT',
            contact: '',
            postalCode: '',
            prefecture: '',
            city: '',
            town: '',
            address: '',
            managerName: '',
            managerPhone: '',
            commissionRate: '',
            contractDate: inheritedContractDate,
            erpFeeRate: inheritedErpFeeRate,
            erpFeeNotes: '',
            kioskMaintenanceCost: inheritedKioskMaintenanceCost,
            kioskSaleCost: inheritedKioskSaleCost,
            kioskSaleNotes: '',
            fcId: fcId || '',
            regionCode: '',
            areaCode: ''
        })
        setShowModal(true)
    }

    const openEditModal = (type: 'partner' | 'corp' | 'fc' | 'branch', item: Partner | Corporation | FC | Branch) => {
        setModalType(type as 'partner' | 'corp' | 'fc' | 'branch')
        setEditingId(item.id)

        if (type === 'branch') {
            const branch = item as Branch
            // 지점 편집 시 corporationId 설정 (저장 시 필요)
            setSelectedCorpId(branch.corporationId || null)

            // 기존 regionCode/areaCode가 없고 주소가 있으면 자동 매핑
            let regionCode = branch.regionCode || ''
            let areaCode = branch.areaCode || ''
            if ((!regionCode || !areaCode) && branch.address) {
                const mapped = mapAddressToRegion(branch.address)
                regionCode = regionCode || mapped.regionCode
                areaCode = areaCode || mapped.areaCode
            }

            setFormData({
                code: branch.code || '',
                name: branch.name || '',
                nameJa: branch.nameJa || '',
                corpName: '',
                corpNameJa: '',
                type: 'CLIENT',
                contact: '',
                postalCode: branch.postalCode || '',
                prefecture: '',
                city: '',
                town: '',
                address: branch.address || '',
                managerName: branch.managerName || '',
                managerPhone: branch.managerPhone || '',
                commissionRate: '',
                contractDate: '',
                erpFeeRate: '',
                erpFeeNotes: '',
                kioskMaintenanceCost: '',
                kioskSaleCost: '',
                kioskSaleNotes: '',
                fcId: '',
                regionCode,
                areaCode
            })
        } else if (type === 'corp') {
            const corp = item as Corporation
            setFormData({
                code: corp.code || '',
                name: corp.name || '',
                nameJa: corp.nameJa || '',
                corpName: '',
                corpNameJa: '',
                type: 'CLIENT',
                contact: corp.contact || '',
                postalCode: '',
                prefecture: '',
                city: '',
                town: '',
                address: corp.address || '',
                managerName: '',
                managerPhone: '',
                commissionRate: '',
                contractDate: '',
                erpFeeRate: '',
                erpFeeNotes: '',
                kioskMaintenanceCost: '',
                kioskSaleCost: '',
                kioskSaleNotes: '',
                fcId: corp.fcId || '',
                regionCode: '',
                areaCode: ''
            })
        } else if (type === 'fc') {
            const fc = item as FC
            setFormData({
                code: fc.code || '',
                name: fc.name || '',
                nameJa: fc.nameJa || '',
                corpName: '',
                corpNameJa: '',
                type: 'CLIENT',
                contact: fc.contact || '',
                postalCode: '',
                prefecture: '',
                city: '',
                town: '',
                address: fc.address || '',
                managerName: '',
                managerPhone: '',
                commissionRate: fc.commissionRate?.toString() || '',
                contractDate: fc.contractDate?.split('T')[0] || '',
                erpFeeRate: '',
                erpFeeNotes: '',
                kioskMaintenanceCost: '',
                kioskSaleCost: '',
                kioskSaleNotes: '',
                fcId: '',
                regionCode: '',
                areaCode: ''
            })
        } else {
            const partner = item as Partner
            setFormData({
                code: '',
                name: partner.name || '',
                nameJa: partner.nameJa || '',
                corpName: '',
                corpNameJa: '',
                type: partner.type || 'CLIENT',
                contact: partner.contact || '',
                postalCode: '',
                prefecture: '',
                city: '',
                town: '',
                address: partner.address || '',
                managerName: '',
                managerPhone: '',
                commissionRate: '',
                contractDate: '',
                erpFeeRate: '',
                erpFeeNotes: '',
                kioskMaintenanceCost: '',
                kioskSaleCost: '',
                kioskSaleNotes: '',
                regionCode: '',
                areaCode: '',
                fcId: ''
            })
        }
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const fullAddress = [
            formData.prefecture,
            formData.city,
            formData.town,
            formData.address
        ].filter(Boolean).join('')

        try {
            let url = ''
            let body: Record<string, unknown> = {}

            if (modalType === 'fc') {
                url = editingId ? `/api/fc/${editingId}` : '/api/fc'
                body = {
                    code: formData.code,
                    name: formData.name,           // FC 브랜드명 (한국어)
                    nameJa: formData.nameJa,       // FC 브랜드명 (일본어)
                    corpName: formData.corpName || formData.name,      // 법인명 (한국어) - 미입력시 브랜드명 사용
                    corpNameJa: formData.corpNameJa || formData.nameJa, // 법인명 (일본어) - 미입력시 브랜드명 사용
                    fcType: 'RENTAL_CAR',
                    contact: formData.contact,
                    address: fullAddress || formData.address,
                    commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : null
                }
            } else if (modalType === 'corp') {
                url = editingId ? `/api/corporations/${editingId}` : '/api/corporations'
                body = {
                    code: formData.code,
                    name: formData.name,
                    nameJa: formData.nameJa,
                    fcId: formData.fcId || null,
                    contact: formData.contact,
                    address: fullAddress || formData.address,
                    contractDate: formData.contractDate || null,
                    erpFeeRate: formData.erpFeeRate ? parseFloat(formData.erpFeeRate) : null,
                    erpFeeNotes: formData.erpFeeNotes,
                    kioskMaintenanceCost: formData.kioskMaintenanceCost ? parseFloat(formData.kioskMaintenanceCost) : null,
                    kioskSaleCost: formData.kioskSaleCost ? parseFloat(formData.kioskSaleCost) : null,
                    kioskSaleNotes: formData.kioskSaleNotes
                }
            } else if (modalType === 'branch') {
                url = editingId ? `/api/branches/${editingId}` : '/api/branches'
                body = {
                    code: formData.code,
                    name: formData.name,
                    nameJa: formData.nameJa,
                    corporationId: selectedCorpId,
                    address: fullAddress || formData.address,
                    postalCode: formData.postalCode,
                    managerName: formData.managerName,
                    managerPhone: formData.managerPhone,
                    regionCode: formData.regionCode || null,
                    areaCode: formData.areaCode || null
                }
            } else if (modalType === 'partner') {
                url = editingId ? `/api/partners/${editingId}` : '/api/partners'
                body = {
                    name: formData.name,
                    nameJa: formData.nameJa,
                    type: formData.type,
                    contact: formData.contact,
                    address: fullAddress || formData.address
                }
            }

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                const savedData = await res.json()
                setShowModal(false)
                setEditingId(null)
                await fetchData()

                // FC 저장 후 생성된 FC를 자동으로 선택
                if (modalType === 'fc' && savedData?.id) {
                    // fetchData 후 새로 생성된 FC를 선택
                    setTimeout(() => {
                        const newFc = fcs.find(f => f.id === savedData.id)
                        if (newFc) {
                            setSelectedFc(newFc)
                        }
                    }, 100)
                }
            } else {
                const errorData = await res.json().catch(() => ({}))
                alert(errorData.error || tcl('saveFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(tcl('errorOccurred'))
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteFc = async (fcId: string) => {
        if (!confirm(tcl('deleteFcConfirm'))) return

        try {
            const res = await fetch(`/api/fc/${fcId}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
                if (selectedFc?.id === fcId) {
                    setSelectedFc(null)
                }
            } else {
                alert(tcl('deleteFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteCorp = async (corpId: string) => {
        if (!confirm(tcl('deleteCorpConfirm'))) return

        try {
            const res = await fetch(`/api/corporations/${corpId}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            } else {
                const errorData = await res.json().catch(() => ({}))
                alert(errorData.error || tcl('deleteFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteBranch = async (branchId: string) => {
        if (!confirm('이 지점을 삭제하시겠습니까?')) return

        try {
            const res = await fetch(`/api/branches/${branchId}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            } else {
                alert(tcl('deleteFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    // FC 활성/비활성 토글
    const handleToggleFcActive = async (fcId: string, currentIsActive: boolean) => {
        try {
            const res = await fetch(`/api/fc/${fcId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentIsActive })
            })
            if (res.ok) {
                fetchData()
            } else {
                alert(tc('statusChangeFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    // 법인 활성/비활성 토글
    const handleToggleCorpActive = async (corpId: string, currentIsActive: boolean) => {
        try {
            const res = await fetch(`/api/corporations/${corpId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentIsActive })
            })
            if (res.ok) {
                fetchData()
            } else {
                alert(tc('statusChangeFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    // 지점 활성/비활성 토글
    const handleToggleBranchActive = async (branchId: string, currentIsActive: boolean) => {
        try {
            const res = await fetch(`/api/branches/${branchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentIsActive })
            })
            if (res.ok) {
                fetchData()
            } else {
                alert(tc('statusChangeFailed'))
            }
        } catch (error) {
            console.error(error)
        }
    }

    // 인라인 편집 시작
    const startEditBranch = (branch: Branch) => {
        setEditingBranchId(branch.id)
        setEditingBranchData({
            code: branch.code || '',
            name: branch.name || '',
            nameJa: branch.nameJa || '',
            postalCode: branch.postalCode || '',
            address: branch.address || '',
            managerPhone: branch.managerPhone || ''
        })
    }

    // 인라인 편집 취소
    const cancelEditBranch = () => {
        setEditingBranchId(null)
        setEditingBranchData({ code: '', name: '', nameJa: '', postalCode: '', address: '', managerPhone: '' })
    }

    // 인라인 편집 저장
    const saveEditBranch = async () => {
        if (!editingBranchId) return
        setSavingBranch(true)

        try {
            const res = await fetch(`/api/branches/${editingBranchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: editingBranchData.code || null,
                    name: editingBranchData.name,
                    nameJa: editingBranchData.nameJa || null,
                    postalCode: editingBranchData.postalCode || null,
                    address: editingBranchData.address || null,
                    managerPhone: editingBranchData.managerPhone || null
                })
            })

            if (res.ok) {
                fetchData()
                setEditingBranchId(null)
                setEditingBranchData({ code: '', name: '', nameJa: '', postalCode: '', address: '', managerPhone: '' })
            } else {
                const err = await res.json()
                alert(err.error || tcl('saveFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(tcl('errorOccurred'))
        } finally {
            setSavingBranch(false)
        }
    }

    // 지점 코드 인라인 편집 시작
    const startEditCode = (branchId: string, currentCode: string) => {
        if (!isSuperAdmin) return
        setEditingCodeBranchId(branchId)
        setEditingCodeValue(currentCode || '')
    }

    // 지점 코드 인라인 편집 취소
    const cancelEditCode = () => {
        setEditingCodeBranchId(null)
        setEditingCodeValue('')
    }

    // 지점 코드 저장
    const saveEditCode = async (branchId: string) => {
        if (!isSuperAdmin) return
        setSavingCode(true)

        try {
            const res = await fetch(`/api/branches/${branchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: editingCodeValue || null })
            })

            if (res.ok) {
                fetchData()
                setEditingCodeBranchId(null)
                setEditingCodeValue('')
            } else {
                const err = await res.json()
                alert(err.error || tcl('saveFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(tcl('errorOccurred'))
        } finally {
            setSavingCode(false)
        }
    }

    // FC 코드 인라인 편집 시작
    const startEditFcCode = (fcId: string, currentCode: string) => {
        setEditingFcCodeId(fcId)
        setEditingFcCodeValue(currentCode || '')
    }

    // FC 코드 인라인 편집 취소
    const cancelEditFcCode = () => {
        setEditingFcCodeId(null)
        setEditingFcCodeValue('')
    }

    // FC 코드 저장
    const saveEditFcCode = async (fcId: string) => {
        setSavingFcCode(true)

        try {
            const res = await fetch(`/api/fc/${fcId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: editingFcCodeValue || null })
            })

            if (res.ok) {
                fetchData()
                setEditingFcCodeId(null)
                setEditingFcCodeValue('')
            } else {
                const err = await res.json()
                alert(err.error || tcl('saveFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(tcl('saveFailed'))
        } finally {
            setSavingFcCode(false)
        }
    }

    // 독립법인 코드 인라인 편집 시작
    const startEditCorpCode = (corpId: string, currentCode: string) => {
        setEditingCorpCodeId(corpId)
        setEditingCorpCodeValue(currentCode || '')
    }

    // 독립법인 코드 인라인 편집 취소
    const cancelEditCorpCode = () => {
        setEditingCorpCodeId(null)
        setEditingCorpCodeValue('')
    }

    // 독립법인 코드 저장
    const saveEditCorpCode = async (corpId: string) => {
        setSavingCorpCode(true)

        try {
            const res = await fetch(`/api/corporations/${corpId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: editingCorpCodeValue || null })
            })

            if (res.ok) {
                fetchData()
                setEditingCorpCodeId(null)
                setEditingCorpCodeValue('')
            } else {
                const err = await res.json()
                alert(err.error || tcl('saveFailed'))
            }
        } catch (error) {
            console.error(error)
            alert(tcl('errorOccurred'))
        } finally {
            setSavingCorpCode(false)
        }
    }

    // 통계 계산 (활성화된 것만 카운팅)
    const activeFcCount = fcs.filter(fc => fc.isActive).length
    const inactiveFcCount = fcs.filter(fc => !fc.isActive).length
    const totalCorps = fcs.filter(fc => fc.isActive).reduce((sum, fc) => sum + fc.corporations.filter(c => c.isActive).length, 0) + independentCorps.filter(c => c.isActive).length
    const totalBranches = fcs.filter(fc => fc.isActive).reduce((sum, fc) =>
        sum + fc.corporations.filter(c => c.isActive).reduce((s, c) => s + c.branches.filter(b => b.isActive).length, 0), 0
    ) + independentCorps.filter(c => c.isActive).reduce((s, c) => s + c.branches.filter(b => b.isActive).length, 0)

    // 비활성화된 법인/지점 수
    const inactiveCorps = fcs.reduce((sum, fc) => sum + fc.corporations.filter(c => !c.isActive).length, 0) + independentCorps.filter(c => !c.isActive).length
    const inactiveBranches = fcs.reduce((sum, fc) =>
        sum + fc.corporations.reduce((s, c) => s + c.branches.filter(b => !b.isActive).length, 0), 0
    ) + independentCorps.reduce((s, c) => s + c.branches.filter(b => !b.isActive).length, 0)

    const getModalTitle = () => {
        switch (modalType) {
            case 'fc': return editingId ? tcl('fcEdit') : tcl('fcRegister')
            case 'corp': return editingId ? tcl('corpEdit') : tcl('corpRegister')
            case 'branch': return editingId ? tcl('branchEdit') : tcl('branchRegister')
            case 'partner': return editingId ? tcl('partnerEdit') : tcl('partnerRegister')
            default: return ''
        }
    }

    const handleCsvUpload = async () => {
        if (!csvFile) return

        setCsvUploading(true)
        setCsvResult(null)

        try {
            const formData = new FormData()
            formData.append('file', csvFile)
            formData.append('autoTranslate', autoTranslate.toString())

            const res = await fetch('/api/clients/csv-import', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (res.ok) {
                setCsvResult(data)
                fetchData()
            } else {
                setCsvResult({ message: data.error || tcl('uploadFailed') })
            }
        } catch (error) {
            console.error(error)
            setCsvResult({ message: tcl('errorOccurred') })
        } finally {
            setCsvUploading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCsvFile(file)
            setCsvResult(null)
        }
    }

    const openCsvModal = () => {
        setCsvFile(null)
        setCsvResult(null)
        setShowCsvModal(true)
    }

    const handleSelectFc = (fc: FC) => {
        setSelectedFc(fc)
        setSelectedIndependentCorp(null)  // 독립법인 선택 해제
        setDetailTab('corp')
        setBranchCorpFilter('all')  // FC 변경 시 법인 필터 초기화
    }

    // FC 카드 컴포넌트
    const FcCard = ({ fc, isPinned = false, isInactive = false }: { fc: FC; isPinned?: boolean; isInactive?: boolean }) => {
        const corpCount = fc.corporations.length
        const branchCount = fc.corporations.reduce((s, c) => s + c.branches.length, 0)
        const kioskCount = fc.corporations.reduce((s, c) =>
            s + c.branches.reduce((bs, b) => bs + (b._count?.kiosks || 0), 0), 0)
        // 취득형태별 카운트: FREE(무상), LEASE_FREE(리스무상), PAID(유상), RENTAL(렌탈)
        const freeCount = fc.corporations.reduce((s, c) =>
            s + c.branches.reduce((bs, b) => bs + (b._acquisitionCount?.free || 0), 0), 0)
        const leaseFreeCount = fc.corporations.reduce((s, c) =>
            s + c.branches.reduce((bs, b) => bs + (b._acquisitionCount?.leaseFree || 0), 0), 0)
        const paidCount = fc.corporations.reduce((s, c) =>
            s + c.branches.reduce((bs, b) => bs + (b._acquisitionCount?.paid || 0), 0), 0)
        const rentalCount = fc.corporations.reduce((s, c) =>
            s + c.branches.reduce((bs, b) => bs + (b._acquisitionCount?.rental || 0), 0), 0)

        // KAFLIXCLOUD 특별 테두리 확인
        const isKaflixcloud = fc.name?.includes('KAFLIXCLOUD') || fc.nameJa?.includes('KAFLIXCLOUD')
        const borderStyle = isInactive
            ? { opacity: 0.6, border: '1px dashed #94a3b8' }
            : isKaflixcloud
                ? { border: '2px solid rgb(251, 191, 36)', boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.2)' }
                : selectedFc?.id === fc.id
                    ? { boxShadow: '0 0 0 2px rgba(32, 107, 196, 0.2)' }
                    : {}

        return (
            <div
                className={`card cursor-pointer ${!isKaflixcloud && !isInactive && selectedFc?.id === fc.id ? 'border-primary border-2' : ''}`}
                onClick={() => handleSelectFc(fc)}
                style={{ borderRadius: '8px', minHeight: '100px', ...borderStyle }}
            >
                <div className="card-body p-3">
                    {/* 상단: 아이콘 + 이름 + 토글 */}
                    <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className={`rounded-circle d-flex align-items-center justify-content-center ${isInactive ? 'bg-secondary' : isPinned ? 'bg-primary' : 'bg-blue-lt'}`}
                                style={{ width: '28px', height: '28px', minWidth: '28px' }}
                            >
                                <Building2 size={14} className={isInactive ? 'text-white' : isPinned ? 'text-white' : 'text-blue'} />
                            </div>
                            <div style={{ lineHeight: 1.3 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isInactive ? '#94a3b8' : '#1e293b' }}>{getDisplayName(fc)}</div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-check form-switch mb-0" style={{ minHeight: 'auto' }} onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={fc.isActive}
                                    onChange={() => handleToggleFcActive(fc.id, fc.isActive)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </label>
                            {!isInactive && (
                                <Star
                                    size={16}
                                    className={`cursor-pointer ${isPinned ? 'text-warning' : 'text-muted'}`}
                                    fill={isPinned ? '#ffc107' : 'none'}
                                    onClick={(e) => togglePinFc(fc.id, e)}
                                />
                            )}
                        </div>
                    </div>

                    {/* 중간: 법인/지점/키오스크 수 */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="d-flex align-items-baseline gap-1">
                            <span style={{ fontSize: '0.8rem', color: '#475569' }}>{tcl('corp')}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{corpCount}</span>
                        </div>
                        <span className="text-muted">|</span>
                        <div className="d-flex align-items-baseline gap-1">
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{branchCount}</span>
                            <span style={{ fontSize: '0.8rem', color: '#475569' }}>{tcl('branch')}</span>
                        </div>
                        <span className="text-muted">|</span>
                        <div className="d-flex align-items-center gap-1">
                            <KioskIcon size={14} className="text-success" />
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>{kioskCount}</span>
                            {(freeCount > 0 || leaseFreeCount > 0 || paidCount > 0 || rentalCount > 0) && (
                                <span className="d-flex gap-1 ms-1">
                                    {freeCount > 0 && <span className="badge bg-green-lt text-green" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>{t('stats.free')}{freeCount}</span>}
                                    {leaseFreeCount > 0 && <span className="badge bg-purple-lt text-purple" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>{t('stats.leaseFree')}{leaseFreeCount}</span>}
                                    {paidCount > 0 && <span className="badge bg-cyan-lt text-cyan" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>{t('stats.paid')}{paidCount}</span>}
                                    {rentalCount > 0 && <span className="badge bg-orange-lt text-orange" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>{t('stats.rental')}{rentalCount}</span>}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 하단: 브랜드 배지 + 드롭다운 버튼 */}
                    <div className="d-flex align-items-center justify-content-between">
                        <span className="badge bg-blue-lt text-blue" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            {fc.code}
                        </span>
                        <div className="d-flex gap-1">
                            <div className="dropdown" onClick={e => e.stopPropagation()}>
                                <button
                                    className="btn btn-sm btn-outline-secondary dropdown-toggle py-1 px-2"
                                    style={{ fontSize: '0.8rem', height: '28px' }}
                                    data-bs-toggle="dropdown"
                                >
                                    {tcl('corp')}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" style={{ fontSize: '0.85rem' }}>
                                    <li><a className="dropdown-item" href="#" onClick={() => openModal('corp', fc.id)}>
                                        <Plus size={14} className="me-1" />{tcl('corpAdd')}
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 독립법인 카드
    const IndependentCorpCard = ({ corp, isInactive = false }: { corp: Corporation; isInactive?: boolean }) => {
        const isSelected = selectedIndependentCorp?.id === corp.id
        return (
            <div
                className="card cursor-pointer"
                style={{
                    borderRadius: '8px',
                    borderColor: isInactive ? '#94a3b8' : isSelected ? '#f59e0b' : '#ffc107',
                    minHeight: '100px',
                    borderWidth: isSelected ? '2px' : '1px',
                    borderStyle: isInactive ? 'dashed' : 'solid',
                    boxShadow: isSelected && !isInactive ? '0 0 0 2px rgba(245, 158, 11, 0.3)' : 'none',
                    opacity: isInactive ? 0.6 : 1
                }}
                onClick={() => {
                    setSelectedIndependentCorp(corp)
                    setSelectedFc(null)
                    setDetailTab('corp')
                }}
            >
                <div className="card-body p-3">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className={`rounded-circle d-flex align-items-center justify-content-center ${isInactive ? 'bg-secondary' : 'bg-warning-lt'}`}
                                style={{ width: '28px', height: '28px', minWidth: '28px' }}
                            >
                                <Store size={14} className={isInactive ? 'text-white' : 'text-warning'} />
                            </div>
                            <div style={{ lineHeight: 1.3 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isInactive ? '#94a3b8' : '#1e293b' }}>
                                    {getDisplayName(corp)}
                                </div>
                            </div>
                        </div>
                        <label className="form-check form-switch mb-0" style={{ minHeight: 'auto' }} onClick={e => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={corp.isActive}
                                onChange={() => handleToggleCorpActive(corp.id, corp.isActive)}
                                style={{ cursor: 'pointer' }}
                            />
                        </label>
                    </div>

                    <div className="d-flex align-items-baseline gap-1 mb-2">
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{corp.branches.length}</span>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>{tcl('branch')}</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                        <span className="badge bg-warning-lt text-warning" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            {corp.code}
                        </span>
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="btn btn-sm btn-outline-secondary dropdown-toggle py-1 px-2"
                                style={{ fontSize: '0.8rem', height: '28px' }}
                                data-bs-toggle="dropdown"
                            >
                                {tcl('branch')}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" style={{ fontSize: '0.85rem' }}>
                                <li><a className="dropdown-item" href="#" onClick={() => openModal('branch', undefined, corp.id)}>
                                    <Plus size={14} className="me-1" />{tcl('branchAdd')}
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container-fluid p-0" style={{ height: 'calc(100vh - 60px)' }}>
            {/* 상단 바 */}
            <div className="bg-white border-bottom px-3 py-2">
                <div className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{tcl('title')}</h5>
                    <div className="d-flex gap-2 align-items-center">
                        <select
                            className="form-select form-select-sm"
                            value={selectedFcFilter}
                            onChange={(e) => setSelectedFcFilter(e.target.value)}
                            style={{ width: 'auto', minWidth: '100px', fontSize: '0.85rem', height: '32px' }}
                        >
                            <option value="all">{tc('all')}</option>
                            {fcs.map(fc => (
                                <option key={fc.id} value={fc.id}>{fc.code}</option>
                            ))}
                        </select>
                        <div className="input-icon">
                            <span className="input-icon-addon">
                                <Search size={14} />
                            </span>
                            <Input
                                placeholder={tcl('searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-5"
                                style={{ minWidth: '180px', fontSize: '0.85rem', height: '32px' }}
                            />
                        </div>
                        <button className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ fontSize: '0.8rem' }} onClick={openCsvModal}>
                            <Upload size={12} className="me-1" />
                            {tcl('csvBulkRegister')}
                        </button>
                        <button className="btn btn-sm btn-primary py-1 px-2" style={{ fontSize: '0.8rem' }} onClick={() => openModal('fc')}>
                            FC {tcl('add')} +
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="d-flex align-items-center justify-content-center" style={{ height: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status"></div>
                        <div className="mt-2 text-muted">{tc('loading')}</div>
                    </div>
                </div>
            ) : (
                <div className="d-flex" style={{ height: 'calc(100% - 50px)' }}>
                    {/* 좌측 패널 - FC 카드 그리드 (스크롤 가능) */}
                    <div className="bg-light p-3 overflow-auto flex-fill" style={{ borderRight: '1px solid #e9ecef' }}>
                        {/* Pinned Favorites */}
                        {pinnedFcsList.length > 0 && (
                            <div
                                className="mb-4 p-3 rounded"
                                style={{
                                    background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
                                    border: '2px solid #fbbf24',
                                    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)'
                                }}
                            >
                                <div className="mb-2 d-flex align-items-center gap-2">
                                    <Star size={16} className="text-warning" fill="#fbbf24" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>Pinned Favorites</span>
                                </div>
                                <div className="row g-2">
                                    {pinnedFcsList.map(fc => (
                                        <div key={fc.id} className="col-3">
                                            <FcCard fc={fc} isPinned />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 전체 등록 섹션 */}
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                {tcl('allClients')} (FC {activeFcCount} / {tcl('totalSummary', { corps: totalCorps, branches: totalBranches })})
                                {(inactiveFcCount > 0 || inactiveCorps > 0 || inactiveBranches > 0) && (
                                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem', fontWeight: 400 }}>
                                        (비활성: FC {inactiveFcCount} / 법인 {inactiveCorps} / 지점 {inactiveBranches})
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="row g-2">
                            {unpinnedFcsList.map(fc => (
                                <div key={fc.id} className="col-3">
                                    <FcCard fc={fc} />
                                </div>
                            ))}
                            {/* 활성 독립법인만 표시 */}
                            {activeIndependentCorps.map(corp => (
                                <div key={corp.id} className="col-3">
                                    <IndependentCorpCard corp={corp} />
                                </div>
                            ))}
                        </div>

                        {/* 비활성화 섹션 */}
                        {(inactiveFcs.length > 0 || inactiveIndependentCorps.length > 0) && (
                            <div
                                className="mt-4 p-3 rounded"
                                style={{
                                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                    border: '1px solid #cbd5e1'
                                }}
                            >
                                <div className="mb-2 d-flex align-items-center gap-2">
                                    <X size={16} className="text-muted" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                                        {tcl('inactiveClients')} ({inactiveFcs.length + inactiveIndependentCorps.length})
                                    </span>
                                </div>
                                <div className="row g-2">
                                    {inactiveFcs.map(fc => (
                                        <div key={fc.id} className="col-3">
                                            <FcCard fc={fc} isInactive />
                                        </div>
                                    ))}
                                    {inactiveIndependentCorps.map(corp => (
                                        <div key={corp.id} className="col-3">
                                            <IndependentCorpCard corp={corp} isInactive />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 우측 패널 - 상세 정보 (고정 너비) */}
                    <div className="bg-white overflow-auto" style={{ width: '520px', minWidth: '520px', flexShrink: 0 }}>
                        {selectedFc ? (
                            <>
                                {/* FC 상세 헤더 */}
                                <div className="p-3 border-bottom">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                                style={{ width: '42px', height: '42px' }}
                                            >
                                                <Building2 size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <div className="d-flex align-items-center gap-2">
                                                    {editingFcCodeId === selectedFc.id ? (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={editingFcCodeValue}
                                                                onChange={(e) => setEditingFcCodeValue(e.target.value.toUpperCase())}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveEditFcCode(selectedFc.id)
                                                                    if (e.key === 'Escape') cancelEditFcCode()
                                                                }}
                                                                style={{ width: '100px', fontSize: '0.85rem', padding: '4px 8px' }}
                                                                autoFocus
                                                                disabled={savingFcCode}
                                                            />
                                                            <button
                                                                className="btn btn-sm p-1"
                                                                onClick={() => saveEditFcCode(selectedFc.id)}
                                                                disabled={savingFcCode}
                                                            >
                                                                {savingFcCode ? <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} /> : <Check size={14} className="text-success" />}
                                                            </button>
                                                            <button
                                                                className="btn btn-sm p-1"
                                                                onClick={cancelEditFcCode}
                                                                disabled={savingFcCode}
                                                            >
                                                                <X size={14} className="text-danger" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="badge bg-blue-lt text-blue border-0"
                                                            style={{ fontSize: '0.85rem', padding: '4px 10px', cursor: 'pointer' }}
                                                            onClick={() => startEditFcCode(selectedFc.id, selectedFc.code)}
                                                            title={tcl('clickToEditCode')}
                                                        >
                                                            {selectedFc.code}
                                                        </button>
                                                    )}
                                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{getDisplayName(selectedFc)}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
                                                    <span>
                                                        {tcl('corp')} <strong style={{ color: '#1e293b' }}>{selectedFc.corporations.length}</strong>
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        <strong style={{ color: '#1e293b' }}>{selectedFc.corporations.reduce((s, c) => s + c.branches.length, 0)}</strong> {tcl('branch')}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="d-flex align-items-center gap-1">
                                                        <KioskIcon size={14} className="text-success" />
                                                        <strong style={{ color: '#059669' }}>
                                                            {selectedFc.corporations.reduce((s, c) => s + c.branches.reduce((bs, b) => bs + (b._count?.kiosks || 0), 0), 0)}
                                                        </strong>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                type="button"
                                                className="btn btn-ghost-secondary p-1"
                                                onClick={() => setShowFcMenu(prev => !prev)}
                                            >
                                                <MoreVertical size={18} className="text-muted" />
                                            </button>
                                            {showFcMenu && (
                                                <>
                                                    <div
                                                        style={{
                                                            position: 'fixed',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            zIndex: 1000
                                                        }}
                                                        onClick={() => setShowFcMenu(false)}
                                                    />
                                                    <ul
                                                        className="dropdown-menu show"
                                                        style={{
                                                            position: 'absolute',
                                                            right: 0,
                                                            top: '100%',
                                                            zIndex: 1001,
                                                            display: 'block',
                                                            minWidth: '120px',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <li>
                                                            <a
                                                                className="dropdown-item"
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    setShowFcMenu(false)
                                                                    openEditModal('fc', selectedFc)
                                                                }}
                                                            >
                                                                <Edit size={14} className="me-2" />{tc('edit')}
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a
                                                                className="dropdown-item text-danger"
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    setShowFcMenu(false)
                                                                    handleDeleteFc(selectedFc.id)
                                                                }}
                                                            >
                                                                <Trash2 size={14} className="me-2" />{tc('delete')}
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 탭 */}
                                <div className="border-bottom">
                                    <div className="d-flex px-3">
                                        {['corp', 'branch', 'settings', 'history'].map(tab => (
                                            <button
                                                key={tab}
                                                className={`btn btn-link px-3 py-2 text-decoration-none ${detailTab === tab ? 'border-bottom border-primary border-2 text-primary' : 'text-muted'}`}
                                                style={{ fontSize: '0.9rem', fontWeight: 500 }}
                                                onClick={() => setDetailTab(tab as typeof detailTab)}
                                            >
                                                {tcl(tab)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 탭 컨텐츠 */}
                                <div className="p-3">
                                    {detailTab === 'corp' && (
                                        <>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="input-icon" style={{ width: '200px' }}>
                                                    <span className="input-icon-addon">
                                                        <Search size={14} />
                                                    </span>
                                                    <Input
                                                        placeholder={tcl('searchPlaceholder')}
                                                        className="ps-5"
                                                        style={{ fontSize: '0.85rem', height: '32px' }}
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary py-1 px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => openModal('corp', selectedFc.id)}
                                                >
                                                    {tcl('corpAdd')} +
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr className="bg-light">
                                                            <th style={{ fontWeight: 600, color: '#475569' }}>{tcl('corpName')}</th>
                                                            <th style={{ fontWeight: 600, color: '#475569', textAlign: 'center', width: '50px' }}>{tcl('branch')}</th>
                                                            <th style={{ fontWeight: 600, color: '#475569', textAlign: 'center', width: '50px', verticalAlign: 'middle' }}>
                                                                <KioskIcon size={14} />
                                                            </th>
                                                            <th style={{ fontWeight: 600, color: '#475569', width: '70px', textAlign: 'center' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedFc.corporations.map(corp => {
                                                            const corpKioskCount = corp.branches.reduce((s, b) => s + (b._count?.kiosks || 0), 0)
                                                            const corpFreeCount = corp.branches.reduce((s, b) => s + (b._acquisitionCount?.free || 0), 0)
                                                            const corpLeaseFreeCount = corp.branches.reduce((s, b) => s + (b._acquisitionCount?.leaseFree || 0), 0)
                                                            const corpPaidCount = corp.branches.reduce((s, b) => s + (b._acquisitionCount?.paid || 0), 0)
                                                            const corpRentalCount = corp.branches.reduce((s, b) => s + (b._acquisitionCount?.rental || 0), 0)
                                                            return (
                                                            <tr key={corp.id}>
                                                                <td>
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <Store size={12} className="text-purple" />
                                                                        <span style={{ fontWeight: 500, color: '#1e293b' }}>{getDisplayName(corp)}</span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ fontWeight: 600, textAlign: 'center', verticalAlign: 'middle' }}>{corp.branches.length}</td>
                                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                    <div className="d-flex flex-column align-items-center">
                                                                        <span style={{ color: '#059669', fontWeight: 600 }}>{corpKioskCount}</span>
                                                                        {(corpFreeCount > 0 || corpLeaseFreeCount > 0 || corpPaidCount > 0 || corpRentalCount > 0) && (
                                                                            <div className="d-flex gap-1 flex-wrap justify-content-center" style={{ fontSize: '0.6rem' }}>
                                                                                {corpFreeCount > 0 && <span className="badge bg-green-lt text-green" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>무상{corpFreeCount}</span>}
                                                                                {corpLeaseFreeCount > 0 && <span className="badge bg-purple-lt text-purple" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>리스{corpLeaseFreeCount}</span>}
                                                                                {corpPaidCount > 0 && <span className="badge bg-cyan-lt text-cyan" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>유상{corpPaidCount}</span>}
                                                                                {corpRentalCount > 0 && <span className="badge bg-orange-lt text-orange" style={{ fontSize: '0.55rem', padding: '1px 3px' }}>렌탈{corpRentalCount}</span>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ verticalAlign: 'middle' }}>
                                                                    <div className="d-flex gap-1 justify-content-center align-items-center">
                                                                        <label className="form-check form-switch mb-0" style={{ minHeight: 'auto' }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                className="form-check-input"
                                                                                checked={corp.isActive}
                                                                                onChange={() => handleToggleCorpActive(corp.id, corp.isActive)}
                                                                                style={{ cursor: 'pointer' }}
                                                                            />
                                                                        </label>
                                                                        <button
                                                                            className="btn btn-sm btn-ghost-primary p-1"
                                                                            title={tc('edit')}
                                                                            onClick={() => openEditModal('corp', corp)}
                                                                        >
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-ghost-danger p-1"
                                                                            title={tc('delete')}
                                                                            onClick={() => handleDeleteCorp(corp.id)}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )})}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'branch' && (
                                        <>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <select
                                                        className="form-select form-select-sm"
                                                        style={{ width: 'auto', fontSize: '0.85rem', height: '32px' }}
                                                        value={branchCorpFilter}
                                                        onChange={(e) => setBranchCorpFilter(e.target.value)}
                                                    >
                                                        <option value="all">{tc('all')} {tcl('corp')}</option>
                                                        {selectedFc.corporations.map(corp => (
                                                            <option key={corp.id} value={corp.id}>{getDisplayName(corp)}</option>
                                                        ))}
                                                    </select>
                                                    <div className="input-icon" style={{ width: '140px' }}>
                                                        <span className="input-icon-addon"><Search size={14} /></span>
                                                        <Input placeholder={tcl('searchPlaceholder')} className="ps-5" style={{ fontSize: '0.85rem', height: '32px' }} />
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary py-1 px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => openModal('branch', selectedFc.id, undefined)}
                                                >
                                                    {tcl('branchAdd')} +
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr className="bg-light">
                                                            <th style={{ fontWeight: 600, color: '#475569' }}>{tcl('branchName')}</th>
                                                            <th style={{ fontWeight: 600, color: '#475569', textAlign: 'center', width: '50px', verticalAlign: 'middle' }}>
                                                                <KioskIcon size={14} />
                                                            </th>
                                                            <th style={{ fontWeight: 600, color: '#475569', width: '70px', textAlign: 'center' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedFc.corporations
                                                            .filter(corp => branchCorpFilter === 'all' || corp.id === branchCorpFilter)
                                                            .flatMap(corp =>
                                                            corp.branches.map(branch => (
                                                                <tr key={branch.id} style={!branch.isActive ? { opacity: 0.6 } : undefined}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <MapPin size={12} className={branch.isActive ? 'text-success' : 'text-secondary'} />
                                                                            <div>
                                                                                <div style={{ fontWeight: 500, color: branch.isActive ? '#1e293b' : '#94a3b8' }}>
                                                                                    {getDisplayName(branch)}
                                                                                    {!branch.isActive && <span className="badge bg-secondary ms-1" style={{ fontSize: '0.6rem' }}>비활성</span>}
                                                                                </div>
                                                                                <div className="d-flex align-items-center gap-1" style={{ marginTop: '2px' }}>
                                                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{getDisplayName(corp)}</span>
                                                                                    {editingCodeBranchId === branch.id ? (
                                                                                        <div className="d-flex align-items-center gap-1">
                                                                                            <input
                                                                                                type="text"
                                                                                                className="form-control form-control-sm"
                                                                                                value={editingCodeValue}
                                                                                                onChange={(e) => setEditingCodeValue(e.target.value.toUpperCase())}
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === 'Enter') saveEditCode(branch.id)
                                                                                                    if (e.key === 'Escape') cancelEditCode()
                                                                                                }}
                                                                                                style={{ width: '80px', fontSize: '0.7rem', padding: '1px 4px', height: '20px' }}
                                                                                                autoFocus
                                                                                                disabled={savingCode}
                                                                                            />
                                                                                            <button
                                                                                                className="btn btn-sm p-0"
                                                                                                onClick={() => saveEditCode(branch.id)}
                                                                                                disabled={savingCode}
                                                                                                style={{ width: '16px', height: '16px' }}
                                                                                            >
                                                                                                {savingCode ? <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }} /> : <Check size={10} className="text-success" />}
                                                                                            </button>
                                                                                            <button
                                                                                                className="btn btn-sm p-0"
                                                                                                onClick={cancelEditCode}
                                                                                                disabled={savingCode}
                                                                                                style={{ width: '16px', height: '16px' }}
                                                                                            >
                                                                                                <X size={10} className="text-danger" />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span
                                                                                            className={`badge bg-secondary-lt ${isSuperAdmin ? 'cursor-pointer' : ''}`}
                                                                                            style={{ fontSize: '0.65rem', padding: '1px 4px' }}
                                                                                            onClick={() => isSuperAdmin && startEditCode(branch.id, branch.code || '')}
                                                                                            title={isSuperAdmin ? '클릭하여 코드 수정' : ''}
                                                                                        >
                                                                                            {branch.code || '-'}
                                                                                            {isSuperAdmin && <Edit size={8} className="ms-1 text-muted" />}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                        <div className="d-flex flex-column align-items-center">
                                                                            <span style={{ color: '#059669', fontWeight: 600 }}>{branch._count?.kiosks || 0}</span>
                                                                            {(branch._acquisitionCount?.free || branch._acquisitionCount?.leaseFree || branch._acquisitionCount?.paid || branch._acquisitionCount?.rental) ? (
                                                                                <div className="d-flex gap-1 flex-wrap justify-content-center" style={{ fontSize: '0.65rem' }}>
                                                                                    {branch._acquisitionCount?.free ? (
                                                                                        <span className="badge bg-green-lt text-green" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                                                                                            무상{branch._acquisitionCount.free}
                                                                                        </span>
                                                                                    ) : null}
                                                                                    {branch._acquisitionCount?.leaseFree ? (
                                                                                        <span className="badge bg-purple-lt text-purple" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                                                                                            리스{branch._acquisitionCount.leaseFree}
                                                                                        </span>
                                                                                    ) : null}
                                                                                    {branch._acquisitionCount?.paid ? (
                                                                                        <span className="badge bg-cyan-lt text-cyan" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                                                                                            유상{branch._acquisitionCount.paid}
                                                                                        </span>
                                                                                    ) : null}
                                                                                    {branch._acquisitionCount?.rental ? (
                                                                                        <span className="badge bg-orange-lt text-orange" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                                                                                            렌탈{branch._acquisitionCount.rental}
                                                                                        </span>
                                                                                    ) : null}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ verticalAlign: 'middle' }}>
                                                                        <div className="d-flex gap-1 justify-content-center align-items-center">
                                                                            <label className="form-check form-switch mb-0" style={{ minHeight: 'auto' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="form-check-input"
                                                                                    checked={branch.isActive}
                                                                                    onChange={() => handleToggleBranchActive(branch.id, branch.isActive)}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                />
                                                                            </label>
                                                                            <button
                                                                                className="btn btn-sm btn-ghost-primary p-1"
                                                                                title={tc('edit')}
                                                                                onClick={() => openEditModal('branch', branch)}
                                                                            >
                                                                                <Edit size={14} />
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-ghost-danger p-1"
                                                                                title={tc('delete')}
                                                                                onClick={() => handleDeleteBranch(branch.id)}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                        {selectedFc.corporations
                                                            .filter(corp => branchCorpFilter === 'all' || corp.id === branchCorpFilter)
                                                            .every(c => c.branches.length === 0) && (
                                                            <tr>
                                                                <td colSpan={3} className="text-center text-muted py-3">
                                                                    {tcl('noBranches')}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'settings' && (
                                        <div>
                                            <div className="mb-4">
                                                <h6 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>
                                                    <Settings size={16} className="me-2" />
                                                    {tcl('fcSettings')}
                                                </h6>

                                                {/* 계약 정보 */}
                                                <div className="card mb-3">
                                                    <div className="card-header py-2" style={{ fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                                                        {tcl('contractInfo')}
                                                    </div>
                                                    <div className="card-body py-3">
                                                        <div className="row g-3">
                                                            <div className="col-md-6">
                                                                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>{tcl('contractDate')}</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    value={fcSettings.contractDate}
                                                                    onChange={(e) => setFcSettings(prev => ({ ...prev, contractDate: e.target.value }))}
                                                                    onBlur={(e) => {
                                                                        const parsed = parseDateInput(e.target.value)
                                                                        if (parsed !== e.target.value) {
                                                                            setFcSettings(prev => ({ ...prev, contractDate: parsed }))
                                                                        }
                                                                    }}
                                                                    placeholder="YYYY-MM-DD"
                                                                    style={{ fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                            <div className="col-12">
                                                                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>{tcl('memo')}</label>
                                                                <textarea
                                                                    className="form-control form-control-sm"
                                                                    rows={3}
                                                                    value={fcSettings.memo}
                                                                    onChange={(e) => setFcSettings(prev => ({ ...prev, memo: e.target.value }))}
                                                                    placeholder={tcl('memoPlaceholder')}
                                                                    style={{ fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 요금 정보 */}
                                                <div className="card mb-3">
                                                    <div className="card-header py-2" style={{ fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#f8fafc' }}>
                                                        {tcl('feeInfo')}
                                                    </div>
                                                    <div className="card-body py-3">
                                                        <div className="row g-3">
                                                            <div className="col-md-6">
                                                                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>{tcl('erpFee')}</label>
                                                                <div className="input-group input-group-sm">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control"
                                                                        value={fcSettings.erpFeeRate}
                                                                        onChange={(e) => setFcSettings(prev => ({ ...prev, erpFeeRate: e.target.value }))}
                                                                        placeholder="0"
                                                                        step="0.1"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    />
                                                                    <span className="input-group-text" style={{ fontSize: '0.8rem' }}>{tcl('percentUnit')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>{tcl('kioskMaintenance')}</label>
                                                                <div className="input-group input-group-sm">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control"
                                                                        value={fcSettings.kioskMaintenanceCost}
                                                                        onChange={(e) => setFcSettings(prev => ({ ...prev, kioskMaintenanceCost: e.target.value }))}
                                                                        placeholder="0"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    />
                                                                    <span className="input-group-text" style={{ fontSize: '0.8rem' }}>{tcl('wonPerMonth')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>{tcl('kioskSale')}</label>
                                                                <div className="input-group input-group-sm">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control"
                                                                        value={fcSettings.kioskSaleCost}
                                                                        onChange={(e) => setFcSettings(prev => ({ ...prev, kioskSaleCost: e.target.value }))}
                                                                        placeholder="0"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    />
                                                                    <span className="input-group-text" style={{ fontSize: '0.8rem' }}>{tcl('wonPerUnit')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-primary py-1 px-2"
                                                        style={{ fontSize: '0.8rem' }}
                                                        onClick={saveFcSettings}
                                                        disabled={savingSettings}
                                                    >
                                                        {savingSettings ? (
                                                            <><span className="spinner-border spinner-border-sm me-1"></span> 저장 중...</>
                                                        ) : tcl('saveSettings')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {detailTab === 'history' && (
                                        <div>
                                            <h6 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>
                                                <History size={16} className="me-2" />
                                                {tcl('historyTitle')}
                                            </h6>

                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover" style={{ fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr className="bg-light">
                                                            <th style={{ fontWeight: 600, color: '#475569', width: '150px' }}>{tcl('historyDate')}</th>
                                                            <th style={{ fontWeight: 600, color: '#475569', width: '80px' }}>{tcl('historyAction')}</th>
                                                            <th style={{ fontWeight: 600, color: '#475569' }}>{tcl('historyDetail')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(() => {
                                                            // FC와 하위 법인/지점의 createdAt/updatedAt 정보를 수집
                                                            const historyItems: HistoryItem[] = []

                                                            // FC 생성
                                                            if (selectedFc.createdAt) {
                                                                historyItems.push({
                                                                    id: `fc-created-${selectedFc.id}`,
                                                                    date: new Date(selectedFc.createdAt),
                                                                    action: 'created',
                                                                    type: 'fc',
                                                                    target: getDisplayName(selectedFc),
                                                                    detail: `FC 생성: ${getDisplayName(selectedFc)}`
                                                                })
                                                            }

                                                            // FC 수정 (createdAt과 다른 경우)
                                                            if (selectedFc.updatedAt && selectedFc.createdAt !== selectedFc.updatedAt) {
                                                                historyItems.push({
                                                                    id: `fc-updated-${selectedFc.id}`,
                                                                    date: new Date(selectedFc.updatedAt),
                                                                    action: 'updated',
                                                                    type: 'fc',
                                                                    target: getDisplayName(selectedFc),
                                                                    detail: `FC 정보 수정: ${getDisplayName(selectedFc)}`
                                                                })
                                                            }

                                                            // 법인들
                                                            selectedFc.corporations.forEach(corp => {
                                                                if (corp.createdAt) {
                                                                    historyItems.push({
                                                                        id: `corp-created-${corp.id}`,
                                                                        date: new Date(corp.createdAt),
                                                                        action: 'created',
                                                                        type: 'corp',
                                                                        target: getDisplayName(corp),
                                                                        detail: `법인 추가: ${getDisplayName(corp)}`
                                                                    })
                                                                }
                                                                if (corp.updatedAt && corp.createdAt !== corp.updatedAt) {
                                                                    historyItems.push({
                                                                        id: `corp-updated-${corp.id}`,
                                                                        date: new Date(corp.updatedAt),
                                                                        action: 'updated',
                                                                        type: 'corp',
                                                                        target: getDisplayName(corp),
                                                                        detail: `법인 수정: ${getDisplayName(corp)}`
                                                                    })
                                                                }

                                                                // 지점들
                                                                corp.branches.forEach(branch => {
                                                                    if (branch.createdAt) {
                                                                        historyItems.push({
                                                                            id: `branch-created-${branch.id}`,
                                                                            date: new Date(branch.createdAt),
                                                                            action: 'created',
                                                                            type: 'branch',
                                                                            target: getDisplayName(branch),
                                                                            detail: `지점 추가: ${getDisplayName(branch)} (${getDisplayName(corp)})`
                                                                        })
                                                                    }
                                                                    if (branch.updatedAt && branch.createdAt !== branch.updatedAt) {
                                                                        historyItems.push({
                                                                            id: `branch-updated-${branch.id}`,
                                                                            date: new Date(branch.updatedAt),
                                                                            action: 'updated',
                                                                            type: 'branch',
                                                                            target: getDisplayName(branch),
                                                                            detail: `지점 수정: ${getDisplayName(branch)} (${getDisplayName(corp)})`
                                                                        })
                                                                    }
                                                                })
                                                            })

                                                            // 날짜 내림차순 정렬
                                                            historyItems.sort((a, b) => b.date.getTime() - a.date.getTime())

                                                            if (historyItems.length === 0) {
                                                                return (
                                                                    <tr>
                                                                        <td colSpan={3} className="text-center text-muted py-4">
                                                                            {tcl('noHistory') || '변경 이력이 없습니다'}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            }

                                                            return historyItems.slice(0, 20).map(item => (
                                                                <tr key={item.id}>
                                                                    <td style={{ color: '#64748b' }}>
                                                                        {item.date.toLocaleDateString('ko-KR')} {item.date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${item.action === 'created' ? 'bg-green-lt text-green' : 'bg-blue-lt text-blue'}`}>
                                                                            {item.action === 'created' ? tcl('actionCreated') : tcl('actionUpdated')}
                                                                        </span>
                                                                    </td>
                                                                    <td>{item.detail}</td>
                                                                </tr>
                                                            ))
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : selectedIndependentCorp ? (
                            <>
                                {/* 독립법인 상세 헤더 - Updated */}
                                <div className="p-3 border-bottom">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="rounded-circle bg-warning d-flex align-items-center justify-content-center"
                                                style={{ width: '42px', height: '42px' }}
                                            >
                                                <Store size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <div className="d-flex align-items-center gap-2">
                                                    {editingCorpCodeId === selectedIndependentCorp.id ? (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={editingCorpCodeValue}
                                                                onChange={(e) => setEditingCorpCodeValue(e.target.value.toUpperCase())}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveEditCorpCode(selectedIndependentCorp.id)
                                                                    if (e.key === 'Escape') cancelEditCorpCode()
                                                                }}
                                                                style={{ width: '140px', fontSize: '0.85rem', padding: '4px 8px' }}
                                                                autoFocus
                                                                disabled={savingCorpCode}
                                                            />
                                                            <button
                                                                className="btn btn-sm p-1"
                                                                onClick={() => saveEditCorpCode(selectedIndependentCorp.id)}
                                                                disabled={savingCorpCode}
                                                            >
                                                                {savingCorpCode ? <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} /> : <Check size={14} className="text-success" />}
                                                            </button>
                                                            <button
                                                                className="btn btn-sm p-1"
                                                                onClick={cancelEditCorpCode}
                                                                disabled={savingCorpCode}
                                                            >
                                                                <X size={14} className="text-danger" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="badge bg-warning-lt text-warning border-0"
                                                            style={{ fontSize: '0.85rem', padding: '4px 10px', cursor: 'pointer' }}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('코드 클릭됨:', selectedIndependentCorp.code);
                                                                startEditCorpCode(selectedIndependentCorp.id, selectedIndependentCorp.code || '');
                                                            }}
                                                            title={tcl('clickToEditCode')}
                                                        >
                                                            {selectedIndependentCorp.code || 'NO_CODE'}
                                                        </button>
                                                    )}
                                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{getDisplayName(selectedIndependentCorp)}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
                                                    <span>
                                                        {tcl('corp')} <strong style={{ color: '#1e293b' }}>0</strong>
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        <strong style={{ color: '#1e293b' }}>{selectedIndependentCorp.branches.length}</strong> {tcl('branch')}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="d-flex align-items-center gap-1">
                                                        <KioskIcon size={14} className="text-success" />
                                                        <strong style={{ color: '#059669' }}>
                                                            {selectedIndependentCorp.branches.reduce((s, b) => s + (b._count?.kiosks || 0), 0)}
                                                        </strong>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                style={{ padding: '4px 8px' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openEditModal('corp', selectedIndependentCorp);
                                                }}
                                                title={tc('edit')}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                style={{ padding: '4px 8px' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteCorp(selectedIndependentCorp.id);
                                                }}
                                                title={tc('delete')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 탭 */}
                                <div className="border-bottom">
                                    <div className="d-flex px-3">
                                        {['corp', 'branch', 'settings', 'history'].map(tab => (
                                            <button
                                                key={tab}
                                                className={`btn btn-link px-3 py-2 text-decoration-none ${detailTab === tab ? 'border-bottom border-primary border-2 text-primary' : 'text-muted'}`}
                                                style={{ fontSize: '0.9rem', fontWeight: 500 }}
                                                onClick={() => setDetailTab(tab as typeof detailTab)}
                                            >
                                                {tcl(tab)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 탭 컨텐츠 */}
                                <div className="p-3">
                                    {detailTab === 'corp' && (
                                        <div className="text-center text-muted py-4">
                                            <Store size={32} className="mb-2 opacity-50" />
                                            <p style={{ fontSize: '0.85rem' }}>{tcl('independentCorpInfo')}</p>
                                            <dl className="row text-start mt-3" style={{ fontSize: '0.85rem' }}>
                                                <dt className="col-4 text-muted">{tcl('corpName')}</dt>
                                                <dd className="col-8">{getDisplayName(selectedIndependentCorp)}</dd>
                                                <dt className="col-4 text-muted">{tcl('corpCode')}</dt>
                                                <dd className="col-8">{selectedIndependentCorp.code || '-'}</dd>
                                                <dt className="col-4 text-muted">{tcl('contact')}</dt>
                                                <dd className="col-8">{selectedIndependentCorp.contact || '-'}</dd>
                                                <dt className="col-4 text-muted">{tcl('address')}</dt>
                                                <dd className="col-8">{selectedIndependentCorp.address || '-'}</dd>
                                            </dl>
                                        </div>
                                    )}

                                    {detailTab === 'branch' && (
                                        <>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="input-icon" style={{ width: '200px' }}>
                                                    <span className="input-icon-addon"><Search size={14} /></span>
                                                    <Input placeholder={tcl('searchPlaceholder')} className="ps-5" style={{ fontSize: '0.85rem', height: '32px' }} />
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary py-1 px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => openModal('branch', undefined, selectedIndependentCorp.id)}
                                                >
                                                    {tcl('branchAdd')} +
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr className="bg-light">
                                                            <th style={{ fontWeight: 600, color: '#475569' }}>{tcl('branchName')}</th>
                                                            <th style={{ fontWeight: 600, color: '#475569', textAlign: 'center', width: '50px', verticalAlign: 'middle' }}>
                                                                <KioskIcon size={14} />
                                                            </th>
                                                            <th style={{ fontWeight: 600, color: '#475569', width: '70px', textAlign: 'center' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedIndependentCorp.branches.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={3} className="text-center text-muted py-4">
                                                                    {tcl('noBranches')}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            selectedIndependentCorp.branches.map(branch => (
                                                                <tr key={branch.id} style={!branch.isActive ? { opacity: 0.6 } : undefined}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <MapPin size={12} className={branch.isActive ? 'text-success' : 'text-secondary'} />
                                                                            <div>
                                                                                <div style={{ fontWeight: 500, color: branch.isActive ? '#1e293b' : '#94a3b8' }}>
                                                                                    {getDisplayName(branch)}
                                                                                    {!branch.isActive && <span className="badge bg-secondary ms-1" style={{ fontSize: '0.6rem' }}>비활성</span>}
                                                                                </div>
                                                                                <span className="badge bg-secondary-lt" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                                                                                    {branch.code || '-'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                        <span style={{ color: '#059669', fontWeight: 600 }}>{branch._count?.kiosks || 0}</span>
                                                                    </td>
                                                                    <td style={{ verticalAlign: 'middle' }}>
                                                                        <div className="d-flex gap-1 justify-content-center align-items-center">
                                                                            <label className="form-check form-switch mb-0" style={{ minHeight: 'auto' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="form-check-input"
                                                                                    checked={branch.isActive}
                                                                                    onChange={() => handleToggleBranchActive(branch.id, branch.isActive)}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                />
                                                                            </label>
                                                                            <button
                                                                                className="btn btn-sm btn-ghost-primary p-1"
                                                                                title={tc('edit')}
                                                                                onClick={() => openEditModal('branch', branch)}
                                                                            >
                                                                                <Edit size={14} />
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-ghost-danger p-1"
                                                                                title={tc('delete')}
                                                                                onClick={() => handleDeleteBranch(branch.id)}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'settings' && (
                                        <div className="text-center text-muted py-4">
                                            <Settings size={32} className="mb-2 opacity-50" />
                                            <p style={{ fontSize: '0.85rem' }}>{tcl('noSettingsForIndependent')}</p>
                                        </div>
                                    )}

                                    {detailTab === 'history' && (
                                        <div className="text-center text-muted py-4">
                                            <History size={32} className="mb-2 opacity-50" />
                                            <p style={{ fontSize: '0.85rem' }}>{tcl('noHistoryYet')}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100">
                                <div className="text-center text-muted">
                                    <Building2 size={48} className="mb-3 opacity-25" />
                                    <p style={{ fontSize: '0.85rem' }}>{tcl('selectFcToView')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 등록 모달 */}
            {showModal && (
                <div className="modal modal-blur fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: '8px' }}>
                            <div className="modal-header border-0 pb-0">
                                <div>
                                    <h6 className="modal-title mb-0">{getModalTitle()}</h6>
                                </div>
                                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditingId(null); }} />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row g-2">
                                        {/* 지점 등록/편집 시 법인 선택 드롭다운 */}
                                        {modalType === 'branch' && (
                                            <div className="col-12">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                                    {tcl('selectCorporation')} *
                                                </label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={selectedCorpId || ''}
                                                    onChange={async (e) => {
                                                        const newCorpId = e.target.value
                                                        setSelectedCorpId(newCorpId || null)

                                                        // 선택된 법인의 FC도 함께 설정
                                                        let foundFcId = ''
                                                        for (const fc of fcs) {
                                                            const corp = fc.corporations.find(c => c.id === newCorpId)
                                                            if (corp) {
                                                                foundFcId = fc.id
                                                                setSelectedFcId(fc.id)
                                                                break
                                                            }
                                                        }
                                                        if (!foundFcId) {
                                                            // 독립법인인 경우
                                                            setSelectedFcId(null)
                                                        }

                                                        // 신규 등록 시에만 지점 코드 추천 가져오기
                                                        if (!editingId && newCorpId) {
                                                            try {
                                                                const res = await fetch(`/api/branches/next-code?corporationId=${newCorpId}`)
                                                                if (res.ok) {
                                                                    const data = await res.json()
                                                                    setFormData(prev => ({...prev, code: data.nextCode || ''}))
                                                                    setExistingBranchCodes(data.existingCodes || [])
                                                                }
                                                            } catch (err) {
                                                                console.error('지점 코드 조회 실패:', err)
                                                            }
                                                        } else if (!editingId) {
                                                            setFormData(prev => ({...prev, code: ''}))
                                                            setExistingBranchCodes([])
                                                        }
                                                    }}
                                                    required
                                                >
                                                    <option value="">{tcl('selectCorporationPlaceholder')}</option>
                                                    {/* 선택된 FC가 있으면 해당 FC의 법인만 표시, 없으면 모든 법인 표시 */}
                                                    {selectedFc ? (
                                                        // 선택된 FC의 법인만 표시
                                                        selectedFc.corporations.map(corp => (
                                                            <option key={corp.id} value={corp.id}>
                                                                [{corp.code}] {getDisplayName(corp)}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        // FC 선택 안됐을 때: 모든 FC 소속 법인들
                                                        <>
                                                            {fcs.map(fc => (
                                                                <optgroup key={fc.id} label={`[${fc.code}] ${getDisplayName(fc)}`}>
                                                                    {fc.corporations.map(corp => (
                                                                        <option key={corp.id} value={corp.id}>
                                                                            [{corp.code}] {getDisplayName(corp)}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            ))}
                                                            {/* 독립법인들 */}
                                                            {independentCorps.length > 0 && (
                                                                <optgroup label={tcl('independentCorp')}>
                                                                    {independentCorps.map(corp => (
                                                                        <option key={corp.id} value={corp.id}>
                                                                            [{corp.code}] {getDisplayName(corp)}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            )}
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        )}

                                        {modalType !== 'partner' && (
                                            <div className="col-md-4">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                                    {modalType === 'branch' ? tcl('branchCode') : modalType === 'corp' ? tcl('corpCode') : modalType === 'fc' ? tcl('fcCode') : tcl('code')}
                                                </label>
                                                <div className="input-group input-group-sm">
                                                    <input
                                                        type="text"
                                                        className={`form-control form-control-sm ${
                                                            modalType === 'branch' && !editingId && formData.code && existingBranchCodes.includes(formData.code)
                                                                ? 'is-invalid'
                                                                : modalType === 'corp' && !editingId && formData.code && existingCorpCodes.includes(formData.code)
                                                                ? 'is-invalid'
                                                                : ''
                                                        }`}
                                                        placeholder={modalType === 'fc' ? tcl('fcCodeHint') : ''}
                                                        value={formData.code}
                                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                                    />
                                                    {/* 지점/법인 등록 시 다음 추천 코드 버튼 */}
                                                    {!editingId && (modalType === 'branch' || modalType === 'corp') && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            title={tcl('nextSuggestedCode')}
                                                            onClick={async () => {
                                                                if (modalType === 'branch') {
                                                                    // 지점 코드는 단순 숫자 형식
                                                                    const nextCode = getNextCode(existingBranchCodes)
                                                                    setFormData({...formData, code: nextCode})
                                                                } else if (modalType === 'corp') {
                                                                    // 법인 코드는 API에서 형식에 맞게 가져오기
                                                                    try {
                                                                        const url = formData.fcId
                                                                            ? `/api/corporations/next-code?fcId=${formData.fcId}`
                                                                            : '/api/corporations/next-code'
                                                                        const res = await fetch(url)
                                                                        if (res.ok) {
                                                                            const data = await res.json()
                                                                            setFormData({...formData, code: data.nextCode || ''})
                                                                            setExistingCorpCodes(data.existingCodes || [])
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('법인 코드 조회 실패:', err)
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                {/* 지점 코드 중복 경고 */}
                                                {modalType === 'branch' && !editingId && formData.code && existingBranchCodes.includes(formData.code) && (
                                                    <div className="invalid-feedback d-block" style={{ fontSize: '0.75rem' }}>
                                                        <AlertCircle size={12} className="me-1" style={{ display: 'inline' }} />
                                                        {tcl('codeDuplicate')}
                                                    </div>
                                                )}
                                                {/* 지점 등록 시 기존 지점 코드 목록 표시 및 추천 코드 */}
                                                {modalType === 'branch' && !editingId && existingBranchCodes.length > 0 && !existingBranchCodes.includes(formData.code) && (
                                                    <div className="mt-1">
                                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {tcl('existingCodes')}: {existingBranchCodes.join(', ')}
                                                        </small>
                                                    </div>
                                                )}
                                                {/* 법인 코드 중복 경고 */}
                                                {modalType === 'corp' && !editingId && formData.code && existingCorpCodes.includes(formData.code) && (
                                                    <div className="invalid-feedback d-block" style={{ fontSize: '0.75rem' }}>
                                                        <AlertCircle size={12} className="me-1" style={{ display: 'inline' }} />
                                                        {tcl('codeDuplicate')}
                                                    </div>
                                                )}
                                                {/* 법인 등록 시 기존 법인 코드 목록 표시 */}
                                                {modalType === 'corp' && !editingId && existingCorpCodes.length > 0 && !existingCorpCodes.includes(formData.code) && (
                                                    <div className="mt-1">
                                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {tcl('existingCodes')}: {existingCorpCodes.join(', ')}
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={modalType !== 'partner' ? "col-md-8" : "col-12"}>
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                                {modalType === 'fc' ? '브랜드명 *' : modalType === 'branch' ? tcl('branchNameKo') : tcl('nameKo') + ' *'}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                                {modalType === 'fc' ? '브랜드명(일본어)' : modalType === 'branch' ? tcl('branchNameJa') : tcl('nameJa')}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.nameJa}
                                                onChange={e => setFormData({...formData, nameJa: e.target.value})}
                                            />
                                        </div>

                                        {/* FC 등록 시 법인명 입력 (브랜드명과 분리) */}
                                        {modalType === 'fc' && (
                                            <>
                                                <div className="col-12 mt-2">
                                                    <hr className="my-2" />
                                                    <small className="text-muted">자동 생성될 법인 정보 (미입력 시 브랜드명과 동일하게 생성)</small>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                                        {tcl('nameKo')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder={formData.name || '브랜드명과 동일'}
                                                        value={formData.corpName}
                                                        onChange={e => setFormData({...formData, corpName: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                                        {tcl('nameJa')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder={formData.nameJa || '브랜드명(일본어)과 동일'}
                                                        value={formData.corpNameJa}
                                                        onChange={e => setFormData({...formData, corpNameJa: e.target.value})}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {modalType === 'corp' && (
                                            <div className="col-12">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>{tcl('belongFc')}</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={formData.fcId}
                                                    onChange={async (e) => {
                                                        const newFcId = e.target.value
                                                        setFormData({...formData, fcId: newFcId})

                                                        // FC 변경 시 해당 FC의 법인 코드 목록과 추천 코드 다시 가져오기
                                                        if (!editingId) {
                                                            try {
                                                                const url = newFcId
                                                                    ? `/api/corporations/next-code?fcId=${newFcId}`
                                                                    : '/api/corporations/next-code'
                                                                const res = await fetch(url)
                                                                if (res.ok) {
                                                                    const data = await res.json()
                                                                    setFormData(prev => ({...prev, fcId: newFcId, code: data.nextCode || ''}))
                                                                    setExistingCorpCodes(data.existingCodes || [])
                                                                }
                                                            } catch (err) {
                                                                console.error('법인 코드 조회 실패:', err)
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <option value="">{tcl('independentCorp')}</option>
                                                    {fcs.map(fc => (
                                                        <option key={fc.id} value={fc.id}>[{fc.code}] {getDisplayName(fc)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="col-12">
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>{tcl('postalCode')}</label>
                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="104-8125"
                                                    value={formData.postalCode}
                                                    onChange={e => setFormData({...formData, postalCode: e.target.value})}
                                                />
                                                <button type="button" className="btn btn-outline-primary" onClick={searchPostalCode} disabled={postalSearching}>
                                                    {postalSearching ? <span className="spinner-border spinner-border-sm" /> : tcl('postalSearch')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>{tcl('address')}</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.address}
                                                onChange={e => {
                                                    const newAddress = e.target.value
                                                    // 주소 변경 시 자동 매핑
                                                    const { regionCode, areaCode } = mapAddressToRegion(newAddress)
                                                    setFormData({...formData, address: newAddress, regionCode, areaCode})
                                                }}
                                            />
                                        </div>

                                        {/* 지역명/관할지역명 표시 (지점 편집 시에만) */}
                                        {modalType === 'branch' && (
                                            <>
                                                <div className="col-6">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>지역명</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={formData.regionCode ? `${getRegionName(formData.regionCode)} (${formData.regionCode})` : ''}
                                                        readOnly
                                                        style={{ backgroundColor: '#f8f9fa' }}
                                                        placeholder="주소 입력 시 자동 매핑"
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>관할지역</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={formData.areaCode ? `${getAreaName(formData.areaCode)} (${formData.areaCode})` : ''}
                                                        readOnly
                                                        style={{ backgroundColor: '#f8f9fa' }}
                                                        placeholder="주소 입력 시 자동 매핑"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {modalType === 'branch' ? (
                                            <>
                                                <div className="col-12">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>{tcl('managerName')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={formData.managerName}
                                                        onChange={e => setFormData({...formData, managerName: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>{tcl('contact')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={formData.managerPhone}
                                                        onChange={e => setFormData({...formData, managerPhone: e.target.value})}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-12">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>{tcl('contact')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={formData.contact}
                                                    onChange={e => setFormData({...formData, contact: e.target.value})}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditingId(null); }}>
                                        {tc('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={
                                            saving ||
                                            Boolean(modalType === 'branch' && !editingId && formData.code && existingBranchCodes.includes(formData.code)) ||
                                            Boolean(modalType === 'corp' && !editingId && formData.code && existingCorpCodes.includes(formData.code))
                                        }
                                    >
                                        {saving && <span className="spinner-border spinner-border-sm me-1"></span>}
                                        {tc('save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV 업로드 모달 */}
            {showCsvModal && (
                <div className="modal modal-blur fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: '8px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h6 className="modal-title">
                                    <FileSpreadsheet size={18} className="me-2" />
                                    {tcl('csvBulkTitle')}
                                </h6>
                                <button type="button" className="btn-close" onClick={() => setShowCsvModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.8rem' }}>
                                    <strong>{tcl('csvBulkDesc')}</strong>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>CSV / XLSX {tcl('fileSelect')}</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        className="form-control form-control-sm"
                                        onChange={handleFileChange}
                                    />
                                    {csvFile && (
                                        <div className="mt-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                            {tcl('selected')}: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-check">
                                        <input type="checkbox" className="form-check-input" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} />
                                        <span className="form-check-label" style={{ fontSize: '0.8rem' }}>{tcl('autoTranslateOption')}</span>
                                    </label>
                                </div>

                                <div className="mb-3">
                                    <a href="/api/clients/csv-sample" download className="btn btn-outline-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                                        <Download size={12} className="me-1" />
                                        {tcl('downloadSampleCsv')}
                                    </a>
                                </div>

                                {csvResult && (
                                    <div className={`alert py-2 ${csvResult.results ? 'alert-success' : 'alert-danger'}`} style={{ fontSize: '0.8rem' }}>
                                        <strong>{csvResult.message}</strong>
                                        {csvResult.results && (
                                            <div className="mt-1">
                                                <span>FC: {csvResult.results.created.fc}{tcl('csvResultUnit')}</span>
                                                <span className="mx-2">·</span>
                                                <span>{tcl('corp')}: {csvResult.results.created.corporation}{tcl('csvResultUnit')}</span>
                                                <span className="mx-2">·</span>
                                                <span>{tcl('branch')}: {csvResult.results.created.branch}{tcl('csvResultUnit')}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCsvModal(false)}>{tcl('close')}</button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={handleCsvUpload} disabled={!csvFile || csvUploading}>
                                    {csvUploading ? <span className="spinner-border spinner-border-sm me-1"></span> : <Upload size={12} className="me-1" />}
                                    {tcl('upload')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 우편번호 검색 결과 모달 */}
            {showPostalModal && (
                <div className="modal modal-blur fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: '8px' }}>
                            <div className="modal-header">
                                <h6 className="modal-title">
                                    <MapPin size={16} className="me-2" />
                                    {tcl('postalSearchTitle')}
                                </h6>
                                <button type="button" className="btn-close" onClick={() => setShowPostalModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="mb-2" style={{ fontSize: '0.8rem' }}>
                                    <span className="text-muted">{tcl('searchResults')}: </span>
                                    <strong>{postalResults.length}{tcl('resultsCount')}</strong>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-sm table-hover table-bordered" style={{ fontSize: '0.8rem' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '40px' }}></th>
                                                <th>{tcl('postalCode')}</th>
                                                <th>{tcl('prefecture')}</th>
                                                <th>{tcl('city')}</th>
                                                <th>{tcl('town')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {postalResults.map((result) => (
                                                <tr
                                                    key={result.id}
                                                    className={selectedPostalId === result.id ? 'table-primary' : ''}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setSelectedPostalId(result.id)}
                                                >
                                                    <td className="text-center">
                                                        <input type="radio" name="postalResult" checked={selectedPostalId === result.id} onChange={() => setSelectedPostalId(result.id)} className="form-check-input" />
                                                    </td>
                                                    <td>{result.postalCode}</td>
                                                    <td>{result.prefecture}</td>
                                                    <td>{result.city}</td>
                                                    <td>{result.town}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPostalModal(false)}>{tcl('close')}</button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={selectPostalResult} disabled={!selectedPostalId}>{tcl('selectAddress')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
