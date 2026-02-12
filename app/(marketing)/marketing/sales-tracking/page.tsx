'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Building2,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Info,
  Save,
  Plus,
  Edit2,
  Trash2,
  X,
  Send,
  MessageCircle,
  Inbox,
  FileEdit,
} from 'lucide-react'
import BulkEmailTab from '@/components/marketing/BulkEmailTab'

import EmailDashboard from '@/components/marketing/EmailDashboard'
import EmailLogPanel from '@/components/marketing/EmailLogPanel'
import BlacklistPanel from '@/components/marketing/BlacklistPanel'
import EmailSettingsPanel from '@/components/marketing/EmailSettingsPanel'
import EmailHistoryPanel from '@/components/marketing/EmailHistoryPanel'
import { useTranslation } from '@/lib/translations'
import { ALL_CONTACT_HISTORY, CONTRACTED_COMPANIES } from '@/data/contact-history'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// =======================================
// Types - Sales Tracking (Google Sheets)
// =======================================
type ProgressStatus = '未交渉' | '連絡中' | '商談中' | '見積提出' | '成約' | '失注' | '保留' | 'unknown'

type ContactType = 'mail' | 'inquiry' | 'phone' | 'unknown'

type ContactRecord = {
  date: string
  dateStr: string
  year: number
  month: number
  day: number
  contactType?: ContactType
}

// 가져온 연락 시도 데이터 타입
type ImportedContactRecord = {
  companyName: string
  contactDate: string  // YYYY-MM-DD
  contactType: ContactType
  year: number
  month: number
  day: number
}

type RentalCarCompany = {
  id: string
  rowNumber: number
  prefecture: string
  companyName: string
  phone: string
  contactMethod: string
  email?: string
  contactUrl?: string
  address: string
  status: ProgressStatus
  systemInUse: string
  contactHistory: ContactRecord[]
  notes: string
  region: string
  regionKo: string
  office: string
}

type RegionSalesStats = {
  region: string
  regionKo: string
  office: string
  totalCompanies: number
  statusBreakdown: { [key in ProgressStatus]?: number }
  contactedCount: number
  lastContactDate: string | null
}

type SalesOverviewStats = {
  totalCompanies: number
  statusBreakdown: { [key in ProgressStatus]?: number }
  contactedCompanies: number
  neverContactedCompanies: number
  recentlyContacted: number
  byRegion: RegionSalesStats[]
  byOffice: {
    [officeCode: string]: {
      name: string
      totalCompanies: number
      contacted: number
    }
  }
}

// =======================================
// Types - Pipedrive
// =======================================
type LeadRegionStats = {
  region: {
    code: string
    name: string
    nameJa: string
    nameKo: string
    areaCode: string
    areaName: string
    color: string
  }
  count: number
  totalValue: number
  leads: Array<{
    id: string
    title: string
    organization?: string
    address?: string
    phone?: string
    email?: string
    value?: number
    add_time: string
  }>
}

type RegionData = {
  stats: LeadRegionStats[]
  unassigned: LeadRegionStats
  total: number
}

type OfficeData = {
  code: string
  name: string
  nameJa: string
  nameKo: string
  color: string
  totalCount: number
  regions: LeadRegionStats[]
}

// =======================================
// Constants
// =======================================
const OFFICE_COLORS: { [key: string]: string } = {
  'A': '#3b82f6', // blue - Sapporo
  'B': '#f59e0b', // amber - Tokyo
  'C': '#ec4899', // pink - Osaka
  'D': '#ef4444', // red - Fukuoka
  'E': '#22c55e', // green - Okinawa
}

const OFFICE_INFO: { [key: string]: { nameJa: string; nameKo: string } } = {
  'A': { nameJa: '札幌オフィス', nameKo: '삿포로 사무소' },
  'B': { nameJa: '東京オフィス', nameKo: '도쿄 사무소' },
  'C': { nameJa: '大阪オフィス', nameKo: '오사카 사무소' },
  'D': { nameJa: '福岡オフィス', nameKo: '후쿠오카 사무소' },
  'E': { nameJa: '沖縄オフィス', nameKo: '오키나와 사무소' },
}

const STATUS_COLORS: { [key in ProgressStatus]: string } = {
  '未交渉': '#9ca3af',
  '連絡中': '#f59e0b',
  '商談中': '#3b82f6',
  '見積提出': '#8b5cf6',
  '成約': '#22c55e',
  '失注': '#ef4444',
  '保留': '#6b7280',
  'unknown': '#d1d5db',
}

const STATUS_LABELS: { [key in ProgressStatus]: { ja: string; ko: string } } = {
  '未交渉': { ja: '未交渉', ko: '미교섭' },
  '連絡中': { ja: '連絡中', ko: '연락 중' },
  '商談中': { ja: '商談中', ko: '상담 중' },
  '見積提出': { ja: '見積提出', ko: '견적 제출' },
  '成約': { ja: '成約', ko: '성약' },
  '失注': { ja: '失注', ko: '영업포기' },
  '保留': { ja: '保留', ko: '보류' },
  'unknown': { ja: '不明', ko: '불명' },
}

// 연락 방법 라벨 (다국어)
const CONTACT_TYPE_LABELS: { [key in ContactType]: { ja: string; ko: string } } = {
  'mail': { ja: 'メール', ko: '메일' },
  'inquiry': { ja: '問合せ', ko: '문의' },
  'phone': { ja: '電話', ko: '전화' },
  'unknown': { ja: '不明', ko: '불명' },
}

// =======================================
// Cold Email Types
// =======================================
type ColdEmailRecord = {
  month: string
  regionCode: string
  emailCount: number
  inquiryCount: number
  note?: string
}

const COLD_EMAIL_REGIONS = [
  { code: 'A_HK', name: '北海道', nameKo: '홋카이도', areaCode: 'A' },
  { code: 'B_TH', name: '東北', nameKo: '도호쿠', areaCode: 'B' },
  { code: 'B_KT', name: '関東', nameKo: '관동', areaCode: 'B' },
  { code: 'B_CB', name: '中部', nameKo: '주부', areaCode: 'B' },
  { code: 'C_HR', name: '北陸信越', nameKo: '호쿠리쿠', areaCode: 'C' },
  { code: 'C_KK', name: '近畿', nameKo: '긴키', areaCode: 'C' },
  { code: 'C_CG', name: '中国', nameKo: '주고쿠', areaCode: 'C' },
  { code: 'C_SK', name: '四国', nameKo: '시코쿠', areaCode: 'C' },
  { code: 'D_KS', name: '九州', nameKo: '규슈', areaCode: 'D' },
  { code: 'E_OK', name: '沖縄', nameKo: '오키나와', areaCode: 'E' },
]

const COLD_EMAIL_SAMPLE_DATA: { [month: string]: ColdEmailRecord[] } = {
  '2026-01': [
    { month: '2026-01', regionCode: 'A_HK', emailCount: 4, inquiryCount: 0 },
    { month: '2026-01', regionCode: 'B_TH', emailCount: 0, inquiryCount: 7 },
    { month: '2026-01', regionCode: 'B_KT', emailCount: 16, inquiryCount: 22 },
    { month: '2026-01', regionCode: 'B_CB', emailCount: 0, inquiryCount: 5 },
    { month: '2026-01', regionCode: 'C_HR', emailCount: 0, inquiryCount: 0 },
    { month: '2026-01', regionCode: 'C_KK', emailCount: 0, inquiryCount: 7 },
    { month: '2026-01', regionCode: 'C_CG', emailCount: 0, inquiryCount: 13 },
    { month: '2026-01', regionCode: 'C_SK', emailCount: 0, inquiryCount: 3 },
    { month: '2026-01', regionCode: 'D_KS', emailCount: 0, inquiryCount: 27 },
    { month: '2026-01', regionCode: 'E_OK', emailCount: 0, inquiryCount: 0 },
  ],
}

// =======================================
// Tab Component
// =======================================
type Tab = 'pipedrive' | 'contacts' | 'cold-email' | 'bulk-email'

