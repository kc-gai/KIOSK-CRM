'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, Users, AlertCircle, MapPin, Info, Building2, Building } from 'lucide-react'
import { useTranslation } from '@/lib/translations'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// Types
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
    value?: number
    add_time: string
  }>
}

type RegionData = {
  stats: LeadRegionStats[]
  unassigned: LeadRegionStats
  total: number
}

// Office (Area) structure
type OfficeData = {
  code: string
  name: string
  nameJa: string
  nameKo: string
  color: string
  totalCount: number
  regions: LeadRegionStats[]
}

// Office colors
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

export default function PipedrivePage() {
  const { locale } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regionData, setRegionData] = useState<RegionData | null>(null)
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const regionRes = await fetch(`/api/pipedrive?type=leads-by-region`)
      const regionResult = await regionRes.json()

      if (regionResult.success) {
        setRegionData(regionResult.data)
      } else {
        setError(regionResult.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Group regions by office (area)
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

    // Sort by total count descending
    return Object.values(officeMap).sort((a, b) => b.totalCount - a.totalCount)
  }

  const offices = regionData ? groupByOffice(regionData.stats) : []
  const selectedOfficeData = offices.find(o => o.code === selectedOffice)
  const selectedRegionData = selectedRegion === 'UNKNOWN'
    ? regionData?.unassigned
    : regionData?.stats.find(s => s.region.code === selectedRegion)

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-danger p-4 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg fw-semibold text-red-800 mb-2">
            {locale === 'ja' ? 'Pipedrive接続エラー' : 'Pipedrive 연결 오류'}
          </h2>
          <p className="text-red-600 mb-3">{error}</p>
          <div className="text-sm text-gray-600 bg-light rounded p-3 text-start mx-auto" style={{ maxWidth: '28rem' }}>
            <p className="fw-medium mb-2">{locale === 'ja' ? '設定方法:' : '설정 방법:'}</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>{locale === 'ja' ? 'Pipedriveにログイン' : 'Pipedrive 로그인'}</li>
              <li>{locale === 'ja' ? '設定 → 個人設定 → API' : '설정 → 개인 설정 → API'}</li>
              <li>{locale === 'ja' ? 'APIトークンをコピー' : 'API 토큰 복사'}</li>
              <li>{locale === 'ja' ? '.envファイルに追加:' : '.env 파일에 추가:'}</li>
            </ol>
            <code className="d-block mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs">
              PIPEDRIVE_API_TOKEN=your_token_here
            </code>
          </div>
          <button
            onClick={fetchData}
            className="btn btn-primary mt-3"
          >
            {locale === 'ja' ? '再試行' : '다시 시도'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900 d-flex align-items-center gap-2">
            <Users size={28} className="text-blue-600" />
            Pipedrive CRM
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'ja' ? '管轄オフィス・地域別リード管理' : '관할사무소·지역별 리드 관리'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-primary d-flex align-items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {locale === 'ja' ? '更新' : '새로고침'}
          </button>
        </div>
      </div>

      {loading && !regionData ? (
        <div className="d-flex align-items-center justify-content-center" style={{ height: '16rem' }}>
          <RefreshCw size={32} className="animate-spin text-blue-500" />
        </div>
      ) : regionData ? (
        <>
          {/* Office Level Summary */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg fw-semibold text-gray-900 d-flex align-items-center gap-2 mb-3">
                <Building size={20} className="text-blue-600" />
                {locale === 'ja' ? '管轄オフィス別リード' : '관할사무소별 리드'}
                <span className="text-sm fw-normal text-gray-500">
                  ({regionData.total}{locale === 'ja' ? '件' : '건'})
                </span>
              </h2>

              {/* Office Cards */}
              <div className="row g-3 mb-4">
                {offices.map((office) => (
                  <div key={office.code} className="col-6 col-md-4 col-lg">
                    <div
                      onClick={() => {
                        setSelectedOffice(selectedOffice === office.code ? null : office.code)
                        setSelectedRegion(null)
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedOffice === office.code
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div
                          className="rounded-full"
                          style={{ backgroundColor: office.color, width: '1rem', height: '1rem' }}
                        />
                        <span className="fw-semibold text-sm">
                          {locale === 'ja' ? office.nameJa : office.nameKo}
                        </span>
                      </div>
                      <div className="text-3xl fw-bold text-gray-900">{office.totalCount}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {office.regions.length} {locale === 'ja' ? '地域' : '지역'}
                      </div>
                    </div>
                  </div>
                ))}
                {regionData.unassigned.count > 0 && (
                  <div className="col-6 col-md-4 col-lg">
                    <div
                      onClick={() => {
                        setSelectedOffice(null)
                        setSelectedRegion(selectedRegion === 'UNKNOWN' ? null : 'UNKNOWN')
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRegion === 'UNKNOWN'
                          ? 'border-gray-500 bg-gray-100'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="rounded-full bg-gray-400" style={{ width: '1rem', height: '1rem' }} />
                        <span className="fw-semibold text-sm text-gray-600">
                          {locale === 'ja' ? '未指定' : '미지정'}
                        </span>
                      </div>
                      <div className="text-3xl fw-bold text-gray-500">{regionData.unassigned.count}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {locale === 'ja' ? '住所未登録' : '주소 미등록'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Office Distribution Chart */}
              <div style={{ height: '12rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={offices} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey={(d) => locale === 'ja' ? d.nameJa : d.nameKo}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value ?? 0}${locale === 'ja' ? '件' : '건'}`, locale === 'ja' ? 'リード数' : '리드 수']}
                    />
                    <Bar dataKey="totalCount" radius={[0, 4, 4, 0]}>
                      {offices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Selected Office Detail - Region Level */}
          {selectedOfficeData && (
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg fw-semibold text-gray-900 d-flex align-items-center gap-2 mb-3">
                  <MapPin size={20} className="text-indigo-600" />
                  <span
                    className="rounded-full d-inline-block"
                    style={{ backgroundColor: selectedOfficeData.color, width: '0.75rem', height: '0.75rem' }}
                  />
                  {locale === 'ja' ? selectedOfficeData.nameJa : selectedOfficeData.nameKo}
                  {locale === 'ja' ? ' の地域別リード' : ' 지역별 리드'}
                  <span className="text-sm fw-normal text-gray-500">
                    ({selectedOfficeData.totalCount}{locale === 'ja' ? '件' : '건'})
                  </span>
                </h2>

                <div className="row g-4">
                  {/* Region Cards */}
                  <div className="col-12 col-lg-6">
                    <div className="row g-2">
                      {selectedOfficeData.regions.map((stat) => (
                        <div key={stat.region.code} className="col-6">
                          <div
                            onClick={() => setSelectedRegion(selectedRegion === stat.region.code ? null : stat.region.code)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedRegion === stat.region.code
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span
                                className="rounded-full"
                                style={{ backgroundColor: stat.region.color, width: '0.75rem', height: '0.75rem' }}
                              />
                              <span className="fw-medium text-sm">
                                {locale === 'ja' ? stat.region.nameJa : stat.region.nameKo}
                              </span>
                            </div>
                            <div className="text-2xl fw-bold text-gray-900">{stat.count}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Region Lead List */}
                  <div className="col-12 col-lg-6">
                    <h3 className="fw-medium text-gray-700 mb-2">
                      {selectedRegionData && selectedRegion !== 'UNKNOWN'
                        ? `${locale === 'ja' ? selectedRegionData.region.nameJa : selectedRegionData.region.nameKo} ${locale === 'ja' ? 'リード一覧' : '리드 목록'}`
                        : (locale === 'ja' ? '地域を選択してください' : '지역을 선택하세요')
                      }
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '16rem', overflowY: 'auto' }}>
                      {selectedRegionData && selectedRegion !== 'UNKNOWN' ? (
                        <div className="divide-y divide-gray-100">
                          {selectedRegionData.leads.map((lead) => (
                            <div key={lead.id} className="p-2 hover:bg-gray-50">
                              <div className="fw-medium text-sm text-gray-900 truncate">
                                {lead.title}
                              </div>
                              {lead.organization && (
                                <div className="text-xs text-gray-600 mt-1 d-flex align-items-center gap-1">
                                  <Building2 size={12} />
                                  {lead.organization}
                                </div>
                              )}
                              <div className="d-flex align-items-center justify-content-between mt-1">
                                <span className="text-xs text-gray-400">
                                  {lead.address || (locale === 'ja' ? '住所なし' : '주소 없음')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(lead.add_time)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-gray-400">
                          {locale === 'ja' ? '左の地域カードをクリックして選択' : '왼쪽 지역 카드를 클릭하여 선택'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unassigned Lead List */}
          {selectedRegion === 'UNKNOWN' && regionData.unassigned && (
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg fw-semibold text-gray-900 d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={20} className="text-gray-500" />
                  {locale === 'ja' ? '未指定リード' : '미지정 리드'}
                  <span className="text-sm fw-normal text-gray-500">
                    ({regionData.unassigned.count}{locale === 'ja' ? '件' : '건'})
                  </span>
                </h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                  <div className="divide-y divide-gray-100">
                    {regionData.unassigned.leads.map((lead) => (
                      <div key={lead.id} className="p-2 hover:bg-gray-50">
                        <div className="fw-medium text-sm text-gray-900 truncate">
                          {lead.title}
                        </div>
                        {lead.organization && (
                          <div className="text-xs text-gray-600 mt-1 d-flex align-items-center gap-1">
                            <Building2 size={12} />
                            {lead.organization}
                          </div>
                        )}
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          <span className="text-xs text-gray-400">
                            {lead.address || (locale === 'ja' ? '住所なし' : '주소 없음')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(lead.add_time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="alert alert-info d-flex align-items-start gap-2">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-1" />
            <p className="text-sm text-blue-800">
              <strong>Pipedrive {locale === 'ja' ? '連動' : '연동'}:</strong>{' '}
              {locale === 'ja'
                ? 'データはPipedrive APIからリアルタイムで取得されます。オフィスをクリックすると所属地域が表示されます。'
                : '데이터는 Pipedrive API에서 실시간으로 가져옵니다. 사무소를 클릭하면 소속 지역이 표시됩니다.'
              }
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
