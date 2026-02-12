'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type FC = {
    id: string
    code: string
    name: string
    nameJa: string | null
}

type Corporation = {
    id: string
    code: string
    name: string
    nameJa: string | null
    fc?: FC | null
}

type Branch = {
    id: string
    code: string | null
    name: string
    nameJa: string | null
    corporationId: string
    address: string | null
    postalCode: string | null
    managerPhone: string | null
}

type LeaseCompany = {
    id: string
    code: string
    name: string
    nameJa: string | null
}

type DeliveryItem = {
    id: number
    corporationId: string
    corporationName?: string  // 저장용
    branchId: string
    branchName?: string  // 저장용
    brandName: string
    postalCode: string
    address: string
    contact: string
    kioskCount: number
    plateCount: number
    acquisition: string  // PAID(유상), FREE(무상), LEASE_FREE(리스무상), RENTAL(렌탈)
    leaseCompanyId: string
    desiredDeliveryDate: string  // 납기희망일 (항목별)
}

type OrderItem = {
    corporationId: string | null
    corporationName: string | null
    corporationNameJa: string | null
    branchId: string | null
    branchName: string | null
    branchNameJa: string | null
    brandName: string | null
    postalCode: string | null
    address: string | null
    contact: string | null
    acquisition: string
    leaseCompanyId: string | null
    desiredDeliveryDate: string | null
    kioskCount: number
    plateCount: number
}

type OrderProcess = {
    id: string
    orderNumber: string
    status: string
    requesterName: string | null
    title: string | null
    kioskUnitPrice: number | null
    plateUnitPrice: number | null
    taxIncluded: boolean
    notes: string | null
    quantity: number
    totalAmount: number | null
    orderRequestDate: string | null
    desiredDeliveryDate: string | null
    createdAt: string
    // 납품항목 정보
    corporationId: string | null
    corporationName: string | null
    corporationNameJa: string | null
    branchId: string | null
    branchName: string | null
    branchNameJa: string | null
    brandName: string | null
    postalCode: string | null
    address: string | null
    contact: string | null
    kioskCount: number
    plateCount: number
    acquisition: string | null
    leaseCompanyId: string | null
    // 품의 관련 필드
    approvalRequestId: string | null
    approvalStatus: string | null
    approvalDate: string | null
    approvalComment: string | null
    // 복수 업체 정보
    items: OrderItem[] | null
    itemCount: number
}

