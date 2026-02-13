'use client'

import { useState, useEffect } from 'react'
import { Mail, FileText, Plus, Save, ChevronDown, MapPin, TrendingUp, Calendar, Info, Link2 } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

// 관할 사무소 정의
type Area = {
  code: string
  name: string
  nameKo: string
  nameJa: string
  color: string
}

const AREAS: { [code: string]: Area } = {
  'A': { code: 'A', name: 'Sapporo Office', nameKo: '삿포로', nameJa: '札幌', color: '#3b82f6' },
  'B': { code: 'B', name: 'Tokyo Office', nameKo: '도쿄', nameJa: '東京', color: '#22c55e' },
  'C': { code: 'C', name: 'Osaka Office', nameKo: '오사카', nameJa: '大阪', color: '#f59e0b' },
  'D': { code: 'D', name: 'Fukuoka Office', nameKo: '후쿠오카', nameJa: '福岡', color: '#ef4444' },
  'E': { code: 'E', name: 'Okinawa Office', nameKo: '오키나와', nameJa: '沖縄', color: '#8b5cf6' },
}

// Kiosk CRM Region 타입 (관할지역 DB 구조 기반)
type Region = {
  id: string
  code: string
  name: string
  nameJa: string | null
  prefectures: string
  areaCode: string
  isActive: boolean
  sortOrder: number
}

// 월별 콜드메일 실적 데이터 타입
type ColdEmailRecord = {
  month: string // "2026-01"
  regionCode: string
  emailCount: number
  inquiryCount: number
  note?: string
}

// 하드코딩된 Region 데이터 (Kiosk CRM Region 테이블 기반) - 10개 지역
const REGIONS: Region[] = [
  { id: '1', code: 'A_HK', name: '北海道 (Hokkaido)', nameJa: '北海道', prefectures: '北海道', areaCode: 'A', isActive: true, sortOrder: 1 },
  { id: '2', code: 'B_TH', name: '東北 (Tohoku)', nameJa: '東北', prefectures: '青森県,岩手県,宮城県,秋田県,山形県,福島県', areaCode: 'B', isActive: true, sortOrder: 2 },
  { id: '3', code: 'B_KT', name: '関東 (Kanto)', nameJa: '関東', prefectures: '東京都,神奈川県,埼玉県,千葉県,茨城県,栃木県,群馬県', areaCode: 'B', isActive: true, sortOrder: 3 },
  { id: '4', code: 'B_CB', name: '中部 (Chubu)', nameJa: '中部', prefectures: '山梨県,長野県,岐阜県,静岡県,愛知県', areaCode: 'B', isActive: true, sortOrder: 4 },
  { id: '5', code: 'C_HR', name: '北陸信越 (Hokuriku-Shinetsu)', nameJa: '北陸信越', prefectures: '新潟県,富山県,石川県,福井県', areaCode: 'C', isActive: true, sortOrder: 5 },
  { id: '6', code: 'C_KK', name: '近畿 (Kinki)', nameJa: '近畿', prefectures: '三重県,滋賀県,京都府,大阪府,兵庫県,奈良県,和歌山県', areaCode: 'C', isActive: true, sortOrder: 6 },
  { id: '7', code: 'C_CG', name: '中国 (Chugoku)', nameJa: '中国', prefectures: '鳥取県,島根県,岡山県,広島県,山口県', areaCode: 'C', isActive: true, sortOrder: 7 },
  { id: '8', code: 'C_SK', name: '四国 (Shikoku)', nameJa: '四国', prefectures: '徳島県,香川県,愛媛県,高知県', areaCode: 'C', isActive: true, sortOrder: 8 },
  { id: '9', code: 'D_KS', name: '九州 (Kyushu)', nameJa: '九州', prefectures: '福岡県,佐賀県,長崎県,熊本県,大分県,宮崎県,鹿児島県', areaCode: 'D', isActive: true, sortOrder: 9 },
  { id: '10', code: 'E_OK', name: '沖縄 (Okinawa)', nameJa: '沖縄', prefectures: '沖縄県', areaCode: 'E', isActive: true, sortOrder: 10 },
]