export default function SalesTrackingPage() {
  const { locale } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('contacts')  // 기본: 전체 리스트

  // Pipedrive State
  const [pipedriveLoading, setPipedriveLoading] = useState(true)
  const [pipedriveError, setPipedriveError] = useState<string | null>(null)
  const [regionData, setRegionData] = useState<RegionData | null>(null)
  const [selectedPipedriveOffice, setSelectedPipedriveOffice] = useState<string | null>(null)
  const [selectedPipedriveRegion, setSelectedPipedriveRegion] = useState<string | null>(null)
  const [expandedPipedriveOffices, setExpandedPipedriveOffices] = useState<Set<string>>(new Set())
  const [showPipedriveLeadList, setShowPipedriveLeadList] = useState(false)

  // Sales Tracking State (Google Sheets)
  const [salesLoading, setSalesLoading] = useState(true)
  const [salesError, setSalesError] = useState<string | null>(null)
  const [stats, setStats] = useState<SalesOverviewStats | null>(null)
  const [companies, setCompanies] = useState<RentalCarCompany[]>([])
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [expandedOffices, setExpandedOffices] = useState<Set<string>>(new Set())
  const [showCompanyList, setShowCompanyList] = useState(true)  // 기본으로 전체 리스트 표시
  const [statusFilter, setStatusFilter] = useState<ProgressStatus | 'all'>('all')
  const [contactCountFilter, setContactCountFilter] = useState<'all' | '0' | '1' | '2' | '3' | '4' | '5+'>('all')
  const [negotiationFilter, setNegotiationFilter] = useState<'all' | 'all-leads' | 'negotiating' | 'not-negotiating' | 'contracted' | 'hold-lost'>('all')
  const [contactStatsYearFilter, setContactStatsYearFilter] = useState<'all' | 2024 | 2025 | 2026>(2026)  // 연락시도 통계 년도 필터

  // 가져온 연락 시도 데이터 (스프레드시트에서 수집한 데이터로 초기화)
  const [importedContacts, setImportedContacts] = useState<ImportedContactRecord[]>(ALL_CONTACT_HISTORY)

  // Company CRUD State
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<RentalCarCompany | null>(null)
  const [customCompanies, setCustomCompanies] = useState<RentalCarCompany[]>([])
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    prefecture: '',
    region: '関東',
    phone: '',
    email: '',
    hpContact: '',
    status: '未交渉' as ProgressStatus,
    systemInUse: '',
    notes: '',
    lineId: '',
    instagram: '',
    twitter: '',
    facebook: '',
  })

  // Contact Record State (manual logging)
  const [contactRecords, setContactRecords] = useState<Array<{ id: string; contactDate: string; contactType: string; channel?: string; summary?: string }>>([])
  const [newContact, setNewContact] = useState({ date: new Date().toISOString().split('T')[0], type: 'mail', summary: '' })
  const [isSavingContact, setIsSavingContact] = useState(false)

  // Cold Email State
  const [coldEmailMonth, setColdEmailMonth] = useState('2026-02')
  const [coldEmailRecords, setColdEmailRecords] = useState<ColdEmailRecord[]>([])
  const [coldEmailSaving, setColdEmailSaving] = useState(false)
  const [coldEmailSaved, setColdEmailSaved] = useState(false)

  // Bulk Email State
  const [emailBlacklist, setEmailBlacklist] = useState<Array<{ companyId: string; companyName: string; email: string }>>([])

  // Contact History Reset State (true = 스프레드시트 연락이력 무시, importedContacts만 사용)
  const [contactHistoryReset, setContactHistoryReset] = useState(true)  // 기본값: 리셋 상태

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  // =======================================
  // Pipedrive Functions
  // =======================================
  const fetchPipedriveData = async () => {
    setPipedriveLoading(true)
    setPipedriveError(null)
    try {
      const regionRes = await fetch(`/api/pipedrive?type=leads-by-region`)
      const regionResult = await regionRes.json()

      if (regionResult.success) {
        setRegionData(regionResult.data)
      } else {
        setPipedriveError(regionResult.error || 'Failed to fetch Pipedrive data')
      }
    } catch (err) {
      setPipedriveError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPipedriveLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  const groupByOffice = (stats: LeadRegionStats[]): OfficeData[] => {
    const officeMap: { [key: string]: OfficeData } = {}

    stats.forEach(stat => {
      const areaCode = stat.region.areaCode
      if (!officeMap[areaCode]) {
        officeMap[areaCode] = {
          code: areaCode,
          name: stat.region.areaName,
          nameJa: OFFICE_INFO[areaCode]?.nameJa || stat.region.areaName,
          nameKo: OFFICE_INFO[areaCode]?.nameKo || stat.region.areaName,
          color: OFFICE_COLORS[areaCode] || '#6b7280',
          totalCount: 0,
          regions: [],
        }
      }
      officeMap[areaCode].totalCount += stat.count
      officeMap[areaCode].regions.push(stat)
    })

    return Object.values(officeMap).sort((a, b) => b.totalCount - a.totalCount)
  }

  // =======================================
  // Sales Tracking Functions (Google Sheets)
  // =======================================
  const fetchSalesData = async (includeCompanies: boolean = false) => {
    setSalesLoading(true)
    setSalesError(null)
    try {
      const type = includeCompanies ? 'all' : 'overview'
      const response = await fetch(`/api/sales-tracking?type=${type}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.data.stats)
        if (includeCompanies && result.data.companies) {
          setCompanies(result.data.companies)
        }
      } else {
        setSalesError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setSalesError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSalesLoading(false)
    }
  }

  const toggleOffice = (officeCode: string) => {
    const newExpanded = new Set(expandedOffices)
    if (newExpanded.has(officeCode)) {
      newExpanded.delete(officeCode)
    } else {
      newExpanded.add(officeCode)
    }
    setExpandedOffices(newExpanded)
  }

  const togglePipedriveOffice = (officeCode: string) => {
    const newExpanded = new Set(expandedPipedriveOffices)
    if (newExpanded.has(officeCode)) {
      newExpanded.delete(officeCode)
    } else {
      newExpanded.add(officeCode)
    }
    setExpandedPipedriveOffices(newExpanded)
  }

  // Cold Email Functions
  const loadColdEmailData = (month: string) => {
    const savedData = typeof window !== 'undefined' ? localStorage.getItem(`coldEmail_${month}`) : null
    if (savedData) {
      setColdEmailRecords(JSON.parse(savedData))
    } else if (COLD_EMAIL_SAMPLE_DATA[month]) {
      setColdEmailRecords(COLD_EMAIL_SAMPLE_DATA[month])
    } else {
      const emptyRecords = COLD_EMAIL_REGIONS.map(region => ({
        month,
        regionCode: region.code,
        emailCount: 0,
        inquiryCount: 0,
        note: ''
      }))
      setColdEmailRecords(emptyRecords)
    }
  }

  const updateColdEmailRecord = (regionCode: string, field: 'emailCount' | 'inquiryCount', value: number) => {
    setColdEmailRecords(prev => prev.map(record => {
      if (record.regionCode === regionCode) {
        return { ...record, [field]: value }
      }
      return record
    }))
  }

  const saveColdEmailData = () => {
    setColdEmailSaving(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`coldEmail_${coldEmailMonth}`, JSON.stringify(coldEmailRecords))
    }
    setTimeout(() => {
      setColdEmailSaving(false)
      setColdEmailSaved(true)
      setTimeout(() => setColdEmailSaved(false), 2000)
    }, 500)
  }

  // =======================================
  // Company CRUD Functions
  // =======================================
  const REGION_OPTIONS = [
    { value: '北海道', label: '北海道', ko: '홋카이도', office: 'A' },
    { value: '関東', label: '関東', ko: '관동', office: 'B' },
    { value: '東北', label: '東北', ko: '도호쿠', office: 'B' },
    { value: '静岡・愛知・岐阜', label: '東海', ko: '토카이', office: 'B' },
    { value: '中国', label: '中国', ko: '주고쿠', office: 'C' },
    { value: '近畿', label: '近畿', ko: '긴키', office: 'C' },
    { value: '四国', label: '四国', ko: '시코쿠', office: 'C' },
    { value: '九州', label: '九州', ko: '규슈', office: 'D' },
    { value: '沖縄', label: '沖縄', ko: '오키나와', office: 'E' },
    { value: '石垣・宮古', label: '石垣・宮古', ko: '이시가키/미야코', office: 'E' },
  ]

  const PREFECTURE_OPTIONS = [
    '', '北海道',
    '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
    '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
  ]

  // Load custom companies from DB (Company table)
  const fetchCustomCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/companies?source=manual&limit=1000')
      if (res.ok) {
        const data = await res.json()
        const dbCompanies: RentalCarCompany[] = (data.companies || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          rowNumber: 0,
          companyName: (c.companyName as string) || '',
          prefecture: (c.prefecture as string) || '',
          region: (c.region as string) || '',
          regionKo: REGION_OPTIONS.find(r => r.value === (c.region as string))?.ko || (c.region as string) || '',
          office: (c.office as string) || REGION_OPTIONS.find(r => r.value === (c.region as string))?.office || 'B',
          phone: (c.phone as string) || '',
          contactMethod: (c.email as string) || (c.contactUrl as string) || '',
          email: (c.email as string) || undefined,
          contactUrl: (c.contactUrl as string) || undefined,
          address: (c.address as string) || '',
          status: ((c.status as string) || '未交渉') as ProgressStatus,
          systemInUse: (c.systemInUse as string) || '',
          contactHistory: [],
          notes: (c.notes as string) || '',
        }))
        setCustomCompanies(dbCompanies)

        // Auto-migrate localStorage data to DB (one-time)
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('customCompanies')
          if (saved && dbCompanies.length === 0) {
            try {
              const localCompanies = JSON.parse(saved) as RentalCarCompany[]
              const activeCompanies = localCompanies.filter(
                (c: RentalCarCompany & { deleted?: boolean }) => !c.deleted && c.companyName
              )
              if (activeCompanies.length > 0) {
                const migrateRes = await fetch('/api/companies', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'bulk-create',
                    companies: activeCompanies.map((c: RentalCarCompany) => ({
                      companyName: c.companyName,
                      prefecture: c.prefecture,
                      region: c.region,
                      office: c.office || REGION_OPTIONS.find(r => r.value === c.region)?.office || 'B',
                      phone: c.phone,
                      email: c.contactMethod?.includes('@') ? c.contactMethod : null,
                      contactUrl: c.contactMethod && !c.contactMethod.includes('@') ? c.contactMethod : null,
                      status: c.status || '未交渉',
                      systemInUse: c.systemInUse,
                      notes: c.notes,
                      source: 'manual',
                      sourceDetail: 'migrated-from-localStorage',
                    })),
                  }),
                })
                if (migrateRes.ok) {
                  console.log('Migrated localStorage companies to DB')
                  localStorage.removeItem('customCompanies')
                  // Re-fetch to get the DB IDs
                  const refreshRes = await fetch('/api/companies?source=manual&limit=1000')
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json()
                    const refreshedCompanies: RentalCarCompany[] = (refreshData.companies || []).map((c: Record<string, unknown>) => ({
                      id: c.id as string,
                      rowNumber: 0,
                      companyName: (c.companyName as string) || '',
                      prefecture: (c.prefecture as string) || '',
                      region: (c.region as string) || '',
                      regionKo: REGION_OPTIONS.find(r => r.value === (c.region as string))?.ko || (c.region as string) || '',
                      office: (c.office as string) || 'B',
                      phone: (c.phone as string) || '',
                      contactMethod: (c.email as string) || (c.contactUrl as string) || '',
                      email: (c.email as string) || undefined,
                      contactUrl: (c.contactUrl as string) || undefined,
                      address: (c.address as string) || '',
                      status: ((c.status as string) || '未交渉') as ProgressStatus,
                      systemInUse: (c.systemInUse as string) || '',
                      contactHistory: [],
                      notes: (c.notes as string) || '',
                    }))
                    setCustomCompanies(refreshedCompanies)
                  }
                }
              }
            } catch (e) {
              console.error('Failed to migrate localStorage companies', e)
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch companies from DB', e)
    }
  }, [])

  useEffect(() => {
    fetchCustomCompanies()
  }, [fetchCustomCompanies])

  // Load imported contacts from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('importedContacts')
      if (saved) {
        try {
          setImportedContacts(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse imported contacts', e)
        }
      }
    }
  }, [])

  // Save imported contacts to localStorage
  const saveImportedContacts = (newContacts: ImportedContactRecord[]) => {
    setImportedContacts(newContacts)
    if (typeof window !== 'undefined') {
      localStorage.setItem('importedContacts', JSON.stringify(newContacts))
    }
  }

  // Fetch email blacklist
  const fetchBlacklist = useCallback(async () => {
    try {
      const res = await fetch('/api/email-blacklist')
      if (res.ok) {
        const json = await res.json()
        setEmailBlacklist(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchBlacklist()
  }, [fetchBlacklist])

  // Handle email sent - update importedContacts
  const handleEmailSent = (sentCompanies: Array<{
    companyId: string
    companyName: string
    contactDate: string
    contactType: string
  }>) => {
    const newRecords: ImportedContactRecord[] = sentCompanies.map(c => ({
      companyName: c.companyName,
      contactDate: c.contactDate,
      contactType: (c.contactType as ContactType) || 'mail',
      year: new Date(c.contactDate).getFullYear(),
      month: new Date(c.contactDate).getMonth() + 1,
      day: new Date(c.contactDate).getDate(),
    }))
    saveImportedContacts([...importedContacts, ...newRecords])
    // Refresh blacklist in case bounces were added
    fetchBlacklist()
  }

  // Open modal for new company
  const openNewCompanyModal = () => {
    setEditingCompany(null)
    setCompanyForm({
      companyName: '',
      prefecture: '',
      region: '関東',
      phone: '',
      email: '',
      hpContact: '',
      status: '未交渉',
      systemInUse: '',
      notes: '',
      lineId: '',
      instagram: '',
      twitter: '',
      facebook: '',
    })
    setShowCompanyModal(true)
  }

  // Open modal for editing company
  const openEditCompanyModal = async (company: RentalCarCompany) => {
    setEditingCompany(company)
    setCompanyForm({
      companyName: company.companyName,
      prefecture: company.prefecture,
      region: company.region,
      phone: company.phone,
      email: company.email || '',
      hpContact: company.contactUrl || '',
      status: company.status,
      systemInUse: company.systemInUse,
      notes: company.notes,
      lineId: '',
      instagram: '',
      twitter: '',
      facebook: '',
    })
    setNewContact({ date: new Date().toISOString().split('T')[0], type: 'mail', summary: '' })
    // Load contact records for this company
    if (company.id && !company.id.startsWith('custom-')) {
      try {
        const res = await fetch(`/api/companies?source=manual&search=${encodeURIComponent(company.companyName)}&limit=1`)
        if (res.ok) {
          const data = await res.json()
          const found = data.companies?.find((c: Record<string, unknown>) => c.id === company.id)
          if (found?.contactRecords) {
            setContactRecords(found.contactRecords.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              contactDate: (r.contactDate as string).split('T')[0],
              contactType: r.contactType as string,
              channel: r.channel as string | undefined,
              summary: r.summary as string | undefined,
            })))
          } else {
            setContactRecords([])
          }
        }
      } catch { setContactRecords([]) }
    } else {
      setContactRecords([])
    }
    setShowCompanyModal(true)
  }

  // Add manual contact record
  const addContactRecord = async () => {
    if (!editingCompany || !newContact.date) return
    setIsSavingContact(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-contact',
          companyId: editingCompany.id,
          contactDate: newContact.date,
          contactType: newContact.type,
          summary: newContact.summary || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setContactRecords(prev => [{
          id: data.record.id,
          contactDate: newContact.date,
          contactType: newContact.type,
          summary: newContact.summary,
        }, ...prev])
        setNewContact({ date: new Date().toISOString().split('T')[0], type: 'mail', summary: '' })
      }
    } catch { /* ignore */ }
    setIsSavingContact(false)
  }

  // Delete contact record
  const deleteContactRecord = async (recordId: string) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-contact', recordId }),
      })
      if (res.ok) {
        setContactRecords(prev => prev.filter(r => r.id !== recordId))
      }
    } catch { /* ignore */ }
  }

  // Save company (create or update) via DB API
  const saveCompany = async () => {
    const regionInfo = REGION_OPTIONS.find(r => r.value === companyForm.region)

    try {
      if (editingCompany && !editingCompany.id.startsWith('custom-') && editingCompany.rowNumber > 0) {
        // Google Sheets company → create new DB entry as manual override
        const existing = customCompanies.find(c => c.id === editingCompany.id)
        if (existing) {
          // Already overridden → update DB entry
          await fetch('/api/companies', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existing.id,
              companyName: companyForm.companyName,
              prefecture: companyForm.prefecture,
              region: companyForm.region,
              office: regionInfo?.office || 'B',
              phone: companyForm.phone,
              email: companyForm.email || null,
              contactUrl: companyForm.hpContact || null,
              status: companyForm.status,
              systemInUse: companyForm.systemInUse,
              notes: companyForm.notes,
              lineId: companyForm.lineId || null,
              instagram: companyForm.instagram || null,
              twitter: companyForm.twitter || null,
              facebook: companyForm.facebook || null,
            }),
          })
        } else {
          // First override → create new DB entry
          await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: companyForm.companyName,
              prefecture: companyForm.prefecture,
              region: companyForm.region,
              office: regionInfo?.office || 'B',
              phone: companyForm.phone,
              email: companyForm.email || null,
              contactUrl: companyForm.hpContact || null,
              status: companyForm.status,
              systemInUse: companyForm.systemInUse,
              notes: companyForm.notes,
              source: 'manual',
              sourceDetail: `sheets-override:${editingCompany.id}`,
              lineId: companyForm.lineId || null,
              instagram: companyForm.instagram || null,
              twitter: companyForm.twitter || null,
              facebook: companyForm.facebook || null,
            }),
          })
        }
      } else if (editingCompany) {
        // DB company → update
        await fetch('/api/companies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCompany.id,
            companyName: companyForm.companyName,
            prefecture: companyForm.prefecture,
            region: companyForm.region,
            office: regionInfo?.office || 'B',
            phone: companyForm.phone,
            email: companyForm.email || null,
            contactUrl: companyForm.hpContact || null,
            status: companyForm.status,
            systemInUse: companyForm.systemInUse,
            notes: companyForm.notes,
            lineId: companyForm.lineId || null,
            instagram: companyForm.instagram || null,
            twitter: companyForm.twitter || null,
            facebook: companyForm.facebook || null,
          }),
        })
      } else {
        // Create new
        await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: companyForm.companyName,
            prefecture: companyForm.prefecture,
            region: companyForm.region,
            office: regionInfo?.office || 'B',
            phone: companyForm.phone,
            email: companyForm.email || null,
            contactUrl: companyForm.hpContact || null,
            status: companyForm.status,
            systemInUse: companyForm.systemInUse,
            notes: companyForm.notes,
            source: 'manual',
            lineId: companyForm.lineId || null,
            instagram: companyForm.instagram || null,
            twitter: companyForm.twitter || null,
            facebook: companyForm.facebook || null,
          }),
        })
      }

      // Refresh companies from DB
      await fetchCustomCompanies()
    } catch (e) {
      console.error('Failed to save company', e)
    }

    setShowCompanyModal(false)
    setEditingCompany(null)
  }

  // 빠른 상태 변경 (리스트에서 직접)
  const quickStatusChange = async (company: RentalCarCompany, newStatus: ProgressStatus) => {
    if (company.status === newStatus) return
    const regionInfo = REGION_OPTIONS.find(r => r.value === company.region)
    const office = regionInfo?.office || company.office || 'B'

    try {
      const dbCompany = customCompanies.find(c => c.id === company.id)
      if (dbCompany) {
        // DB company → update
        await fetch('/api/companies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: company.id, status: newStatus }),
        })
      } else {
        // Google Sheets company → create DB override
        await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: company.companyName,
            prefecture: company.prefecture,
            region: company.region,
            office,
            phone: company.phone,
            email: company.email || null,
            contactUrl: company.contactUrl || null,
            status: newStatus,
            systemInUse: company.systemInUse,
            notes: company.notes,
            source: 'manual',
            sourceDetail: `sheets-override:${company.id}`,
          }),
        })
      }
      await fetchCustomCompanies()
    } catch (e) {
      console.error('Failed to update status', e)
    }
  }

  // Delete company via DB API
  const deleteCompany = async (companyId: string) => {
    if (!confirm(locale === 'ja' ? 'この会社を削除しますか？' : '이 업체를 삭제하시겠습니까?')) return

    try {
      // DB company → delete from DB
      const dbCompany = customCompanies.find(c => c.id === companyId)
      if (dbCompany) {
        await fetch(`/api/companies?id=${companyId}`, { method: 'DELETE' })
      }
      // Refresh
      await fetchCustomCompanies()
    } catch (e) {
      console.error('Failed to delete company', e)
    }
  }

  // 会社から返信確認 (Email Reply Check)
  const [replyCheckLoading, setReplyCheckLoading] = useState<string | null>(null)
  const [replyCheckResult, setReplyCheckResult] = useState<{ companyId: string; hasReply: boolean; message: string } | null>(null)

  const handleCheckReply = async (company: RentalCarCompany) => {
    const email = company.email
    if (!email) return

    setReplyCheckLoading(company.id)
    setReplyCheckResult(null)
    try {
      const res = await fetch('/api/email-replies/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email }),
      })
      const data = await res.json()
      if (data.success) {
        const replyCount = data.newReplies || 0
        setReplyCheckResult({
          companyId: company.id,
          hasReply: replyCount > 0,
          message: replyCount > 0
            ? (locale === 'ja' ? `${replyCount}件の返信あり` : `${replyCount}건 회신 있음`)
            : (locale === 'ja' ? '返信なし' : '회신 없음'),
        })
      } else {
        setReplyCheckResult({
          companyId: company.id,
          hasReply: false,
          message: data.error || (locale === 'ja' ? '確認失敗' : '확인 실패'),
        })
      }
    } catch {
      setReplyCheckResult({
        companyId: company.id,
        hasReply: false,
        message: locale === 'ja' ? '確認失敗' : '확인 실패',
      })
    } finally {
      setReplyCheckLoading(null)
      setTimeout(() => setReplyCheckResult(null), 5000)
    }
  }

  // 問合せフォーム自動入力
  const [inquiryFormLoading, setInquiryFormLoading] = useState<string | null>(null)
  const [inquiryFormResult, setInquiryFormResult] = useState<{
    companyId: string
    screenshot?: string
    logId?: string
    message: string
  } | null>(null)

  const handleOpenInquiryForm = async (company: RentalCarCompany) => {
    const url = company.contactUrl
    if (!url) return

    setInquiryFormLoading(company.id)
    setInquiryFormResult(null)
    try {
      // まずテンプレートを取得
      const templateRes = await fetch('/api/inquiry-form/template')
      const templateData = await templateRes.json()
      const template = templateData.template

      // フォーム分析 + 自動入力
      const res = await fetch('/api/inquiry-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fill',
          url,
          companyId: company.id,
          template,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInquiryFormResult({
          companyId: company.id,
          screenshot: data.screenshot,
          logId: data.logId,
          message: locale === 'ja'
            ? `${data.filledFields?.length || 0}個のフィールドを入力しました`
            : `${data.filledFields?.length || 0}개 필드 입력 완료`,
        })
      } else {
        setInquiryFormResult({
          companyId: company.id,
          message: data.error || (locale === 'ja' ? '入力失敗' : '입력 실패'),
        })
      }
    } catch {
      setInquiryFormResult({
        companyId: company.id,
        message: locale === 'ja' ? 'エラーが発生しました' : '오류가 발생했습니다',
      })
    } finally {
      setInquiryFormLoading(null)
    }
  }

  // Merge companies (Google Sheets + DB manual companies)
  // contactHistoryReset이 true이면 스프레드시트의 연락이력을 무시하고 importedContacts 기반으로 연락이력 재구성
  const mergedCompanies = React.useMemo(() => {
    // DB companies override sheets companies with the same name
    // DB 오버라이드 업체는 원래 sheets 위치를 유지 (편집 후 사라지지 않도록)
    const dbByName = new Map(customCompanies.map(c => [c.companyName.toLowerCase(), c]))
    const usedDbNames = new Set<string>()

    // sheets 업체를 순회하며, DB 오버라이드가 있으면 해당 위치에 DB 버전 삽입
    const merged = companies.map(sheetsCompany => {
      const key = sheetsCompany.companyName.toLowerCase()
      const dbVersion = dbByName.get(key)
      if (dbVersion) {
        usedDbNames.add(key)
        return dbVersion
      }
      return sheetsCompany
    })

    // DB에만 있는 업체 (sheets에 없는 순수 수동 추가 업체)는 끝에 추가
    const dbOnlyCompanies = customCompanies.filter(c => !usedDbNames.has(c.companyName.toLowerCase()))
    let allCompanies = [...merged, ...dbOnlyCompanies]

    // 계약완료 업체 자동 표시 - CONTRACTED_COMPANIES에 포함된 회사는 '成約' 상태로 설정
    const contractedNamesLower = CONTRACTED_COMPANIES.map(name => name.toLowerCase())
    allCompanies = allCompanies.map(company => {
      const companyNameLower = company.companyName.toLowerCase()
      const isContracted = contractedNamesLower.some(name =>
        companyNameLower.includes(name) || name.includes(companyNameLower)
      )
      if (isContracted) {
        return { ...company, status: '成約' as ProgressStatus }
      }
      return company
    })

    // contactHistoryReset이 true이면 연락이력을 importedContacts 기반으로 재구성
    if (contactHistoryReset) {
      // importedContacts를 회사별로 그룹화
      const contactsByCompany: { [name: string]: ContactRecord[] } = {}
      for (const contact of importedContacts) {
        const key = contact.companyName
        if (!contactsByCompany[key]) {
          contactsByCompany[key] = []
        }
        contactsByCompany[key].push({
          date: contact.contactDate,
          dateStr: contact.contactDate,
          year: contact.year,
          month: contact.month,
          day: contact.day,
          contactType: contact.contactType,
        })
      }

      // 각 회사의 연락이력을 importedContacts 기반으로 교체
      allCompanies = allCompanies.map(company => {
        // 회사명으로 매칭 (정확한 매칭 또는 부분 매칭)
        const matchedContacts = contactsByCompany[company.companyName] ||
          Object.entries(contactsByCompany).find(([name]) =>
            name.includes(company.companyName) || company.companyName.includes(name)
          )?.[1] || []

        return {
          ...company,
          contactHistory: matchedContacts.sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1, a.day)
            const dateB = new Date(b.year, b.month - 1, b.day)
            return dateA.getTime() - dateB.getTime()
          }),
        }
      })
    }

    return allCompanies
  }, [companies, customCompanies, contactHistoryReset, importedContacts])

  const coldEmailTotals = React.useMemo(() => {
    const totalEmail = coldEmailRecords.reduce((sum, r) => sum + r.emailCount, 0)
    const totalInquiry = coldEmailRecords.reduce((sum, r) => sum + r.inquiryCount, 0)
    return { totalEmail, totalInquiry, total: totalEmail + totalInquiry }
  }, [coldEmailRecords])

  const formatColdEmailMonth = (month: string) => {
    const [year, m] = month.split('-')
    if (locale === 'ja') {
      return `${year}年${parseInt(m)}月`
    }
    return `${year}년 ${parseInt(m)}월`
  }

  // Pipedrive 리드 중 mergedCompanies에 없는 리드 (영업 제외 대상)
  const unmatchedPipedriveLeads = React.useMemo((): RentalCarCompany[] => {
    if (!regionData) return []

    // mergedCompanies의 회사명 Set (소문자 + 공백/기호 제거로 퍼지 매칭)
    const normalize = (name: string) => name.toLowerCase().replace(/[\s\-・()（）株式会社有限会社合同会社]/g, '')
    const mergedNames = new Set(mergedCompanies.map(c => normalize(c.companyName)))

    const unmatched: RentalCarCompany[] = []
    const allRegionStats = [...regionData.stats, regionData.unassigned]

    for (const regionStat of allRegionStats) {
      for (const lead of regionStat.leads) {
        const leadName = lead.organization || lead.title || ''
        if (!leadName) continue

        const normalizedLead = normalize(leadName)
        // mergedCompanies에 이미 있는 리드는 제외
        const isMatched = [...mergedNames].some(name =>
          name.includes(normalizedLead) || normalizedLead.includes(name)
        )
        if (isMatched) continue

        unmatched.push({
          id: `pipedrive-${lead.id}`,
          rowNumber: 0,
          companyName: leadName,
          prefecture: lead.address || '',
          phone: lead.phone || '',
          contactMethod: lead.email || '',
          email: lead.email || undefined,
          address: lead.address || '',
          status: '未交渉' as ProgressStatus,
          systemInUse: '',
          contactHistory: [],
          notes: `Pipedrive: ${lead.title}`,
          region: regionStat.region?.nameJa || '不明',
          regionKo: regionStat.region?.nameKo || '불명',
          office: regionStat.region?.areaCode || '',
        })
      }
    }

    return unmatched
  }, [regionData, mergedCompanies])

  const filteredCompanies = React.useMemo(() => {
    // 전체 리드 보기 (Pipedrive 전체): mergedCompanies + unmatchedPipedriveLeads
    if (negotiationFilter === 'all-leads') {
      return [...mergedCompanies, ...unmatchedPipedriveLeads]
    }

    const baseFiltered = mergedCompanies.filter(company => {
      // 기본 'all' 필터에서는 보류/포기 제외 (영업제외로 분류)
      if (negotiationFilter === 'all') {
        if (['保留', '失注'].includes(company.status)) return false
        if (selectedRegion && company.region !== selectedRegion) return false
        if (selectedOffice && company.office !== selectedOffice) return false
      }

      if (statusFilter !== 'all' && company.status !== statusFilter) return false

      // 교섭 상태 필터
      if (negotiationFilter === 'negotiating') {
        if (!['連絡中', '商談中', '見積提出'].includes(company.status)) return false
      } else if (negotiationFilter === 'not-negotiating') {
        if (company.status !== '未交渉') return false
      } else if (negotiationFilter === 'contracted') {
        if (company.status !== '成約') return false
      } else if (negotiationFilter === 'hold-lost') {
        if (!['保留', '失注'].includes(company.status)) return false
      }

      // 연락 횟수 필터
      if (contactCountFilter !== 'all') {
        const contactCount = company.contactHistory.length
        if (contactCountFilter === '0' && contactCount !== 0) return false
        if (contactCountFilter === '1' && contactCount !== 1) return false
        if (contactCountFilter === '2' && contactCount !== 2) return false
        if (contactCountFilter === '3' && contactCount !== 3) return false
        if (contactCountFilter === '4' && contactCount !== 4) return false
        if (contactCountFilter === '5+' && contactCount < 5) return false
      }
      return true
    })

    // 영업 제외 필터 시: 보류/포기 업체 + Pipedrive에만 있는 미매칭 리드도 포함
    if (negotiationFilter === 'hold-lost') {
      return [...baseFiltered, ...unmatchedPipedriveLeads]
    }

    return baseFiltered
  }, [mergedCompanies, unmatchedPipedriveLeads, negotiationFilter, selectedRegion, selectedOffice, statusFilter, contactCountFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRegion, selectedOffice, statusFilter, contactCountFilter, negotiationFilter])

  // mergedCompanies 기반 상태별 카운트 (DB 업체 + Google Sheets 업체 모두 포함)
  const mergedStatusBreakdown = React.useMemo(() => {
    const breakdown: { [key in ProgressStatus]?: number } = {}
    for (const company of mergedCompanies) {
      breakdown[company.status] = (breakdown[company.status] || 0) + 1
    }
    return breakdown
  }, [mergedCompanies])

  const statusPieData = stats ? Object.entries(mergedStatusBreakdown).map(([status, count]) => ({
    name: STATUS_LABELS[status as ProgressStatus]?.[locale === 'ja' ? 'ja' : 'ko'] || status,
    value: count || 0,
    color: STATUS_COLORS[status as ProgressStatus] || '#d1d5db',
  })) : []

  const officeBarData = stats ? Object.entries(stats.byOffice).map(([code, data]) => ({
    name: locale === 'ja' ? OFFICE_INFO[code]?.nameJa : OFFICE_INFO[code]?.nameKo,
    total: data.totalCompanies,
    contacted: data.contacted,
    color: OFFICE_COLORS[code],
  })) : []

  // contactRate는 contactStats에서 계산 (리셋된 연락이력 반영)

  // 연락 횟수별 통계 계산 (mergedCompanies 기준 - 리셋된 연락이력 반영)
  const contactCountStats = React.useMemo(() => {
    if (!mergedCompanies.length) return { 0: { total: 0, success: 0, noResponse: 0 }, 1: { total: 0, success: 0, noResponse: 0 }, 2: { total: 0, success: 0, noResponse: 0 }, 3: { total: 0, success: 0, noResponse: 0 }, 4: { total: 0, success: 0, noResponse: 0 }, '5+': { total: 0, success: 0, noResponse: 0 } }

    const result: { [key: string]: { total: number; success: number; noResponse: number } } = {
      0: { total: 0, success: 0, noResponse: 0 },
      1: { total: 0, success: 0, noResponse: 0 },
      2: { total: 0, success: 0, noResponse: 0 },
      3: { total: 0, success: 0, noResponse: 0 },
      4: { total: 0, success: 0, noResponse: 0 },
      '5+': { total: 0, success: 0, noResponse: 0 },
    }

    for (const company of mergedCompanies) {
      const count = company.contactHistory.length
      const key = count >= 5 ? '5+' : count.toString()
      result[key].total++

      // 교섭 = 連絡中, 商談中, 見積提出
      // 미교섭 = 未交渉, 失注, 保留, 成約(성약은 별도 처리)
      if (['連絡中', '商談中', '見積提出'].includes(company.status)) {
        result[key].success++
      } else {
        result[key].noResponse++
      }
    }

    return result
  }, [mergedCompanies])

  // 연락 관련 통계 (mergedCompanies 기준 - 리셋된 연락이력 반영)
  const contactStats = React.useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let contactedCompanies = 0
    let recentlyContacted = 0

    for (const company of mergedCompanies) {
      if (company.contactHistory.length > 0) {
        contactedCompanies++

        // 최근 30일 내 연락 확인
        const lastContact = company.contactHistory[company.contactHistory.length - 1]
        if (lastContact) {
          const lastDate = new Date(lastContact.year, lastContact.month - 1, lastContact.day)
          if (lastDate > thirtyDaysAgo) {
            recentlyContacted++
          }
        }
      }
    }

    return {
      contactedCompanies,
      neverContactedCompanies: mergedCompanies.length - contactedCompanies,
      recentlyContacted,
      contactRate: mergedCompanies.length > 0 ? Math.round((contactedCompanies / mergedCompanies.length) * 100) : 0,
    }
  }, [mergedCompanies])

  // 연락 횟수 파이 차트 데이터
  const contactCountPieData = [
    { name: locale === 'ja' ? '未連絡' : '미연락', value: contactCountStats[0].total, color: '#d1d5db' },
    { name: locale === 'ja' ? '1回' : '1회', value: contactCountStats[1].total, color: '#93c5fd' },
    { name: locale === 'ja' ? '2回' : '2회', value: contactCountStats[2].total, color: '#60a5fa' },
    { name: locale === 'ja' ? '3回' : '3회', value: contactCountStats[3].total, color: '#3b82f6' },
    { name: locale === 'ja' ? '4回' : '4회', value: contactCountStats[4].total, color: '#2563eb' },
    { name: locale === 'ja' ? '5回以上' : '5회 이상', value: contactCountStats['5+'].total, color: '#1d4ed8' },
  ].filter(d => d.value > 0)

  // 연락 시도 통계 (년도별, 월별) - importedContacts 기준으로 계산
  const contactAttemptStats = React.useMemo(() => {
    // 월별 메일/문의 구분 데이터 구조
    const createMonthlyByType = () => Array(12).fill(null).map(() => ({ mail: 0, inquiry: 0 }))

    const yearlyStats: { [year: number]: { monthly: number[]; monthlyByType: { mail: number; inquiry: number }[]; total: number; byType: { mail: number; inquiry: number } } } = {
      2024: { monthly: Array(12).fill(0), monthlyByType: createMonthlyByType(), total: 0, byType: { mail: 0, inquiry: 0 } },
      2025: { monthly: Array(12).fill(0), monthlyByType: createMonthlyByType(), total: 0, byType: { mail: 0, inquiry: 0 } },
      2026: { monthly: Array(12).fill(0), monthlyByType: createMonthlyByType(), total: 0, byType: { mail: 0, inquiry: 0 } },
    }

    // 년도별 지역/오피스 통계
    const regionStatsByYear: { [year: number]: { [region: string]: number } } = {
      2024: {},
      2025: {},
      2026: {},
    }
    const officeStatsByYear: { [year: number]: { [office: string]: number } } = {
      2024: {},
      2025: {},
      2026: {},
    }

    // importedContacts 기반으로 계산
    for (const contact of importedContacts) {
      const year = contact.year
      const month = contact.month - 1 // 0-indexed

      if (year >= 2024 && year <= 2026 && yearlyStats[year]) {
        yearlyStats[year].monthly[month]++
        yearlyStats[year].total++

        // 연락 방법별 통계 (전체 + 월별)
        if (contact.contactType === 'mail') {
          yearlyStats[year].byType.mail++
          yearlyStats[year].monthlyByType[month].mail++
        } else if (contact.contactType === 'inquiry') {
          yearlyStats[year].byType.inquiry++
          yearlyStats[year].monthlyByType[month].inquiry++
        }

        // 회사 정보 찾기
        const company = mergedCompanies.find(c =>
          c.companyName === contact.companyName ||
          c.companyName.includes(contact.companyName) ||
          contact.companyName.includes(c.companyName)
        )

        if (company) {
          // 년도별 Region stats
          const regionKey = company.region
          regionStatsByYear[year][regionKey] = (regionStatsByYear[year][regionKey] || 0) + 1

          // 년도별 Office stats
          const officeKey = company.office
          officeStatsByYear[year][officeKey] = (officeStatsByYear[year][officeKey] || 0) + 1
        }
      }
    }

    return { yearlyStats, regionStatsByYear, officeStatsByYear }
  }, [importedContacts, mergedCompanies])

  // 연락 시도 차트 데이터 (메일/문의 구분)
  const contactAttemptChartData = React.useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return months.map((month, i) => ({
      month: locale === 'ja' ? month : `${i + 1}월`,
      '2024_mail': contactAttemptStats.yearlyStats[2024]?.monthlyByType?.[i]?.mail || 0,
      '2024_inquiry': contactAttemptStats.yearlyStats[2024]?.monthlyByType?.[i]?.inquiry || 0,
      '2025_mail': contactAttemptStats.yearlyStats[2025]?.monthlyByType?.[i]?.mail || 0,
      '2025_inquiry': contactAttemptStats.yearlyStats[2025]?.monthlyByType?.[i]?.inquiry || 0,
      '2026_mail': contactAttemptStats.yearlyStats[2026]?.monthlyByType?.[i]?.mail || 0,
      '2026_inquiry': contactAttemptStats.yearlyStats[2026]?.monthlyByType?.[i]?.inquiry || 0,
    }))
  }, [contactAttemptStats, locale])

  // 지역별 연락 통계 차트 데이터 (년도 필터 적용)
  const regionContactChartData = React.useMemo(() => {
    let stats: { [region: string]: number } = {}

    if (contactStatsYearFilter === 'all') {
      // 2024 + 2025 + 2026 합산
      const stats2024 = contactAttemptStats.regionStatsByYear[2024] || {}
      const stats2025 = contactAttemptStats.regionStatsByYear[2025] || {}
      const stats2026 = contactAttemptStats.regionStatsByYear[2026] || {}
      stats = { ...stats2026 }
      Object.entries(stats2025).forEach(([region, count]) => {
        stats[region] = (stats[region] || 0) + count
      })
      Object.entries(stats2024).forEach(([region, count]) => {
        stats[region] = (stats[region] || 0) + count
      })
    } else {
      stats = contactAttemptStats.regionStatsByYear[contactStatsYearFilter] || {}
    }

    return Object.entries(stats)
      .map(([region, count]) => ({
        region: locale === 'ja' ? region : (REGION_OPTIONS.find(r => r.value === region)?.ko || region),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [contactAttemptStats, contactStatsYearFilter, locale])

  // 관할구역별 연락 통계 차트 데이터 (년도 필터 적용)
  const officeContactChartData = React.useMemo(() => {
    let stats: { [office: string]: number } = {}

    if (contactStatsYearFilter === 'all') {
      // 2024 + 2025 + 2026 합산
      const stats2024 = contactAttemptStats.officeStatsByYear[2024] || {}
      const stats2025 = contactAttemptStats.officeStatsByYear[2025] || {}
      const stats2026 = contactAttemptStats.officeStatsByYear[2026] || {}
      stats = { ...stats2026 }
      Object.entries(stats2025).forEach(([office, count]) => {
        stats[office] = (stats[office] || 0) + count
      })
      Object.entries(stats2024).forEach(([office, count]) => {
        stats[office] = (stats[office] || 0) + count
      })
    } else {
      stats = contactAttemptStats.officeStatsByYear[contactStatsYearFilter] || {}
    }

    return Object.entries(stats)
      .map(([office, count]) => ({
        office: locale === 'ja' ? OFFICE_INFO[office]?.nameJa : OFFICE_INFO[office]?.nameKo,
        count,
        color: OFFICE_COLORS[office] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count)
  }, [contactAttemptStats, contactStatsYearFilter, locale])

  // Pipedrive 총 리드 수
  const totalPipedriveLeads = regionData
    ? regionData.stats.reduce((sum, r) => sum + r.count, 0) + regionData.unassigned.count
    : 0

  // 유효 리드 수 (보류/실주 제외)
  const validLeadCount = mergedCompanies.length - (mergedStatusBreakdown['保留'] || 0) - (mergedStatusBreakdown['失注'] || 0)
  // 영업 제외 수 = 총 리드(Pipedrive) - 유효 리드
  const excludedLeads = Math.max(0, totalPipedriveLeads - validLeadCount)
  // 보류/실주 추적 건수 (시트에 기록된 것)
  const trackedExcluded = (mergedStatusBreakdown['保留'] || 0) + (mergedStatusBreakdown['失注'] || 0)

  // =======================================
  // Effects
  // =======================================
  useEffect(() => {
    fetchPipedriveData()
    fetchSalesData(true)
  }, [])

  // Load cold email data when month changes
  useEffect(() => {
    loadColdEmailData(coldEmailMonth)
  }, [coldEmailMonth])

  const pipedriveOffices = regionData ? groupByOffice(regionData.stats) : []
  const selectedPipedriveOfficeData = pipedriveOffices.find(o => o.code === selectedPipedriveOffice)
  const selectedPipedriveRegionData = selectedPipedriveRegion === 'UNKNOWN'
    ? regionData?.unassigned
    : regionData?.stats.find(s => s.region.code === selectedPipedriveRegion)

  // =======================================
  // Render
  // =======================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            {locale === 'ja' ? '営業進捗管理' : '영업 진척 관리'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'contacts' && (
            <a
              href="https://docs.google.com/spreadsheets/d/1DmsvdcknuIXETeBj72ewSefwjJ8fKb6ROAl3dS5JJmg/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {locale === 'ja' ? 'Sheets を開く' : 'Sheets 열기'}
            </a>
          )}
          <button
            onClick={() => activeTab === 'pipedrive' ? fetchPipedriveData() : fetchSalesData(true)}
            disabled={activeTab === 'pipedrive' ? pipedriveLoading : salesLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(activeTab === 'pipedrive' ? pipedriveLoading : salesLoading) ? 'animate-spin' : ''}`} />
            {locale === 'ja' ? '更新' : '새로고침'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pipedrive')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pipedrive'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {locale === 'ja' ? 'Pipedrive リード' : 'Pipedrive 리드'}
              <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded">
                {locale === 'ja' ? '暫定' : '임시'}
              </span>
              {regionData && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {regionData.total}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'contacts'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              {locale === 'ja' ? 'コンタクトリスト' : '컨택 리스트'}
              {validLeadCount > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {validLeadCount.toLocaleString()}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cold-email')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'cold-email'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {locale === 'ja' ? 'コールドメール' : '콜드메일'}
              {coldEmailTotals.total > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                  {coldEmailTotals.total}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bulk-email')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'bulk-email'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {locale === 'ja' ? '一括メール送信' : '일괄 메일 발송'}
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'pipedrive' ? (
        // =======================================
        // Pipedrive Tab (Unified with Contact List Style)
        // =======================================
        <>
          {pipedriveError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                {locale === 'ja' ? 'Pipedrive接続エラー' : 'Pipedrive 연결 오류'}
              </h2>
              <p className="text-red-600 mb-4">{pipedriveError}</p>
              <div className="text-sm text-gray-600 bg-gray-100 rounded p-4 text-left max-w-md mx-auto">
                <p className="font-medium mb-2">{locale === 'ja' ? '設定方法:' : '설정 방법:'}</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>{locale === 'ja' ? 'Pipedriveにログイン' : 'Pipedrive 로그인'}</li>
                  <li>{locale === 'ja' ? '設定 → 個人設定 → API' : '설정 → 개인 설정 → API'}</li>
                  <li>{locale === 'ja' ? 'APIトークンをコピー' : 'API 토큰 복사'}</li>
                  <li>{locale === 'ja' ? '.envファイルに追加:' : '.env 파일에 추가:'}</li>
                </ol>
                <code className="block mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs">
                  PIPEDRIVE_API_TOKEN=your_token_here
                </code>
              </div>
              <button
                onClick={fetchPipedriveData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {locale === 'ja' ? '再試行' : '다시 시도'}
              </button>
            </div>
          ) : pipedriveLoading && !regionData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : regionData ? (
            <>
              {/* Statistics Cards */}
              <div className="space-y-4">
                {/* 1. 리드 섹션 */}
                <div className="card">
                  <div className="card-header py-2">
                    <h3 className="card-title text-sm font-semibold">{locale === 'ja' ? '1. Pipedriveリード概要' : '1. Pipedrive 리드 개요'}</h3>
                  </div>
                  <div className="card-body py-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">{locale === 'ja' ? '総リード' : '총 리드'}</p>
                        <p className="text-2xl font-bold text-blue-600">{regionData.total.toLocaleString()}</p>
                        <p className="text-xs text-blue-400">Pipedrive</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">{locale === 'ja' ? '地域特定済み' : '지역 특정됨'}</p>
                        <p className="text-2xl font-bold text-green-600">{regionData.stats.reduce((sum, r) => sum + r.count, 0).toLocaleString()}</p>
                        <p className="text-xs text-green-400">{Math.round((regionData.stats.reduce((sum, r) => sum + r.count, 0) / regionData.total) * 100)}%</p>
                      </div>
                      <div className="text-center p-3 bg-gray-100 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{locale === 'ja' ? '未指定' : '미지정'}</p>
                        <p className="text-2xl font-bold text-gray-500">{regionData.unassigned.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{locale === 'ja' ? '住所未登録' : '주소 미등록'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 사무소별 통계 */}
                <div className="card">
                  <div className="card-header py-2">
                    <h3 className="card-title text-sm font-semibold">{locale === 'ja' ? '2. オフィス別リード数' : '2. 사무소별 리드 수'}</h3>
                  </div>
                  <div className="card-body py-3">
                    <div className="grid grid-cols-5 gap-2">
                      {pipedriveOffices.map((office) => (
                        <div key={office.code} className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: office.color }} />
                            <p className="text-xs text-gray-500">{locale === 'ja' ? office.nameJa : office.nameKo}</p>
                          </div>
                          <p className="text-lg font-bold" style={{ color: office.color }}>{office.totalCount}</p>
                          <p className="text-xs text-gray-400">{office.regions.length}{locale === 'ja' ? '地域' : '지역'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts - Side by Side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Office Distribution Pie */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      {locale === 'ja' ? 'オフィス別分布' : '사무소별 분포'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pipedriveOffices.map(o => ({ name: locale === 'ja' ? o.nameJa : o.nameKo, value: o.totalCount, color: o.color }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pipedriveOffices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number | undefined) => [`${value ?? 0}${locale === 'ja' ? '件' : '건'}`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Office Bar Chart */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      {locale === 'ja' ? 'オフィス別リード数' : '사무소별 리드 수'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pipedriveOffices} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey={(d) => locale === 'ja' ? d.nameJa : d.nameKo} tick={{ fontSize: 11 }} width={80} />
                          <Tooltip formatter={(value: number | undefined) => [`${value ?? 0}${locale === 'ja' ? '件' : '건'}`, locale === 'ja' ? 'リード数' : '리드 수']} />
                          <Bar dataKey="totalCount" radius={[0, 4, 4, 0]}>
                            {pipedriveOffices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office/Region Expandable List */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {locale === 'ja' ? '管轄オフィス・地域別詳細' : '관할 사무소/지역별 상세'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedPipedriveOffices(new Set(pipedriveOffices.map(o => o.code)))}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ja' ? 'すべて展開' : '모두 펼치기'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setExpandedPipedriveOffices(new Set())}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ja' ? 'すべて折りたたむ' : '모두 접기'}
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  {pipedriveOffices.map((office) => {
                    const isExpanded = expandedPipedriveOffices.has(office.code)
                    const officePercent = Math.round((office.totalCount / regionData.total) * 100)

                    return (
                      <div key={office.code} className="border-b border-gray-100 last:border-b-0">
                        {/* Office Header */}
                        <div
                          onClick={() => togglePipedriveOffice(office.code)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: office.color }} />
                            <div>
                              <span className="font-medium text-gray-900">
                                {locale === 'ja' ? office.nameJa : office.nameKo}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({office.regions.length} {locale === 'ja' ? '地域' : '지역'})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="text-lg font-bold text-gray-900">{office.totalCount}</span>
                              <span className="text-sm text-gray-500 ml-1">{locale === 'ja' ? '件' : '건'}</span>
                            </div>
                            <div className="w-32">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${officePercent}%`, backgroundColor: office.color }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-10">{officePercent}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Region List */}
                        {isExpanded && (
                          <div className="bg-gray-50 px-4 py-2">
                            {office.regions
                              .sort((a, b) => b.count - a.count)
                              .map(region => {
                                const regionPercent = Math.round((region.count / office.totalCount) * 100)
                                return (
                                  <div
                                    key={region.region.code}
                                    onClick={() => {
                                      setSelectedPipedriveRegion(region.region.code)
                                      setSelectedPipedriveOffice(office.code)
                                      setShowPipedriveLeadList(true)
                                    }}
                                    className="flex items-center justify-between py-2 px-4 hover:bg-white rounded cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: region.region.color }} />
                                      <span className="text-gray-700">
                                        {locale === 'ja' ? region.region.nameJa : region.region.nameKo}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-600">
                                        {region.count} {locale === 'ja' ? '件' : '건'}
                                      </span>
                                      <span className="text-xs text-gray-400">{regionPercent}%</span>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {/* Unassigned Section */}
                  {regionData.unassigned.count > 0 && (
                    <div className="border-b border-gray-100 last:border-b-0">
                      <div
                        onClick={() => {
                          setSelectedPipedriveRegion('UNKNOWN')
                          setSelectedPipedriveOffice(null)
                          setShowPipedriveLeadList(true)
                        }}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-600">
                            {locale === 'ja' ? '未指定 (住所未登録)' : '미지정 (주소 미등록)'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-500">{regionData.unassigned.count}</span>
                          <span className="text-sm text-gray-400 ml-1">{locale === 'ja' ? '件' : '건'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead List Table */}
              {showPipedriveLeadList && selectedPipedriveRegionData && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {selectedPipedriveRegion === 'UNKNOWN'
                        ? (locale === 'ja' ? '未指定リード' : '미지정 리드')
                        : `${locale === 'ja' ? selectedPipedriveRegionData.region.nameJa : selectedPipedriveRegionData.region.nameKo} ${locale === 'ja' ? 'リード一覧' : '리드 목록'}`
                      }
                      <span className="text-sm font-normal text-gray-500">
                        ({selectedPipedriveRegionData.count}{locale === 'ja' ? '件' : '건'})
                      </span>
                    </h3>
                    <button
                      onClick={() => {
                        setShowPipedriveLeadList(false)
                        setSelectedPipedriveRegion(null)
                        setSelectedPipedriveOffice(null)
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ✕ {locale === 'ja' ? '閉じる' : '닫기'}
                    </button>
                  </div>
                  <div className="card-body p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '組織' : '조직'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '状態' : '상태'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '住所' : '주소'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '電話番号' : '전화번호'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? 'メール' : '이메일'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? 'HP問合せ' : 'HP 문의'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '登録日' : '등록일'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedPipedriveRegionData.leads.slice(0, 50).map((lead) => {
                            // 리드 타이틀에서 상태 태그 추출 (※ 또는 * 뒤의 텍스트)
                            const statusMatch = lead.title.match(/[※\*](.+)$/)
                            const statusTag = statusMatch ? statusMatch[1].trim() : null
                            const cleanTitle = lead.title.replace(/[※\*].+$/, '').trim()

                            // 상태 색상 매핑
                            const getStatusColor = (status: string | null) => {
                              if (!status) return null
                              if (status.includes('保留') || status.includes('보류')) return { bg: '#fef3c7', text: '#d97706' }
                              if (status.includes('連絡先不明') || status.includes('연락처')) return { bg: '#fee2e2', text: '#dc2626' }
                              if (status.includes('成約') || status.includes('성약')) return { bg: '#dcfce7', text: '#16a34a' }
                              if (status.includes('商談') || status.includes('상담')) return { bg: '#dbeafe', text: '#2563eb' }
                              return { bg: '#f3f4f6', text: '#6b7280' }
                            }
                            const statusColor = getStatusColor(statusTag)

                            return (
                              <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{lead.organization || cleanTitle}</div>
                                  {lead.organization && cleanTitle !== lead.organization && (
                                    <div className="text-xs text-gray-400">{cleanTitle}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {statusTag ? (
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                      style={{ backgroundColor: statusColor?.bg, color: statusColor?.text }}
                                    >
                                      {statusTag}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">
                                    {lead.address || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {lead.phone ? (
                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                      <Phone className="w-3 h-3" />
                                      {lead.phone}
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {lead.email ? (
                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                      <Mail className="w-3 h-3" />
                                      {lead.email.length > 20 ? lead.email.slice(0, 20) + '...' : lead.email}
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-gray-400">-</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-500">{formatDate(lead.add_time)}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {selectedPipedriveRegionData.leads.length > 50 && (
                      <div className="px-4 py-3 text-center text-sm text-gray-500 border-t">
                        {locale === 'ja'
                          ? `他 ${selectedPipedriveRegionData.leads.length - 50}件`
                          : `외 ${selectedPipedriveRegionData.leads.length - 50}건`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Pipedrive {locale === 'ja' ? '連動' : '연동'}:</strong>{' '}
                  {locale === 'ja'
                    ? 'データはPipedrive APIからリアルタイムで取得されます。地域をクリックするとリード一覧が表示されます。'
                    : '데이터는 Pipedrive API에서 실시간으로 가져옵니다. 지역을 클릭하면 리드 목록이 표시됩니다.'
                  }
                </p>
              </div>
            </>
          ) : null}
        </>
      ) : activeTab === 'contacts' ? (
        // =======================================
        // Contacts Tab (Google Sheets)
        // =======================================
        <>
          {salesLoading && !stats ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : salesError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
              <p className="text-red-600">{salesError}</p>
              <button
                onClick={() => fetchSalesData(true)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {locale === 'ja' ? '再試行' : '다시 시도'}
              </button>
            </div>
          ) : stats ? (
            <>
              {/* Statistics Cards - New Structure */}
              <div className="space-y-4">
                {/* 1. 리드 현황 - 1행 구조 */}
                <div className="card">
                  <div className="card-header py-2">
                    <h3 className="card-title text-sm font-semibold">{locale === 'ja' ? '1. リード現況' : '1. 리드 현황'}</h3>
                  </div>
                  <div className="card-body py-3">
                    <div className="flex items-stretch gap-4">
                      {/* 총 리드 */}
                      <div
                        onClick={() => {
                          setNegotiationFilter('all-leads')
                          setSelectedRegion(null)
                          setSelectedOffice(null)
                          setShowCompanyList(true)
                        }}
                        className={`flex-shrink-0 text-center p-4 rounded-lg min-w-[140px] cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 ${
                          negotiationFilter === 'all-leads' ? 'bg-gray-200 ring-2 ring-gray-500' : 'bg-gray-50'
                        }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">{locale === 'ja' ? '総リード' : '총 리드'}</p>
                        <p className="text-3xl font-bold text-gray-700">{totalPipedriveLeads.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Pipedrive</p>
                      </div>

                      {/* 화살표 */}
                      <div className="flex items-center text-gray-300 text-2xl">=</div>

                      {/* 유효 리드 (교섭중 + 미교섭) - 보류/실주 제외 */}
                      <div className="flex-1 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-blue-600 font-medium">{locale === 'ja' ? '有効リード' : '유효 리드'}</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {validLeadCount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {/* 교섭 중 */}
                          <div
                            onClick={() => {
                              setNegotiationFilter('negotiating')
                              setSelectedRegion(null)
                              setSelectedOffice(null)
                              setShowCompanyList(true)
                            }}
                            className={`flex-1 text-center p-2 rounded cursor-pointer transition-all hover:ring-2 hover:ring-green-400 ${
                              negotiationFilter === 'negotiating' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-green-50'
                            }`}
                          >
                            <p className="text-[10px] text-green-600">{locale === 'ja' ? '交渉中' : '교섭중'}</p>
                            <p className="text-lg font-bold text-green-600">
                              {((mergedStatusBreakdown['連絡中'] || 0) + (mergedStatusBreakdown['商談中'] || 0) + (mergedStatusBreakdown['見積提出'] || 0)).toLocaleString()}
                            </p>
                          </div>
                          {/* 미교섭 */}
                          <div
                            onClick={() => {
                              setNegotiationFilter('not-negotiating')
                              setSelectedRegion(null)
                              setSelectedOffice(null)
                              setShowCompanyList(true)
                            }}
                            className={`flex-1 text-center p-2 rounded cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 ${
                              negotiationFilter === 'not-negotiating' ? 'bg-gray-200 ring-2 ring-gray-500' : 'bg-white'
                            }`}
                          >
                            <p className="text-[10px] text-gray-600">{locale === 'ja' ? '未交渉' : '미교섭'}</p>
                            <p className="text-lg font-bold text-gray-600">
                              {(mergedStatusBreakdown['未交渉'] || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 더하기 기호 */}
                      <div className="flex items-center text-gray-300 text-2xl">+</div>

                      {/* 영업 제외 */}
                      <div
                        onClick={() => {
                          setNegotiationFilter('hold-lost')
                          setSelectedRegion(null)
                          setSelectedOffice(null)
                          setShowCompanyList(true)
                        }}
                        className={`flex-shrink-0 text-center p-4 rounded-lg min-w-[140px] cursor-pointer transition-all hover:ring-2 hover:ring-red-400 ${
                          negotiationFilter === 'hold-lost' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-red-50'
                        }`}
                      >
                        <p className="text-xs text-red-500 mb-1">{locale === 'ja' ? '営業除外' : '영업 제외'}</p>
                        <p className="text-3xl font-bold text-red-500">
                          {excludedLeads.toLocaleString()}
                        </p>
                        <p className="text-xs text-red-400">
                          {locale === 'ja'
                            ? `保留・失注 ${trackedExcluded}件`
                            : `보류·포기 ${trackedExcluded}건`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 오피스별 리드 수 (Pipedrive 기준) */}
                <div className="card">
                  <div className="card-header py-2">
                    <div className="flex items-center justify-between">
                      <h3 className="card-title text-sm font-semibold">{locale === 'ja' ? '2. オフィス別リード数' : '2. 오피스별 리드 수'}</h3>
                      <span className="text-xs text-gray-500">
                        {locale === 'ja' ? '総リード' : '총 리드'}: {totalPipedriveLeads.toLocaleString()} (Pipedrive)
                      </span>
                    </div>
                  </div>
                  <div className="card-body py-3">
                    <div className="grid grid-cols-5 gap-3">
                      {pipedriveOffices.map((office) => {
                        const validLeads = stats.byOffice?.[office.code]?.totalCompanies || 0
                        const pipedriveTotal = office.totalCount
                        const excluded = Math.max(0, pipedriveTotal - validLeads)
                        return (
                          <div key={office.code} className="p-3 bg-white border border-gray-100 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: office.color }}
                              />
                              <p className="text-xs text-gray-500">
                                {locale === 'ja' ? office.nameJa : office.nameKo}
                              </p>
                            </div>
                            {/* Pipedrive 총 리드 */}
                            <p className="text-2xl font-bold text-center" style={{ color: office.color }}>
                              {pipedriveTotal.toLocaleString()}
                            </p>
                            {/* 유효/제외 breakdown */}
                            <div className="flex justify-center gap-2 mt-2 text-[10px]">
                              <span className="text-blue-600">
                                {locale === 'ja' ? '有効' : '유효'} {validLeads}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-red-400">
                                {locale === 'ja' ? '除外' : '제외'} {excluded}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. 유효리드 연락 현황 & 최근 30일 연락 */}
                <div className="grid grid-cols-3 gap-4">
                  {/* 3. 유효리드 연락 현황 (왼쪽 2/3) */}
                  <div className="col-span-2 card">
                    <div className="card-header py-2">
                      <h3 className="card-title text-sm font-semibold">{locale === 'ja' ? '3. 有効リード連絡状況' : '3. 유효리드 연락 현황'}</h3>
                    </div>
                    <div className="card-body py-3">
                      <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, '5+'].map((count) => {
                          const data = contactCountStats[count.toString()]
                          const label = count === 0
                            ? (locale === 'ja' ? '未連絡' : '미연락')
                            : count === '5+'
                              ? (locale === 'ja' ? '5回以上' : '5회 이상')
                              : (locale === 'ja' ? `${count}回` : `${count}회`)
                          return (
                            <div key={count} className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">{label}</p>
                              <p className="text-lg font-bold text-gray-700">{data.total}</p>
                              <div className="text-xs mt-1 space-y-0.5">
                                <p className="text-green-600">{locale === 'ja' ? '交渉' : '교섭'} {data.success}</p>
                                <p className="text-gray-400">{locale === 'ja' ? '無応答' : '무응답'} {data.noResponse}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 4. 최근 30일 연락 (오른쪽 1/3) */}
                  <div className="card">
                    <div className="card-header py-2">
                      <h3 className="card-title text-sm font-semibold">{locale === 'ja' ? '4. 最近30日連絡' : '4. 최근 30일 연락'}</h3>
                    </div>
                    <div className="card-body py-3">
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-blue-600">{contactStats.recentlyContacted}</p>
                          <p className="text-xs text-gray-500 mt-1">{locale === 'ja' ? 'アクティブ営業' : '활성 영업'}</p>
                        </div>
                        <div className="text-center text-sm text-gray-500 mt-3">
                          <p>{locale === 'ja' ? '連絡率' : '연락률'}: <span className="font-semibold text-blue-600">{contactStats.contactRate}%</span></p>
                          <p>{locale === 'ja' ? '連絡済み' : '연락 완료'}: <span className="font-semibold">{contactStats.contactedCompanies}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-6">
                {/* Contact Count Distribution (연락 횟수 분포) */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      {locale === 'ja' ? '連絡回数分布' : '연락 횟수 분포'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={contactCountPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {contactCountPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number | undefined) => [`${value ?? 0}${locale === 'ja' ? '件' : '건'}`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Office Status */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      {locale === 'ja' ? 'オフィス別状況' : '사무소별 현황'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={officeBarData} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip
                            formatter={(value: number | undefined, name: string | undefined) => [
                              `${value ?? 0}${locale === 'ja' ? '件' : '건'}`,
                              name === 'total' ? (locale === 'ja' ? '総数' : '총수') : (locale === 'ja' ? '連絡済み' : '연락 완료'),
                            ]}
                          />
                          <Bar dataKey="total" fill="#e5e7eb" name="total" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="contacted" fill="#3b82f6" name="contacted" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Attempt Statistics */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    {locale === 'ja' ? '連絡試行統計' : '연락 시도 통계'}
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* 년도 필터 버튼 */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setContactStatsYearFilter('all')}
                        className={`px-3 py-1 text-xs rounded ${
                          contactStatsYearFilter === 'all'
                            ? 'bg-white shadow text-gray-900 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {locale === 'ja' ? '全期間' : '전체'}
                      </button>
                      <button
                        onClick={() => setContactStatsYearFilter(2024)}
                        className={`px-3 py-1 text-xs rounded ${
                          contactStatsYearFilter === 2024
                            ? 'bg-purple-500 text-white font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        2024
                      </button>
                      <button
                        onClick={() => setContactStatsYearFilter(2025)}
                        className={`px-3 py-1 text-xs rounded ${
                          contactStatsYearFilter === 2025
                            ? 'bg-blue-500 text-white font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        2025
                      </button>
                      <button
                        onClick={() => setContactStatsYearFilter(2026)}
                        className={`px-3 py-1 text-xs rounded ${
                          contactStatsYearFilter === 2026
                            ? 'bg-green-500 text-white font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        2026
                      </button>
                    </div>
                    {/* 년도별 총계 - 메일/문의 구분 (같은 행) */}
                    <div className="flex items-center gap-4 text-sm flex-nowrap">
                      <span className="text-purple-600 font-semibold whitespace-nowrap">2024: {contactAttemptStats.yearlyStats[2024]?.total || 0}{locale === 'ja' ? '回' : '회'} <span className="text-xs text-gray-500">([{CONTACT_TYPE_LABELS.mail[locale]}]{contactAttemptStats.yearlyStats[2024]?.byType.mail || 0}+[{CONTACT_TYPE_LABELS.inquiry[locale]}]{contactAttemptStats.yearlyStats[2024]?.byType.inquiry || 0})</span></span>
                      <span className="text-blue-600 font-semibold whitespace-nowrap">2025: {contactAttemptStats.yearlyStats[2025]?.total || 0}{locale === 'ja' ? '回' : '회'} <span className="text-xs text-gray-500">([{CONTACT_TYPE_LABELS.mail[locale]}]{contactAttemptStats.yearlyStats[2025]?.byType.mail || 0}+[{CONTACT_TYPE_LABELS.inquiry[locale]}]{contactAttemptStats.yearlyStats[2025]?.byType.inquiry || 0})</span></span>
                      <span className="text-green-600 font-semibold whitespace-nowrap">2026: {contactAttemptStats.yearlyStats[2026]?.total || 0}{locale === 'ja' ? '回' : '회'} <span className="text-xs text-gray-500">([{CONTACT_TYPE_LABELS.mail[locale]}]{contactAttemptStats.yearlyStats[2026]?.byType.mail || 0}+[{CONTACT_TYPE_LABELS.inquiry[locale]}]{contactAttemptStats.yearlyStats[2026]?.byType.inquiry || 0})</span></span>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* Monthly Chart */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {locale === 'ja' ? '月別連絡回数' : '월별 연락 횟수'}
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={contactAttemptChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: number | undefined, name: string | undefined) => {
                              const n = name ?? ''
                              const typeLabel = n.includes('mail')
                                ? (locale === 'ja' ? 'メール' : '메일')
                                : (locale === 'ja' ? '問合せ' : '문의')
                              const year = n.split('_')[0]
                              return [`${value ?? 0}${locale === 'ja' ? '回' : '회'}`, `${year} ${typeLabel}`]
                            }}
                          />
                          {/* 2024: 보라색 계열 (진한색=메일, 연한색=문의) */}
                          <Bar dataKey="2024_mail" stackId="2024" fill="#7c3aed" name="2024_mail" />
                          <Bar dataKey="2024_inquiry" stackId="2024" fill="#c4b5fd" name="2024_inquiry" radius={[2, 2, 0, 0]} />
                          {/* 2025: 파란색 계열 (진한색=메일, 연한색=문의) */}
                          <Bar dataKey="2025_mail" stackId="2025" fill="#2563eb" name="2025_mail" />
                          <Bar dataKey="2025_inquiry" stackId="2025" fill="#93c5fd" name="2025_inquiry" radius={[2, 2, 0, 0]} />
                          {/* 2026: 초록색 계열 (진한색=메일, 연한색=문의) */}
                          <Bar dataKey="2026_mail" stackId="2026" fill="#16a34a" name="2026_mail" />
                          <Bar dataKey="2026_inquiry" stackId="2026" fill="#86efac" name="2026_inquiry" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs">
                      {/* 2024 */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-700">2024:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7c3aed' }} />
                          <span>{locale === 'ja' ? 'メール' : '메일'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c4b5fd' }} />
                          <span>{locale === 'ja' ? '問合せ' : '문의'}</span>
                        </div>
                      </div>
                      {/* 2025 */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-700">2025:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2563eb' }} />
                          <span>{locale === 'ja' ? 'メール' : '메일'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#93c5fd' }} />
                          <span>{locale === 'ja' ? '問合せ' : '문의'}</span>
                        </div>
                      </div>
                      {/* 2026 */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-700">2026:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#16a34a' }} />
                          <span>{locale === 'ja' ? 'メール' : '메일'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#86efac' }} />
                          <span>{locale === 'ja' ? '問合せ' : '문의'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Region & Office Breakdown */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* By Region */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {locale === 'ja' ? '地域別連絡回数 (Top 10)' : '지역별 연락 횟수 (상위 10)'}
                      </h4>
                      <div className="space-y-2">
                        {regionContactChartData.map((item, idx) => {
                          const maxCount = regionContactChartData[0]?.count || 1
                          const percentage = Math.round((item.count / maxCount) * 100)
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-24 truncate">{item.region}</span>
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-10 text-right">{item.count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* By Office */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {locale === 'ja' ? '管轄オフィス別連絡回数' : '관할구역별 연락 횟수'}
                      </h4>
                      <div className="space-y-2">
                        {officeContactChartData.map((item, idx) => {
                          const maxCount = officeContactChartData[0]?.count || 1
                          const percentage = Math.round((item.count / maxCount) * 100)
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-24 truncate">{item.office}</span>
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-10 text-right">{item.count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Region Details */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {locale === 'ja' ? '管轄オフィス・地域別詳細' : '관할 사무소/지역별 상세'}
                    <span className="text-sm font-normal text-gray-500">
                      {locale === 'ja'
                        ? `総 ${totalPipedriveLeads.toLocaleString()}件 / 有効リード ${validLeadCount.toLocaleString()}件`
                        : `총 ${totalPipedriveLeads.toLocaleString()}건 / 유효리드 ${validLeadCount.toLocaleString()}건`}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNegotiationFilter('all')
                        setSelectedRegion(null)
                        setSelectedOffice(null)
                        setShowCompanyList(true)
                      }}
                      className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                    >
                      {locale === 'ja' ? '全社リスト' : '전체 목록'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setExpandedOffices(new Set(Object.keys(stats.byOffice)))}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ja' ? 'すべて展開' : '모두 펼치기'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setExpandedOffices(new Set())}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === 'ja' ? 'すべて折りたたむ' : '모두 접기'}
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  {Object.entries(stats.byOffice)
                    .sort(([, a], [, b]) => b.totalCompanies - a.totalCompanies)
                    .map(([officeCode, officeData]) => {
                      const isExpanded = expandedOffices.has(officeCode)
                      const officeRegions = stats.byRegion.filter(r => r.office === officeCode)
                      const officeContactRate = Math.round((officeData.contacted / officeData.totalCompanies) * 100)
                      const officePipedrive = pipedriveOffices.find(o => o.code === officeCode)
                      const officePipedriveTotal = officePipedrive?.totalCount || 0

                      return (
                        <div key={officeCode} className="border-b border-gray-100 last:border-b-0">
                          {/* Office Header */}
                          <div
                            onClick={() => toggleOffice(officeCode)}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: OFFICE_COLORS[officeCode] }}
                              />
                              <div>
                                <span className="font-medium text-gray-900">
                                  {locale === 'ja' ? OFFICE_INFO[officeCode]?.nameJa : OFFICE_INFO[officeCode]?.nameKo}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({officeRegions.length} {locale === 'ja' ? '地域' : '지역'})
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                {officePipedriveTotal > 0 && (
                                  <span className="text-xs text-gray-400 mr-2">
                                    {locale === 'ja' ? '総' : '총'} {officePipedriveTotal} /
                                  </span>
                                )}
                                <span className="text-lg font-bold text-gray-900">{officeData.totalCompanies}</span>
                                <span className="text-sm text-gray-500 ml-1">{locale === 'ja' ? '件' : '건'}</span>
                              </div>
                              <div className="w-32">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${officeContactRate}%`,
                                        backgroundColor: OFFICE_COLORS[officeCode],
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500 w-10">{officeContactRate}%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Region List */}
                          {isExpanded && (
                            <div className="bg-gray-50 px-4 py-2">
                              {officeRegions.map(region => {
                                const regionContactRate = Math.round((region.contactedCount / region.totalCompanies) * 100)
                                return (
                                  <div
                                    key={region.region}
                                    onClick={() => {
                                      setSelectedRegion(region.region)
                                      setSelectedOffice(null)
                                      setShowCompanyList(true)
                                    }}
                                    className="flex items-center justify-between py-2 px-4 hover:bg-white rounded cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-700">
                                        {locale === 'ja' ? region.region : region.regionKo}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-600">
                                        {region.totalCompanies} {locale === 'ja' ? '件' : '건'}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <span className="text-sm text-gray-500">
                                          {region.contactedCount} ({regionContactRate}%)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Company List */}
              {showCompanyList && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {negotiationFilter === 'all-leads'
                        ? (locale === 'ja' ? '全リード一覧' : '전체 리드 목록')
                        : negotiationFilter === 'negotiating'
                          ? (locale === 'ja' ? '交渉中の会社' : '교섭 중인 업체')
                          : negotiationFilter === 'not-negotiating'
                            ? (locale === 'ja' ? '未交渉の会社' : '미교섭 업체')
                            : negotiationFilter === 'contracted'
                              ? (locale === 'ja' ? '成約済の会社' : '성약 완료 업체')
                              : negotiationFilter === 'hold-lost'
                                ? (locale === 'ja' ? '営業除外リスト' : '영업 제외 리스트')
                                : selectedRegion
                                  ? `${selectedRegion} ${locale === 'ja' ? 'のレンタカー会社' : ' 렌터카 업체'}`
                                  : (locale === 'ja' ? '有効リード一覧' : '유효 리드 목록')}
                      <span className="text-sm font-normal text-gray-500">
                        ({filteredCompanies.length}{locale === 'ja' ? '件' : '건'})
                      </span>
                      {negotiationFilter !== 'all' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          negotiationFilter === 'all-leads' ? 'bg-gray-200 text-gray-700' :
                          negotiationFilter === 'negotiating' ? 'bg-green-100 text-green-700' :
                          negotiationFilter === 'contracted' ? 'bg-blue-100 text-blue-700' :
                          negotiationFilter === 'hold-lost' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {negotiationFilter === 'all-leads'
                            ? (locale === 'ja' ? `Pipedrive全リード` : `Pipedrive 전체`)
                            : negotiationFilter === 'negotiating'
                              ? (locale === 'ja' ? '連絡中・商談・見積' : '연락·상담·견적')
                              : negotiationFilter === 'contracted'
                                ? (locale === 'ja' ? '成約' : '성약')
                                : negotiationFilter === 'hold-lost'
                                  ? (locale === 'ja'
                                      ? `保留・失注 ${trackedExcluded}件 + 未リスト ${unmatchedPipedriveLeads.length}件`
                                      : `보류·포기 ${trackedExcluded}건 + 미등록 ${unmatchedPipedriveLeads.length}건`)
                                  : (locale === 'ja' ? '未交渉' : '미교섭')}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3">
                      {negotiationFilter !== 'all' && (
                        <button
                          onClick={() => {
                            setNegotiationFilter('all')
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {locale === 'ja' ? 'フィルタ解除' : '필터 해제'}
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as ProgressStatus | 'all')}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="all">{locale === 'ja' ? '進捗: すべて' : '진척: 전체'}</option>
                          {Object.entries(STATUS_LABELS).map(([key, labels]) => (
                            <option key={key} value={key}>
                              {locale === 'ja' ? labels.ja : labels.ko}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* 연락 횟수 필터 */}
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <select
                          value={contactCountFilter}
                          onChange={(e) => setContactCountFilter(e.target.value as typeof contactCountFilter)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="all">{locale === 'ja' ? '連絡回数: すべて' : '연락 횟수: 전체'}</option>
                          <option value="0">{locale === 'ja' ? '未連絡 (0回)' : '미연락 (0회)'}</option>
                          <option value="1">{locale === 'ja' ? '1回連絡' : '1회 연락'}</option>
                          <option value="2">{locale === 'ja' ? '2回連絡' : '2회 연락'}</option>
                          <option value="3">{locale === 'ja' ? '3回連絡' : '3회 연락'}</option>
                          <option value="4">{locale === 'ja' ? '4回連絡' : '4회 연락'}</option>
                          <option value="5+">{locale === 'ja' ? '5回以上連絡' : '5회 이상 연락'}</option>
                        </select>
                      </div>
                      <button
                        onClick={openNewCompanyModal}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {locale === 'ja' ? '新規追加' : '신규 추가'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCompanyList(false)
                          setSelectedRegion(null)
                          setSelectedOffice(null)
                          setStatusFilter('all')
                          setContactCountFilter('all')
                          setNegotiationFilter('all')
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        ✕ {locale === 'ja' ? '閉じる' : '닫기'}
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '会社名' : '회사명'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '地域' : '지역'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '進捗' : '진척'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '連絡履歴' : '연락 이력'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? 'システム' : '시스템'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? '電話番号' : '전화번호'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? 'メール' : '이메일'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                              {locale === 'ja' ? 'HP問合せ' : 'HP 문의'}
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-20">
                              {locale === 'ja' ? '操作' : '액션'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedCompanies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{company.companyName}</div>
                                <div className="text-xs text-gray-400">{company.prefecture}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">
                                  {locale === 'ja' ? company.region : company.regionKo}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={company.status}
                                  onChange={(e) => quickStatusChange(company, e.target.value as ProgressStatus)}
                                  className="text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer appearance-none"
                                  style={{
                                    backgroundColor: `${STATUS_COLORS[company.status]}20`,
                                    color: STATUS_COLORS[company.status],
                                  }}
                                >
                                  {(['未交渉', '連絡中', '商談中', '見積提出', '成約', '保留', '失注'] as ProgressStatus[]).map(s => (
                                    <option key={s} value={s} style={{ color: '#333', backgroundColor: '#fff' }}>
                                      {locale === 'ja' ? STATUS_LABELS[s]?.ja : STATUS_LABELS[s]?.ko}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                {company.contactHistory.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {company.contactHistory.slice(-3).map((contact, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                                      >
                                        {contact.year}/{contact.month}/{contact.day}
                                      </span>
                                    ))}
                                    {company.contactHistory.length > 3 && (
                                      <span className="text-xs text-gray-400">
                                        +{company.contactHistory.length - 3}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{company.systemInUse || '-'}</span>
                              </td>
                              <td className="px-4 py-3">
                                {company.phone ? (
                                  <a
                                    href={`tel:${company.phone}`}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    <Phone className="w-3 h-3" />
                                    {company.phone}
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {company.email ? (
                                  <a
                                    href={`mailto:${company.email}`}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    <Mail className="w-3 h-3" />
                                    {company.email.length > 20 ? company.email.slice(0, 20) + '...' : company.email}
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {company.contactUrl ? (
                                  (() => {
                                    const isUrl = company.contactUrl!.includes('http') || company.contactUrl!.includes('www')
                                    if (isUrl) {
                                      return (
                                        <a
                                          href={company.contactUrl!.startsWith('http') ? company.contactUrl! : `https://${company.contactUrl!}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          HP
                                        </a>
                                      )
                                    }
                                    return <span className="text-xs text-gray-500">{company.contactUrl!.length > 15 ? company.contactUrl!.slice(0, 15) + '...' : company.contactUrl!}</span>
                                  })()
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {company.email && (
                                    <button
                                      onClick={() => handleCheckReply(company)}
                                      disabled={replyCheckLoading === company.id}
                                      className={`p-1 rounded transition-colors ${
                                        replyCheckResult?.companyId === company.id
                                          ? replyCheckResult.hasReply
                                            ? 'text-green-600 bg-green-50'
                                            : 'text-gray-400 bg-gray-50'
                                          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                                      }`}
                                      title={
                                        replyCheckResult?.companyId === company.id
                                          ? replyCheckResult.message
                                          : (locale === 'ja' ? '返信確認' : '회신 확인')
                                      }
                                    >
                                      {replyCheckLoading === company.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Inbox className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  {company.contactUrl && (
                                    <button
                                      onClick={() => handleOpenInquiryForm(company)}
                                      disabled={inquiryFormLoading === company.id}
                                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                      title={locale === 'ja' ? '問合せフォーム' : '문의폼 입력'}
                                    >
                                      {inquiryFormLoading === company.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <FileEdit className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditCompanyModal(company)}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title={locale === 'ja' ? '編集' : '편집'}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteCompany(company.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title={locale === 'ja' ? '削除' : '삭제'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="px-4 py-3 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {locale === 'ja'
                            ? `${filteredCompanies.length}件中 ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)}件を表示`
                            : `${filteredCompanies.length}건 중 ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)}건 표시`}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {'<<'}
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {locale === 'ja' ? '前へ' : '이전'}
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number
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
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 text-sm rounded ${
                                    currentPage === pageNum
                                      ? 'bg-primary text-white'
                                      : 'border hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {locale === 'ja' ? '次へ' : '다음'}
                          </button>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {'>>'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Source Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>{locale === 'ja' ? 'データソース' : '데이터 출처'}:</strong>{' '}
                  {locale === 'ja'
                    ? 'Google Sheets「メールリスト全国版」から5分間隔で同期。日付はシートに記載された年月日をそのまま使用。'
                    : 'Google Sheets "메일리스트 전국판"에서 5분 간격으로 동기화. 날짜는 시트에 기재된 년월일을 그대로 사용.'}
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : activeTab === 'cold-email' ? (
        // =======================================
        // Cold Email Tab
        // =======================================
        <div className="space-y-6">
          {/* Header with Month Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={coldEmailMonth}
                onChange={(e) => setColdEmailMonth(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                {['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'].map((month) => (
                  <option key={month} value={month}>{formatColdEmailMonth(month)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={saveColdEmailData}
              disabled={coldEmailSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {coldEmailSaved ? (locale === 'ja' ? '保存完了' : '저장 완료') : (locale === 'ja' ? '保存' : '저장')}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-500">{locale === 'ja' ? 'メール送信' : '메일 발송'}</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{coldEmailTotals.totalEmail}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-500">{locale === 'ja' ? 'お問い合わせ' : '문의'}</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{coldEmailTotals.totalInquiry}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500">{locale === 'ja' ? '合計アウトリーチ' : '총 아웃리치'}</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">{coldEmailTotals.total}</p>
              </div>
            </div>
          </div>

          {/* Region Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {locale === 'ja' ? '地域別コールドメール実績' : '지역별 콜드메일 실적'}
                <span className="text-sm font-normal text-gray-500">
                  ({formatColdEmailMonth(coldEmailMonth)})
                </span>
              </h3>
            </div>
            <div className="card-body p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      {locale === 'ja' ? '担当' : '담당'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      {locale === 'ja' ? '地域' : '지역'}
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                      {locale === 'ja' ? 'メール送信' : '메일 발송'}
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                      {locale === 'ja' ? 'お問い合わせ' : '문의'}
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                      {locale === 'ja' ? '合計' : '합계'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coldEmailRecords.map((record) => {
                    const region = COLD_EMAIL_REGIONS.find(r => r.code === record.regionCode)
                    const officeColor = OFFICE_COLORS[region?.areaCode || 'B'] || '#6b7280'
                    const officeName = locale === 'ja'
                      ? OFFICE_INFO[region?.areaCode || 'B']?.nameJa
                      : OFFICE_INFO[region?.areaCode || 'B']?.nameKo
                    return (
                      <tr key={record.regionCode} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: officeColor }} />
                            <span className="text-sm text-gray-600">{officeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {locale === 'ja' ? region?.name : region?.nameKo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={record.emailCount}
                            onChange={(e) => updateColdEmailRecord(record.regionCode, 'emailCount', parseInt(e.target.value) || 0)}
                            className="w-20 text-center border border-gray-200 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={record.inquiryCount}
                            onChange={(e) => updateColdEmailRecord(record.regionCode, 'inquiryCount', parseInt(e.target.value) || 0)}
                            className="w-20 text-center border border-gray-200 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-gray-900">
                            {record.emailCount + record.inquiryCount}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      {locale === 'ja' ? '合計' : '합계'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{coldEmailTotals.totalEmail}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{coldEmailTotals.totalInquiry}</td>
                    <td className="px-4 py-3 text-center font-bold text-purple-600">{coldEmailTotals.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-800">
              {locale === 'ja'
                ? 'データはブラウザのローカルストレージに保存されます。月を選択して実績を入力し、保存ボタンを押してください。'
                : '데이터는 브라우저의 로컬 스토리지에 저장됩니다. 월을 선택하고 실적을 입력한 후 저장 버튼을 눌러주세요.'}
            </p>
          </div>
        </div>
      ) : activeTab === 'bulk-email' ? (
        // =======================================
        // Bulk Email Tab
        // =======================================
        <div className="space-y-6">
          {/* Sub-tabs: Send / Dashboard / History / Blacklist */}
          <BulkEmailTab
            companies={mergedCompanies.map(c => ({
              id: c.id,
              companyName: c.companyName,
              contactMethod: c.email || c.contactUrl || c.contactMethod,
              phone: c.phone,
              region: c.region,
              regionKo: c.regionKo,
              office: c.office,
              status: c.status,
              systemInUse: c.systemInUse,
              contactHistory: c.contactHistory.map(h => ({ date: h.date, dateStr: h.dateStr })),
            }))}
            blacklist={emailBlacklist}
            onEmailSent={handleEmailSent}
            locale={locale as 'ja' | 'ko'}
          />

          {/* Dashboard */}
          <EmailDashboard />

          {/* Email Log */}
          <EmailLogPanel
            onAddToBlacklist={async (companyId, companyName, email) => {
              try {
                await fetch('/api/email-blacklist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ companyId, companyName, email, reason: 'bounce' }),
                })
                fetchBlacklist()
              } catch {
                // silently fail
              }
            }}
          />

          {/* Email History Timeline */}
          <EmailHistoryPanel />

          {/* Settings (Templates + Sender) */}
          <EmailSettingsPanel />

          {/* Blacklist */}
          <BlacklistPanel onUpdate={fetchBlacklist} />
        </div>
      ) : null}

      {/* Company Add/Edit Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingCompany
                  ? (locale === 'ja' ? '会社情報を編集' : '업체 정보 수정')
                  : (locale === 'ja' ? '新規会社を追加' : '신규 업체 추가')}
              </h3>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ja' ? '会社名' : '회사명'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={locale === 'ja' ? '例: ABCレンタカー' : '예: ABC렌터카'}
                />
              </div>

              {/* Prefecture & Region */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '都道府県' : '도도부현'}
                  </label>
                  <select
                    value={PREFECTURE_OPTIONS.includes(companyForm.prefecture) ? companyForm.prefecture : ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, prefecture: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{locale === 'ja' ? '選択してください' : '선택해주세요'}</option>
                    {PREFECTURE_OPTIONS.filter(Boolean).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '地域' : '지역'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={companyForm.region}
                    onChange={(e) => setCompanyForm({ ...companyForm, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {REGION_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {locale === 'ja' ? r.label : r.ko}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ja' ? '電話番号' : '전화번호'}
                </label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="03-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ja' ? 'メールアドレス' : '이메일'}
                </label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="info@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ja' ? 'HP問合せURL' : 'HP 문의 URL'}
                </label>
                <input
                  type="text"
                  value={companyForm.hpContact}
                  onChange={(e) => setCompanyForm({ ...companyForm, hpContact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://example.com/contact"
                />
              </div>

              {/* Status & System */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '進捗状況' : '진척 상황'}
                  </label>
                  <select
                    value={companyForm.status}
                    onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value as ProgressStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {Object.entries(STATUS_LABELS).map(([key, labels]) => (
                      <option key={key} value={key}>
                        {locale === 'ja' ? labels.ja : labels.ko}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '使用システム' : '사용 시스템'}
                  </label>
                  <input
                    type="text"
                    value={companyForm.systemInUse}
                    onChange={(e) => setCompanyForm({ ...companyForm, systemInUse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder={locale === 'ja' ? '例: レンタカー侍' : '예: 렌터카 사무라이'}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ja' ? '備考' : '비고'}
                </label>
                <textarea
                  value={companyForm.notes}
                  onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={2}
                  placeholder={locale === 'ja' ? 'メモを入力...' : '메모를 입력...'}
                />
              </div>

              {/* Contact Records - Manual Logging */}
              {editingCompany && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <label className="block text-sm font-semibold text-gray-700">
                      {locale === 'ja' ? '連絡履歴' : '연락 이력'}
                    </label>
                    <span className="text-xs text-gray-400">
                      ({contactRecords.length}{locale === 'ja' ? '件' : '건'})
                    </span>
                  </div>

                  {/* Add new contact */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="date"
                        value={newContact.date}
                        onChange={(e) => setNewContact({ ...newContact, date: e.target.value })}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={newContact.type}
                        onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="mail">{locale === 'ja' ? 'メール' : '메일'}</option>
                        <option value="inquiry">{locale === 'ja' ? '問合せフォーム' : '문의폼'}</option>
                        <option value="phone">{locale === 'ja' ? '電話' : '전화'}</option>
                        <option value="sns">SNS</option>
                        <option value="reply">{locale === 'ja' ? '返信受信' : '회신 수신'}</option>
                      </select>
                      <button
                        onClick={addContactRecord}
                        disabled={isSavingContact || !newContact.date}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingContact
                          ? '...'
                          : locale === 'ja' ? '追加' : '추가'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newContact.summary}
                      onChange={(e) => setNewContact({ ...newContact, summary: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      placeholder={locale === 'ja' ? 'メモ（任意）' : '메모 (선택)'}
                    />
                  </div>

                  {/* Existing records */}
                  {contactRecords.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {contactRecords.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                          <span className="font-mono text-gray-500">{r.contactDate}</span>
                          <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${
                            r.contactType === 'mail' ? 'bg-blue-500' :
                            r.contactType === 'inquiry' ? 'bg-green-500' :
                            r.contactType === 'phone' ? 'bg-orange-500' :
                            r.contactType === 'reply' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}>
                            {r.contactType === 'mail' ? (locale === 'ja' ? 'メール' : '메일') :
                             r.contactType === 'inquiry' ? (locale === 'ja' ? '問合せ' : '문의') :
                             r.contactType === 'phone' ? (locale === 'ja' ? '電話' : '전화') :
                             r.contactType === 'reply' ? (locale === 'ja' ? '返信' : '회신') :
                             'SNS'}
                          </span>
                          {r.summary && <span className="truncate flex-1">{r.summary}</span>}
                          <button
                            onClick={() => deleteContactRecord(r.id)}
                            className="text-red-400 hover:text-red-600 ml-auto shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SNS Contacts */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <label className="block text-sm font-semibold text-gray-700">
                    {locale === 'ja' ? 'SNS連絡先' : 'SNS 연락처'}
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">LINE ID</label>
                    <input
                      type="text"
                      value={(companyForm as Record<string, string>).lineId || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, lineId: e.target.value } as typeof companyForm)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="@line_id"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={(companyForm as Record<string, string>).instagram || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, instagram: e.target.value } as typeof companyForm)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Twitter/X</label>
                    <input
                      type="text"
                      value={(companyForm as Record<string, string>).twitter || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, twitter: e.target.value } as typeof companyForm)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="@handle"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                    <input
                      type="text"
                      value={(companyForm as Record<string, string>).facebook || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, facebook: e.target.value } as typeof companyForm)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="facebook.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCompanyModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {locale === 'ja' ? 'キャンセル' : '취소'}
              </button>
              <button
                onClick={saveCompany}
                disabled={!companyForm.companyName}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {locale === 'ja' ? '保存' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Form Screenshot Modal */}
      {inquiryFormResult?.screenshot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {locale === 'ja' ? '問合せフォーム入力結果' : '문의폼 입력 결과'}
              </h3>
              <button
                onClick={() => setInquiryFormResult(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-green-600 mb-3">{inquiryFormResult.message}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inquiryFormResult.screenshot}
                alt="Form screenshot"
                className="w-full rounded border"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setInquiryFormResult(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  {locale === 'ja' ? '閉じる' : '닫기'}
                </button>
                {inquiryFormResult.logId && (
                  <button
                    onClick={async () => {
                      await fetch('/api/inquiry-form', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'mark-submitted',
                          logId: inquiryFormResult.logId,
                          companyId: inquiryFormResult.companyId,
                        }),
                      })
                      setInquiryFormResult(null)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    {locale === 'ja' ? '送信済みにする' : '전송 완료 처리'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
