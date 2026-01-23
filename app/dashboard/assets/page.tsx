'use client'

import Papa from 'papaparse'
import { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Partner = {
    id: string
    name: string
    nameJa: string | null
}

type Corporation = {
    id: string
    code: string
    name: string
    nameJa: string | null
    contractDate: string | null
    erpFeeRate: number | null
    kioskMaintenanceCost: number | null
    kioskSaleCost: number | null
    fc?: {
        id: string
        code: string
        name: string
    } | null
}

type Branch = {
    id: string
    code: string
    name: string
    nameJa: string | null
    corporationId: string
    regionCode: string | null
    areaCode: string | null
    address: string | null
    postalCode: string | null
    managerPhone: string | null
}

type Kiosk = {
    id: string
    serialNumber: string
    kioskNumber: string | null
    anydeskId: string | null
    brandName: string | null
    currentPartnerId: string | null
    currentPartner: Partner | null
    branchId: string | null
    branchName: string | null
    regionCode: string | null
    areaCode: string | null
    acquisition: string
    salePrice: number | null
    orderRequestDate: string | null
    deliveryDueDate: string | null
    deliveryDate: string | null
    latestEventDate: string | null  // 최신 이력의 eventDate (납품일로 표시)
    latestMoveType: string | null  // 최신 이력의 이동유형
    latestBranchName: string | null  // 최신 이력의 지점명
    latestBranch?: {
        id: string
        name: string
        nameJa: string | null
        regionCode: string | null
        areaCode: string | null
        corporation?: {
            id: string
            name: string
            nameJa: string | null
            code: string | null
            fc?: {
                id: string
                code: string
                name: string
                nameJa: string | null
            } | null
        } | null
    } | null
    latestCorporation?: {
        id: string
        name: string
        nameJa: string | null
        code: string | null
        fc?: {
            id: string
            code: string
            name: string
            nameJa: string | null
        } | null
    } | null
    leaseCompanyId: string | null
    leaseCompany?: {
        id: string
        code: string
        name: string
        nameJa: string | null
    } | null
    deliveryStatus: string
    status: string
    memo: string | null
    _count?: { history: number }
    branch?: {
        id: string
        name: string
        nameJa: string | null
        regionCode: string | null
        areaCode: string | null
        corporation?: {
            id: string
            name: string
            nameJa: string | null
            code: string | null
            fc?: {
                id: string
                code: string
                name: string
                nameJa: string | null
            } | null
        } | null
    } | null
}

type HistoryItem = {
    id: string
    moveType: string
    prevLocation: string | null
    newLocation: string | null
    prevPartner: Partner | null
    newPartner: Partner | null
    prevBranch: string | null
    newBranch: string | null
    prevBranchRel: { id: string; name: string; nameJa: string | null } | null
    newBranchRel: { id: string; name: string; nameJa: string | null } | null
    prevCorporation: { id: string; name: string; nameJa: string | null } | null
    newCorporation: { id: string; name: string; nameJa: string | null } | null
    prevStatus: string | null
    newStatus: string | null
    repairReason: string | null
    repairCost: number | null
    repairVendor: string | null
    eventDate: string
    description: string | null
    handledBy: string | null
}

type LeaseCompany = {
    id: string
    code: string
    name: string
    nameJa: string | null
    defaultMonthlyFee: number | null
    defaultPeriod: number | null
}

type Region = {
    id: string
    code: string
    name: string
    nameJa: string | null
    prefectures: string | null
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

export default function AssetsPage() {
    const t = useTranslations('assets')
    const tc = useTranslations('common')
    const th = useTranslations('history')
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = useLocale()

    // URL에서 page 파라미터 가져오기
    const initialPage = parseInt(searchParams.get('page') || '1', 10)

    const [kiosks, setKiosks] = useState<Kiosk[]>([])
    const [partners, setPartners] = useState<Partner[]>([])
    const [corporations, setCorporations] = useState<Corporation[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // 페이지네이션 - URL의 page 파라미터로 초기화
    const [currentPage, setCurrentPage] = useState(initialPage)
    const itemsPerPage = 50

    // 페이지 변경 시 URL도 업데이트하는 함수
    const changePage = (newPage: number) => {
        setCurrentPage(newPage)
        // URL 파라미터 업데이트 (히스토리에 추가하지 않고 현재 URL만 변경)
        const url = new URL(window.location.href)
        url.searchParams.set('page', String(newPage))
        window.history.replaceState({}, '', url.toString())
    }

    // 이동이력 모달 관련
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedKioskForHistory, setSelectedKioskForHistory] = useState<Kiosk | null>(null)
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    // 컬럼 토글 관련
    const [showColumnSettings, setShowColumnSettings] = useState(false)
    // 필터 팝업 관련
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)

    // 인라인 편집 관련
    const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
    const [inlineEditValue, setInlineEditValue] = useState('')

    // 취득형태 인라인 편집 관련
    const [acquisitionEditingId, setAcquisitionEditingId] = useState<string | null>(null)
    const [acquisitionEditValue, setAcquisitionEditValue] = useState('')
    const [leaseCompanyValue, setLeaseCompanyValue] = useState<string | null>(null)
    const [leaseCompanies, setLeaseCompanies] = useState<LeaseCompany[]>([])

    const defaultColumns: Record<string, boolean> = {
        brandName: true,
        contractPartner: true,
        branchName: true,
        regionName: true,
        areaName: true,
        acquisition: true,
        salePrice: false,
        orderRequestDate: false,
        deliveryDueDate: false,
        deliveryDate: true,
        deliveryStatus: true,
        status: true,
        serialNumber: true,
        kioskNumber: true,
        anydeskId: true
    }

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(defaultColumns)

    // localStorage에서 컬럼 설정 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('kiosk-crm-asset-columns')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setVisibleColumns(prev => ({ ...prev, ...parsed }))
            } catch (e) {
                console.error('Failed to parse saved column settings:', e)
            }
        }
    }, [])

    // 컬럼 설정 저장
    const saveColumnSettings = () => {
        localStorage.setItem('kiosk-crm-asset-columns', JSON.stringify(visibleColumns))
        setShowColumnSettings(false)
        alert(t('columnSettingsSaved'))
    }

    const columnDefinitions = [
        { key: 'brandName', label: t('brandName') },
        { key: 'contractPartner', label: t('contractPartner') },
        { key: 'branchName', label: t('branchName') },
        { key: 'regionName', label: t('regionName') },
        { key: 'areaName', label: t('areaName') },
        { key: 'acquisition', label: t('acquisition') },
        { key: 'salePrice', label: t('salePrice') },
        { key: 'orderRequestDate', label: t('orderRequestDate') },
        { key: 'deliveryDueDate', label: t('deliveryDueDate') },
        { key: 'deliveryDate', label: t('deliveryDate') },
        { key: 'deliveryStatus', label: t('deliveryStatus') },
        { key: 'status', label: t('installStatus') },
        { key: 'serialNumber', label: t('serialNumber') },
        { key: 'kioskNumber', label: t('kioskNumber') },
        { key: 'anydeskId', label: t('anydeskId') }
    ]

    // 필터 상태
    const [filters, setFilters] = useState({
        brandName: '',
        corporationId: '',
        branchId: '',
        regionCode: '',
        areaCode: '',
        acquisition: '',
        deliveryStatus: '',
        status: ''
    })

    // KC자산 필터 (판매가격 0엔)
    const [showKcAssetOnly, setShowKcAssetOnly] = useState(false)

    // 계약법인 검색 드롭다운 상태
    const [corpSearchOpen, setCorpSearchOpen] = useState(false)
    const [corpSearchText, setCorpSearchText] = useState('')
    const corpDropdownRef = useRef<HTMLDivElement>(null)

    // 지점 검색 드롭다운 상태
    const [branchSearchOpen, setBranchSearchOpen] = useState(false)
    const [branchSearchText, setBranchSearchText] = useState('')
    const branchDropdownRef = useRef<HTMLDivElement>(null)

    const toggleColumn = (key: string) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const toggleAllColumns = (show: boolean) => {
        const newState: Record<string, boolean> = {}
        columnDefinitions.forEach(col => { newState[col.key] = show })
        setVisibleColumns(newState)
    }

    const [formData, setFormData] = useState({
        serialNumber: '',
        kioskNumber: '',
        anydeskId: '',
        brandName: '',
        currentPartnerId: '',
        corporationId: '',
        branchId: '',
        branchName: '',
        regionCode: '',
        areaCode: '',
        postalCode: '',
        address: '',
        managerPhone: '',
        contractDate: '',
        erpFeeRate: '',
        kioskMaintenanceCost: '',
        kioskSaleCost: '',
        acquisition: 'FREE',
        leaseCompanyId: '',
        salePrice: '',
        orderRequestDate: '',
        deliveryDueDate: '',
        deliveryDate: '',
        deliveryStatus: 'PENDING',
        status: 'IN_STOCK',
        memo: ''
    })

    // 날짜 입력 헬퍼: YYYYMMDD -> YYYY-MM-DD 자동 변환
    const handleDateInput = (field: string, value: string) => {
        // YYYY/MM/DD 형식을 YYYY-MM-DD로 변환
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
            const formatted = value.replace(/\//g, '-')
            setFormData(prev => ({ ...prev, [field]: formatted }))
            return
        }

        // YYYY-MM-DD 형식이면 그대로 사용
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            setFormData(prev => ({ ...prev, [field]: value }))
            return
        }

        // 숫자만 추출
        const digits = value.replace(/\D/g, '')

        // 8자리 숫자면 YYYY-MM-DD 형식으로 변환
        if (digits.length === 8) {
            const formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
            setFormData(prev => ({ ...prev, [field]: formatted }))
        } else if (value.includes('-') || value.includes('/')) {
            // 하이픈이나 슬래시가 포함된 부분 입력 중
            setFormData(prev => ({ ...prev, [field]: value }))
        } else {
            // 그 외 숫자 입력 중
            setFormData(prev => ({ ...prev, [field]: value }))
        }
    }

    const fetchData = async () => {
        try {
            const [kiosksRes, partnersRes, corporationsRes, branchesRes, regionsRes, areasRes, leaseCompaniesRes] = await Promise.all([
                fetch('/api/assets'),
                fetch('/api/partners'),
                fetch('/api/corporations'),
                fetch('/api/branches'),
                fetch('/api/regions'),
                fetch('/api/areas'),
                fetch('/api/lease-companies')
            ])
            if (kiosksRes.ok) setKiosks(await kiosksRes.json())
            if (partnersRes.ok) {
                const allPartners = await partnersRes.json()
                setPartners(allPartners.filter((p: any) => p.type === 'CLIENT'))
            }
            if (corporationsRes.ok) setCorporations(await corporationsRes.json())
            if (branchesRes.ok) setBranches(await branchesRes.json())
            if (regionsRes.ok) setRegions(await regionsRes.json())
            if (areasRes.ok) setAreas(await areasRes.json())
            if (leaseCompaniesRes.ok) setLeaseCompanies(await leaseCompaniesRes.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // URL의 page 파라미터가 변경되면 currentPage 업데이트
    useEffect(() => {
        const pageParam = parseInt(searchParams.get('page') || '1', 10)
        if (pageParam !== currentPage) {
            setCurrentPage(pageParam)
        }
    }, [searchParams])

    // 계약법인 검색 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.corp-search-dropdown')) {
                setCorpSearchOpen(false)
            }
        }
        if (corpSearchOpen) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [corpSearchOpen])

    // 계약법인 드롭다운이 열릴 때 선택된 항목으로 스크롤
    useEffect(() => {
        if (corpSearchOpen && formData.corporationId && corpDropdownRef.current) {
            // 약간의 지연 후 스크롤 (DOM 렌더링 완료 대기)
            setTimeout(() => {
                const selectedElement = corpDropdownRef.current?.querySelector(`[data-corp-id="${formData.corporationId}"]`)
                if (selectedElement) {
                    selectedElement.scrollIntoView({ block: 'center', behavior: 'instant' })
                }
            }, 50)
        }
    }, [corpSearchOpen])

    // 지점 검색 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.branch-search-dropdown')) {
                setBranchSearchOpen(false)
            }
        }
        if (branchSearchOpen) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [branchSearchOpen])

    // 지점 드롭다운이 열릴 때 선택된 항목으로 스크롤
    useEffect(() => {
        if (branchSearchOpen && formData.branchId && branchDropdownRef.current) {
            setTimeout(() => {
                const selectedElement = branchDropdownRef.current?.querySelector(`[data-branch-id="${formData.branchId}"]`)
                if (selectedElement) {
                    selectedElement.scrollIntoView({ block: 'center', behavior: 'instant' })
                }
            }, 50)
        }
    }, [branchSearchOpen])

    // 법인 선택 시 해당 법인의 지점만 필터링
    useEffect(() => {
        if (formData.corporationId) {
            const filtered = branches.filter(b => b.corporationId === formData.corporationId)
            setFilteredBranches(filtered)
        } else {
            setFilteredBranches([])
        }
    }, [formData.corporationId, branches])

    // 법인 변경 시 계약 정보 업데이트
    const handleCorporationChange = (corporationId: string) => {
        // 신규 업체 추가 선택 시 거래처/점포 관리 페이지로 이동
        if (corporationId === 'ADD_NEW') {
            router.push('/dashboard/clients')
            return
        }

        // 법인 변경 시 지점 초기화
        setFormData(prev => ({
            ...prev,
            corporationId,
            branchId: '',
            branchName: '',
            regionCode: '',
            areaCode: '',
            postalCode: '',
            address: '',
            managerPhone: ''
        }))

        // 선택된 법인의 계약 정보 및 브랜드 불러오기
        if (corporationId) {
            const selectedCorp = corporations.find(c => c.id === corporationId)
            if (selectedCorp) {
                // FC 브랜드명: "코드 / 이름" 형식으로 저장
                const brandName = selectedCorp.fc
                    ? `${selectedCorp.fc.code} / ${selectedCorp.fc.name}`
                    : ''

                // Corporation에서 계약 정보 가져옴
                // 값이 없으면 같은 FC 소속의 다른 법인에서 기본값 가져오기
                let contractDate = selectedCorp.contractDate || null
                let erpFeeRate = selectedCorp.erpFeeRate ?? null
                let kioskMaintenanceCost = selectedCorp.kioskMaintenanceCost ?? null
                let kioskSaleCost = selectedCorp.kioskSaleCost ?? null

                // 같은 FC 소속 법인 중 설정값이 있는 법인에서 기본값 상속
                if (selectedCorp.fc && (erpFeeRate === null || kioskMaintenanceCost === null || kioskSaleCost === null)) {
                    const sameFcCorps = corporations.filter(c => c.fc?.id === selectedCorp.fc?.id)
                    for (const corp of sameFcCorps) {
                        if (erpFeeRate === null && corp.erpFeeRate !== null) erpFeeRate = corp.erpFeeRate
                        if (kioskMaintenanceCost === null && corp.kioskMaintenanceCost !== null) kioskMaintenanceCost = corp.kioskMaintenanceCost
                        if (kioskSaleCost === null && corp.kioskSaleCost !== null) kioskSaleCost = corp.kioskSaleCost
                        if (contractDate === null && corp.contractDate !== null) contractDate = corp.contractDate
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    corporationId,
                    branchId: '',
                    branchName: '',
                    regionCode: '',
                    areaCode: '',
                    postalCode: '',
                    address: '',
                    managerPhone: '',
                    brandName,  // FC 브랜드 코드와 이름 자동 입력
                    contractDate: contractDate ? String(contractDate).split('T')[0] : '',
                    erpFeeRate: erpFeeRate?.toString() || '',
                    kioskMaintenanceCost: kioskMaintenanceCost?.toString() || '',
                    kioskSaleCost: kioskSaleCost?.toString() || ''
                }))
            }
        } else {
            // 법인 선택 해제 시 계약 정보도 초기화
            setFormData(prev => ({
                ...prev,
                corporationId: '',
                branchId: '',
                branchName: '',
                regionCode: '',
                areaCode: '',
                postalCode: '',
                address: '',
                managerPhone: '',
                brandName: '',  // 브랜드명도 초기화
                contractDate: '',
                erpFeeRate: '',
                kioskMaintenanceCost: '',
                kioskSaleCost: ''
            }))
        }
    }

    // 주소 기반 지역/관할지역 자동 매핑 함수
    const mapAddressToRegion = (address: string): { regionCode: string, areaCode: string } => {
        let regionCode = ''
        let areaCode = ''

        if (!address) return { regionCode, areaCode }

        // 먼저 Area의 addressKeywords로 매칭 시도
        for (const area of areas) {
            if (area.addressKeywords) {
                const keywords = area.addressKeywords.split(',').map(k => k.trim())
                for (const keyword of keywords) {
                    if (keyword && address.includes(keyword)) {
                        const regionCodeFound = area.region?.code || regions.find(r => r.id === area.regionId)?.code
                        if (regionCodeFound) {
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
                        const defaultArea = areas.find(a => a.regionId === region.id)
                        return {
                            regionCode: region.code,
                            areaCode: defaultArea?.code || ''
                        }
                    }
                }
            }
        }

        return { regionCode, areaCode }
    }

    // 지점 선택 시 자동으로 지역코드, 관할코드, 우편번호, 주소, 담당자 연락처 입력
    const handleBranchChange = (branchId: string) => {
        // 신규 지점 추가 선택 시 거래처/점포 관리 페이지로 이동 (법인ID와 함께)
        if (branchId === 'ADD_NEW') {
            // 현재 선택된 법인의 FC를 찾아서 쿼리 파라미터로 전달
            const selectedCorp = corporations.find(c => c.id === formData.corporationId)
            if (selectedCorp && selectedCorp.fc?.id) {
                // FC 소속 법인인 경우: fcId와 corporationId를 전달하고 점포 탭 활성화
                router.push(`/dashboard/clients?fcId=${selectedCorp.fc.id}&corpId=${selectedCorp.id}&tab=branch&action=addBranch`)
            } else if (selectedCorp) {
                // 독립 법인인 경우: corporationId만 전달
                router.push(`/dashboard/clients?corpId=${selectedCorp.id}&tab=branch&action=addBranch&independent=true`)
            } else {
                router.push('/dashboard/clients')
            }
            return
        }

        const selectedBranch = branches.find(b => b.id === branchId)
        console.log('Selected branch:', selectedBranch)
        if (selectedBranch) {
            // Branch에 regionCode/areaCode가 없고 주소가 있으면 자동 매핑
            let regionCode = selectedBranch.regionCode || ''
            let areaCode = selectedBranch.areaCode || ''

            if ((!regionCode || !areaCode) && selectedBranch.address) {
                const mapped = mapAddressToRegion(selectedBranch.address)
                regionCode = regionCode || mapped.regionCode
                areaCode = areaCode || mapped.areaCode
            }

            setFormData(prev => ({
                ...prev,
                branchId,
                branchName: selectedBranch.name,
                regionCode,
                areaCode,
                postalCode: selectedBranch.postalCode || '',
                address: selectedBranch.address || '',
                managerPhone: selectedBranch.managerPhone || ''
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                branchId: '',
                branchName: '',
                regionCode: '',
                areaCode: '',
                postalCode: '',
                address: '',
                managerPhone: ''
            }))
        }
    }

    const filteredKiosks = kiosks.filter(k => {
        // 검색어 필터
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const matchesSearch = (
                k.serialNumber?.toLowerCase().includes(query) ||
                k.kioskNumber?.toLowerCase().includes(query) ||
                k.anydeskId?.toLowerCase().includes(query) ||
                k.brandName?.toLowerCase().includes(query) ||
                k.currentPartner?.name?.toLowerCase().includes(query) ||
                k.branchName?.toLowerCase().includes(query)
            )
            if (!matchesSearch) return false
        }

        // 브랜드명 필터
        if (filters.brandName && getBrandName(k) !== filters.brandName) return false

        // 계약법인명 필터
        if (filters.corporationId && k.branch?.corporation?.id !== filters.corporationId) return false

        // 지점명 필터
        if (filters.branchId && k.branchId !== filters.branchId) return false

        // 지역명 필터
        if (filters.regionCode && k.regionCode !== filters.regionCode) return false

        // 관할지역 필터
        if (filters.areaCode && k.areaCode !== filters.areaCode) return false

        // 취득형태 필터 (기존 값 호환: PURCHASE=FREE, LEASE=LEASE_FREE)
        if (filters.acquisition) {
            if (filters.acquisition === 'FREE' && k.acquisition !== 'FREE' && k.acquisition !== 'PURCHASE') return false
            if (filters.acquisition === 'LEASE_FREE' && k.acquisition !== 'LEASE_FREE' && k.acquisition !== 'LEASE') return false
            if (filters.acquisition === 'PAID' && k.acquisition !== 'PAID') return false
            if (filters.acquisition === 'RENTAL' && k.acquisition !== 'RENTAL') return false
        }

        // 납품상태 필터
        if (filters.deliveryStatus && k.deliveryStatus !== filters.deliveryStatus) return false

        // 설치상태 필터 (이력 기반: latestMoveType으로 판단)
        if (filters.status) {
            const moveType = k.latestMoveType
            if (filters.status === 'IN_STOCK') {
                // 재고: RETURN, STORAGE 또는 이력 없이 IN_STOCK
                const isInStock = moveType ? ['RETURN', 'STORAGE'].includes(moveType) : k.status === 'IN_STOCK'
                if (!isInStock) return false
            } else if (filters.status === 'DEPLOYED') {
                // 설치완료: DEPLOY, TRANSFER, RESALE
                const isDeployed = moveType ? ['DEPLOY', 'TRANSFER', 'RESALE'].includes(moveType) : k.status === 'DEPLOYED'
                if (!isDeployed) return false
            } else if (filters.status === 'MAINTENANCE') {
                // 수리입고: MAINTENANCE
                const isMaintenance = moveType ? moveType === 'MAINTENANCE' : k.status === 'MAINTENANCE'
                if (!isMaintenance) return false
            } else if (filters.status === 'RETIRED') {
                // 폐기: DISPOSAL
                const isRetired = moveType ? moveType === 'DISPOSAL' : k.status === 'RETIRED'
                if (!isRetired) return false
            }
        }

        // KC자산 필터 (유상, 렌탈 제외)
        if (showKcAssetOnly) {
            const effectiveAcq = (k.salePrice && k.salePrice > 0) ? 'PAID' : k.acquisition
            if (effectiveAcq === 'PAID' || effectiveAcq === 'RENTAL') return false
        }

        return true
    })

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredKiosks.length / itemsPerPage)
    const paginatedKiosks = filteredKiosks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const resetForm = () => {
        setFormData({
            serialNumber: '', kioskNumber: '', anydeskId: '', brandName: '',
            currentPartnerId: '', corporationId: '', branchId: '', branchName: '',
            regionCode: '', areaCode: '', postalCode: '', address: '', managerPhone: '',
            contractDate: '', erpFeeRate: '', kioskMaintenanceCost: '', kioskSaleCost: '',
            acquisition: 'FREE', leaseCompanyId: '', salePrice: '', orderRequestDate: '',
            deliveryDueDate: '', deliveryDate: '', deliveryStatus: 'PENDING', status: 'IN_STOCK',
            memo: ''
        })
    }

    // 인라인 납품일 편집 시작 (Kiosk의 deliveryDate 사용)
    const startInlineEdit = (kiosk: Kiosk) => {
        setInlineEditingId(kiosk.id)
        // Kiosk의 deliveryDate를 납품일로 사용
        const dateSource = kiosk.deliveryDate
        const dateStr = dateSource
            ? (typeof dateSource === 'string'
                ? dateSource.split('T')[0]
                : new Date(dateSource).toISOString().split('T')[0])
            : ''
        setInlineEditValue(dateStr)
    }

    // 날짜 문자열 파싱 (다양한 형식 지원: 2023/01/01, 2023-01-01, 2023.01.01, 20231201 등)
    const parseDateString = (value: string): string => {
        if (!value) return ''

        // YYYYMMDD 형식 (8자리 숫자) 처리
        const compactMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/)
        if (compactMatch) {
            const [, year, month, day] = compactMatch
            return `${year}-${month}-${day}`
        }

        // 슬래시, 점을 하이픈으로 변환
        const normalized = value.replace(/[\/\.]/g, '-')
        // YYYY-MM-DD 형식으로 변환 시도
        const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
        if (match) {
            const [, year, month, day] = match
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return value
    }

    // 인라인 날짜 입력 핸들러
    const handleInlineDateInput = (value: string) => {
        const parsed = parseDateString(value)
        setInlineEditValue(parsed)
    }

    // 인라인 납품일 저장 (LocationHistory의 eventDate만 업데이트 - 새 이력 생성하지 않음)
    const saveInlineEdit = async (kioskId: string) => {
        if (!inlineEditValue) {
            setInlineEditingId(null)
            return
        }

        // 날짜 유효성 검사
        const dateToSave = parseDateString(inlineEditValue)
        const testDate = new Date(dateToSave)
        if (isNaN(testDate.getTime())) {
            alert(tc('invalidDateFormat'))
            return
        }

        try {
            // 해당 키오스크의 최신 이력 가져오기
            const historyRes = await fetch(`/api/assets/${kioskId}/history`)
            if (!historyRes.ok) throw new Error('Failed to fetch history')
            const historyData = await historyRes.json()

            if (historyData.length > 0) {
                // 최신 이력의 eventDate 업데이트
                const latestHistory = historyData[0]
                const updateRes = await fetch(`/api/history/${latestHistory.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...latestHistory,
                        eventDate: dateToSave
                    })
                })

                if (!updateRes.ok) throw new Error('Failed to update history')
            }

            // Kiosk의 deliveryDate는 직접 DB 업데이트 (이력 생성 없이)
            await fetch(`/api/assets/${kioskId}/delivery-date`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryDate: dateToSave })
            })

            setInlineEditingId(null)
            fetchData()
        } catch (error) {
            console.error('Inline edit error:', error)
            alert(tc('editError'))
        }
    }

    // 인라인 편집 취소
    const cancelInlineEdit = () => {
        setInlineEditingId(null)
        setInlineEditValue('')
    }

    // 취득형태 인라인 편집 시작
    const startAcquisitionEdit = (kiosk: Kiosk) => {
        setAcquisitionEditingId(kiosk.id)
        setAcquisitionEditValue(kiosk.acquisition || 'FREE')
        setLeaseCompanyValue(kiosk.leaseCompanyId || null)
    }

    // 취득형태 인라인 편집 저장
    const saveAcquisitionEdit = async (kioskId: string) => {
        try {
            const res = await fetch(`/api/assets/${kioskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    acquisition: acquisitionEditValue,
                    leaseCompanyId: acquisitionEditValue === 'LEASE_FREE' ? leaseCompanyValue : null
                })
            })

            if (!res.ok) throw new Error('Failed to update acquisition')

            setAcquisitionEditingId(null)
            setAcquisitionEditValue('')
            setLeaseCompanyValue(null)
            fetchData()
        } catch (error) {
            console.error('Acquisition edit error:', error)
            alert(tc('editError'))
        }
    }

    // 취득형태 인라인 편집 취소
    const cancelAcquisitionEdit = () => {
        setAcquisitionEditingId(null)
        setAcquisitionEditValue('')
        setLeaseCompanyValue(null)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('handleCreate called')

        // 리스(무상) 선택 시 리스회사 필수 체크
        if (formData.acquisition === 'LEASE_FREE' && !formData.leaseCompanyId) {
            alert(t('leaseCompanyRequired'))
            return
        }

        const res = await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        if (res.ok) { resetForm(); setIsCreating(false); fetchData() }
    }

    const handleEdit = (kiosk: Kiosk) => {
        setEditingKiosk(kiosk)

        // branchId가 있으면 해당 브랜치를 찾아서 corporationId와 관련 정보도 설정
        // branchId가 없으면 latestBranch에서 정보를 가져옴
        let corpId = ''
        let branchId = kiosk.branchId || ''
        let contractInfo = {
            contractDate: '',
            erpFeeRate: '',
            kioskMaintenanceCost: '',
            kioskSaleCost: ''
        }
        let branchInfo = {
            regionCode: kiosk.regionCode || '',
            areaCode: kiosk.areaCode || '',
            postalCode: '',
            address: '',
            managerPhone: ''
        }
        let brandName = kiosk.brandName || ''

        // 1. 먼저 branchId로 찾기
        if (branchId) {
            const kioskBranch = branches.find(b => b.id === branchId)
            if (kioskBranch) {
                corpId = kioskBranch.corporationId

                // 브랜치 정보 매핑 (kiosk에 값이 없으면 브랜치 값 사용)
                branchInfo = {
                    regionCode: kiosk.regionCode || kioskBranch.regionCode || '',
                    areaCode: kiosk.areaCode || kioskBranch.areaCode || '',
                    postalCode: kioskBranch.postalCode || '',
                    address: kioskBranch.address || '',
                    managerPhone: kioskBranch.managerPhone || ''
                }
            }
        }
        // 2. branchId가 없으면 latestBranch에서 정보 가져오기
        else if (kiosk.latestBranch) {
            branchId = kiosk.latestBranch.id
            if (kiosk.latestBranch.corporation) {
                corpId = kiosk.latestBranch.corporation.id
            }
            branchInfo = {
                regionCode: kiosk.regionCode || kiosk.latestBranch.regionCode || '',
                areaCode: kiosk.areaCode || kiosk.latestBranch.areaCode || '',
                postalCode: '',
                address: '',
                managerPhone: ''
            }
        }
        // 3. latestCorporation만 있는 경우
        else if (kiosk.latestCorporation) {
            corpId = kiosk.latestCorporation.id
        }

        // 법인의 계약 정보 및 브랜드 정보 불러오기
        if (corpId) {
            const corp = corporations.find(c => c.id === corpId)
            if (corp) {
                // 값이 없으면 같은 FC 소속의 다른 법인에서 기본값 가져오기
                let erpFeeRate = corp.erpFeeRate ?? null
                let kioskMaintenanceCost = corp.kioskMaintenanceCost ?? null
                let kioskSaleCost = corp.kioskSaleCost ?? null
                let contractDate = corp.contractDate || null

                if (corp.fc && (erpFeeRate === null || kioskMaintenanceCost === null || kioskSaleCost === null)) {
                    const sameFcCorps = corporations.filter(c => c.fc?.id === corp.fc?.id)
                    for (const c of sameFcCorps) {
                        if (erpFeeRate === null && c.erpFeeRate !== null) erpFeeRate = c.erpFeeRate
                        if (kioskMaintenanceCost === null && c.kioskMaintenanceCost !== null) kioskMaintenanceCost = c.kioskMaintenanceCost
                        if (kioskSaleCost === null && c.kioskSaleCost !== null) kioskSaleCost = c.kioskSaleCost
                        if (contractDate === null && c.contractDate !== null) contractDate = c.contractDate
                    }
                }

                contractInfo = {
                    contractDate: contractDate ? String(contractDate).split('T')[0] : '',
                    erpFeeRate: erpFeeRate?.toString() || '',
                    kioskMaintenanceCost: kioskMaintenanceCost?.toString() || '',
                    kioskSaleCost: kioskSaleCost?.toString() || ''
                }

                // 브랜드명 매핑 (kiosk에 값이 없으면 FC 정보 사용)
                if (!brandName && corp.fc) {
                    brandName = `${corp.fc.code} / ${corp.fc.name}`
                }
            }
        }

        // 판매요금이 0보다 크면 취득형태를 '유상'으로 자동 설정
        // 구버전 값(PURCHASE, LEASE)을 새 값(FREE, LEASE_FREE)으로 매핑
        const salePriceValue = kiosk.salePrice || 0
        let acquisitionValue = kiosk.acquisition
        // 구버전 → 신버전 매핑
        if (acquisitionValue === 'PURCHASE') acquisitionValue = 'FREE'
        if (acquisitionValue === 'LEASE') acquisitionValue = 'LEASE_FREE'
        // 판매가 있으면 유상으로
        if (salePriceValue > 0) acquisitionValue = 'PAID'

        setFormData({
            serialNumber: kiosk.serialNumber || '',
            kioskNumber: kiosk.kioskNumber || '',
            anydeskId: kiosk.anydeskId || '',
            brandName: brandName,
            currentPartnerId: kiosk.currentPartnerId || '',
            corporationId: corpId,
            branchId: branchId,
            branchName: kiosk.branchName || kiosk.latestBranchName || '',
            ...branchInfo,
            ...contractInfo,
            acquisition: acquisitionValue,
            leaseCompanyId: kiosk.leaseCompanyId || '',
            salePrice: kiosk.salePrice?.toString() || '',
            orderRequestDate: kiosk.orderRequestDate ? (typeof kiosk.orderRequestDate === 'string' ? kiosk.orderRequestDate.split('T')[0] : new Date(kiosk.orderRequestDate).toISOString().split('T')[0]) : '',
            deliveryDueDate: kiosk.deliveryDueDate ? (typeof kiosk.deliveryDueDate === 'string' ? kiosk.deliveryDueDate.split('T')[0] : new Date(kiosk.deliveryDueDate).toISOString().split('T')[0]) : '',
            deliveryDate: kiosk.deliveryDate ? (typeof kiosk.deliveryDate === 'string' ? kiosk.deliveryDate.split('T')[0] : new Date(kiosk.deliveryDate).toISOString().split('T')[0]) : '',
            deliveryStatus: kiosk.deliveryStatus,
            status: kiosk.status,
            memo: kiosk.memo || ''
        })
        setIsCreating(false)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('handleUpdate called, editingKiosk:', editingKiosk?.id)
        if (!editingKiosk) return

        // 리스(무상) 선택 시 리스회사 필수 체크
        if (formData.acquisition === 'LEASE_FREE' && !formData.leaseCompanyId) {
            alert(t('leaseCompanyRequired'))
            return
        }

        try {
            console.log('Updating with formData:', formData)
            const res = await fetch(`/api/assets/${editingKiosk.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                resetForm();
                setEditingKiosk(null);
                fetchData()
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Update failed:', res.status, errorData)
                alert(`${tc('saveFailed')}: ${errorData.error || res.status}`)
            }
        } catch (error) {
            console.error('Update error:', error)
            alert(tc('savingError'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
        if (res.ok) fetchData()
    }

    const getDeliveryStatusBadge = (s: string) => {
        const map: Record<string, { label: string, color: string, text: string }> = {
            'PENDING': { label: t('deliveryPending'), color: 'bg-secondary', text: 'text-white' },
            'ORDERED': { label: t('deliveryOrdered'), color: 'bg-blue', text: 'text-white' },
            'SHIPPED': { label: t('deliveryShipped'), color: 'bg-yellow', text: 'text-dark' },
            'DELIVERED': { label: t('deliveryDelivered'), color: 'bg-green', text: 'text-white' }
        }
        const badge = map[s] || { label: s, color: 'bg-secondary', text: 'text-white' }
        return <span className={`badge ${badge.color} ${badge.text}`}>{badge.label}</span>
    }

    // 이력 기반 상태 배지 (latestMoveType 기준) - moveType 그대로 표시
    const getStatusBadgeFromMoveType = (k: Kiosk) => {
        const moveType = k.latestMoveType

        if (moveType) {
            // DEPLOY, TRANSFER, RESALE -> 설치
            if (['DEPLOY', 'TRANSFER', 'RESALE'].includes(moveType)) {
                return <span className="badge bg-green text-white">{th('typeDeploy')}</span>
            }
            // MAINTENANCE -> 수리입고
            if (moveType === 'MAINTENANCE') {
                return <span className="badge bg-red text-white">{th('typeMaintenance')}</span>
            }
            // REPAIR_COMPLETE -> 수리완료
            if (moveType === 'REPAIR_COMPLETE') {
                return <span className="badge bg-cyan text-white">{th('typeRepairComplete')}</span>
            }
            // RETURN -> 회수
            if (moveType === 'RETURN') {
                return <span className="badge bg-orange text-white">{th('typeReturn')}</span>
            }
            // STORAGE -> 창고입고
            if (moveType === 'STORAGE') {
                return <span className="badge bg-secondary text-white">{th('typeStorage')}</span>
            }
            // DISPOSAL -> 폐기
            if (moveType === 'DISPOSAL') {
                return <span className="badge bg-dark text-white">{th('typeDisposal')}</span>
            }
        }

        // 이력이 없으면 기본 설치 표시
        const badge = { label: th('typeDeploy'), color: 'bg-green', text: 'text-white' }
        return <span className={`badge ${badge.color} ${badge.text}`}>{badge.label}</span>
    }

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-'
    const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString() : '-'

    // 납기희망일 포맷: ISO 날짜면 변환, 텍스트면 그대로 표시
    const formatDeliveryDueDate = (d: string | null) => {
        if (!d) return '-'
        // ISO 날짜 형식인지 확인 (YYYY-MM-DD 또는 ISO 8601)
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/
        if (isoDateRegex.test(d)) {
            // ISO 형식이면 YYYY-MM-DD만 추출
            return d.split('T')[0]
        }
        // 텍스트 형식이면 그대로 반환
        return d
    }

    const truncateText = (text: string | null, maxLength: number) => {
        if (!text) return '-'
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    // 브랜드명 가져오기: 최신 이력 FC > 기존 branch FC > 저장된 brandName 순으로 우선
    const getBrandName = (k: Kiosk) => {
        // 1. 최신 이력의 corporation > fc 에서 브랜드명 가져오기
        const latestFc = k.latestCorporation?.fc || k.latestBranch?.corporation?.fc
        if (latestFc) {
            return locale === 'ja' ? (latestFc.nameJa || latestFc.name) : latestFc.name
        }
        // 2. 기존 branch > corporation > fc 에서 브랜드명 가져오기
        const fc = k.branch?.corporation?.fc
        if (fc) {
            return locale === 'ja' ? (fc.nameJa || fc.name) : fc.name
        }
        // 3. 저장된 brandName에서 가져오기
        if (k.brandName) {
            // 슬래시가 있으면 뒤의 값만 반환
            if (k.brandName.includes('/')) {
                return k.brandName.split('/').pop()?.trim() || k.brandName
            }
            return k.brandName
        }
        return '-'
    }

    // Kiosk에서 지역코드 가져오기 (최신 이력 > branch > kiosk 순으로 우선)
    const getRegionCode = (k: Kiosk) => {
        return k.latestBranch?.regionCode || k.branch?.regionCode || k.regionCode || null
    }

    // Kiosk에서 관할코드 가져오기 (최신 이력 > branch > kiosk 순으로 우선)
    const getAreaCode = (k: Kiosk) => {
        return k.latestBranch?.areaCode || k.branch?.areaCode || k.areaCode || null
    }

    // 지역코드로 지역명 가져오기 (형식: "沖縄 (Okinawa)")
    const getRegionName = (regionCode: string | null) => {
        if (!regionCode) return null
        const region = regions.find(r => r.code === regionCode)
        if (!region) return regionCode
        const displayName = locale === 'ja' ? (region.nameJa || region.name) : region.name
        return `${displayName} (${region.code})`
    }

    // 관할코드로 관할지역명 가져오기 (형식: "九州 (Kyushu)")
    const getAreaName = (areaCode: string | null) => {
        if (!areaCode) return null
        const area = areas.find(a => a.code === areaCode)
        if (!area) return areaCode
        const displayName = locale === 'ja' ? (area.nameJa || area.name) : area.name
        return `${displayName} (${area.code})`
    }

    // 이력 description 다국어 번역 (API에서 키 형식으로 저장된 값을 번역)
    const translateDescription = (desc: string | null): string => {
        if (!desc) return '-'

        // 기존 한국어 텍스트는 그대로 표시 (이전 데이터 호환)
        if (desc.includes('지점 변경') || desc.includes('소속 회사 변경') ||
            desc.includes('관할지역 변경') || desc.includes('취득형태 변경') ||
            desc.includes('상태 변경') || desc.includes('가격 변경')) {
            return desc
        }

        // 새로운 키 형식 번역
        const parts = desc.split(', ')
        const translated = parts.map(part => {
            if (part === 'CHANGE_PARTNER') return t('changePartner')
            if (part === 'CHANGE_BRANCH') return t('changeBranch')
            if (part === 'CHANGE_AREA') return t('changeArea')
            if (part.startsWith('CHANGE_STATUS:')) {
                const [, values] = part.split(':')
                return `${t('changeStatus')}: ${values}`
            }
            if (part.startsWith('CHANGE_ACQUISITION:')) {
                const [, values] = part.split(':')
                return `${t('changeAcquisition')}: ${values}`
            }
            if (part.startsWith('CHANGE_PRICE:')) {
                const [, values] = part.split(':')
                return `${t('changePrice')}: ${values}${t('manYenUnit')}`
            }
            return part
        })
        return translated.join(', ')
    }

    // 계약법인명 가져오기 (최신 이력 > branch.corporation > currentPartner 순으로 우선)
    const getContractPartnerName = (k: Kiosk) => {
        // 최신 이력의 corporation 정보 우선
        const latestCorp = k.latestCorporation || k.latestBranch?.corporation
        if (latestCorp) {
            if (locale === 'ja') {
                return latestCorp.nameJa || latestCorp.name || null
            }
            return latestCorp.name || null
        }
        // 기존 branch.corporation 또는 currentPartner
        if (locale === 'ja') {
            return k.branch?.corporation?.nameJa || k.branch?.corporation?.name || k.currentPartner?.nameJa || k.currentPartner?.name || null
        }
        return k.branch?.corporation?.name || k.currentPartner?.name || null
    }

    // 지점명 가져오기 (최신 이력 > branch 순으로 우선)
    const getBranchName = (k: Kiosk) => {
        // 최신 이력의 지점 정보 우선 (일본어일 때는 latestBranch.nameJa 우선)
        if (k.latestBranch) {
            if (locale === 'ja') {
                return k.latestBranch.nameJa || k.latestBranch.name || k.latestBranchName || null
            }
            return k.latestBranch.name || k.latestBranchName || null
        }
        if (k.latestBranchName) {
            return k.latestBranchName
        }
        // 기존 branch 정보
        if (k.branch) {
            if (locale === 'ja') {
                return k.branch.nameJa || k.branch.name || k.branchName || null
            }
            return k.branch.name || k.branchName || null
        }
        if (k.branchName) return k.branchName
        return null
    }

    // 취득형태 배지 (색상 포함) - salePrice > 0이면 자동으로 유상 표시 (가격 포함)
    const getAcquisitionBadge = (kiosk: Kiosk) => {
        // 판매가격이 0보다 크면 자동으로 유상으로 표시
        const effectiveAcquisition = (kiosk.salePrice && kiosk.salePrice > 0) ? 'PAID' : kiosk.acquisition

        // 기존 값 -> 새 값 매핑 (색상 포함)
        const mapping: Record<string, { label: string, color: string }> = {
            'FREE': { label: t('acquisitionFree'), color: 'text-primary' },
            'LEASE_FREE': { label: t('acquisitionLeaseFree'), color: 'text-info' },
            'PAID': { label: t('acquisitionPaid'), color: 'text-success' },
            'RENTAL': { label: t('acquisitionRental'), color: 'text-warning' },
            // 기존 값 호환
            'PURCHASE': { label: t('acquisitionFree'), color: 'text-primary' },
            'LEASE': { label: t('acquisitionLeaseFree'), color: 'text-info' }
        }
        const badge = mapping[effectiveAcquisition] || { label: effectiveAcquisition, color: 'text-muted' }

        return <span className={`fw-medium ${badge.color}`}>{badge.label}</span>
    }

    // 효과적인 취득형태 계산 (salePrice > 0이면 PAID)
    const getEffectiveAcquisition = (kiosk: Kiosk) => {
        return (kiosk.salePrice && kiosk.salePrice > 0) ? 'PAID' : kiosk.acquisition
    }

    // 이동이력 조회
    const fetchHistory = async (kiosk: Kiosk) => {
        setSelectedKioskForHistory(kiosk)
        setShowHistoryModal(true)
        setHistoryLoading(true)

        try {
            const res = await fetch(`/api/assets/${kiosk.id}/history`)
            if (res.ok) {
                const data = await res.json()
                setHistoryItems(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setHistoryLoading(false)
        }
    }

    // 이동 유형 뱃지 (DEPLOY, TRANSFER, RESALE는 모두 "설치"로 통합)
    const getMoveTypeBadge = (moveType: string) => {
        const map: Record<string, { labelKey: string, color: string }> = {
            'DEPLOY': { labelKey: 'typeDeploy', color: 'bg-green' },
            'RETURN': { labelKey: 'typeReturn', color: 'bg-orange' },
            'TRANSFER': { labelKey: 'typeDeploy', color: 'bg-green' },  // 설치로 통합
            'RESALE': { labelKey: 'typeDeploy', color: 'bg-green' },  // 설치로 통합
            'MAINTENANCE': { labelKey: 'typeMaintenance', color: 'bg-yellow' },
            'REPAIR_COMPLETE': { labelKey: 'typeRepairComplete', color: 'bg-cyan' },
            'DISPOSAL': { labelKey: 'typeDisposal', color: 'bg-dark' },
            'STORAGE': { labelKey: 'typeStorage', color: 'bg-secondary' }
        }
        const badge = map[moveType] || { labelKey: moveType, color: 'bg-secondary' }
        return <span className={`badge ${badge.color} text-white`}>{th(badge.labelKey as any) || moveType}</span>
    }

    // CSV 템플릿 다운로드
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                serialNumber: "SN-WAREHOUSE-0001",
                kioskNumber: "K001",
                anydeskId: "123 456 789",
                corporationName: "株式会社G-WORKS",
                branchName: "渋谷店",
                acquisition: "FREE",
                salePrice: "50",
                orderRequestDate: "2024-01-15",
                deliveryDueDate: "2024-02-01"
            },
            {
                serialNumber: "SN-WAREHOUSE-0002",
                kioskNumber: "K002",
                anydeskId: "987 654 321",
                corporationName: "株式会社KAFLIXCLOUD",
                branchName: "新宿店",
                acquisition: "LEASE_FREE",
                salePrice: "",
                orderRequestDate: "2024-02-01",
                deliveryDueDate: "2024-02-15"
            },
            {
                serialNumber: "SN-WAREHOUSE-0003",
                kioskNumber: "K003",
                anydeskId: "",
                corporationName: "株式会社ニコニコレンタカー",
                branchName: "大阪駅前店",
                acquisition: "PAID",
                salePrice: "100",
                orderRequestDate: "",
                deliveryDueDate: ""
            }
        ]
        const csv = Papa.unparse(templateData)
        const bom = '\uFEFF'
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', 'kiosk_assets_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // CSV 파일 업로드
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data as any[]
                // acquisition 필드가 채워진 행만 유효한 데이터로 간주
                const validData = data.filter((row) => {
                    return row.acquisition && row.acquisition.trim() !== ''
                })

                if (validData.length === 0) {
                    alert(tc('noValidData'))
                    return
                }

                if (confirm(t('importConfirm', { count: validData.length }))) {
                    try {
                        const res = await fetch('/api/assets/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(validData)
                        })
                        const result = await res.json()
                        if (res.ok && result.success) {
                            let message = `${t('importComplete')}\n${t('importSuccessCount', { count: result.count })}`
                            if (result.failed > 0) {
                                message += `\n${t('importFailedCount', { count: result.failed })}`
                                if (result.errors && result.errors.length > 0) {
                                    message += `\n\n${t('importErrors')}:\n${result.errors.join('\n')}`
                                }
                            }
                            alert(message)
                            fetchData()
                        } else {
                            alert(t('importFailed') + (result.error ? `: ${result.error}` : ''))
                        }
                    } catch (err) {
                        console.error(err)
                        alert(t('importFailed'))
                    }
                }
                // 파일 입력 초기화
                e.target.value = ''
            }
        })
    }

    return (
        <>
            {/* Page Header */}
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle">Management</div>
                            <h2 className="page-title">{t('title')}</h2>
                        </div>
                        {/* 통합검색창 */}
                        <div className="col-12 col-md-4 mt-2 mt-md-0">
                            <div className="input-icon">
                                <span className="input-icon-addon">
                                    <i className="ti ti-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={locale === 'ja' ? 'シリアル番号、KIOSK番号、支店名、法人名などで検索...' : '시리얼번호, KIOSK번호, 지점명, 법인명 등으로 검색...'}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                />
                                {searchQuery && (
                                    <span className="input-icon-addon" style={{ cursor: 'pointer', right: '0.5rem', left: 'auto' }} onClick={() => { setSearchQuery(''); setCurrentPage(1) }}>
                                        <i className="ti ti-x"></i>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="col-auto ms-auto d-print-none">
                            <div className="btn-list">
                                <button onClick={handleDownloadTemplate} className="btn btn-secondary d-none d-sm-inline-block">
                                    <i className="ti ti-download me-2"></i>
                                    {t('templateDownload')}
                                </button>
                                <label className="btn btn-outline-primary d-none d-sm-inline-block mb-0">
                                    <i className="ti ti-upload me-2"></i>
                                    {t('csvUpload')}
                                    <input type="file" accept=".csv" onChange={handleFileUpload} className="d-none" />
                                </label>
                                <button className="btn btn-primary d-none d-sm-inline-block" onClick={() => { setIsCreating(!isCreating); setEditingKiosk(null); resetForm() }}>
                                    <i className="ti ti-plus me-2"></i>
                                    {t('newAsset')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Body */}
            <div className="page-body">
                <div className="container-xl">
                    {/* Create/Edit Form */}
                    {(isCreating || editingKiosk) && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <i className={`ti ${editingKiosk ? 'ti-edit' : 'ti-plus'} me-2`}></i>
                                    {editingKiosk ? tc('edit') : t('newAsset')}
                                </h3>
                                <div className="card-actions">
                                    <button className="btn btn-ghost-secondary btn-sm" onClick={() => { setIsCreating(false); setEditingKiosk(null); resetForm() }}>
                                        <i className="ti ti-x"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <form onSubmit={editingKiosk ? handleUpdate : handleCreate} noValidate>
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <label className="form-label">{t('serialNumber')}</label>
                                            <input type="text" className="form-control" value={formData.serialNumber}
                                                onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('kioskNumber')}</label>
                                            <input type="text" className="form-control" value={formData.kioskNumber}
                                                onChange={e => setFormData({...formData, kioskNumber: e.target.value})} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('anydeskId')}</label>
                                            <input type="text" className="form-control" value={formData.anydeskId}
                                                onChange={e => setFormData({...formData, anydeskId: e.target.value})} placeholder="123 456 789" />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('brandName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.brandName}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                                placeholder={t('brandNamePlaceholder')}
                                            />
                                        </div>

                                        {/* 계약법인 드롭다운 - 브랜드(FC)로 그룹화 + 검색 기능 */}
                                        <div className="col-md-3 corp-search-dropdown">
                                            <label className="form-label">{t('contractPartner')}</label>
                                            <div className="position-relative">
                                                <div
                                                    className="form-select d-flex align-items-center justify-content-between"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setCorpSearchOpen(!corpSearchOpen)}
                                                >
                                                    <span className={formData.corporationId ? '' : 'text-muted'}>
                                                        {formData.corporationId
                                                            ? (() => {
                                                                const corp = corporations.find(c => c.id === formData.corporationId)
                                                                return corp ? (locale === 'ja' ? (corp.nameJa || corp.name) : corp.name) : t('selectPartner')
                                                            })()
                                                            : t('selectPartner')
                                                        }
                                                    </span>
                                                    <i className={`ti ti-chevron-${corpSearchOpen ? 'up' : 'down'}`}></i>
                                                </div>
                                                {corpSearchOpen && (
                                                    <div
                                                        ref={corpDropdownRef}
                                                        className="position-absolute bg-white border rounded shadow-sm w-100"
                                                        style={{ zIndex: 1050, maxHeight: '300px', overflowY: 'auto', top: '100%', left: 0 }}
                                                    >
                                                        {/* 검색 입력 */}
                                                        <div className="p-2 border-bottom sticky-top bg-white">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder={t('searchCorporation') || '법인 검색...'}
                                                                value={corpSearchText}
                                                                onChange={e => setCorpSearchText(e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        {/* 선택 해제 옵션 */}
                                                        <div
                                                            className="px-3 py-2 cursor-pointer hover-bg-light"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => {
                                                                handleCorporationChange('')
                                                                setCorpSearchOpen(false)
                                                                setCorpSearchText('')
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            {t('selectPartner')}
                                                        </div>
                                                        {/* 그룹화된 법인 목록 */}
                                                        {(() => {
                                                            const searchLower = corpSearchText.toLowerCase()
                                                            const grouped: Record<string, { fcName: string, corps: Corporation[] }> = {}
                                                            const noFc: Corporation[] = []

                                                            corporations.forEach(corp => {
                                                                const corpName = (locale === 'ja' ? (corp.nameJa || corp.name) : corp.name).toLowerCase()
                                                                const fcName = corp.fc?.name?.toLowerCase() || ''
                                                                // 검색어가 법인명 또는 브랜드명에 포함되는지 확인
                                                                if (searchLower && !corpName.includes(searchLower) && !fcName.includes(searchLower)) {
                                                                    return
                                                                }

                                                                if (corp.fc) {
                                                                    const fcKey = corp.fc.id
                                                                    if (!grouped[fcKey]) {
                                                                        grouped[fcKey] = { fcName: corp.fc.name, corps: [] }
                                                                    }
                                                                    grouped[fcKey].corps.push(corp)
                                                                } else {
                                                                    noFc.push(corp)
                                                                }
                                                            })

                                                            const sortedGroups = Object.entries(grouped).sort((a, b) =>
                                                                a[1].fcName.localeCompare(b[1].fcName)
                                                            )

                                                            return (
                                                                <>
                                                                    {sortedGroups.map(([fcId, group]) => (
                                                                        <div key={fcId}>
                                                                            <div className="px-3 py-1 text-muted small fw-bold bg-light">
                                                                                {group.fcName}
                                                                            </div>
                                                                            {group.corps.map(corp => (
                                                                                <div
                                                                                    key={corp.id}
                                                                                    data-corp-id={corp.id}
                                                                                    className={`px-3 py-2 ps-4 ${formData.corporationId === corp.id ? 'bg-primary text-white' : ''}`}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                    onClick={() => {
                                                                                        handleCorporationChange(corp.id)
                                                                                        setCorpSearchOpen(false)
                                                                                        setCorpSearchText('')
                                                                                    }}
                                                                                    onMouseEnter={e => {
                                                                                        if (formData.corporationId !== corp.id) {
                                                                                            e.currentTarget.style.backgroundColor = '#f8f9fa'
                                                                                        }
                                                                                    }}
                                                                                    onMouseLeave={e => {
                                                                                        if (formData.corporationId !== corp.id) {
                                                                                            e.currentTarget.style.backgroundColor = 'transparent'
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {locale === 'ja' ? (corp.nameJa || corp.name) : corp.name}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                    {noFc.length > 0 && (
                                                                        <div>
                                                                            <div className="px-3 py-1 text-muted small fw-bold bg-light">
                                                                                {t('noBrand') || '브랜드 없음'}
                                                                            </div>
                                                                            {noFc.map(corp => (
                                                                                <div
                                                                                    key={corp.id}
                                                                                    data-corp-id={corp.id}
                                                                                    className={`px-3 py-2 ps-4 ${formData.corporationId === corp.id ? 'bg-primary text-white' : ''}`}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                    onClick={() => {
                                                                                        handleCorporationChange(corp.id)
                                                                                        setCorpSearchOpen(false)
                                                                                        setCorpSearchText('')
                                                                                    }}
                                                                                    onMouseEnter={e => {
                                                                                        if (formData.corporationId !== corp.id) {
                                                                                            e.currentTarget.style.backgroundColor = '#f8f9fa'
                                                                                        }
                                                                                    }}
                                                                                    onMouseLeave={e => {
                                                                                        if (formData.corporationId !== corp.id) {
                                                                                            e.currentTarget.style.backgroundColor = 'transparent'
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {locale === 'ja' ? (corp.nameJa || corp.name) : corp.name}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )
                                                        })()}
                                                        {/* 신규 업체 추가 */}
                                                        <div
                                                            className="px-3 py-2 border-top fw-bold"
                                                            style={{ cursor: 'pointer', color: '#206bc4' }}
                                                            onClick={() => {
                                                                handleCorporationChange('ADD_NEW')
                                                                setCorpSearchOpen(false)
                                                                setCorpSearchText('')
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            + {t('addNewCompany')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 지점 드롭다운 (검색 기능 포함) */}
                                        <div className="col-md-3 branch-search-dropdown">
                                            <label className="form-label">{t('branchName')}</label>
                                            <div className="position-relative">
                                                <div
                                                    className={`form-select d-flex align-items-center justify-content-between ${!formData.corporationId ? 'disabled' : ''}`}
                                                    style={{ cursor: formData.corporationId ? 'pointer' : 'not-allowed', backgroundColor: !formData.corporationId ? '#e9ecef' : 'white' }}
                                                    onClick={() => formData.corporationId && setBranchSearchOpen(!branchSearchOpen)}
                                                >
                                                    <span className={formData.branchId ? '' : 'text-muted'}>
                                                        {formData.branchId
                                                            ? (() => {
                                                                const branch = branches.find(b => b.id === formData.branchId)
                                                                return branch ? (locale === 'ja' ? (branch.nameJa || branch.name) : branch.name) : t('selectBranch')
                                                            })()
                                                            : t('selectBranch') || '지점 선택...'}
                                                    </span>
                                                    <i className={`ti ti-chevron-${branchSearchOpen ? 'up' : 'down'}`}></i>
                                                </div>
                                                {branchSearchOpen && formData.corporationId && (
                                                    <div
                                                        ref={branchDropdownRef}
                                                        className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
                                                        style={{ zIndex: 1050, maxHeight: '300px', overflowY: 'auto' }}
                                                    >
                                                        <div className="p-2 border-bottom sticky-top bg-white">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder={t('searchBranch') || '지점 검색...'}
                                                                value={branchSearchText}
                                                                onChange={(e) => setBranchSearchText(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div
                                                            className="px-3 py-2 border-bottom text-muted small"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => {
                                                                handleBranchChange('')
                                                                setBranchSearchOpen(false)
                                                                setBranchSearchText('')
                                                            }}
                                                        >
                                                            {t('selectBranch') || '지점 선택...'}
                                                        </div>
                                                        {filteredBranches
                                                            .filter(branch => {
                                                                if (!branchSearchText) return true
                                                                const searchLower = branchSearchText.toLowerCase()
                                                                return branch.name.toLowerCase().includes(searchLower) ||
                                                                       (branch.nameJa && branch.nameJa.toLowerCase().includes(searchLower))
                                                            })
                                                            .map(branch => (
                                                                <div
                                                                    key={branch.id}
                                                                    data-branch-id={branch.id}
                                                                    className={`px-3 py-2 ${formData.branchId === branch.id ? 'bg-primary text-white' : 'hover-bg-light'}`}
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => {
                                                                        handleBranchChange(branch.id)
                                                                        setBranchSearchOpen(false)
                                                                        setBranchSearchText('')
                                                                    }}
                                                                >
                                                                    {locale === 'ja' ? (branch.nameJa || branch.name) : branch.name}
                                                                </div>
                                                            ))
                                                        }
                                                        {formData.corporationId && (
                                                            <div
                                                                className="px-3 py-2 border-top text-primary fw-bold"
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => {
                                                                    handleBranchChange('ADD_NEW')
                                                                    setBranchSearchOpen(false)
                                                                    setBranchSearchText('')
                                                                }}
                                                            >
                                                                + {t('addNewBranch')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 지역명 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('regionName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.regionCode ? getRegionName(formData.regionCode) || '' : ''}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                            />
                                        </div>

                                        {/* 관할지역 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('areaName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.areaCode ? getAreaName(formData.areaCode) || '' : ''}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                            />
                                        </div>

                                        {/* 우편번호 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{tc('postalCode')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.postalCode}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                            />
                                        </div>

                                        {/* 주소 (자동입력) */}
                                        <div className="col-md-6">
                                            <label className="form-label">{tc('address')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                            />
                                        </div>

                                        {/* 담당자 연락처 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{tc('managerPhone')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.managerPhone}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                            />
                                        </div>

                                        {/* 계약 정보 섹션 */}
                                        <div className="col-12">
                                            <hr className="my-2" />
                                            <h4 className="text-muted">{t('contractInfo')}</h4>
                                        </div>

                                        {/* DX솔루션 계약일 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('contractDate')}</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.contractDate}
                                                readOnly
                                                style={{ backgroundColor: '#f0f0f0' }}
                                            />
                                        </div>

                                        {/* ERP 수수료율 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('erpFeeRate')}</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.erpFeeRate}
                                                    readOnly
                                                    style={{ backgroundColor: '#f0f0f0' }}
                                                />
                                                <span className="input-group-text">%</span>
                                            </div>
                                        </div>

                                        {/* 키오스크 유지보수 비용 (자동입력) */}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('kioskMaintenanceCost')}</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.kioskMaintenanceCost}
                                                    readOnly
                                                    style={{ backgroundColor: '#f0f0f0' }}
                                                />
                                                <span className="input-group-text">円/月</span>
                                            </div>
                                        </div>

                                        {/* 키오스크 판매 비용 (자동입력) - 만엔 단위 */}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('kioskSaleCost')}</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.kioskSaleCost}
                                                    readOnly
                                                    style={{ backgroundColor: '#f0f0f0' }}
                                                />
                                                <span className="input-group-text">万円/台</span>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <hr className="my-2" />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">{t('acquisition')}</label>
                                            <select className="form-select" value={formData.acquisition}
                                                onChange={e => setFormData({...formData, acquisition: e.target.value, leaseCompanyId: e.target.value !== 'LEASE_FREE' ? '' : formData.leaseCompanyId})}>
                                                <option value="FREE">{t('acquisitionFree')}</option>
                                                <option value="LEASE_FREE">{t('acquisitionLeaseFree')}</option>
                                                <option value="PAID">{t('acquisitionPaid')}</option>
                                                <option value="RENTAL">{t('acquisitionRental')}</option>
                                            </select>
                                        </div>
                                        {formData.acquisition === 'LEASE_FREE' && (
                                            <div className="col-md-3">
                                                <label className="form-label">
                                                    {t('selectLeaseCompany')}
                                                    <span className="text-danger ms-1">*</span>
                                                </label>
                                                <select
                                                    className={`form-select ${!formData.leaseCompanyId ? 'is-invalid' : ''}`}
                                                    value={formData.leaseCompanyId}
                                                    onChange={e => setFormData({...formData, leaseCompanyId: e.target.value})}
                                                    required
                                                >
                                                    <option value="">{t('selectLeaseCompany')}</option>
                                                    {leaseCompanies.map(lc => (
                                                        <option key={lc.id} value={lc.id}>{lc.name}</option>
                                                    ))}
                                                </select>
                                                {!formData.leaseCompanyId && (
                                                    <div className="invalid-feedback">{t('leaseCompanyRequired')}</div>
                                                )}
                                            </div>
                                        )}
                                        <div className="col-md-3">
                                            <label className="form-label">{t('salePrice')}</label>
                                            <div className="input-group">
                                                <input type="number" className="form-control" value={formData.salePrice}
                                                    onChange={e => {
                                                        const newPrice = e.target.value
                                                        // 판매요금이 0이 아닌 숫자면 자동으로 '유상'으로 변경
                                                        if (newPrice && parseFloat(newPrice) > 0) {
                                                            setFormData({...formData, salePrice: newPrice, acquisition: 'PAID'})
                                                        } else {
                                                            setFormData({...formData, salePrice: newPrice})
                                                        }
                                                    }} />
                                                <span className="input-group-text">{th('manYen')}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('orderRequestDate')}</label>
                                            <input type="text" className="form-control" value={formData.orderRequestDate}
                                                onChange={e => handleDateInput('orderRequestDate', e.target.value)}
                                                placeholder={t('datePlaceholder')} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('deliveryDueDate')}</label>
                                            <input type="text" className="form-control" value={formData.deliveryDueDate}
                                                onChange={e => setFormData({...formData, deliveryDueDate: e.target.value})}
                                                placeholder={t('deliveryDueDatePlaceholder')} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('deliveryDate')}</label>
                                            <input type="text" className="form-control" value={formData.deliveryDate}
                                                onChange={e => handleDateInput('deliveryDate', e.target.value)}
                                                placeholder={t('datePlaceholder')} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">{t('deliveryStatus')}</label>
                                            <select className="form-select" value={formData.deliveryStatus}
                                                onChange={e => setFormData({...formData, deliveryStatus: e.target.value})}>
                                                <option value="PENDING">{t('deliveryPending')}</option>
                                                <option value="ORDERED">{t('deliveryOrdered')}</option>
                                                <option value="SHIPPED">{t('deliveryShipped')}</option>
                                                <option value="DELIVERED">{t('deliveryDelivered')}</option>
                                            </select>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">{t('memo')}</label>
                                            <textarea
                                                className="form-control"
                                                value={formData.memo}
                                                onChange={e => setFormData({...formData, memo: e.target.value})}
                                                rows={3}
                                                placeholder={t('memoPlaceholder')}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button type="submit" className="btn btn-primary">
                                            <i className="ti ti-check me-2"></i>
                                            {tc('save')}
                                        </button>
                                        <button type="button" className="btn btn-secondary ms-2" onClick={() => { setIsCreating(false); setEditingKiosk(null); resetForm() }}>
                                            {tc('cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Statistics Summary */}
                    <div className="card mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="card-body py-3">
                            <div className="d-flex flex-wrap align-items-center gap-3" style={{ fontSize: '0.95rem' }}>
                                {/* 그룹 1: 키오스크 수량 */}
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
                                    <span className="text-muted">{t('stats.kiosks')}</span>
                                    <strong className="text-primary" style={{ fontSize: '1.1rem' }}>{filteredKiosks.length}</strong>
                                    <span className="text-muted">{t('stats.units')}</span>
                                </div>

                                {/* 그룹 2: KC자산 = 총 키오스크 - 유상(salePrice > 0) - 렌탈 */}
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#f3e5f5', border: '1px solid #ce93d8' }}>
                                    <span className="text-muted">{t('stats.kcAsset')}</span>
                                    <strong style={{ color: '#7b1fa2', fontSize: '1.1rem' }}>{filteredKiosks.filter(k => getEffectiveAcquisition(k) !== 'PAID' && getEffectiveAcquisition(k) !== 'RENTAL').length}</strong>
                                    <span className="text-muted">{t('stats.units')}</span>
                                    <button
                                        className={`btn btn-sm ms-2 ${showKcAssetOnly ? 'btn-purple' : 'btn-outline-purple'}`}
                                        onClick={() => setShowKcAssetOnly(!showKcAssetOnly)}
                                        style={{
                                            backgroundColor: showKcAssetOnly ? '#7b1fa2' : 'transparent',
                                            borderColor: '#7b1fa2',
                                            color: showKcAssetOnly ? 'white' : '#7b1fa2',
                                            padding: '2px 8px',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        <i className={`ti ${showKcAssetOnly ? 'ti-filter-off' : 'ti-filter'} me-1`}></i>
                                        {showKcAssetOnly ? t('stats.showAll') : t('stats.kcAssetFilter')}
                                    </button>
                                </div>

                                {/* 그룹 3: 브랜드/계약법인/지점 */}
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#fff3e0', border: '1px solid #ffcc80' }}>
                                    <span className="text-muted">{t('stats.brands')}</span>
                                    <strong style={{ color: '#e65100', fontSize: '1.1rem' }}>{new Set(filteredKiosks.map(k => getBrandName(k)).filter(b => b !== '-')).size}</strong>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-muted">{t('stats.corporations')}</span>
                                    <strong style={{ color: '#e65100', fontSize: '1.1rem' }}>{new Set(filteredKiosks.map(k => k.branch?.corporation?.id).filter(Boolean)).size}</strong>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-muted">{t('stats.branches')}</span>
                                    <strong style={{ color: '#e65100', fontSize: '1.1rem' }}>{new Set(filteredKiosks.map(k => k.branchName).filter(Boolean)).size}</strong>
                                </div>

                                {/* 그룹 3: 취득형태별 (salePrice > 0이면 자동으로 유상으로 카운트) */}
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
                                    <span className="text-muted">{t('stats.free')}</span>
                                    <strong className="text-success" style={{ fontSize: '1.1rem' }}>{filteredKiosks.filter(k => getEffectiveAcquisition(k) === 'FREE' || getEffectiveAcquisition(k) === 'PURCHASE').length}</strong>
                                    <span className="text-muted">{t('stats.cases')}</span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-muted">{t('stats.leaseFree')}</span>
                                    <strong className="text-warning" style={{ fontSize: '1.1rem' }}>{filteredKiosks.filter(k => getEffectiveAcquisition(k) === 'LEASE_FREE' || getEffectiveAcquisition(k) === 'LEASE').length}</strong>
                                    <span className="text-muted">{t('stats.cases')}</span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-muted">{t('stats.paid')}</span>
                                    <strong className="text-primary" style={{ fontSize: '1.1rem' }}>{filteredKiosks.filter(k => getEffectiveAcquisition(k) === 'PAID').length}</strong>
                                    <span className="text-muted">{t('stats.cases')}</span>
                                    <span className="text-muted ms-1">
                                        ({filteredKiosks.filter(k => getEffectiveAcquisition(k) === 'PAID').reduce((sum, k) => sum + (k.salePrice || 0), 0).toLocaleString()}{th('manYen')})
                                    </span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-muted">{t('stats.rental')}</span>
                                    <strong className="text-info" style={{ fontSize: '1.1rem' }}>{filteredKiosks.filter(k => getEffectiveAcquisition(k) === 'RENTAL').length}</strong>
                                    <span className="text-muted">{t('stats.cases')}</span>
                                </div>

                                {/* 그룹 5: 수리 현황 (최신 이력의 moveType이 MAINTENANCE인 경우) */}
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#ffebee', border: '1px solid #ef9a9a' }}>
                                    <span className="text-muted">{t('stats.repair')}</span>
                                    <strong className="text-danger" style={{ fontSize: '1.1rem' }}>{filteredKiosks.filter(k => k.latestMoveType === 'MAINTENANCE').length}</strong>
                                    <span className="text-muted">{t('stats.cases')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Table */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('title')}</h3>
                            <div className="ms-auto d-flex gap-2">
                                {/* 필터 초기화 버튼 */}
                                {Object.values(filters).some(v => v !== '') && (
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => setFilters({ brandName: '', corporationId: '', branchId: '', regionCode: '', areaCode: '', acquisition: '', deliveryStatus: '', status: '' })}
                                    >
                                        <i className="ti ti-filter-off me-1"></i>
                                        {tc('filterReset')}
                                    </button>
                                )}
                                {/* 컬럼 설정 버튼 */}
                                <div className="dropdown" style={{ position: 'relative' }}>
                                    <button
                                        className="btn btn-outline-secondary btn-sm dropdown-toggle"
                                        onClick={() => setShowColumnSettings(!showColumnSettings)}
                                    >
                                        <i className="ti ti-columns me-1"></i>
                                        {t('columnSettings')}
                                    </button>
                                    {showColumnSettings && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                                                onClick={() => setShowColumnSettings(false)}
                                            />
                                            <div className="dropdown-menu show" style={{ minWidth: '220px', position: 'absolute', right: 0, left: 'auto', zIndex: 1000 }}>
                                                <div className="dropdown-header d-flex justify-content-between align-items-center">
                                                    <span>{t('selectColumns')}</span>
                                                    <div className="btn-group btn-group-sm">
                                                        <button className="btn btn-sm btn-outline-primary py-0 px-1" onClick={() => toggleAllColumns(true)}>{t('selectAll')}</button>
                                                        <button className="btn btn-sm btn-outline-secondary py-0 px-1" onClick={() => toggleAllColumns(false)}>{t('deselectAll')}</button>
                                                    </div>
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    {columnDefinitions.map(col => (
                                                        <label key={col.key} className="dropdown-item d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input m-0"
                                                                checked={visibleColumns[col.key]}
                                                                onChange={() => toggleColumn(col.key)}
                                                            />
                                                            <span>{col.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <div className="px-3 py-2">
                                                    <button
                                                        className="btn btn-primary btn-sm w-100"
                                                        onClick={saveColumnSettings}
                                                    >
                                                        <i className="ti ti-device-floppy me-1"></i>
                                                        {t('saveColumnSettings')}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* 상단 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                                <p className="m-0 text-muted" style={{ fontSize: '12px' }}>
                                    {t('total')}: <strong>{filteredKiosks.length}</strong>
                                    {filteredKiosks.length !== kiosks.length && <span className="text-muted ms-2">({kiosks.length}건 중)</span>}
                                </p>
                                <ul className="pagination pagination-sm m-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => changePage(Math.max(1, currentPage - 1))}>
                                            {tc('previous')}
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }
                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => changePage(pageNum)}>
                                                    {pageNum}
                                                </button>
                                            </li>
                                        )
                                    })}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => changePage(Math.min(totalPages, currentPage + 1))}>
                                            {tc('next')}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                        <div className="table-responsive" style={{ overflow: 'visible' }}>
                            <table className="table table-vcenter card-table table-striped" style={{ fontSize: '12px', tableLayout: 'fixed', width: '100%' }}>
                                <thead>
                                    <tr>
                                        {visibleColumns.brandName && (
                                            <th style={{ position: 'relative', width: '90px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'brandName' ? null : 'brandName')}
                                                >
                                                    {t('brandName')}
                                                    <i className={`ti ti-chevron-down ${filters.brandName ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'brandName' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '150px', maxHeight: '250px', overflowY: 'auto' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, brandName: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            {[...new Set(kiosks.map(k => getBrandName(k)).filter(b => b !== '-'))].sort().map(brand => (
                                                                <button key={brand} className={`dropdown-item ${filters.brandName === brand ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, brandName: brand })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                    {brand}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.contractPartner && (
                                            <th style={{ position: 'relative', width: '120px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'contractPartner' ? null : 'contractPartner')}
                                                >
                                                    {t('contractPartner')}
                                                    <i className={`ti ti-chevron-down ${filters.corporationId ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'contractPartner' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '180px', maxHeight: '250px', overflowY: 'auto' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, corporationId: '', branchId: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            {[...new Set(kiosks.map(k => k.branch?.corporation).filter(Boolean))].map((corp: any) => (
                                                                <button key={corp.id} className={`dropdown-item ${filters.corporationId === corp.id ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, corporationId: corp.id, branchId: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                    {locale === 'ja' ? (corp.nameJa || corp.name) : corp.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.branchName && (
                                            <th style={{ position: 'relative', width: '80px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'branchName' ? null : 'branchName')}
                                                >
                                                    {t('branchName')}
                                                    <i className={`ti ti-chevron-down ${filters.branchId ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'branchName' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '150px', maxHeight: '250px', overflowY: 'auto' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, branchId: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            {[...new Set(kiosks.map(k => k.branchId).filter(Boolean))].map(branchId => {
                                                                const branch = branches.find(b => b.id === branchId)
                                                                return branch ? (
                                                                    <button key={branchId} className={`dropdown-item ${filters.branchId === branchId ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, branchId: branchId as string })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                        {locale === 'ja' ? (branch.nameJa || branch.name) : branch.name}
                                                                    </button>
                                                                ) : null
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.regionName && (
                                            <th style={{ position: 'relative', width: '85px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'regionName' ? null : 'regionName')}
                                                >
                                                    {t('regionName')}
                                                    <i className={`ti ti-chevron-down ${filters.regionCode ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'regionName' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '120px', maxHeight: '250px', overflowY: 'auto' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, regionCode: '', areaCode: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            {regions.map(r => (
                                                                <button key={r.code} className={`dropdown-item ${filters.regionCode === r.code ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, regionCode: r.code, areaCode: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                    {locale === 'ja' ? (r.nameJa || r.name) : r.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.areaName && (
                                            <th style={{ position: 'relative', width: '90px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'areaName' ? null : 'areaName')}
                                                >
                                                    {t('areaName')}
                                                    <i className={`ti ti-chevron-down ${filters.areaCode ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'areaName' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '120px', maxHeight: '250px', overflowY: 'auto' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, areaCode: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            {areas.filter(a => !filters.regionCode || a.regionId === regions.find(r => r.code === filters.regionCode)?.id).map(a => (
                                                                <button key={a.code} className={`dropdown-item ${filters.areaCode === a.code ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, areaCode: a.code })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                    {locale === 'ja' ? (a.nameJa || a.name) : a.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.acquisition && (
                                            <th style={{ position: 'relative', width: '55px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'acquisition' ? null : 'acquisition')}
                                                >
                                                    {t('acquisition')}
                                                    <i className={`ti ti-chevron-down ${filters.acquisition ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'acquisition' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '100px' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, acquisition: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            <button className={`dropdown-item ${filters.acquisition === 'FREE' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, acquisition: 'FREE' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('acquisitionFree')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.acquisition === 'LEASE_FREE' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, acquisition: 'LEASE_FREE' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('acquisitionLeaseFree')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.acquisition === 'PAID' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, acquisition: 'PAID' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('acquisitionPaid')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.acquisition === 'RENTAL' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, acquisition: 'RENTAL' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('acquisitionRental')}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.salePrice && <th style={{ width: '50px' }}>{t('salePrice')}</th>}
                                        {visibleColumns.orderRequestDate && <th style={{ width: '70px' }}>{t('orderRequestDate')}</th>}
                                        {visibleColumns.deliveryDueDate && <th style={{ width: '75px' }}>{t('deliveryDueDate')}</th>}
                                        {visibleColumns.deliveryDate && <th style={{ width: '70px' }}>{t('deliveryDate')}</th>}
                                        {visibleColumns.deliveryStatus && (
                                            <th style={{ position: 'relative', width: '60px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'deliveryStatus' ? null : 'deliveryStatus')}
                                                >
                                                    {t('deliveryStatus')}
                                                    <i className={`ti ti-chevron-down ${filters.deliveryStatus ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'deliveryStatus' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '100px' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, deliveryStatus: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            <button className={`dropdown-item ${filters.deliveryStatus === 'PENDING' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, deliveryStatus: 'PENDING' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('deliveryPending')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.deliveryStatus === 'DELIVERED' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, deliveryStatus: 'DELIVERED' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('deliveryDelivered')}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th style={{ position: 'relative', width: '60px' }}>
                                                <span
                                                    className="d-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveFilterColumn(activeFilterColumn === 'status' ? null : 'status')}
                                                >
                                                    {t('installStatus')}
                                                    <i className={`ti ti-chevron-down ${filters.status ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '10px' }}></i>
                                                </span>
                                                {activeFilterColumn === 'status' && (
                                                    <>
                                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, minWidth: '100px' }}>
                                                            <button className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {tc('all')}
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            <button className={`dropdown-item ${filters.status === 'IN_STOCK' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, status: 'IN_STOCK' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('statusInStock')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.status === 'DEPLOYED' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, status: 'DEPLOYED' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('statusDeployed')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.status === 'MAINTENANCE' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, status: 'MAINTENANCE' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('statusMaintenance')}
                                                            </button>
                                                            <button className={`dropdown-item ${filters.status === 'RETIRED' ? 'active' : ''}`} onClick={() => { setFilters(prev => ({ ...prev, status: 'RETIRED' })); setCurrentPage(1); setActiveFilterColumn(null) }}>
                                                                {t('statusRetired')}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        )}
                                        {visibleColumns.serialNumber && <th style={{ width: '100px' }}>{t('serialNumber')}</th>}
                                        {visibleColumns.kioskNumber && <th style={{ width: '55px' }}>{t('kioskNumber')}</th>}
                                        {visibleColumns.anydeskId && <th style={{ width: '85px' }}>{t('anydeskId')}</th>}
                                        <th style={{ width: '100px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></td></tr>
                                    ) : filteredKiosks.length === 0 ? (
                                        <tr><td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center text-muted py-4">{t('noAssets')}</td></tr>
                                    ) : (
                                        paginatedKiosks.map(k => (
                                            <tr key={k.id}>
                                                {visibleColumns.brandName && <td style={{ wordBreak: 'break-word' }}>{getBrandName(k)}</td>}
                                                {visibleColumns.contractPartner && <td style={{ wordBreak: 'break-word' }}>{getContractPartnerName(k) || '-'}</td>}
                                                {visibleColumns.branchName && <td style={{ wordBreak: 'break-word' }}>{getBranchName(k) || '-'}</td>}
                                                {visibleColumns.regionName && <td>{getRegionCode(k) ? <span className="badge bg-azure-lt">{getRegionName(getRegionCode(k))}</span> : '-'}</td>}
                                                {visibleColumns.areaName && <td style={{ wordBreak: 'break-word' }}>{getAreaCode(k) ? getAreaName(getAreaCode(k)) : '-'}</td>}
                                                {visibleColumns.acquisition && (
                                                    <td>
                                                        {getAcquisitionBadge(k)}
                                                    </td>
                                                )}
                                                {visibleColumns.salePrice && <td>{k.salePrice ? `${k.salePrice}${th('manYen')}` : '-'}</td>}
                                                {visibleColumns.orderRequestDate && <td>{formatDate(k.orderRequestDate)}</td>}
                                                {visibleColumns.deliveryDueDate && <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDeliveryDueDate(k.deliveryDueDate)}</td>}
                                                {visibleColumns.deliveryDate && (
                                                    <td
                                                        style={{ cursor: 'pointer', minWidth: '100px' }}
                                                        onClick={() => inlineEditingId !== k.id && startInlineEdit(k)}
                                                    >
                                                        {inlineEditingId === k.id ? (
                                                            <div className="d-flex align-items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    value={inlineEditValue}
                                                                    onChange={(e) => handleInlineDateInput(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') saveInlineEdit(k.id)
                                                                        if (e.key === 'Escape') cancelInlineEdit()
                                                                    }}
                                                                    placeholder="YYYY-MM-DD"
                                                                    autoFocus
                                                                    style={{ width: '110px' }}
                                                                />
                                                                <button
                                                                    className="btn btn-sm btn-success p-1"
                                                                    onClick={(e) => { e.stopPropagation(); saveInlineEdit(k.id) }}
                                                                    title="저장"
                                                                >
                                                                    <i className="ti ti-check" style={{ fontSize: '12px' }}></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-secondary p-1"
                                                                    onClick={(e) => { e.stopPropagation(); cancelInlineEdit() }}
                                                                    title="취소"
                                                                >
                                                                    <i className="ti ti-x" style={{ fontSize: '12px' }}></i>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-primary" style={{ borderBottom: '1px dashed #206bc4' }}>
                                                                {formatDate(k.deliveryDate) || '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.deliveryStatus && <td>{getDeliveryStatusBadge(k.deliveryStatus)}</td>}
                                                {visibleColumns.status && <td>{getStatusBadgeFromMoveType(k)}</td>}
                                                {visibleColumns.serialNumber && <td className="fw-bold" style={{ wordBreak: 'break-word' }}>
                                                    <Link href={`/dashboard/assets/${k.id}?page=${currentPage}`} className="text-reset">
                                                        {k.serialNumber}
                                                    </Link>
                                                </td>}
                                                {visibleColumns.kioskNumber && <td>{k.kioskNumber || '-'}</td>}
                                                {visibleColumns.anydeskId && <td style={{ wordBreak: 'break-word' }}>{k.anydeskId || '-'}</td>}
                                                <td>
                                                    <div className="btn-list flex-nowrap">
                                                        {/* 이력 버튼 - 숫자만 표시 */}
                                                        <button
                                                            className="btn btn-ghost-secondary btn-sm"
                                                            onClick={() => fetchHistory(k)}
                                                            title="이동이력"
                                                        >
                                                            {k._count?.history || 0}
                                                        </button>
                                                        <Link href={`/dashboard/assets/${k.id}?page=${currentPage}`} className="btn btn-ghost-info btn-sm" title="상세보기">
                                                            <i className="ti ti-eye"></i>
                                                        </Link>
                                                        <button className="btn btn-ghost-primary btn-sm" onClick={() => handleEdit(k)} title="편집">
                                                            <i className="ti ti-edit"></i>
                                                        </button>
                                                        <button className="btn btn-ghost-danger btn-sm" onClick={() => handleDelete(k.id)} title="삭제">
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
                        <div className="card-footer d-flex align-items-center justify-content-between">
                            <p className="m-0 text-muted">
                                {t('total')}: <strong>{filteredKiosks.length}</strong>
                                {filteredKiosks.length !== kiosks.length && <span className="text-muted ms-2">({kiosks.length}건 중)</span>}
                            </p>
                            {totalPages > 1 && (
                                <ul className="pagination m-0 ms-auto">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => changePage(Math.max(1, currentPage - 1))}>
                                            {tc('previous')}
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }
                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => changePage(pageNum)}>
                                                    {pageNum}
                                                </button>
                                            </li>
                                        )
                                    })}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => changePage(Math.min(totalPages, currentPage + 1))}>
                                            {tc('next')}
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 이동이력 모달 */}
            {showHistoryModal && (
                <div className="modal modal-blur fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="ti ti-history me-2 text-warning"></i>
                                    이동이력 - {selectedKioskForHistory?.serialNumber}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => { setShowHistoryModal(false); setSelectedKioskForHistory(null); setHistoryItems([]) }}></button>
                            </div>
                            <div className="modal-body">
                                {historyLoading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="text-muted mt-2">이력을 불러오는 중...</p>
                                    </div>
                                ) : historyItems.length === 0 ? (
                                    <div className="text-center py-4">
                                        <i className="ti ti-history-off text-muted" style={{ fontSize: '3rem' }}></i>
                                        <p className="text-muted mt-2">이동이력이 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="timeline">
                                        {historyItems.map((item, index) => (
                                            <div className="timeline-event" key={item.id}>
                                                <div className="timeline-event-icon bg-warning-lt">
                                                    <i className="ti ti-arrows-exchange"></i>
                                                </div>
                                                <div className="card timeline-event-card">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                {getMoveTypeBadge(item.moveType)}
                                                                <span className="text-muted ms-2 small">{formatDateTime(item.eventDate)}</span>
                                                            </div>
                                                            {item.handledBy && (
                                                                <span className="badge bg-secondary-lt">{item.handledBy}</span>
                                                            )}
                                                        </div>
                                                        <div className="row g-2">
                                                            <div className="col-md-5">
                                                                <div className="text-muted small">{th('before')}</div>
                                                                {item.prevCorporation && (
                                                                    <div className="fw-semibold text-azure">{locale === 'ja' ? (item.prevCorporation.nameJa || item.prevCorporation.name) : item.prevCorporation.name}</div>
                                                                )}
                                                                <div className="fw-semibold">{item.prevBranchRel ? (locale === 'ja' ? (item.prevBranchRel.nameJa || item.prevBranchRel.name) : item.prevBranchRel.name) : (item.prevLocation || item.prevBranch || '-')}</div>
                                                                {!item.prevCorporation && item.prevPartner && (
                                                                    <div className="text-muted small">{item.prevPartner.name}</div>
                                                                )}
                                                                {item.prevStatus && (
                                                                    <span className="badge bg-secondary-lt mt-1">{item.prevStatus}</span>
                                                                )}
                                                            </div>
                                                            <div className="col-md-2 d-flex align-items-center justify-content-center">
                                                                <i className="ti ti-arrow-right text-warning" style={{ fontSize: '1.5rem' }}></i>
                                                            </div>
                                                            <div className="col-md-5">
                                                                <div className="text-muted small">{th('after')}</div>
                                                                {item.newCorporation && (
                                                                    <div className="fw-semibold text-azure">{locale === 'ja' ? (item.newCorporation.nameJa || item.newCorporation.name) : item.newCorporation.name}</div>
                                                                )}
                                                                <div className="fw-semibold">{item.newBranchRel ? (locale === 'ja' ? (item.newBranchRel.nameJa || item.newBranchRel.name) : item.newBranchRel.name) : (item.newLocation || item.newBranch || '-')}</div>
                                                                {!item.newCorporation && item.newPartner && (
                                                                    <div className="text-muted small">{item.newPartner.name}</div>
                                                                )}
                                                                {item.newStatus && (
                                                                    <span className="badge bg-primary-lt mt-1">{item.newStatus}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(item.repairReason || item.repairCost || item.repairVendor) && (
                                                            <div className="mt-3 p-2 bg-yellow-lt rounded">
                                                                <div className="fw-semibold text-yellow mb-1">
                                                                    <i className="ti ti-tool me-1"></i>수리 정보
                                                                </div>
                                                                {item.repairReason && <div className="small">사유: {item.repairReason}</div>}
                                                                {item.repairVendor && <div className="small">업체: {item.repairVendor}</div>}
                                                                {item.repairCost && <div className="small">비용: ¥{item.repairCost.toLocaleString()}</div>}
                                                            </div>
                                                        )}
                                                        {item.description && (
                                                            <div className="mt-2 text-muted small">
                                                                <i className="ti ti-note me-1"></i>{translateDescription(item.description)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowHistoryModal(false); setSelectedKioskForHistory(null); setHistoryItems([]) }}>
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