// 샘플 실적 데이터 (Excel 데이터 기반)
const SAMPLE_DATA: { [month: string]: ColdEmailRecord[] } = {
  '2026-01': [
    { month: '2026-01', regionCode: 'A_HK', emailCount: 4, inquiryCount: 0, note: '' },
    { month: '2026-01', regionCode: 'B_TH', emailCount: 0, inquiryCount: 7, note: '' },
    { month: '2026-01', regionCode: 'B_KT', emailCount: 16, inquiryCount: 22, note: '' },
    { month: '2026-01', regionCode: 'B_CB', emailCount: 0, inquiryCount: 5, note: '' },
    { month: '2026-01', regionCode: 'C_HR', emailCount: 0, inquiryCount: 0, note: '' },
    { month: '2026-01', regionCode: 'C_KK', emailCount: 0, inquiryCount: 7, note: '' },
    { month: '2026-01', regionCode: 'C_CG', emailCount: 0, inquiryCount: 13, note: '' },
    { month: '2026-01', regionCode: 'C_SK', emailCount: 0, inquiryCount: 3, note: '' },
    { month: '2026-01', regionCode: 'D_KS', emailCount: 0, inquiryCount: 27, note: '' },
    { month: '2026-01', regionCode: 'E_OK', emailCount: 0, inquiryCount: 0, note: '' },
  ],
}

// 월 목록 생성 (2026년)
const AVAILABLE_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
  '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
]