export default function OrderPage() {
    const t = useTranslations('order')
    const tn = useTranslations('nav')
    const tc = useTranslations('common')
    const ta = useTranslations('assets')
    const locale = useLocale()
    const router = useRouter()
    const { data: session } = useSession()

    const [corporations, setCorporations] = useState<Corporation[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [leaseCompanies, setLeaseCompanies] = useState<LeaseCompany[]>([])
    const [orders, setOrders] = useState<OrderProcess[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showForm, setShowForm] = useState(true)  // 기본적으로 폼 열림

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 30

    // 아코디언 확장 상태 (복수 거래처가 있는 발주)
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

    // 편집 중인 발주 ID
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null)

    // 드롭다운 상태 (각 행별로)
    const [openCorpDropdown, setOpenCorpDropdown] = useState<number | null>(null)
    const [openBranchDropdown, setOpenBranchDropdown] = useState<number | null>(null)
    const [corpSearchTexts, setCorpSearchTexts] = useState<Record<number, string>>({})
    const [branchSearchTexts, setBranchSearchTexts] = useState<Record<number, string>>({})

    // 기본 정보 (납기희망일은 납품항목으로 이동)
    const [formData, setFormData] = useState({
        title: 'キオスク端末＆決済端末の鉄板・金具',
        requesterName: '',
        orderRequestDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        kioskUnitPrice: 240000,
        plateUnitPrice: 5000,
        notes: ''
    })

    // 납품의뢰자 초기값 설정 여부 추적
    const [requesterInitialized, setRequesterInitialized] = useState(false)

    // 로그인 사용자 이름을 납품의뢰자에 자동 설정
    useEffect(() => {
        if (session?.user?.name && !requesterInitialized) {
            setFormData(prev => ({ ...prev, requesterName: session.user.name || '' }))
            setRequesterInitialized(true)
        }
    }, [session?.user?.name, requesterInitialized])

    // 납품 항목 리스트
    const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([
        { id: 1, corporationId: '', branchId: '', brandName: '', postalCode: '', address: '', contact: '', kioskCount: 1, plateCount: 1, acquisition: 'FREE', leaseCompanyId: '', desiredDeliveryDate: '' }
    ])

    // 클릭 외부 감지
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenCorpDropdown(null)
                setOpenBranchDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 데이터 불러오기
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [corpsRes, branchesRes, leaseRes, ordersRes] = await Promise.all([
                fetch('/api/corporations'),
                fetch('/api/branches'),
                fetch('/api/lease-companies'),
                fetch('/api/order')
            ])

            if (corpsRes.ok) setCorporations(await corpsRes.json())
            if (branchesRes.ok) setBranches(await branchesRes.json())
            if (leaseRes.ok) setLeaseCompanies(await leaseRes.json())
            if (ordersRes.ok) setOrders(await ordersRes.json())
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getDisplayName = (item: { name: string; nameJa?: string | null }) => {
        return locale === 'ja' ? (item.nameJa || item.name) : item.name
    }

    // YYYYMMDD 형식 날짜를 표시용 문자열로 변환
    const formatOrderDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '-'
        // YYYYMMDD 형식인 경우 (8자리 숫자)
        if (/^\d{8}$/.test(dateStr)) {
            const year = dateStr.substring(0, 4)
            const month = dateStr.substring(4, 6)
            const day = dateStr.substring(6, 8)
            return `${year}.${parseInt(month)}.${parseInt(day)}`
        }
        // ISO 타임스탬프인 경우
        if (dateStr.includes('T')) {
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString()
            }
        }
        // 그 외 문자열은 그대로 반환 (텍스트 형식 날짜)
        return dateStr
    }

    // 법인 선택 시 지점 필터링
    const getFilteredBranches = (corporationId: string) => {
        return branches.filter(b => b.corporationId === corporationId)
    }

    // 항목 추가
    const addDeliveryItem = () => {
        const newId = Math.max(...deliveryItems.map(i => i.id), 0) + 1
        setDeliveryItems([...deliveryItems, {
            id: newId,
            corporationId: '',
            branchId: '',
            brandName: '',
            postalCode: '',
            address: '',
            contact: '',
            kioskCount: 1,
            plateCount: 1,
            acquisition: 'FREE',
            leaseCompanyId: '',
            desiredDeliveryDate: ''
        }])
    }

    // 항목 삭제
    const removeDeliveryItem = (id: number) => {
        if (deliveryItems.length > 1) {
            setDeliveryItems(deliveryItems.filter(item => item.id !== id))
        }
    }

    // 항목 업데이트
    const updateDeliveryItem = (id: number, field: keyof DeliveryItem, value: string | number) => {
        setDeliveryItems(deliveryItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value }

                // 지점 선택 시 주소, 우편번호, 연락처 자동 입력 + 지점명 저장
                if (field === 'branchId' && value) {
                    const branch = branches.find(b => b.id === value)
                    if (branch) {
                        updated.postalCode = branch.postalCode || ''
                        updated.address = branch.address || ''
                        updated.contact = branch.managerPhone || ''
                        updated.branchName = branch.name || ''  // 지점명 저장
                    }
                }

                // 법인 변경 시 지점 초기화 + 브랜드명 자동 입력 + 법인명 저장
                if (field === 'corporationId') {
                    updated.branchId = ''
                    updated.branchName = ''
                    updated.postalCode = ''
                    updated.address = ''
                    updated.contact = ''
                    // 브랜드명 자동 입력 + 법인명 저장
                    if (value) {
                        const corp = corporations.find(c => c.id === value)
                        updated.corporationName = corp?.name || ''  // 법인명 저장
                        if (corp?.fc) {
                            updated.brandName = locale === 'ja' ? (corp.fc.nameJa || corp.fc.name) : corp.fc.name
                        } else {
                            updated.brandName = ''
                        }
                    } else {
                        updated.corporationName = ''
                        updated.brandName = ''
                    }
                }

                // 취득형태가 리스(무상)이 아니면 리스회사 초기화
                if (field === 'acquisition' && value !== 'LEASE_FREE') {
                    updated.leaseCompanyId = ''
                }

                return updated
            }
            return item
        }))
    }

    // 행별 단가 합계 계산
    const getItemTotal = (item: DeliveryItem) => {
        return (item.kioskCount * formData.kioskUnitPrice) + (item.plateCount * formData.plateUnitPrice)
    }

    // 전체 합계 계산
    const totalKioskCount = deliveryItems.reduce((sum, item) => sum + item.kioskCount, 0)
    const totalPlateCount = deliveryItems.reduce((sum, item) => sum + item.plateCount, 0)
    const totalAmount = deliveryItems.reduce((sum, item) => sum + getItemTotal(item), 0)

    // 저장 - /api/order 호출하여 OrderProcess + Kiosk 생성
    const handleSave = async () => {
        if (!formData.requesterName) {
            alert(locale === 'ja' ? '納品依頼者を入力してください' : '납품의뢰자를 입력해주세요')
            return
        }

        // 각 납품 항목의 필수 입력 검증
        for (let i = 0; i < deliveryItems.length; i++) {
            const item = deliveryItems[i]
            const rowNum = i + 1

            if (!item.corporationId) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: 契約法人名を選択してください`
                    : `${rowNum}행: 계약법인명을 선택해주세요`)
                return
            }
            if (!item.branchId) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: 店舗名を選択してください`
                    : `${rowNum}행: 점포명을 선택해주세요`)
                return
            }
            if (!item.brandName) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: ブランド名を入力してください`
                    : `${rowNum}행: 브랜드명을 입력해주세요`)
                return
            }
            if (!item.postalCode) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: 郵便番号を入力してください`
                    : `${rowNum}행: 우편번호를 입력해주세요`)
                return
            }
            if (!item.address) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: 住所を入力してください`
                    : `${rowNum}행: 주소를 입력해주세요`)
                return
            }
            if (!item.acquisition) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: 取得形態を選択してください`
                    : `${rowNum}행: 취득형태를 선택해주세요`)
                return
            }
            if (item.kioskCount < 1) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: キオスク数量は1以上にしてください`
                    : `${rowNum}행: 키오스크 수량은 1 이상이어야 합니다`)
                return
            }
            // 리스(무상) 선택 시 리스회사 필수
            if (item.acquisition === 'LEASE_FREE' && !item.leaseCompanyId) {
                alert(locale === 'ja'
                    ? `${rowNum}行目: 無償提供(リース)選択時はリース会社を選択してください`
                    : `${rowNum}행: 무상제공(리스) 선택 시 리스회사를 선택해주세요`)
                return
            }
        }

        setIsSaving(true)
        try {
            const url = editingOrderId ? `/api/order/${editingOrderId}` : '/api/order'
            const method = editingOrderId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    items: deliveryItems,
                    totalKioskCount,
                    totalPlateCount,
                    totalAmount
                })
            })

            if (res.ok) {
                const result = await res.json()
                if (editingOrderId) {
                    alert(locale === 'ja' ? '更新しました' : '수정되었습니다')
                    setEditingOrderId(null)
                } else {
                    alert(locale === 'ja'
                        ? `発注 ${result.orderNumber} が作成されました。\nキオスク ${result.quantity}台が登録されました。`
                        : `발주 ${result.orderNumber}가 생성되었습니다.\n키오스크 ${result.quantity}대가 등록되었습니다.`)
                }

                // 폼 초기화 (납품의뢰자는 로그인 사용자 이름 유지)
                setFormData({
                    title: 'キオスク端末＆決済端末の鉄板・金具',
                    requesterName: session?.user?.name || '',
                    orderRequestDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                    kioskUnitPrice: 240000,
                    plateUnitPrice: 5000,
                    notes: ''
                })
                setDeliveryItems([
                    { id: 1, corporationId: '', branchId: '', brandName: '', postalCode: '', address: '', contact: '', kioskCount: 1, plateCount: 1, acquisition: 'FREE', leaseCompanyId: '', desiredDeliveryDate: '' }
                ])

                // 목록 새로고침 및 폼 닫기
                const ordersRes = await fetch('/api/order')
                if (ordersRes.ok) setOrders(await ordersRes.json())
                setShowForm(false)
            } else {
                const error = await res.json()
                alert(error.message || (locale === 'ja' ? '保存に失敗しました' : '저장에 실패했습니다'))
            }
        } catch (error) {
            console.error('Failed to save:', error)
            alert(locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다')
        } finally {
            setIsSaving(false)
        }
    }

    // 취득형태 라벨 (발주의뢰처 입장 용어)
    const getAcquisitionLabel = (acquisition: string) => {
        const map: Record<string, { ko: string, ja: string }> = {
            // 코드 기반 매핑
            'PAID': { ko: '유상판매', ja: '有償販売' },
            'FREE': { ko: '무상제공', ja: '無償提供' },
            'LEASE_FREE': { ko: '무상제공(리스)', ja: '無償提供(リース)' },
            'RENTAL': { ko: '렌탈', ja: 'レンタル' },
            // 한국어 텍스트 역매핑 (레거시 데이터 호환)
            '유상판매': { ko: '유상판매', ja: '有償販売' },
            '무상제공': { ko: '무상제공', ja: '無償提供' },
            '무상제공(리스)': { ko: '무상제공(리스)', ja: '無償提供(リース)' },
            '렌탈': { ko: '렌탈', ja: 'レンタル' },
            // 일본어 텍스트 역매핑
            '有償販売': { ko: '유상판매', ja: '有償販売' },
            '無償提供': { ko: '무상제공', ja: '無償提供' },
            '無償提供(リース)': { ko: '무상제공(리스)', ja: '無償提供(リース)' },
            'レンタル': { ko: '렌탈', ja: 'レンタル' },
            // PURCHASE도 무상으로 처리 (기존 데이터 호환)
            'PURCHASE': { ko: '무상제공', ja: '無償提供' }
        }
        const label = map[acquisition] || { ko: acquisition, ja: acquisition }
        return locale === 'ja' ? label.ja : label.ko
    }

    // 법인 드롭다운 렌더링 (자산관리와 동일한 스타일)
    const renderCorpDropdown = (itemId: number, item: DeliveryItem) => {
        const searchText = corpSearchTexts[itemId] || ''
        const searchLower = searchText.toLowerCase()

        // 그룹화
        const grouped: Record<string, { fcName: string, corps: Corporation[] }> = {}
        const noFc: Corporation[] = []

        corporations.forEach(corp => {
            const corpName = (locale === 'ja' ? (corp.nameJa || corp.name) : corp.name).toLowerCase()
            const fcName = corp.fc?.name?.toLowerCase() || ''
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
            <div
                className="position-absolute bg-white border rounded shadow-sm mt-1"
                style={{ zIndex: 9999, maxHeight: '300px', overflowY: 'auto', minWidth: '280px', left: 0, top: '100%' }}
            >
                <div className="p-2 border-bottom sticky-top bg-white">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={locale === 'ja' ? '法人検索...' : '법인 검색...'}
                        value={searchText}
                        onChange={e => setCorpSearchTexts({ ...corpSearchTexts, [itemId]: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                    />
                </div>
                <div
                    className="px-3 py-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        updateDeliveryItem(itemId, 'corporationId', '')
                        setOpenCorpDropdown(null)
                        setCorpSearchTexts({ ...corpSearchTexts, [itemId]: '' })
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {ta('selectPartner')}
                </div>
                {sortedGroups.length === 0 && noFc.length === 0 && (
                    <div className="px-3 py-2 text-muted small">
                        {locale === 'ja' ? '検索結果がありません' : '검색 결과가 없습니다'}
                    </div>
                )}
                {sortedGroups.map(([fcId, group]) => (
                    <div key={fcId}>
                        <div className="px-3 py-1 text-muted small fw-bold bg-light">
                            {group.fcName}
                        </div>
                        {group.corps.map(corp => (
                            <div
                                key={corp.id}
                                className={`px-3 py-2 ps-4 ${item.corporationId === corp.id ? 'bg-primary text-white' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    updateDeliveryItem(itemId, 'corporationId', corp.id)
                                    setOpenCorpDropdown(null)
                                    setCorpSearchTexts({ ...corpSearchTexts, [itemId]: '' })
                                }}
                                onMouseEnter={e => {
                                    if (item.corporationId !== corp.id) {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (item.corporationId !== corp.id) {
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
                            {locale === 'ja' ? 'ブランドなし' : '브랜드 없음'}
                        </div>
                        {noFc.map(corp => (
                            <div
                                key={corp.id}
                                className={`px-3 py-2 ps-4 ${item.corporationId === corp.id ? 'bg-primary text-white' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    updateDeliveryItem(itemId, 'corporationId', corp.id)
                                    setOpenCorpDropdown(null)
                                    setCorpSearchTexts({ ...corpSearchTexts, [itemId]: '' })
                                }}
                                onMouseEnter={e => {
                                    if (item.corporationId !== corp.id) {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (item.corporationId !== corp.id) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                {locale === 'ja' ? (corp.nameJa || corp.name) : corp.name}
                            </div>
                        ))}
                    </div>
                )}
                {/* 신규 법인 추가 */}
                <div
                    className="px-3 py-2 border-top fw-bold"
                    style={{ cursor: 'pointer', color: '#206bc4' }}
                    onClick={() => {
                        router.push('/dashboard/clients')
                        setOpenCorpDropdown(null)
                        setCorpSearchTexts({ ...corpSearchTexts, [itemId]: '' })
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    + {ta('addNewCompany')}
                </div>
            </div>
        )
    }

    // 지점 드롭다운 렌더링
    const renderBranchDropdown = (itemId: number, item: DeliveryItem) => {
        const searchText = branchSearchTexts[itemId] || ''
        const filteredBranches = getFilteredBranches(item.corporationId).filter(branch => {
            if (!searchText) return true
            const searchLower = searchText.toLowerCase()
            return branch.name.toLowerCase().includes(searchLower) ||
                   (branch.nameJa && branch.nameJa.toLowerCase().includes(searchLower))
        })

        return (
            <div
                className="position-absolute bg-white border rounded shadow-sm mt-1"
                style={{ zIndex: 9999, maxHeight: '300px', overflowY: 'auto', minWidth: '220px', left: 0, top: '100%' }}
            >
                <div className="p-2 border-bottom sticky-top bg-white">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={locale === 'ja' ? '支店検索...' : '지점 검색...'}
                        value={searchText}
                        onChange={e => setBranchSearchTexts({ ...branchSearchTexts, [itemId]: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                    />
                </div>
                <div
                    className="px-3 py-2 border-bottom text-muted small"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        updateDeliveryItem(itemId, 'branchId', '')
                        setOpenBranchDropdown(null)
                        setBranchSearchTexts({ ...branchSearchTexts, [itemId]: '' })
                    }}
                >
                    {ta('selectBranch') || (locale === 'ja' ? '支店選択...' : '지점 선택...')}
                </div>
                {filteredBranches.map(branch => (
                    <div
                        key={branch.id}
                        className={`px-3 py-2 ${item.branchId === branch.id ? 'bg-primary text-white' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            updateDeliveryItem(itemId, 'branchId', branch.id)
                            setOpenBranchDropdown(null)
                            setBranchSearchTexts({ ...branchSearchTexts, [itemId]: '' })
                        }}
                        onMouseEnter={e => {
                            if (item.branchId !== branch.id) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa'
                            }
                        }}
                        onMouseLeave={e => {
                            if (item.branchId !== branch.id) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                            }
                        }}
                    >
                        {locale === 'ja' ? (branch.nameJa || branch.name) : branch.name}
                    </div>
                ))}
                {/* 신규 지점 추가 */}
                {item.corporationId && (
                    <div
                        className="px-3 py-2 border-top fw-bold"
                        style={{ cursor: 'pointer', color: '#206bc4' }}
                        onClick={() => {
                            // 선택된 법인의 FC를 찾아서 쿼리 파라미터로 전달
                            const selectedCorp = corporations.find(c => c.id === item.corporationId)
                            if (selectedCorp && selectedCorp.fc) {
                                // FC 소속 법인인 경우
                                router.push(`/dashboard/clients?fcId=${selectedCorp.fc.id}&corpId=${selectedCorp.id}&tab=branch&action=addBranch`)
                            } else if (selectedCorp) {
                                // 독립 법인인 경우
                                router.push(`/dashboard/clients?corpId=${selectedCorp.id}&tab=branch&action=addBranch&independent=true`)
                            } else {
                                router.push('/dashboard/clients')
                            }
                            setOpenBranchDropdown(null)
                            setBranchSearchTexts({ ...branchSearchTexts, [itemId]: '' })
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        + {ta('addNewBranch')}
                    </div>
                )}
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    // 프로세스 단계 정의: 정보입력→발주(PDF)→품의→품의완료→발주통지
    const processSteps = [
        { key: 'PENDING', labelJa: '情報入力', label: '정보입력', descJa: '発注情報を入力します', desc: '발주 정보를 입력합니다', color: '#6c757d', bgColor: '#f8f9fa' },
        { key: 'ORDERED', labelJa: '発注（PDF）', label: '발주(PDF)', descJa: '納品依頼書PDFを生成します', desc: '납품의뢰서 PDF를 생성합니다', color: '#0d6efd', bgColor: '#e7f1ff' },
        { key: 'APPROVAL', labelJa: '稟議中', label: '품의중', descJa: 'Jobcanで稟議を進めます', desc: 'Jobcan에서 품의를 진행합니다', color: '#0dcaf0', bgColor: '#e7feff' },
        { key: 'APPROVED', labelJa: '稟議完了', label: '품의완료', descJa: '稟議承認を確認します', desc: '품의 승인을 확인합니다', color: '#fd7e14', bgColor: '#fff3e6' },
        { key: 'NOTIFIED', labelJa: '発注通知', label: '발주통지', descJa: '発注先にメールを送信します', desc: '발주처에 메일을 발송합니다', color: '#198754', bgColor: '#e8f5e9' }
    ]

    // 상태 뱃지 색상
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { color: string, label: string, labelJa: string }> = {
            'PENDING': { color: 'secondary', label: '정보입력', labelJa: '情報入力' },
            'ORDERED': { color: 'primary', label: '발주(PDF)', labelJa: '発注（PDF）' },
            'APPROVAL': { color: 'info', label: '품의중', labelJa: '稟議中' },
            'APPROVED': { color: 'warning', label: '품의완료', labelJa: '稟議完了' },
            'NOTIFIED': { color: 'success', label: '발주통지', labelJa: '発注通知' },
            // 기존 상태 호환
            'IN_PROGRESS': { color: 'warning', label: '진행중', labelJa: '進行中' },
            'COMPLETED': { color: 'success', label: '완료', labelJa: '完了' }
        }
        const s = statusMap[status] || { color: 'secondary', label: status, labelJa: status }
        return <span className={`badge bg-${s.color}`}>{locale === 'ja' ? s.labelJa : s.label}</span>
    }

    // 프로세스 단계 표시 (1~5 단계) - 테이블 내 작은 버전
    const getProcessSteps = (status: string) => {
        const currentIndex = processSteps.findIndex(s => s.key === status)
        const activeIndex = currentIndex >= 0 ? currentIndex : 0

        return (
            <div className="d-flex align-items-center gap-1">
                {processSteps.map((step, idx) => (
                    <div key={step.key} className="d-flex align-items-center">
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${idx <= activeIndex ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                            style={{ width: '20px', height: '20px', fontSize: '10px' }}
                            title={locale === 'ja' ? step.labelJa : step.label}
                        >
                            {idx + 1}
                        </div>
                        {idx < processSteps.length - 1 && (
                            <div
                                className={`${idx < activeIndex ? 'bg-primary' : 'bg-light'}`}
                                style={{ width: '12px', height: '2px' }}
                            />
                        )}
                    </div>
                ))}
            </div>
        )
    }

    // 발주 편집 - 기본정보 입력창에 데이터 로드
    const handleEditOrder = async (order: OrderProcess) => {
        setEditingOrderId(order.id)

        // 기본 정보 로드
        // orderRequestDate가 ISO 타임스탬프면 YYYYMMDD 형식으로 변환
        let formattedOrderDate = order.orderRequestDate || ''
        if (formattedOrderDate && formattedOrderDate.includes('T')) {
            formattedOrderDate = formattedOrderDate.split('T')[0].replace(/-/g, '')
        }

        setFormData({
            title: order.title || 'キオスク端末＆決済端末の鉄板・金具',
            requesterName: order.requesterName || session?.user?.name || '',
            orderRequestDate: formattedOrderDate,
            kioskUnitPrice: order.kioskUnitPrice || 240000,
            plateUnitPrice: order.plateUnitPrice || 5000,
            notes: order.notes || ''
        })

        // 납품 항목 로드
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const items: DeliveryItem[] = order.items.map((item, idx) => {
                // 법인 ID 찾기 (ID가 직접 있으면 사용, 없으면 이름으로 검색)
                let corpId = item.corporationId || ''
                let corpName = item.corporationName || ''
                if (!corpId && corpName) {
                    const corp = corporations.find(c =>
                        c.name === corpName || c.nameJa === corpName
                    )
                    corpId = corp?.id || ''
                }
                if (corpId && !corpName) {
                    const corp = corporations.find(c => c.id === corpId)
                    corpName = corp?.name || ''
                }

                // 지점 ID 찾기 (ID가 직접 있으면 사용, 없으면 이름으로 검색)
                let branchId = item.branchId || ''
                let branchName = item.branchName || ''
                let branch = branchId ? branches.find(b => b.id === branchId) : null
                if (!branchId && branchName) {
                    branch = branches.find(b =>
                        (b.name === branchName || b.nameJa === branchName) &&
                        (corpId ? b.corporationId === corpId : true)
                    )
                    branchId = branch?.id || ''
                }
                if (branchId && !branchName) {
                    branch = branches.find(b => b.id === branchId)
                    branchName = branch?.name || ''
                }

                return {
                    id: idx + 1,
                    corporationId: corpId,
                    corporationName: corpName,
                    branchId: branchId,
                    branchName: branchName,
                    brandName: item.brandName || '',
                    postalCode: branch?.postalCode || item.postalCode || '',
                    address: branch?.address || item.address || '',
                    contact: branch?.managerPhone || item.contact || '',
                    kioskCount: item.kioskCount || 1,
                    plateCount: item.plateCount || 1,
                    acquisition: item.acquisition || 'FREE',
                    leaseCompanyId: item.leaseCompanyId || '',
                    desiredDeliveryDate: ''
                }
            })
            setDeliveryItems(items)
        } else {
            // 단일 항목인 경우
            let corpId = order.corporationId || ''
            let corpName = order.corporationName || ''
            if (!corpId && corpName) {
                const corp = corporations.find(c =>
                    c.name === corpName || c.nameJa === corpName
                )
                corpId = corp?.id || ''
            }
            if (corpId && !corpName) {
                const corp = corporations.find(c => c.id === corpId)
                corpName = corp?.name || ''
            }

            let branchId = order.branchId || ''
            let branchName = order.branchName || ''
            let branch = branchId ? branches.find(b => b.id === branchId) : null
            if (!branchId && branchName) {
                branch = branches.find(b =>
                    (b.name === branchName || b.nameJa === branchName) &&
                    (corpId ? b.corporationId === corpId : true)
                )
                branchId = branch?.id || ''
            }
            if (branchId && !branchName) {
                branch = branches.find(b => b.id === branchId)
                branchName = branch?.name || ''
            }

            setDeliveryItems([{
                id: 1,
                corporationId: corpId,
                corporationName: corpName,
                branchId: branchId,
                branchName: branchName,
                brandName: order.brandName || '',
                postalCode: branch?.postalCode || order.postalCode || '',
                address: branch?.address || order.address || '',
                contact: branch?.managerPhone || order.contact || '',
                kioskCount: order.kioskCount || order.quantity || 1,
                plateCount: order.plateCount || 1,
                acquisition: order.acquisition || 'FREE',
                leaseCompanyId: order.leaseCompanyId || '',
                desiredDeliveryDate: ''
            }])
        }

        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 편집 취소
    const handleCancelEdit = () => {
        setEditingOrderId(null)
        // 폼 초기화
        setFormData({
            title: 'キオスク端末＆決済端末の鉄板・金具',
            requesterName: session?.user?.name || '',
            orderRequestDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            kioskUnitPrice: 240000,
            plateUnitPrice: 5000,
            notes: ''
        })
        setDeliveryItems([
            { id: 1, corporationId: '', branchId: '', brandName: '', postalCode: '', address: '', contact: '', kioskCount: 1, plateCount: 1, acquisition: 'FREE', leaseCompanyId: '', desiredDeliveryDate: '' }
        ])
    }

    // 발주 삭제
    const handleDelete = async (orderId: string, orderNumber: string) => {
        const confirmMsg = locale === 'ja'
            ? `発注 ${orderNumber} を削除しますか？\n関連するキオスクも削除されます。`
            : `발주 ${orderNumber}를 삭제하시겠습니까?\n관련 키오스크도 함께 삭제됩니다.`

        if (!confirm(confirmMsg)) return

        try {
            const res = await fetch(`/api/order/${orderId}`, { method: 'DELETE' })
            if (res.ok) {
                alert(locale === 'ja' ? '削除しました' : '삭제되었습니다')
                setOrders(orders.filter(o => o.id !== orderId))
            } else {
                alert(locale === 'ja' ? '削除に失敗しました' : '삭제에 실패했습니다')
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert(locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다')
        }
    }

    // PDF 다운로드
    const handleDownloadPdf = (orderId: string, orderNumber: string) => {
        // PDF 생성 페이지로 이동 (새 탭)
        window.open(`/dashboard/order/${orderId}/pdf`, '_blank')
    }

    return (
        <div ref={dropdownRef}>
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row align-items-center">
                        <div className="col-auto">
                            <h2 className="page-title">
                                <i className="ti ti-file-invoice me-2"></i>
                                {locale === 'ja' ? '発注管理' : '발주관리'}
                            </h2>
                            <div className="text-muted mt-1">
                                {locale === 'ja' ? '発注依頼書(納品依頼書) 管理' : '발주의뢰서(납품의뢰서) 관리'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="container-xl">
                    {/* ========== 섹션 1: 발주 입력 폼 ========== */}
                    <div className="mb-5" style={{
                        background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '2px solid #c7dff7'
                    }}>
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold' }}>1</div>
                            <h4 className="mb-0 text-primary fw-bold">
                                <i className="ti ti-edit me-2"></i>
                                {locale === 'ja' ? '発注依頼入力' : '발주의뢰 입력'}
                            </h4>
                        </div>
                    {/* 기본 정보 */}
                    <div className="card mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: editingOrderId ? '2px solid #fd7e14' : undefined }}>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="card-title mb-0">
                                {locale === 'ja' ? '基本情報' : '기본 정보'}
                                {editingOrderId && (
                                    <span className="badge bg-warning ms-2">{locale === 'ja' ? '編集中' : '편집 중'}</span>
                                )}
                            </h3>
                            {editingOrderId && (
                                <button className="btn btn-outline-secondary btn-sm" onClick={handleCancelEdit}>
                                    <i className="ti ti-x me-1"></i>
                                    {locale === 'ja' ? '編集キャンセル' : '편집 취소'}
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {/* 건명 (맨 위) */}
                                <div className="col-md-12">
                                    <label className="form-label">{locale === 'ja' ? '件名' : '건명'}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                {/* 납품의뢰자 */}
                                <div className="col-md-4">
                                    <label className="form-label required">
                                        {locale === 'ja' ? '納品依頼者' : '납품의뢰자'}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.requesterName}
                                        onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
                                        placeholder={locale === 'ja' ? '納品依頼者名' : '납품의뢰자명'}
                                    />
                                </div>

                                {/* 발주의뢰일 (YYYYMMDD 텍스트) */}
                                <div className="col-md-4">
                                    <label className="form-label">{ta('orderRequestDate')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.orderRequestDate}
                                        onChange={e => setFormData({ ...formData, orderRequestDate: e.target.value })}
                                        placeholder="YYYYMMDD"
                                    />
                                </div>

                                {/* 키오스크 단가 */}
                                <div className="col-md-3">
                                    <label className="form-label">
                                        {locale === 'ja' ? 'キオスク単価' : '키오스크 단가'}
                                        <span className="text-muted ms-1" style={{ fontSize: '0.8em' }}>
                                            ({locale === 'ja' ? '税抜' : '세금별도'})
                                        </span>
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.kioskUnitPrice}
                                            onChange={e => setFormData({ ...formData, kioskUnitPrice: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="input-group-text">{locale === 'ja' ? '円' : '엔'}</span>
                                    </div>
                                </div>

                                {/* 철판 단가 */}
                                <div className="col-md-3">
                                    <label className="form-label">
                                        {locale === 'ja' ? '金具単価' : '철판 단가'}
                                        <span className="text-muted ms-1" style={{ fontSize: '0.8em' }}>
                                            ({locale === 'ja' ? '税抜' : '세금별도'})
                                        </span>
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.plateUnitPrice}
                                            onChange={e => setFormData({ ...formData, plateUnitPrice: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="input-group-text">{locale === 'ja' ? '円' : '엔'}</span>
                                    </div>
                                </div>

                                {/* 비고 */}
                                <div className="col-md-12">
                                    <label className="form-label">{locale === 'ja' ? '備考' : '비고'}</label>
                                    <textarea
                                        className="form-control"
                                        rows={2}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder={locale === 'ja' ? '備考' : '비고'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 납품 항목 */}
                    <div className="card" style={{ overflow: 'visible', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: editingOrderId ? '2px solid #fd7e14' : undefined }}>
                        <div className="card-header">
                            <div className="d-flex align-items-center gap-3">
                                <h3 className="card-title mb-0">{locale === 'ja' ? '納品項目' : '납품 항목'}</h3>
                                {editingOrderId && (
                                    <span className="badge bg-warning">{locale === 'ja' ? '編集中' : '편집 중'}</span>
                                )}
                                <button className="btn btn-success btn-sm" onClick={addDeliveryItem}>
                                    <i className="ti ti-row-insert-bottom me-1"></i>
                                    {locale === 'ja' ? '行追加' : '행 추가'}
                                </button>
                                <a href="/dashboard/clients" className="btn btn-outline-secondary btn-sm" target="_blank">
                                    <i className="ti ti-building me-1"></i>
                                    {locale === 'ja' ? '取引先/支店 管理' : '거래처/지점 관리'}
                                </a>
                            </div>
                        </div>
                        <div className="table-responsive" style={{ overflow: 'visible' }}>
                            <table className="table table-vcenter card-table" style={{ overflow: 'visible' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>NO</th>
                                        <th style={{ width: '180px' }}>{ta('contractPartner')}</th>
                                        <th style={{ width: '150px' }}>{ta('branchName')}</th>
                                        <th style={{ width: '100px' }}>{locale === 'ja' ? 'ブランド名' : '브랜드명'}</th>
                                        <th style={{ width: '90px' }}>{locale === 'ja' ? '郵便番号' : '우편번호'}</th>
                                        <th style={{ width: '200px' }}>{locale === 'ja' ? '住所' : '주소'}</th>
                                        <th style={{ width: '120px' }}>{locale === 'ja' ? '連絡先' : '연락처'}</th>
                                        <th style={{ width: '110px' }}>{ta('acquisition')}</th>
                                        <th style={{ width: '140px' }}>{locale === 'ja' ? 'リース会社' : '리스회사'}</th>
                                        <th style={{ width: '120px' }}>{locale === 'ja' ? '納期希望日' : '납기희망일'}</th>
                                        <th style={{ width: '70px' }}>{locale === 'ja' ? 'キオスク' : '키오스크'}</th>
                                        <th style={{ width: '70px' }}>{locale === 'ja' ? '金具' : '철판'}</th>
                                        <th style={{ width: '100px' }}>{locale === 'ja' ? '単価合計' : '단가합계'}</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryItems.map((item, index) => (
                                        <tr key={item.id} style={{ position: 'relative' }}>
                                            <td className="text-muted">{index + 1}</td>
                                            {/* 계약법인명 드롭다운 */}
                                            <td style={{ position: 'relative', overflow: 'visible' }}>
                                                <div className="position-relative">
                                                    <div
                                                        className="form-select form-select-sm d-flex align-items-center justify-content-between"
                                                        style={{ cursor: 'pointer', minHeight: '31px' }}
                                                        onClick={() => setOpenCorpDropdown(openCorpDropdown === item.id ? null : item.id)}
                                                    >
                                                        <span className={item.corporationId ? '' : 'text-muted'} style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.corporationId
                                                                ? (() => {
                                                                    const corp = corporations.find(c => c.id === item.corporationId)
                                                                    return corp ? getDisplayName(corp) : (locale === 'ja' ? '法人選択...' : '법인 선택...')
                                                                })()
                                                                : (locale === 'ja' ? '法人選択...' : '법인 선택...')}
                                                        </span>
                                                        <i className={`ti ti-chevron-${openCorpDropdown === item.id ? 'up' : 'down'} ms-1`} style={{ fontSize: '12px' }}></i>
                                                    </div>
                                                    {openCorpDropdown === item.id && renderCorpDropdown(item.id, item)}
                                                </div>
                                            </td>
                                            {/* 지점명 드롭다운 */}
                                            <td style={{ position: 'relative', overflow: 'visible' }}>
                                                <div className="position-relative">
                                                    <div
                                                        className={`form-select form-select-sm d-flex align-items-center justify-content-between ${!item.corporationId ? 'disabled' : ''}`}
                                                        style={{ cursor: item.corporationId ? 'pointer' : 'not-allowed', backgroundColor: !item.corporationId ? '#e9ecef' : 'white', minHeight: '31px' }}
                                                        onClick={() => item.corporationId && setOpenBranchDropdown(openBranchDropdown === item.id ? null : item.id)}
                                                    >
                                                        <span className={item.branchId ? '' : 'text-muted'} style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.branchId
                                                                ? (() => {
                                                                    const branch = branches.find(b => b.id === item.branchId)
                                                                    return branch ? getDisplayName(branch) : (locale === 'ja' ? '支店選択...' : '지점 선택...')
                                                                })()
                                                                : (locale === 'ja' ? '支店選択...' : '지점 선택...')}
                                                        </span>
                                                        <i className={`ti ti-chevron-${openBranchDropdown === item.id ? 'up' : 'down'} ms-1`} style={{ fontSize: '12px' }}></i>
                                                    </div>
                                                    {openBranchDropdown === item.id && item.corporationId && renderBranchDropdown(item.id, item)}
                                                </div>
                                            </td>
                                            {/* 브랜드명 (자동입력) */}
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.brandName}
                                                    readOnly
                                                    style={{ backgroundColor: '#f8f9fa' }}
                                                    placeholder={locale === 'ja' ? '自動' : '자동'}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.postalCode}
                                                    onChange={e => updateDeliveryItem(item.id, 'postalCode', e.target.value)}
                                                    placeholder="〒"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.address}
                                                    onChange={e => updateDeliveryItem(item.id, 'address', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.contact}
                                                    onChange={e => updateDeliveryItem(item.id, 'contact', e.target.value)}
                                                    placeholder="TEL"
                                                />
                                            </td>
                                            {/* 취득형태 (4가지) - 발주의뢰처 입장 용어 */}
                                            <td>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={item.acquisition}
                                                    onChange={e => updateDeliveryItem(item.id, 'acquisition', e.target.value)}
                                                >
                                                    <option value="PAID">{locale === 'ja' ? '有償販売' : '유상판매'}</option>
                                                    <option value="FREE">{locale === 'ja' ? '無償提供' : '무상제공'}</option>
                                                    <option value="LEASE_FREE">{locale === 'ja' ? '無償提供(リース)' : '무상제공(리스)'}</option>
                                                    <option value="RENTAL">{locale === 'ja' ? 'レンタル' : '렌탈'}</option>
                                                </select>
                                            </td>
                                            {/* 리스회사 (리스(무상) 선택시만 표시) */}
                                            <td>
                                                {item.acquisition === 'LEASE_FREE' ? (
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={item.leaseCompanyId}
                                                        onChange={e => updateDeliveryItem(item.id, 'leaseCompanyId', e.target.value)}
                                                    >
                                                        <option value="">{tc('selectPlaceholder')}</option>
                                                        {leaseCompanies.map(lc => (
                                                            <option key={lc.id} value={lc.id}>
                                                                {getDisplayName(lc)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            {/* 납기희망일 (텍스트 자유입력) */}
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={item.desiredDeliveryDate}
                                                    onChange={e => updateDeliveryItem(item.id, 'desiredDeliveryDate', e.target.value)}
                                                    placeholder={locale === 'ja' ? '例: 3/24(月)の週' : '예: 3/24(월)의 주'}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm text-center"
                                                    min="0"
                                                    value={item.kioskCount}
                                                    onChange={e => updateDeliveryItem(item.id, 'kioskCount', parseInt(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm text-center"
                                                    min="0"
                                                    value={item.plateCount}
                                                    onChange={e => updateDeliveryItem(item.id, 'plateCount', parseInt(e.target.value) || 0)}
                                                />
                                            </td>
                                            {/* 단가 합계 */}
                                            <td className="text-end fw-bold">
                                                {getItemTotal(item).toLocaleString()}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-ghost-danger btn-icon btn-sm"
                                                    onClick={() => removeDeliveryItem(item.id)}
                                                    disabled={deliveryItems.length === 1}
                                                >
                                                    <i className="ti ti-x"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-light">
                                        <td colSpan={10} className="text-end fw-bold">
                                            {locale === 'ja' ? '合計' : '합계'}
                                        </td>
                                        <td className="text-center fw-bold">{totalKioskCount}</td>
                                        <td className="text-center fw-bold">{totalPlateCount}</td>
                                        <td className="text-end fw-bold">{totalAmount.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {/* 저장 버튼 및 총 금액 - 카드 하단 */}
                        <div className="card-footer">
                            <div className="d-flex align-items-center gap-4">
                                <div>
                                    <span className="text-muted">{locale === 'ja' ? '総金額:' : '총 금액:'}</span>
                                    <span className="h2 ms-2 mb-0">
                                        {totalAmount.toLocaleString()} {locale === 'ja' ? '円' : '엔'}
                                    </span>
                                    <span className="text-muted ms-2">
                                        ({locale === 'ja' ? '税抜' : '세금별도'})
                                    </span>
                                </div>
                                <button className={`btn ${editingOrderId ? 'btn-warning' : 'btn-primary'}`} onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {tc('saving')}
                                        </>
                                    ) : editingOrderId ? (
                                        <>
                                            <i className="ti ti-check me-2"></i>
                                            {locale === 'ja' ? '更新' : '수정'}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-device-floppy me-2"></i>
                                            {tc('save')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>
                    {/* ========== 섹션 1 끝 ========== */}

                    {/* ========== 섹션 2: 발주 목록 ========== */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '2px solid #e2e8f0'
                    }}>
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold' }}>2</div>
                            <h4 className="mb-0 text-secondary fw-bold">
                                <i className="ti ti-list-check me-2"></i>
                                {locale === 'ja' ? '発注一覧・管理' : '발주 목록 · 관리'}
                            </h4>
                        </div>

                    {/* 프로세스 단계 설명 - 단계별 색상 적용 */}
                    <div className="card mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                <i className="ti ti-timeline me-2"></i>
                                {locale === 'ja' ? '発注依頼プロセス' : '발주의뢰 프로세스'}
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="d-flex justify-content-between align-items-start">
                                {processSteps.map((step, idx) => (
                                    <div key={step.key} className="d-flex align-items-center flex-grow-1">
                                        <div className="text-center" style={{ minWidth: '140px' }}>
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    backgroundColor: step.color,
                                                    color: 'white',
                                                    boxShadow: `0 2px 8px ${step.color}40`
                                                }}
                                            >
                                                {idx + 1}
                                            </div>
                                            <div
                                                className="fw-bold mb-1 px-2 py-1 rounded"
                                                style={{ backgroundColor: step.bgColor, color: step.color }}
                                            >
                                                {locale === 'ja' ? step.labelJa : step.label}
                                            </div>
                                            <div className="text-muted small mt-1">
                                                {locale === 'ja' ? step.descJa : step.desc}
                                            </div>
                                        </div>
                                        {idx < processSteps.length - 1 && (
                                            <div className="flex-grow-1 px-2" style={{ marginTop: '-50px' }}>
                                                <div style={{
                                                    height: '3px',
                                                    background: `linear-gradient(90deg, ${step.color}, ${processSteps[idx + 1].color})`
                                                }}></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 발주 목록 - 납품항목 형태로 표시 */}
                    <div className="card" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                <i className="ti ti-list me-2"></i>
                                {locale === 'ja' ? '発注一覧' : '발주 목록'}
                                <span className="badge bg-primary text-white ms-2">{orders.length}</span>
                            </h3>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table table-hover">
                                <thead>
                                    <tr>
                                        <th style={{ width: '140px', whiteSpace: 'nowrap' }}>{locale === 'ja' ? '発注番号' : '발주번호'}</th>
                                        <th style={{ width: '90px', whiteSpace: 'nowrap' }}>{locale === 'ja' ? '依頼日' : '의뢰일'}</th>
                                        <th style={{ width: '90px', whiteSpace: 'nowrap' }}>{locale === 'ja' ? '納期希望' : '납기희망'}</th>
                                        <th style={{ width: '180px' }}>{locale === 'ja' ? '取引先名' : '거래처명'}</th>
                                        <th style={{ width: '85px' }}>{locale === 'ja' ? '取得形態' : '취득형태'}</th>
                                        <th style={{ width: '100px' }}>{locale === 'ja' ? 'リース会社' : '리스회사'}</th>
                                        <th style={{ width: '90px' }}>{locale === 'ja' ? '稟議番号' : '품의번호'}</th>
                                        <th style={{ width: '70px' }}>{locale === 'ja' ? '依頼者' : '의뢰자'}</th>
                                        <th style={{ width: '60px', textAlign: 'center' }}>KIOSK</th>
                                        <th style={{ width: '50px', textAlign: 'center' }}>{locale === 'ja' ? '金具' : '철판'}</th>
                                        <th style={{ width: '80px', textAlign: 'right' }}>{locale === 'ja' ? '計' : '계'}</th>
                                        <th style={{ width: '140px', textAlign: 'center' }}>{locale === 'ja' ? '現在段階' : '현재 단계'}</th>
                                        <th style={{ width: '100px' }} className="text-end"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="text-center text-muted py-4">
                                                {locale === 'ja' ? '発注データがありません' : '발주 데이터가 없습니다'}
                                            </td>
                                        </tr>
                                    ) : (
                                        orders
                                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                            .map(order => {
                                            const currentStepIndex = processSteps.findIndex(s => s.key === order.status)
                                            const activeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0
                                            const hasMultipleItems = order.items && Array.isArray(order.items) && order.items.length > 1
                                            const isExpanded = expandedOrders.has(order.id)

                                            // 거래처명 표시 (i18n 적용) - 브랜드/법인명(지점명) 형식
                                            const getCorporationDisplay = (corp: string | null, corpJa: string | null, branch: string | null, branchJa: string | null, brand: string | null) => {
                                                const corpName = locale === 'ja' ? (corpJa || corp) : corp
                                                const branchName = locale === 'ja' ? (branchJa || branch) : branch
                                                return (
                                                    <>
                                                        {brand && <span className="text-primary fw-semibold">{brand}/</span>}
                                                        {corpName || '-'}
                                                        {branchName && <span className="text-muted">({branchName})</span>}
                                                    </>
                                                )
                                            }

                                            // 프로세스 단계 인포그래프 렌더링 함수 - 클릭 시 상세 페이지로 이동
                                            const renderProcessSteps = () => (
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    {processSteps.map((step, idx) => (
                                                        <React.Fragment key={step.key}>
                                                            <div
                                                                className="rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: idx <= activeStepIndex ? step.color : '#e9ecef',
                                                                    color: idx <= activeStepIndex ? 'white' : '#adb5bd',
                                                                    transition: 'all 0.2s',
                                                                    cursor: 'pointer'
                                                                }}
                                                                title={locale === 'ja' ? step.labelJa : step.label}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    router.push(`/dashboard/order/${order.id}`)
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </div>
                                                            {idx < processSteps.length - 1 && (
                                                                <div
                                                                    style={{
                                                                        width: '8px',
                                                                        height: '2px',
                                                                        backgroundColor: idx < activeStepIndex ? processSteps[idx + 1].color : '#e9ecef'
                                                                    }}
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            )

                                            // 아코디언 토글 함수
                                            const toggleExpand = () => {
                                                setExpandedOrders(prev => {
                                                    const next = new Set(prev)
                                                    if (next.has(order.id)) {
                                                        next.delete(order.id)
                                                    } else {
                                                        next.add(order.id)
                                                    }
                                                    return next
                                                })
                                            }

                                            return (
                                                <React.Fragment key={order.id}>
                                                    <tr style={{ cursor: hasMultipleItems ? 'pointer' : 'default' }} onClick={hasMultipleItems ? toggleExpand : undefined}>
                                                        <td style={{ whiteSpace: 'nowrap' }}>
                                                            {hasMultipleItems && (
                                                                <i className={`ti ti-chevron-${isExpanded ? 'down' : 'right'} me-1`} style={{ fontSize: '12px', color: '#206bc4' }}></i>
                                                            )}
                                                            <a
                                                                href={`/dashboard/order/${order.id}`}
                                                                className="fw-bold text-primary text-decoration-none"
                                                                onClick={e => e.stopPropagation()}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                {order.orderNumber}
                                                            </a>
                                                            {hasMultipleItems && (
                                                                <span className="badge bg-info ms-1" style={{ fontSize: '10px' }}>
                                                                    {order.items?.length}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                                            {formatOrderDate(order.orderRequestDate)}
                                                        </td>
                                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                                            {order.items?.[0]?.desiredDeliveryDate || '-'}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>
                                                            {getCorporationDisplay(order.corporationName, order.corporationNameJa, order.branchName, order.branchNameJa, order.brandName)}
                                                            {hasMultipleItems && (
                                                                <span className="text-info ms-1" style={{ fontSize: '11px' }}>
                                                                    (+{(order.items?.length || 0) - 1})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem' }}>{order.acquisition ? getAcquisitionLabel(order.acquisition) : '-'}</td>
                                                        <td style={{ fontSize: '0.8rem' }}>
                                                            {order.leaseCompanyId ? (
                                                                leaseCompanies.find(lc => lc.id === order.leaseCompanyId)?.name || '-'
                                                            ) : '-'}
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem' }}>
                                                            {order.approvalRequestId ? (
                                                                <span>
                                                                    {order.approvalRequestId}
                                                                    {order.approvalStatus === 'APPROVED' && <i className="ti ti-check text-success ms-1"></i>}
                                                                    {order.approvalStatus === 'PENDING' && <i className="ti ti-clock text-warning ms-1"></i>}
                                                                    {order.approvalStatus === 'REJECTED' && <i className="ti ti-x text-danger ms-1"></i>}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>{order.requesterName || '-'}</td>
                                                        <td className="text-center fw-bold">{order.kioskCount || order.quantity}</td>
                                                        <td className="text-center">{order.plateCount || 0}</td>
                                                        <td className="text-end fw-bold">
                                                            {order.totalAmount ? order.totalAmount.toLocaleString() : '-'}
                                                        </td>
                                                        {/* 현재 단계 인포그래프 */}
                                                        <td className="text-center">
                                                            {renderProcessSteps()}
                                                        </td>
                                                        <td className="text-end" onClick={e => e.stopPropagation()}>
                                                            <div className="btn-list flex-nowrap justify-content-end" style={{ gap: '1px' }}>
                                                                <a
                                                                    href={`/dashboard/order/${order.id}`}
                                                                    className="btn btn-ghost-info btn-icon btn-sm"
                                                                    title={locale === 'ja' ? '詳細' : '상세'}
                                                                >
                                                                    <i className="ti ti-eye"></i>
                                                                </a>
                                                                <button
                                                                    className="btn btn-ghost-primary btn-icon btn-sm"
                                                                    title={locale === 'ja' ? '編集' : '편집'}
                                                                    onClick={() => handleEditOrder(order)}
                                                                >
                                                                    <i className="ti ti-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost-danger btn-icon btn-sm"
                                                                    title={locale === 'ja' ? '削除' : '삭제'}
                                                                    onClick={() => handleDelete(order.id, order.orderNumber)}
                                                                >
                                                                    <i className="ti ti-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {/* 아코디언 확장 행 - 복수 거래처 상세 */}
                                                    {hasMultipleItems && isExpanded && order.items?.map((item, idx) => {
                                                        // 항목별 소계 계산
                                                        const itemSubtotal = (item.kioskCount * (order.kioskUnitPrice || 0)) + (item.plateCount * (order.plateUnitPrice || 0))
                                                        return (
                                                            <tr key={`${order.id}-item-${idx}`} style={{ backgroundColor: '#f8fafc' }}>
                                                                <td className="ps-4" style={{ fontSize: '0.8rem', color: '#206bc4' }}>
                                                                    <i className="ti ti-corner-down-right me-1"></i>
                                                                    {idx + 1}
                                                                </td>
                                                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#6c757d' }}>
                                                                    {formatOrderDate(order.orderRequestDate)}
                                                                </td>
                                                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#6c757d' }}>
                                                                    {item.desiredDeliveryDate || '-'}
                                                                </td>
                                                                <td style={{ fontSize: '0.85rem' }}>
                                                                    {getCorporationDisplay(item.corporationName, item.corporationNameJa, item.branchName, item.branchNameJa, item.brandName)}
                                                                </td>
                                                                <td style={{ fontSize: '0.8rem' }}>{item.acquisition ? getAcquisitionLabel(item.acquisition) : '-'}</td>
                                                                <td style={{ fontSize: '0.8rem' }}>
                                                                    {item.leaseCompanyId ? (
                                                                        leaseCompanies.find(lc => lc.id === item.leaseCompanyId)?.name || '-'
                                                                    ) : '-'}
                                                                </td>
                                                                <td></td>
                                                                <td></td>
                                                                <td className="text-center">{item.kioskCount}</td>
                                                                <td className="text-center">{item.plateCount}</td>
                                                                <td className="text-end" style={{ fontSize: '0.85rem' }}>
                                                                    {itemSubtotal.toLocaleString()}
                                                                </td>
                                                                <td className="text-center">
                                                                    {renderProcessSteps()}
                                                                </td>
                                                                <td></td>
                                                            </tr>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* 페이지네이션 */}
                        {orders.length > itemsPerPage && (
                            <div className="card-footer d-flex align-items-center justify-content-between">
                                <p className="m-0 text-muted">
                                    {locale === 'ja'
                                        ? `${orders.length}件中 ${(currentPage - 1) * itemsPerPage + 1}〜${Math.min(currentPage * itemsPerPage, orders.length)}件を表示`
                                        : `${orders.length}건 중 ${(currentPage - 1) * itemsPerPage + 1}~${Math.min(currentPage * itemsPerPage, orders.length)}건 표시`
                                    }
                                </p>
                                <ul className="pagination m-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="ti ti-chevrons-left"></i>
                                        </button>
                                    </li>
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="ti ti-chevron-left"></i>
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.ceil(orders.length / itemsPerPage) }, (_, i) => i + 1)
                                        .filter(page => {
                                            const totalPages = Math.ceil(orders.length / itemsPerPage)
                                            if (totalPages <= 5) return true
                                            if (page === 1 || page === totalPages) return true
                                            if (Math.abs(page - currentPage) <= 1) return true
                                            return false
                                        })
                                        .map((page, idx, arr) => (
                                            <React.Fragment key={page}>
                                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                    <li className="page-item disabled">
                                                        <span className="page-link">...</span>
                                                    </li>
                                                )}
                                                <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            </React.Fragment>
                                        ))
                                    }
                                    <li className={`page-item ${currentPage === Math.ceil(orders.length / itemsPerPage) ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(orders.length / itemsPerPage), prev + 1))}
                                            disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                                        >
                                            <i className="ti ti-chevron-right"></i>
                                        </button>
                                    </li>
                                    <li className={`page-item ${currentPage === Math.ceil(orders.length / itemsPerPage) ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(Math.ceil(orders.length / itemsPerPage))}
                                            disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                                        >
                                            <i className="ti ti-chevrons-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    </div>
                    {/* ========== 섹션 2 끝 ========== */}
                </div>
            </div>
        </div>
    )
}
