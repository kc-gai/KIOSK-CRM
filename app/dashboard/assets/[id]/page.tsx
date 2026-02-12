'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

type Partner = {
    id: string
    name: string
    nameJa: string | null
}

type Region = {
    id: string
    code: string
    name: string
    nameJa: string | null
}

type Area = {
    id: string
    code: string
    name: string
    nameJa: string | null
    regionId: string
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
    postalCode: string | null
    address: string | null
    managerPhone: string | null
    acquisition: string
    salePrice: number | null
    orderRequestDate: string | null
    deliveryDueDate: string | null
    deliveryDate: string | null
    latestEventDate: string | null  // 최신 이력의 eventDate
    latestMoveType: string | null  // 최신 이력의 이동유형
    latestStatus: string | null  // 최신 이력의 상태
    latestBranchName: string | null  // 최신 이력의 지점명
    latestBranch?: {
        id: string
        name: string
        nameJa: string | null
        postalCode: string | null
        address: string | null
        managerPhone: string | null
        managerName: string | null
        regionCode: string | null
        areaCode: string | null
        corporation: {
            id: string
            name: string
            nameJa: string | null
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
        fc?: {
            id: string
            code: string
            name: string
            nameJa: string | null
        } | null
    } | null
    deliveryStatus: string
    status: string
    memo: string | null
    createdAt: string
    updatedAt: string
    branch?: {
        id: string
        name: string
        nameJa: string | null
        postalCode: string | null
        address: string | null
        managerPhone: string | null
        managerName: string | null
        regionCode: string | null
        areaCode: string | null
        corporation: {
            id: string
            name: string
            nameJa: string | null
            fc?: {
                id: string
                code: string
                name: string
                nameJa: string | null
            } | null
        } | null
    } | null
}

type Corporation = {
    id: string
    name: string
    nameJa: string | null
}

type History = {
    id: string
    moveType: string
    prevLocation: string | null
    newLocation: string | null
    prevPartner: Partner | null
    newPartner: Partner | null
    prevBranch: string | null
    newBranch: string | null
    prevBranchId: string | null
    newBranchId: string | null
    prevCorporation: Corporation | null
    newCorporation: Corporation | null
    prevRegionCode: string | null
    newRegionCode: string | null
    prevAreaCode: string | null
    newAreaCode: string | null
    prevStatus: string | null
    newStatus: string | null
    prevSaleType: string | null
    newSaleType: string | null
    prevPrice: number | null
    newPrice: number | null
    prevAcquisition: string | null
    newAcquisition: string | null
    repairReason: string | null
    repairCost: number | null
    repairVendor: string | null
    eventDate: string
    description: string | null
    handledBy: string | null
    approvedBy: string | null
    createdAt: string
}

export default function AssetDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations('assets')
    const th = useTranslations('history')
    const tc = useTranslations('common')
    const locale = useLocale()

    // URL에서 page 파라미터 가져오기 (뒤로 버튼용)
    const returnPage = searchParams.get('page') || '1'

    // params.id를 문자열로 변환
    const kioskId = typeof params.id === 'string' ? params.id : (Array.isArray(params.id) ? params.id[0] : params.id)

    const [kiosk, setKiosk] = useState<Kiosk | null>(null)
    const [history, setHistory] = useState<History[]>([])
    const [corporations, setCorporations] = useState<{ id: string; name: string; nameJa: string | null }[]>([])
    const [branches, setBranches] = useState<{ id: string; name: string; nameJa: string | null; corporationId: string; regionCode?: string | null; areaCode?: string | null }[]>([])
    const [filteredBranches, setFilteredBranches] = useState<{ id: string; name: string; nameJa: string | null; corporationId: string; regionCode?: string | null; areaCode?: string | null }[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showEditHistoryModal, setShowEditHistoryModal] = useState(false)
    const [editingHistory, setEditingHistory] = useState<History | null>(null)

    // 키오스크 소속 편집용 상태
    const [showEditKioskModal, setShowEditKioskModal] = useState(false)
    const [editKioskCorporationId, setEditKioskCorporationId] = useState('')
    const [editKioskBranchId, setEditKioskBranchId] = useState('')
    const [editKioskFilteredBranches, setEditKioskFilteredBranches] = useState<{ id: string; name: string; nameJa: string | null; corporationId: string; regionCode?: string | null; areaCode?: string | null }[]>([])

    // 상태 편집용 상태
    const [showEditStatusModal, setShowEditStatusModal] = useState(false)
    const [editStatus, setEditStatus] = useState('')

    // 인라인 이동일시 편집용 상태
    const [inlineEditingHistoryId, setInlineEditingHistoryId] = useState<string | null>(null)
    const [inlineEditHistoryValue, setInlineEditHistoryValue] = useState('')

    const [historyForm, setHistoryForm] = useState({
        moveType: 'TRANSFER',
        newPartnerId: '',
        newBranchId: '',
        newStatus: '',
        newPrice: '',
        repairReason: '',
        repairCost: '',
        repairVendor: '',
        eventDate: new Date().toISOString().split('T')[0],
        description: '',
        handledBy: '',
        updateKiosk: true
    })

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
        const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
        if (match) {
            const [, year, month, day] = match
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return value
    }

    // 인라인 이동일시 편집 시작
    const startInlineHistoryEdit = (h: History) => {
        setInlineEditingHistoryId(h.id)
        const dateStr = h.eventDate ? h.eventDate.split('T')[0] : ''
        setInlineEditHistoryValue(dateStr)
    }

    // 인라인 이동일시 저장
    const saveInlineHistoryEdit = async (historyId: string) => {
        if (!inlineEditHistoryValue) {
            setInlineEditingHistoryId(null)
            return
        }

        const dateToSave = parseDateString(inlineEditHistoryValue)
        const testDate = new Date(dateToSave)
        if (isNaN(testDate.getTime())) {
            alert('유효한 날짜 형식이 아닙니다. (예: 2023-01-01, 2023/01/01)')
            return
        }

        try {
            const historyItem = history.find(h => h.id === historyId)
            if (!historyItem) return

            const updateRes = await fetch(`/api/history/${historyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...historyItem,
                    eventDate: dateToSave
                })
            })

            if (!updateRes.ok) throw new Error('Failed to update history')

            setInlineEditingHistoryId(null)
            fetchData()
        } catch (error) {
            console.error('Inline edit error:', error)
            alert('수정 중 오류가 발생했습니다.')
        }
    }

    // 인라인 편집 취소
    const cancelInlineHistoryEdit = () => {
        setInlineEditingHistoryId(null)
        setInlineEditHistoryValue('')
    }

    // 인라인 날짜 입력 핸들러 - 입력 중에는 그대로 유지, 저장 시에만 파싱
    const handleInlineHistoryDateInput = (value: string) => {
        // 숫자와 구분자만 허용 (-, /, .)
        const filtered = value.replace(/[^0-9\-\/\.]/g, '')
        setInlineEditHistoryValue(filtered)
    }

    const fetchData = async () => {
        try {
            const [kioskRes, historyRes, corporationsRes, branchesRes, regionsRes, areasRes] = await Promise.all([
                fetch(`/api/assets/${kioskId}`),
                fetch(`/api/assets/${kioskId}/history`),
                fetch('/api/corporations'),
                fetch('/api/branches'),
                fetch('/api/regions'),
                fetch('/api/areas')
            ])

            if (kioskRes.ok) setKiosk(await kioskRes.json())
            if (historyRes.ok) setHistory(await historyRes.json())
            if (corporationsRes.ok) setCorporations(await corporationsRes.json())
            if (branchesRes.ok) setBranches(await branchesRes.json())
            if (regionsRes.ok) setRegions(await regionsRes.json())
            if (areasRes.ok) setAreas(await areasRes.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // 지역코드로 지역명 가져오기
    const getRegionName = (code: string | null): string => {
        if (!code) return ''
        const region = regions.find(r => r.code === code)
        if (!region) return ''
        return locale === 'ja' ? (region.nameJa || region.name) : region.name
    }

    // 관할코드로 관할지역명 가져오기
    const getAreaName = (code: string | null): string => {
        if (!code) return ''
        const area = areas.find(a => a.code === code)
        if (!area) return ''
        return locale === 'ja' ? (area.nameJa || area.name) : area.name
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
            return part // 알 수 없는 형식은 그대로 반환
        })
        return translated.join(', ')
    }

    // 날짜 입력 자동 포맷팅 (YYYY-MM-DD)
    const formatDateInput = (value: string): string => {
        // 숫자만 추출
        const numbers = value.replace(/\D/g, '')

        // 최대 8자리까지만
        const limited = numbers.slice(0, 8)

        // YYYY-MM-DD 형식으로 포맷
        if (limited.length <= 4) {
            return limited
        } else if (limited.length <= 6) {
            return `${limited.slice(0, 4)}-${limited.slice(4)}`
        } else {
            return `${limited.slice(0, 4)}-${limited.slice(4, 6)}-${limited.slice(6)}`
        }
    }

    // 날짜 입력 핸들러
    const handleDateInput = (value: string, setter: (val: string) => void) => {
        const formatted = formatDateInput(value)
        setter(formatted)
    }

    useEffect(() => {
        if (kioskId) fetchData()
    }, [kioskId])

    // Corporation 선택 시 해당 법인의 지점 필터링
    const handleCorporationChange = (corporationId: string) => {
        setHistoryForm({ ...historyForm, newPartnerId: corporationId, newBranchId: '' })
        if (corporationId) {
            setFilteredBranches(branches.filter(b => b.corporationId === corporationId))
        } else {
            setFilteredBranches([])
        }
    }

    const getMoveTypeBadge = (type: string) => {
        // DEPLOY, TRANSFER, RESALE는 모두 "설치 (고객사 설치)"로 통합 표시
        const types: Record<string, { label: string, color: string }> = {
            'DEPLOY': { label: th('typeDeploy'), color: 'bg-green' },
            'RETURN': { label: th('typeReturn'), color: 'bg-orange' },
            'TRANSFER': { label: th('typeDeploy'), color: 'bg-green' },  // 설치로 통합
            'MAINTENANCE': { label: th('typeMaintenance'), color: 'bg-red' },
            'REPAIR_COMPLETE': { label: th('typeRepairComplete'), color: 'bg-cyan' },
            'RESALE': { label: th('typeDeploy'), color: 'bg-green' },  // 설치로 통합
            'DISPOSAL': { label: th('typeDisposal'), color: 'bg-dark' },
            'STORAGE': { label: th('typeStorage'), color: 'bg-secondary' }
        }
        const badge = types[type] || { label: type, color: 'bg-secondary' }
        return <span className={`badge ${badge.color} text-white`}>{badge.label}</span>
    }

    const getStatusBadge = (status: string | null) => {
        if (!status) return '-'
        const statuses: Record<string, { label: string, color: string }> = {
            'IN_STOCK': { label: t('statusInStock'), color: 'bg-secondary' },
            'DEPLOYED': { label: t('statusDeployed'), color: 'bg-green' },
            'MAINTENANCE': { label: t('statusMaintenance'), color: 'bg-orange' },
            'RETIRED': { label: t('statusRetired'), color: 'bg-dark' }
        }
        const badge = statuses[status] || { label: status, color: 'bg-secondary' }
        return <span className={`badge ${badge.color} text-white`}>{badge.label}</span>
    }

    // 최신 이력의 moveType을 기반으로 현재 상태 배지 표시
    const getLatestStatusBadge = () => {
        if (!kiosk) return '-'

        // 최신 이력의 moveType이 있으면 그에 따른 상태 표시 (moveType 그대로 표시)
        const moveType = kiosk.latestMoveType
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

        // 최신 이력이 없으면 기본 설치 표시
        return <span className="badge bg-green text-white">{th('typeDeploy')}</span>
    }

    const getDeliveryStatusBadge = (status: string | null) => {
        if (!status) return '-'
        const statuses: Record<string, { label: string, color: string }> = {
            'PENDING': { label: t('deliveryPending'), color: 'bg-secondary' },
            'ORDERED': { label: t('deliveryOrdered'), color: 'bg-blue' },
            'SHIPPED': { label: t('deliveryShipped'), color: 'bg-orange' },
            'DELIVERED': { label: t('deliveryDelivered'), color: 'bg-green' }
        }
        const badge = statuses[status] || { label: status, color: 'bg-secondary' }
        return <span className={`badge ${badge.color} text-white`}>{badge.label}</span>
    }

    const handleAddHistory = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('handleAddHistory called')
        console.log('kioskId:', kioskId)
        console.log('historyForm:', historyForm)

        try {
            // 선택한 지점의 이름 가져오기
            const selectedBranch = filteredBranches.find(b => b.id === historyForm.newBranchId)
            const newBranchName = selectedBranch
                ? (locale === 'ja' ? (selectedBranch.nameJa || selectedBranch.name) : selectedBranch.name)
                : ''

            const res = await fetch(`/api/assets/${kioskId}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...historyForm,
                    newBranch: newBranchName,
                    newBranchId: historyForm.newBranchId || null,
                    newRegionCode: selectedBranch?.regionCode || null,
                    newAreaCode: selectedBranch?.areaCode || null,
                    corporationId: historyForm.newPartnerId || null,  // Corporation ID (Kiosk 업데이트용)
                    newPrice: historyForm.newPrice ? parseFloat(historyForm.newPrice) : null,
                    repairCost: historyForm.repairCost ? parseFloat(historyForm.repairCost) : null,
                    newPartnerId: null  // LocationHistory의 newPartnerId는 Partner를 참조하므로 null
                })
            })

            console.log('Response status:', res.status)

            if (res.ok) {
                setShowHistoryModal(false)
                setHistoryForm({
                    moveType: 'TRANSFER',
                    newPartnerId: '',
                    newBranchId: '',
                    newStatus: '',
                    newPrice: '',
                    repairReason: '',
                    repairCost: '',
                    repairVendor: '',
                    eventDate: new Date().toISOString().split('T')[0],
                    description: '',
                    handledBy: '',
                    updateKiosk: true
                })
                setFilteredBranches([])
                fetchData()
            } else {
                const errorData = await res.json()
                console.error('Error response:', errorData)
                alert(`${th('addFailed')}: ${errorData.error || ''}`)
            }
        } catch (error) {
            console.error('Exception:', error)
            alert(th('addError'))
        }
    }

    // 이력 편집용 법인/지점 상태
    const [editFilteredBranches, setEditFilteredBranches] = useState<{ id: string; name: string; nameJa: string | null; corporationId: string; regionCode?: string | null; areaCode?: string | null }[]>([])
    const [editSelectedCorporationId, setEditSelectedCorporationId] = useState('')
    const [editSelectedBranchId, setEditSelectedBranchId] = useState('')

    // 이력 편집 모달 열기
    const openEditHistoryModal = (h: History) => {
        setEditingHistory(h)

        // 기존 이력의 법인/지점 정보로 초기화
        if (h.newCorporation?.id) {
            setEditSelectedCorporationId(h.newCorporation.id)
            const filtered = branches.filter(b => b.corporationId === h.newCorporation!.id)
            setEditFilteredBranches(filtered)
            setEditSelectedBranchId(h.newBranchId || '')
        } else {
            setEditSelectedCorporationId('')
            setEditSelectedBranchId('')
            setEditFilteredBranches([])
        }
        setShowEditHistoryModal(true)
    }

    // 이력 편집 시 법인 선택 핸들러
    const handleEditCorporationChange = (corporationId: string) => {
        setEditSelectedCorporationId(corporationId)
        setEditSelectedBranchId('')
        if (corporationId) {
            setEditFilteredBranches(branches.filter(b => b.corporationId === corporationId))
        } else {
            setEditFilteredBranches([])
        }
    }

    // 이력 편집 시 지점 선택 핸들러
    const handleEditBranchChange = (branchId: string) => {
        console.log('handleEditBranchChange called with branchId:', branchId)
        setEditSelectedBranchId(branchId)
        const branch = branches.find(b => b.id === branchId)
        console.log('Found branch:', branch)
        if (branch && editingHistory) {
            const branchName = locale === 'ja' ? (branch.nameJa || branch.name) : branch.name
            console.log('Setting newBranch to:', branchName)
            setEditingHistory({ ...editingHistory, newBranch: branchName })
        }
    }

    // 이력 수정
    const handleEditHistory = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('=== handleEditHistory called ===')
        if (!editingHistory) {
            console.log('editingHistory is null')
            return
        }
        console.log('editingHistory.newBranch:', editingHistory.newBranch)
        console.log('editSelectedBranchId:', editSelectedBranchId)

        // 선택된 지점의 지역/관할코드 가져오기
        const selectedBranch = editSelectedBranchId ? branches.find(b => b.id === editSelectedBranchId) : null
        console.log('selectedBranch:', selectedBranch ? { id: selectedBranch.id, name: selectedBranch.name } : null)

        try {
            const requestBody = {
                moveType: editingHistory.moveType,
                eventDate: editingHistory.eventDate,
                newBranch: editingHistory.newBranch,
                newBranchId: editSelectedBranchId || undefined,
                newRegionCode: selectedBranch?.regionCode || undefined,
                newAreaCode: selectedBranch?.areaCode || undefined,
                newStatus: editingHistory.newStatus || undefined,
                newPrice: editingHistory.newPrice || undefined,
                repairReason: editingHistory.repairReason || undefined,
                repairCost: editingHistory.repairCost || undefined,
                repairVendor: editingHistory.repairVendor || undefined,
                description: editingHistory.description,
                handledBy: editingHistory.handledBy
            }
            console.log('Sending PUT request to /api/history/' + editingHistory.id)
            console.log('Request body:', JSON.stringify(requestBody))

            const res = await fetch(`/api/history/${editingHistory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            console.log('Response received, status:', res.status)
            if (res.ok) {
                console.log('Success!')
                setShowEditHistoryModal(false)
                setEditingHistory(null)
                fetchData()
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Error response:', errorData)
                alert('수정 실패: ' + (errorData.error || res.status))
            }
        } catch (error) {
            console.error('Fetch error:', error)
            alert('오류가 발생했습니다: ' + (error as Error).message)
        }
    }

    // 이력 삭제
    const handleDeleteHistory = async (historyId: string) => {
        if (!confirm('이 이력을 삭제하시겠습니까?')) return

        try {
            const res = await fetch(`/api/history/${historyId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchData()
            } else {
                alert('삭제 실패')
            }
        } catch (error) {
            console.error(error)
            alert('오류가 발생했습니다')
        }
    }

    // 최신 이력으로 동기화
    const handleSyncLatestHistory = async () => {
        if (!kiosk || history.length === 0) return
        if (!confirm(th('syncLatestConfirm'))) return

        try {
            const res = await fetch(`/api/assets/${kiosk.id}/sync-latest`, {
                method: 'POST'
            })

            if (res.ok) {
                const result = await res.json()
                if (result.updated) {
                    alert(th('syncLatestSuccess'))
                    fetchData()
                } else {
                    alert(result.message)
                }
            } else {
                const errorData = await res.json().catch(() => ({}))
                alert(th('syncLatestFailed') + ': ' + (errorData.error || ''))
            }
        } catch (error) {
            console.error(error)
            alert('오류가 발생했습니다')
        }
    }

    // 키오스크 소속 편집 모달 열기
    const openEditKioskModal = () => {
        // 현재 키오스크의 법인/지점 정보로 초기화
        // kiosk.branch.corporation.id를 우선 사용하고, 없으면 branches 배열에서 찾기
        const currentCorporationId = kiosk?.branch?.corporation?.id ||
            (kiosk?.branchId ? branches.find(b => b.id === kiosk.branchId)?.corporationId : '') || ''

        setEditKioskCorporationId(currentCorporationId)
        if (currentCorporationId) {
            const filtered = branches.filter(b => b.corporationId === currentCorporationId)
            setEditKioskFilteredBranches(filtered)
        } else {
            setEditKioskFilteredBranches([])
        }
        setEditKioskBranchId(kiosk?.branchId || '')
        setShowEditKioskModal(true)
    }

    // 키오스크 편집 시 법인 선택 핸들러
    const handleEditKioskCorporationChange = (corporationId: string) => {
        setEditKioskCorporationId(corporationId)
        setEditKioskBranchId('')
        if (corporationId) {
            setEditKioskFilteredBranches(branches.filter(b => b.corporationId === corporationId))
        } else {
            setEditKioskFilteredBranches([])
        }
    }

    // 키오스크 소속 업데이트
    const handleUpdateKioskBelong = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('handleUpdateKioskBelong called')
        if (!kiosk) {
            console.log('kiosk is null')
            return
        }

        const selectedBranch = editKioskBranchId ? branches.find(b => b.id === editKioskBranchId) : null
        const branchName = selectedBranch
            ? (locale === 'ja' ? (selectedBranch.nameJa || selectedBranch.name) : selectedBranch.name)
            : null

        console.log('selectedBranch:', selectedBranch)
        console.log('branchName:', branchName)
        console.log('editKioskBranchId:', editKioskBranchId)

        try {
            const requestBody = {
                branchId: editKioskBranchId || null,
                branchName: branchName,
                regionCode: selectedBranch?.regionCode || null,
                areaCode: selectedBranch?.areaCode || null
            }
            console.log('Request body:', requestBody)

            const res = await fetch(`/api/assets/${kiosk.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            console.log('Response status:', res.status)

            if (res.ok) {
                console.log('Success! Closing modal and refreshing data')
                setShowEditKioskModal(false)
                fetchData()
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Error response:', errorData)
                alert('수정 실패: ' + (errorData.error || res.status))
            }
        } catch (error) {
            console.error('Exception:', error)
            alert('오류가 발생했습니다')
        }
    }

    // 상태 편집 모달 열기
    const openEditStatusModal = () => {
        // 현재 최신 이력의 moveType을 기본값으로 설정
        setEditStatus(kiosk?.latestMoveType || 'DEPLOY')
        setShowEditStatusModal(true)
    }

    // 상태 업데이트 - 이력 생성을 통해 상태 변경
    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!kiosk || !editStatus) return

        try {
            // 이력 생성을 통해 상태 변경
            const res = await fetch(`/api/assets/${kiosk.id}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moveType: editStatus,
                    eventDate: new Date().toISOString().split('T')[0],
                    description: th('statusChangeHistory'),
                    updateKiosk: true
                })
            })

            if (res.ok) {
                setShowEditStatusModal(false)
                fetchData()
            } else {
                const errorData = await res.json().catch(() => ({}))
                alert('수정 실패: ' + (errorData.error || res.status))
            }
        } catch (error) {
            console.error(error)
            alert('오류가 발생했습니다')
        }
    }

    if (isLoading) {
        return (
            <div className="container-xl">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            </div>
        )
    }

    if (!kiosk) {
        return (
            <div className="container-xl">
                <div className="alert alert-danger">{t('noAssets')}</div>
            </div>
        )
    }

    return (
        <>
            {/* Page Header */}
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col-auto">
                            <Link href={`/dashboard/assets?page=${returnPage}`} className="btn btn-ghost-secondary">
                                <i className="ti ti-arrow-left me-1"></i>
                                {tc('back')}
                            </Link>
                        </div>
                        <div className="col">
                            <div className="page-pretitle">Asset Detail</div>
                            <h2 className="page-title d-flex align-items-center gap-2">
                                {kiosk.serialNumber}
                                {getLatestStatusBadge()}
                            </h2>
                        </div>
                        <div className="col-auto d-flex gap-2">
                            <Link
                                href={`/dashboard/assets?edit=${kiosk.id}&page=${returnPage}`}
                                className="btn btn-outline-primary"
                            >
                                <i className="ti ti-edit me-2"></i>
                                {tc('edit')}
                            </Link>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    // 납품일이 있으면 기본값으로 설정, 없으면 현재 날짜
                                    const defaultDate = kiosk?.deliveryDate
                                        ? new Date(kiosk.deliveryDate).toISOString().split('T')[0]
                                        : new Date().toISOString().split('T')[0]
                                    setHistoryForm({
                                        ...historyForm,
                                        eventDate: defaultDate
                                    })
                                    setShowHistoryModal(true)
                                }}
                            >
                                <i className="ti ti-plus me-2"></i>
                                {th('addHistory')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Body */}
            <div className="page-body">
                <div className="container-xl">
                    {/* 기본 정보 */}
                    <div className="row mb-3">
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">{t('title')}</h3>
                                </div>
                                <div className="card-body">
                                    <dl className="row mb-0">
                                        <dt className="col-5">{t('serialNumber')}</dt>
                                        <dd className="col-7 fw-bold">{kiosk.serialNumber}</dd>

                                        <dt className="col-5">{t('kioskNumber')}</dt>
                                        <dd className="col-7">{kiosk.kioskNumber || '-'}</dd>

                                        <dt className="col-5">{t('anydeskId')}</dt>
                                        <dd className="col-7">{kiosk.anydeskId || '-'}</dd>

                                        <dt className="col-5">{t('brandName')}</dt>
                                        <dd className="col-7">{kiosk.brandName || '-'}</dd>

                                        <dt className="col-5">{t('status')}</dt>
                                        <dd className="col-7 d-flex align-items-center gap-2">
                                            {getLatestStatusBadge()}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost-primary p-1"
                                                onClick={openEditStatusModal}
                                                title={tc('edit')}
                                            >
                                                <i className="ti ti-edit" style={{ fontSize: '14px' }}></i>
                                            </button>
                                        </dd>

                                        <dt className="col-5">{t('acquisition')}</dt>
                                        <dd className="col-7">
                                            {kiosk.acquisition === 'FREE' || kiosk.acquisition === 'PURCHASE' ? t('acquisitionFree') :
                                             kiosk.acquisition === 'LEASE_FREE' || kiosk.acquisition === 'LEASE' ? t('acquisitionLeaseFree') :
                                             kiosk.acquisition === 'PAID' ? t('acquisitionPaid') :
                                             kiosk.acquisition === 'RENTAL' ? t('acquisitionRental') : kiosk.acquisition}
                                        </dd>

                                        <dt className="col-5">{t('salePrice')}</dt>
                                        <dd className="col-7">{kiosk.salePrice ? `${kiosk.salePrice}${t('stats.manYen')}` : '-'}</dd>

                                        <dt className="col-5">{t('memo')}</dt>
                                        <dd className="col-7">
                                            <span className="text-muted">{kiosk.memo || '-'}</span>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title mb-0">{t('belongInfo')}</h3>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={openEditKioskModal}
                                    >
                                        <i className="ti ti-edit me-1"></i>
                                        {tc('edit')}
                                    </button>
                                </div>
                                <div className="card-body">
                                    <dl className="row mb-0">
                                        <dt className="col-5">{t('corporationName')}</dt>
                                        <dd className="col-7">{(() => {
                                            // 최신 이력의 법인 정보 우선 사용
                                            const latestCorp = kiosk.latestCorporation || kiosk.latestBranch?.corporation
                                            if (latestCorp) {
                                                return locale === 'ja' ? (latestCorp.nameJa || latestCorp.name || '-') : (latestCorp.name || '-')
                                            }
                                            // 기존 branch 정보 사용
                                            return locale === 'ja' ? (kiosk.branch?.corporation?.nameJa || kiosk.branch?.corporation?.name || '-') : (kiosk.branch?.corporation?.name || '-')
                                        })()}</dd>

                                        <dt className="col-5">{t('branchName')}</dt>
                                        <dd className="col-7">{(() => {
                                            // 최신 이력의 지점 정보 우선 사용
                                            if (kiosk.latestBranchName) return kiosk.latestBranchName
                                            if (kiosk.latestBranch) {
                                                return locale === 'ja' ? (kiosk.latestBranch.nameJa || kiosk.latestBranch.name || '-') : (kiosk.latestBranch.name || '-')
                                            }
                                            return kiosk.branchName || '-'
                                        })()}</dd>

                                        <dt className="col-5">{t('regionCode')}</dt>
                                        <dd className="col-7">
                                            {(() => {
                                                // 최신 이력 > branch > kiosk 순으로 우선
                                                const regionCode = kiosk.latestBranch?.regionCode || kiosk.regionCode || kiosk.branch?.regionCode || null
                                                const regionName = getRegionName(regionCode)
                                                if (!regionCode) return '-'
                                                return (
                                                    <span className="badge bg-azure-lt">
                                                        {regionCode}{regionName ? ` / ${regionName}` : ''}
                                                    </span>
                                                )
                                            })()}
                                        </dd>

                                        <dt className="col-5">{t('areaCode')}</dt>
                                        <dd className="col-7">
                                            {(() => {
                                                // 최신 이력 > branch > kiosk 순으로 우선
                                                const areaCode = kiosk.latestBranch?.areaCode || kiosk.areaCode || kiosk.branch?.areaCode || null
                                                const areaName = getAreaName(areaCode)
                                                if (!areaCode) return '-'
                                                return (
                                                    <span className="badge bg-purple-lt">
                                                        {areaCode}{areaName ? ` / ${areaName}` : ''}
                                                    </span>
                                                )
                                            })()}
                                        </dd>

                                        <dt className="col-5">{tc('postalCode')}</dt>
                                        <dd className="col-7">{kiosk.latestBranch?.postalCode || kiosk.branch?.postalCode || kiosk.postalCode || '-'}</dd>

                                        <dt className="col-5">{tc('address')}</dt>
                                        <dd className="col-7">{kiosk.latestBranch?.address || kiosk.branch?.address || kiosk.address || '-'}</dd>

                                        <dt className="col-5">{tc('managerPhone')}</dt>
                                        <dd className="col-7">{kiosk.latestBranch?.managerPhone || kiosk.branch?.managerPhone || kiosk.managerPhone || '-'}</dd>

                                        <dt className="col-5">{t('deliveryDate')}</dt>
                                        <dd className="col-7">{(() => {
                                            // Kiosk의 deliveryDate를 납품일로 표시
                                            return kiosk.deliveryDate ? new Date(kiosk.deliveryDate).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'
                                        })()}</dd>

                                        <dt className="col-5">{t('deliveryStatus')}</dt>
                                        <dd className="col-7">{getDeliveryStatusBadge(kiosk.deliveryStatus)}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 이동 이력 */}
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="card-title mb-0">
                                {th('title')}
                                <span className="badge bg-blue-lt ms-2">{history.length}</span>
                            </h3>
                            {history.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={handleSyncLatestHistory}
                                    title={th('syncLatestDesc')}
                                >
                                    <i className="ti ti-refresh me-1"></i>
                                    {th('syncLatest')}
                                </button>
                            )}
                        </div>
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table">
                                <thead>
                                    <tr>
                                        <th>{th('eventDate')}</th>
                                        <th>{th('moveType')}</th>
                                        <th>{th('changeDetails')}</th>
                                        <th>{th('handledBy')}</th>
                                        <th>{th('memo')}</th>
                                        <th className="w-1"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted py-4">
                                                {th('noHistory')}
                                            </td>
                                        </tr>
                                    ) : (
                                        [...history].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).map(h => (
                                            <tr key={h.id}>
                                                <td
                                                    className="text-nowrap"
                                                    style={{ cursor: 'pointer', minWidth: '120px' }}
                                                    onClick={() => inlineEditingHistoryId !== h.id && startInlineHistoryEdit(h)}
                                                >
                                                    {inlineEditingHistoryId === h.id ? (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={inlineEditHistoryValue}
                                                                onChange={(e) => handleInlineHistoryDateInput(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveInlineHistoryEdit(h.id)
                                                                    if (e.key === 'Escape') cancelInlineHistoryEdit()
                                                                }}
                                                                placeholder="YYYY-MM-DD"
                                                                autoFocus
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{ width: '110px' }}
                                                            />
                                                            <button
                                                                className="btn btn-sm btn-success p-1"
                                                                onClick={(e) => { e.stopPropagation(); saveInlineHistoryEdit(h.id) }}
                                                                title="저장"
                                                            >
                                                                <i className="ti ti-check" style={{ fontSize: '12px' }}></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-secondary p-1"
                                                                onClick={(e) => { e.stopPropagation(); cancelInlineHistoryEdit() }}
                                                                title="취소"
                                                            >
                                                                <i className="ti ti-x" style={{ fontSize: '12px' }}></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-primary" style={{ borderBottom: '1px dashed #206bc4' }}>
                                                            {new Date(h.eventDate).toLocaleDateString('ko-KR', {
                                                                year: 'numeric',
                                                                month: '2-digit',
                                                                day: '2-digit'
                                                            })}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{getMoveTypeBadge(h.moveType)}</td>
                                                <td>
                                                    <div className="small">
                                                        {(() => {
                                                            // 지점 또는 법인이 변경되었는지 확인
                                                            const branchChanged = h.prevBranch !== h.newBranch ||
                                                                h.prevBranchId !== h.newBranchId ||
                                                                h.prevCorporation?.id !== h.newCorporation?.id

                                                            if (branchChanged && (h.prevBranch || h.newBranch || h.prevCorporation || h.newCorporation)) {
                                                                const prevCorpName = h.prevCorporation
                                                                    ? (locale === 'ja' ? (h.prevCorporation.nameJa || h.prevCorporation.name) : h.prevCorporation.name)
                                                                    : ''
                                                                const newCorpName = h.newCorporation
                                                                    ? (locale === 'ja' ? (h.newCorporation.nameJa || h.newCorporation.name) : h.newCorporation.name)
                                                                    : ''

                                                                // branchId로 지점 정보를 찾아서 로케일에 맞는 이름 사용
                                                                const prevBranchObj = h.prevBranchId ? branches.find(b => b.id === h.prevBranchId) : null
                                                                const newBranchObj = h.newBranchId ? branches.find(b => b.id === h.newBranchId) : null

                                                                const prevBranchName = prevBranchObj
                                                                    ? (locale === 'ja' ? (prevBranchObj.nameJa || prevBranchObj.name) : prevBranchObj.name)
                                                                    : h.prevBranch  // branchId가 없으면 저장된 문자열 사용 (이전 데이터 호환)
                                                                const newBranchName = newBranchObj
                                                                    ? (locale === 'ja' ? (newBranchObj.nameJa || newBranchObj.name) : newBranchObj.name)
                                                                    : h.newBranch  // branchId가 없으면 저장된 문자열 사용 (이전 데이터 호환)

                                                                const prevDisplay = prevBranchName
                                                                    ? (prevCorpName ? `${prevCorpName} / ${prevBranchName}` : prevBranchName)
                                                                    : (prevCorpName || th('none'))
                                                                const newDisplay = newBranchName
                                                                    ? (newCorpName ? `${newCorpName} / ${newBranchName}` : newBranchName)
                                                                    : (newCorpName || th('none'))

                                                                return (
                                                                    <div>
                                                                        <strong>{th('branch')}:</strong> {prevDisplay} → {newDisplay}
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                        {h.prevStatus !== h.newStatus && h.newStatus ? (
                                                            <div>
                                                                <strong>{th('status')}:</strong> {h.prevStatus || th('none')} → {h.newStatus}
                                                            </div>
                                                        ) : null}
                                                        {h.prevPrice !== h.newPrice && h.newPrice !== null ? (
                                                            <div>
                                                                <strong>{th('price')}:</strong> {h.prevPrice || 0}{th('manYen')} → {h.newPrice}{th('manYen')}
                                                            </div>
                                                        ) : null}
                                                        {h.repairReason ? (
                                                            <div>
                                                                <strong>{th('repairReason')}:</strong> {h.repairReason}
                                                                {h.repairCost ? ` (${h.repairCost}${th('manYen')})` : ''}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td>{h.handledBy || '-'}</td>
                                                <td>
                                                    <span className="text-muted small">{translateDescription(h.description)}</span>
                                                </td>
                                                <td>
                                                    <div className="btn-list flex-nowrap">
                                                        <button
                                                            className="btn btn-sm btn-ghost-primary"
                                                            onClick={() => openEditHistoryModal(h)}
                                                            title={tc('edit')}
                                                        >
                                                            <i className="ti ti-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-ghost-danger"
                                                            onClick={() => handleDeleteHistory(h.id)}
                                                            title={tc('delete')}
                                                        >
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
                    </div>
                </div>
            </div>

            {/* Add History Modal */}
            {showHistoryModal && (
                <div className="modal modal-blur show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg" style={{ zIndex: 1055 }}>
                        <div className="modal-content" style={{ position: 'relative', zIndex: 1060 }}>
                            <div className="modal-header">
                                <h5 className="modal-title">{th('addHistory')}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)}></button>
                            </div>
                            <form onSubmit={handleAddHistory}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label required">{th('moveType')}</label>
                                            <select
                                                className="form-select"
                                                value={historyForm.moveType}
                                                onChange={e => setHistoryForm({ ...historyForm, moveType: e.target.value })}
                                            >
                                                <option value="DEPLOY">{th('typeDeploy')} ({th('typeDeployDesc')})</option>
                                                <option value="RETURN">{th('typeReturn')} ({th('typeReturnDesc')})</option>
                                                <option value="MAINTENANCE">{th('typeMaintenance')} ({th('typeMaintenanceDesc')})</option>
                                                <option value="REPAIR_COMPLETE">{th('typeRepairComplete')}</option>
                                                <option value="STORAGE">{th('typeStorage')}</option>
                                                <option value="DISPOSAL">{th('typeDisposal')}</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label required">{th('eventDateTime')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={historyForm.eventDate}
                                                onChange={e => handleDateInput(e.target.value, (val) => setHistoryForm({ ...historyForm, eventDate: val }))}
                                                placeholder="YYYY-MM-DD"
                                                maxLength={10}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('newPartner')}</label>
                                            <select
                                                className="form-select"
                                                value={historyForm.newPartnerId}
                                                onChange={e => handleCorporationChange(e.target.value)}
                                            >
                                                <option value="">{th('noSelection')}</option>
                                                {corporations.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {locale === 'ja' ? (c.nameJa || c.name) : c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('newBranch')}</label>
                                            <select
                                                className="form-select"
                                                value={historyForm.newBranchId}
                                                onChange={e => setHistoryForm({ ...historyForm, newBranchId: e.target.value })}
                                                disabled={!historyForm.newPartnerId}
                                            >
                                                <option value="">{th('noSelection')}</option>
                                                {filteredBranches.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {locale === 'ja' ? (b.nameJa || b.name) : b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('newPrice')} ({th('manYen')})</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={historyForm.newPrice}
                                                onChange={e => setHistoryForm({ ...historyForm, newPrice: e.target.value })}
                                                placeholder={th('changeIfNeeded')}
                                            />
                                        </div>

                                        {/* 수리 관련 필드 */}
                                        {(historyForm.moveType === 'MAINTENANCE' || historyForm.moveType === 'REPAIR_COMPLETE') && (
                                            <>
                                                <div className="col-12">
                                                    <hr className="my-2" />
                                                    <label className="form-label fw-bold">{th('repairInfo')}</label>
                                                </div>
                                                <div className="col-md-12">
                                                    <label className="form-label">{th('repairReason')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={historyForm.repairReason}
                                                        onChange={e => setHistoryForm({ ...historyForm, repairReason: e.target.value })}
                                                        placeholder={th('faultOrRepairContent')}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">{th('repairCost')} ({th('manYen')})</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={historyForm.repairCost}
                                                        onChange={e => setHistoryForm({ ...historyForm, repairCost: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">{th('repairVendor')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={historyForm.repairVendor}
                                                        onChange={e => setHistoryForm({ ...historyForm, repairVendor: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="col-md-6">
                                            <label className="form-label">{th('handledBy')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={historyForm.handledBy}
                                                onChange={e => setHistoryForm({ ...historyForm, handledBy: e.target.value })}
                                                placeholder={th('handledBy')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">&nbsp;</label>
                                            <div className="form-check mt-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={historyForm.updateKiosk}
                                                    onChange={e => setHistoryForm({ ...historyForm, updateKiosk: e.target.checked })}
                                                    id="updateKiosk"
                                                />
                                                <label className="form-check-label" htmlFor="updateKiosk">
                                                    {th('updateKioskInfo')}
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">{th('memo')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={historyForm.description}
                                                onChange={e => setHistoryForm({ ...historyForm, description: e.target.value })}
                                                placeholder={th('detailDesc')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                                        {tc('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        onClick={(e) => {
                                            console.log('Button clicked!')
                                            // form submit will handle the rest
                                        }}
                                    >
                                        <i className="ti ti-check me-2"></i>
                                        {th('addHistory')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
                </div>
            )}

            {/* Edit History Modal */}
            {showEditHistoryModal && editingHistory && (
                <div className="modal modal-blur show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg" style={{ zIndex: 1055 }}>
                        <div className="modal-content" style={{ position: 'relative', zIndex: 1060 }}>
                            <div className="modal-header">
                                <h5 className="modal-title">{th('editHistory')}</h5>
                                <button type="button" className="btn-close" onClick={() => {
                                    setShowEditHistoryModal(false)
                                    setEditingHistory(null)
                                }}></button>
                            </div>
                            <form onSubmit={handleEditHistory}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{th('moveType')}</label>
                                            <select
                                                className="form-select"
                                                value={editingHistory.moveType}
                                                onChange={e => setEditingHistory({ ...editingHistory, moveType: e.target.value })}
                                            >
                                                <option value="DEPLOY">{th('typeDeploy')}</option>
                                                <option value="RETURN">{th('typeReturn')}</option>
                                                <option value="MAINTENANCE">{th('typeMaintenance')}</option>
                                                <option value="REPAIR_COMPLETE">{th('typeRepairComplete')}</option>
                                                <option value="STORAGE">{th('typeStorage')}</option>
                                                <option value="DISPOSAL">{th('typeDisposal')}</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('eventDate')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editingHistory.eventDate ? editingHistory.eventDate.split('T')[0] : ''}
                                                onChange={e => handleDateInput(e.target.value, (val) => setEditingHistory({ ...editingHistory, eventDate: val }))}
                                                placeholder="YYYY-MM-DD"
                                                maxLength={10}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('newPartner')}</label>
                                            <select
                                                className="form-select"
                                                value={editSelectedCorporationId}
                                                onChange={e => handleEditCorporationChange(e.target.value)}
                                            >
                                                <option value="">{th('noSelection')}</option>
                                                {corporations.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {locale === 'ja' ? (c.nameJa || c.name) : c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('newBranch')}</label>
                                            <select
                                                className="form-select"
                                                value={editSelectedBranchId}
                                                onChange={e => handleEditBranchChange(e.target.value)}
                                                disabled={!editSelectedCorporationId}
                                            >
                                                <option value="">{th('noSelection')}</option>
                                                {editFilteredBranches.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {locale === 'ja' ? (b.nameJa || b.name) : b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{th('newPrice')} ({th('manYen')})</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editingHistory.newPrice || ''}
                                                onChange={e => setEditingHistory({ ...editingHistory, newPrice: e.target.value ? Number(e.target.value) : null })}
                                                placeholder={th('changeIfNeeded')}
                                            />
                                        </div>

                                        {/* 수리 관련 필드 */}
                                        {(editingHistory.moveType === 'MAINTENANCE' || editingHistory.moveType === 'REPAIR_COMPLETE') && (
                                            <>
                                                <div className="col-12">
                                                    <hr className="my-2" />
                                                    <label className="form-label fw-bold">{th('repairInfo')}</label>
                                                </div>
                                                <div className="col-md-12">
                                                    <label className="form-label">{th('repairReason')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={editingHistory.repairReason || ''}
                                                        onChange={e => setEditingHistory({ ...editingHistory, repairReason: e.target.value })}
                                                        placeholder={th('faultOrRepairContent')}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">{th('repairCost')} ({th('manYen')})</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={editingHistory.repairCost || ''}
                                                        onChange={e => setEditingHistory({ ...editingHistory, repairCost: e.target.value ? Number(e.target.value) : null })}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">{th('repairVendor')}</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={editingHistory.repairVendor || ''}
                                                        onChange={e => setEditingHistory({ ...editingHistory, repairVendor: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="col-md-6">
                                            <label className="form-label">{th('handledBy')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editingHistory.handledBy || ''}
                                                onChange={e => setEditingHistory({ ...editingHistory, handledBy: e.target.value })}
                                                placeholder={th('handledBy')}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">{th('memo')}</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={editingHistory.description || ''}
                                                onChange={e => setEditingHistory({ ...editingHistory, description: e.target.value })}
                                                placeholder={th('detailDesc')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                        setShowEditHistoryModal(false)
                                        setEditingHistory(null)
                                    }}>
                                        {tc('cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="ti ti-check me-2"></i>
                                        {tc('save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
                </div>
            )}

            {/* Edit Kiosk Belong Modal */}
            {showEditKioskModal && (
                <div className="modal modal-blur show d-block" style={{ zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1060 }}>
                        <div className="modal-content" style={{ position: 'relative', zIndex: 1065 }}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('editBelong')}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditKioskModal(false)}></button>
                            </div>
                            <form onSubmit={handleUpdateKioskBelong}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">{t('corporationName')}</label>
                                        <select
                                            className="form-select"
                                            value={editKioskCorporationId}
                                            onChange={e => handleEditKioskCorporationChange(e.target.value)}
                                        >
                                            <option value="">{th('noSelection')}</option>
                                            {corporations.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {locale === 'ja' ? (c.nameJa || c.name) : c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('branchName')}</label>
                                        <select
                                            className="form-select"
                                            value={editKioskBranchId}
                                            onChange={e => setEditKioskBranchId(e.target.value)}
                                            disabled={!editKioskCorporationId}
                                        >
                                            <option value="">{th('noSelection')}</option>
                                            {editKioskFilteredBranches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {locale === 'ja' ? (b.nameJa || b.name) : b.name}
                                                </option>
                                            ))}
                                        </select>
                                        {editKioskCorporationId && editKioskFilteredBranches.length === 0 && (
                                            <small className="text-muted">{t('noBranches')}</small>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditKioskModal(false)}>
                                        {tc('cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="ti ti-check me-2"></i>
                                        {tc('save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
                </div>
            )}

            {/* Edit Status Modal */}
            {showEditStatusModal && (
                <>
                    <div className="modal-backdrop show" style={{ zIndex: 1050 }} onClick={() => setShowEditStatusModal(false)}></div>
                    <div className="modal modal-blur show d-block" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{t('statusEdit')}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditStatusModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpdateStatus}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">{th('moveType')}</label>
                                            <select
                                                className="form-select"
                                                value={editStatus}
                                                onChange={e => setEditStatus(e.target.value)}
                                                required
                                            >
                                                <option value="DEPLOY">{th('typeDeploy')}</option>
                                                <option value="RETURN">{th('typeReturn')}</option>
                                                <option value="MAINTENANCE">{th('typeMaintenance')}</option>
                                                <option value="REPAIR_COMPLETE">{th('typeRepairComplete')}</option>
                                                <option value="STORAGE">{th('typeStorage')}</option>
                                                <option value="DISPOSAL">{th('typeDisposal')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditStatusModal(false)}>
                                            {tc('cancel')}
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            <i className="ti ti-check me-2"></i>
                                            {tc('save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