export default function ColdEmailPage() {
  const { t, locale } = useTranslation()
  const [selectedMonth, setSelectedMonth] = useState('2026-02')
  const [records, setRecords] = useState<ColdEmailRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  // 선택된 월의 데이터 로드
  useEffect(() => {
    const savedData = localStorage.getItem(`coldEmail_${selectedMonth}`)
    if (savedData) {
      setRecords(JSON.parse(savedData))
    } else if (SAMPLE_DATA[selectedMonth]) {
      setRecords(SAMPLE_DATA[selectedMonth])
    } else {
      // 새로운 월에는 빈 데이터 생성
      const emptyRecords = REGIONS.map(region => ({
        month: selectedMonth,
        regionCode: region.code,
        emailCount: 0,
        inquiryCount: 0,
        note: ''
      }))
      setRecords(emptyRecords)
    }
  }, [selectedMonth])

  // 데이터 업데이트
  const updateRecord = (regionCode: string, field: 'emailCount' | 'inquiryCount' | 'note', value: number | string) => {
    setRecords(prev => prev.map(record => {
      if (record.regionCode === regionCode) {
        return { ...record, [field]: value }
      }
      return record
    }))
  }

  // 데이터 저장
  const saveData = () => {
    setIsSaving(true)
    localStorage.setItem(`coldEmail_${selectedMonth}`, JSON.stringify(records))
    setTimeout(() => {
      setIsSaving(false)
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    }, 500)
  }

  // 통계 계산
  const totalEmail = records.reduce((sum, r) => sum + r.emailCount, 0)
  const totalInquiry = records.reduce((sum, r) => sum + r.inquiryCount, 0)
  const totalOutreach = totalEmail + totalInquiry

  // 지역별 합계 (이메일 + 문의)
  const regionTotals = records.map(r => ({
    ...r,
    total: r.emailCount + r.inquiryCount
  })).sort((a, b) => b.total - a.total)

  // 상위 3개 지역
  const topRegions = regionTotals.filter(r => r.total > 0).slice(0, 3)

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    if (locale === 'ja') {
      return `${year}年${parseInt(m)}月`
    }
    return `${year}년 ${parseInt(m)}월`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900">
            <Mail className="d-inline-block me-2 text-primary" size={24} />
            {t.coldEmailTitle}
          </h1>
          <p className="text-gray-500 mt-1">{t.coldEmailSubtitle}</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* 월 선택 */}
          <div className="position-relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-select form-select-sm appearance-none cursor-pointer"
              style={{ paddingRight: '2rem' }}
            >
              {AVAILABLE_MONTHS.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </div>
          {/* 저장 버튼 */}
          <button
            onClick={saveData}
            disabled={isSaving}
            className="btn btn-primary d-flex align-items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {showSaved ? (locale === 'ja' ? '保存完了' : '저장 완료') : (locale === 'ja' ? '保存' : '저장')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex align-items-center gap-2">
              <Mail size={20} className="text-blue-400" />
              <p className="stat-label">{t.emailSending}</p>
            </div>
            <p className="stat-value text-blue-600">{totalEmail}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatMonth(selectedMonth)}
            </p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex align-items-center gap-2">
              <FileText size={20} className="text-green-400" />
              <p className="stat-label">{t.inquiryForm}</p>
            </div>
            <p className="stat-value text-green-600">{totalInquiry}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatMonth(selectedMonth)}
            </p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex align-items-center gap-2">
              <TrendingUp size={20} className="text-purple-400" />
              <p className="stat-label">{t.totalOutreach}</p>
            </div>
            <p className="stat-value text-purple-600">{totalOutreach}</p>
            <p className="text-xs text-gray-400 mt-1">
              {locale === 'ja' ? 'メール + フォーム' : '메일 + 양식'}
            </p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex align-items-center gap-2">
              <MapPin size={20} className="text-orange-400" />
              <p className="stat-label">{locale === 'ja' ? '活動地域' : '활동 지역'}</p>
            </div>
            <p className="stat-value text-orange-600">{regionTotals.filter(r => r.total > 0).length}</p>
            <p className="text-xs text-gray-400 mt-1">
              / {REGIONS.length} {locale === 'ja' ? '地域' : '지역'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Regions */}
      {topRegions.length > 0 && (
        <div className="card">
          <div className="card-header bg-blue-50">
            <h3 className="card-title">
              <TrendingUp size={20} className="me-2 text-primary" />
              {locale === 'ja' ? 'トップ地域 (活動量)' : '상위 지역 (활동량)'}
            </h3>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {topRegions.map((record, index) => {
                const region = REGIONS.find(r => r.code === record.regionCode)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={record.regionCode} className="col-md-4">
                    <div className="d-flex align-items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{medals[index]}</span>
                      <div className="flex-fill">
                        <p className="fw-medium text-gray-900">{region?.nameJa || region?.name}</p>
                        <div className="d-flex gap-3 text-sm text-gray-500 mt-1">
                          <span className="text-blue-600">{locale === 'ja' ? 'メール' : '메일'}: {record.emailCount}</span>
                          <span className="text-green-600">{locale === 'ja' ? 'フォーム' : '양식'}: {record.inquiryCount}</span>
                        </div>
                      </div>
                      <span className="text-lg fw-bold text-primary">{record.total}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Data Input Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Calendar size={20} className="me-2" />
            {formatMonth(selectedMonth)} {t.regionBreakdown}
          </h3>
          <span className="badge badge-info">
            {locale === 'ja' ? `合計 ${totalOutreach}件` : `합계 ${totalOutreach}건`}
          </span>
        </div>
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th className="text-sm fw-medium text-gray-600">
                  {locale === 'ja' ? '地域' : '지역'}
                </th>
                <th className="text-center text-sm fw-medium text-gray-600" style={{ width: '6rem' }}>
                  {locale === 'ja' ? '管轄' : '관할'}
                </th>
                <th className="text-center text-sm fw-medium text-gray-600" style={{ width: '7rem' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1">
                    <Mail size={16} className="text-blue-500" />
                    {t.emailSending}
                  </div>
                </th>
                <th className="text-center text-sm fw-medium text-gray-600" style={{ width: '7rem' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1">
                    <FileText size={16} className="text-green-500" />
                    {t.inquiryForm}
                  </div>
                </th>
                <th className="text-center text-sm fw-medium text-gray-600" style={{ width: '5rem' }}>
                  {locale === 'ja' ? '合計' : '합계'}
                </th>
                <th className="text-sm fw-medium text-gray-600">
                  {locale === 'ja' ? 'メモ' : '메모'}
                </th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((region) => {
                const record = records.find(r => r.regionCode === region.code) || {
                  month: selectedMonth,
                  regionCode: region.code,
                  emailCount: 0,
                  inquiryCount: 0,
                  note: ''
                }
                const regionTotal = record.emailCount + record.inquiryCount

                const area = AREAS[region.areaCode]

                return (
                  <tr key={region.code}>
                    <td className="px-3 py-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-xs px-2 bg-gray-100 rounded font-monospace text-gray-500" style={{ paddingTop: '0.125rem', paddingBottom: '0.125rem' }}>
                          {region.code}
                        </span>
                        <span className="fw-medium text-gray-900">{region.nameJa}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate" style={{ maxWidth: '20rem' }}>
                        {region.prefectures}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className="text-xs px-2 py-1 rounded-full fw-medium"
                        style={{ backgroundColor: `${area.color}20`, color: area.color }}
                      >
                        {locale === 'ja' ? area.nameJa : area.nameKo}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={record.emailCount}
                        onChange={(e) => updateRecord(region.code, 'emailCount', parseInt(e.target.value) || 0)}
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={record.inquiryCount}
                        onChange={(e) => updateRecord(region.code, 'inquiryCount', parseInt(e.target.value) || 0)}
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`fw-bold ${regionTotal > 0 ? 'text-primary' : 'text-gray-300'}`}>
                        {regionTotal}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={record.note || ''}
                        onChange={(e) => updateRecord(region.code, 'note', e.target.value)}
                        placeholder={locale === 'ja' ? '備考...' : '비고...'}
                        className="form-control form-control-sm text-sm"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-top">
              <tr>
                <td className="px-3 py-2 fw-bold text-gray-900">
                  {t.monthlyTotal}
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-center fw-bold text-blue-600">
                  {totalEmail}
                </td>
                <td className="px-3 py-2 text-center fw-bold text-green-600">
                  {totalInquiry}
                </td>
                <td className="px-3 py-2 text-center fw-bold text-primary text-lg">
                  {totalOutreach}
                </td>
                <td className="px-3 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="alert alert-info d-flex align-items-start gap-2">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-1" />
        <p className="text-sm text-blue-800 mb-0">
          <strong>{locale === 'ja' ? 'ヒント' : '힌트'}:</strong>{' '}
          {locale === 'ja'
            ? '地域コードはKiosk CRMの管轄地域DBに連動しています。データは自動保存されません。変更後は必ず「保存」ボタンを押してください。'
            : '지역 코드는 Kiosk CRM의 관할지역 DB와 연동됩니다. 데이터는 자동 저장되지 않습니다. 변경 후 반드시 "저장" 버튼을 눌러주세요.'}
        </p>
      </div>

      {/* API Connection Info */}
      <div className="alert alert-secondary d-flex align-items-start gap-2">
        <Link2 size={20} className="text-gray-500 flex-shrink-0 mt-1" />
        <div>
          <p className="text-sm text-gray-600 mb-0">
            <strong>{locale === 'ja' ? '連携情報' : '연동 정보'}:</strong>{' '}
            {locale === 'ja'
              ? 'Kiosk CRM 管轄地域DB (localhost:3000/dashboard/regions) と同期可能'
              : 'Kiosk CRM 관할지역 DB (localhost:3000/dashboard/regions)와 동기화 가능'}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-0">
            Region API: GET /api/regions | {locale === 'ja' ? '現在はローカルストレージに保存' : '현재는 로컬 스토리지에 저장'}
          </p>
        </div>
      </div>
    </div>
  )
}
