// 관할지역 데이터 및 주소 매칭 로직
// Based on KIOSK CRM's region/area structure

export type Area = {
  code: string
  name: string
  nameKo: string
  nameJa: string
  addressKeywords: string[]
}

export type Region = {
  code: string
  name: string
  nameKo: string
  nameJa: string
  prefectures: string[]
  area: Area
  color: string
}

// 관할 사무소 정의
export const AREAS: { [code: string]: Area } = {
  'A': {
    code: 'A',
    name: 'Sapporo Office',
    nameKo: '삿포로 사무소',
    nameJa: '札幌オフィス',
    addressKeywords: ['北海道', '札幌', 'Hokkaido', 'Sapporo'],
  },
  'B': {
    code: 'B',
    name: 'Tokyo Office',
    nameKo: '도쿄 사무소',
    nameJa: '東京オフィス',
    addressKeywords: ['東京', '千葉', '神奈川', '埼玉', '茨城', '栃木', '群馬', 'Tokyo', 'Chiba', 'Kanagawa', 'Saitama'],
  },
  'C': {
    code: 'C',
    name: 'Osaka Office',
    nameKo: '오사카 사무소',
    nameJa: '大阪オフィス',
    addressKeywords: ['大阪', '京都', '兵庫', '奈良', '滋賀', '和歌山', 'Osaka', 'Kyoto', 'Hyogo', 'Nara'],
  },
  'D': {
    code: 'D',
    name: 'Fukuoka Office',
    nameKo: '후쿠오카 사무소',
    nameJa: '福岡オフィス',
    addressKeywords: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', 'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto'],
  },
  'E': {
    code: 'E',
    name: 'Okinawa Office',
    nameKo: '오키나와 사무소',
    nameJa: '沖縄オフィス',
    addressKeywords: ['沖縄', 'Okinawa'],
  },
}

// 관할지역 정의 (도도부현 기준)
export const REGIONS: Region[] = [
  {
    code: 'A_HK',
    name: 'Hokkaido',
    nameKo: '홋카이도',
    nameJa: '北海道',
    prefectures: ['北海道'],
    area: AREAS['A'],
    color: '#3b82f6', // 파랑
  },
  {
    code: 'B_TH',
    name: 'Tohoku',
    nameKo: '도호쿠',
    nameJa: '東北',
    prefectures: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    area: AREAS['B'],
    color: '#22c55e', // 초록
  },
  {
    code: 'B_KT',
    name: 'Kanto',
    nameKo: '관동',
    nameJa: '関東',
    prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
    area: AREAS['B'],
    color: '#f59e0b', // 주황
  },
  {
    code: 'B_CB',
    name: 'Chubu',
    nameKo: '중부',
    nameJa: '中部',
    prefectures: ['山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
    area: AREAS['B'],
    color: '#8b5cf6', // 보라
  },
  {
    code: 'C_HR',
    name: 'Hokuriku-Shinetsu',
    nameKo: '호쿠리쿠신에츠',
    nameJa: '北陸信越',
    prefectures: ['新潟県', '富山県', '石川県', '福井県'],
    area: AREAS['C'],
    color: '#06b6d4', // 청록
  },
  {
    code: 'C_KK',
    name: 'Kinki',
    nameKo: '긴키',
    nameJa: '近畿',
    prefectures: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
    area: AREAS['C'],
    color: '#ec4899', // 분홍
  },
  {
    code: 'C_CG',
    name: 'Chugoku',
    nameKo: '주고쿠',
    nameJa: '中国',
    prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
    area: AREAS['C'],
    color: '#14b8a6', // 민트
  },
  {
    code: 'C_SK',
    name: 'Shikoku',
    nameKo: '시코쿠',
    nameJa: '四国',
    prefectures: ['徳島県', '香川県', '愛媛県', '高知県'],
    area: AREAS['C'],
    color: '#f97316', // 오렌지
  },
  {
    code: 'D_KS',
    name: 'Kyushu',
    nameKo: '규슈',
    nameJa: '九州',
    prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'],
    area: AREAS['D'],
    color: '#ef4444', // 빨강
  },
  {
    code: 'E_OK',
    name: 'Okinawa',
    nameKo: '오키나와',
    nameJa: '沖縄',
    prefectures: ['沖縄県'],
    area: AREAS['E'],
    color: '#84cc16', // 라임
  },
]

// 도도부현별 매핑 (역방향 조회용)
const prefectureToRegionMap: Map<string, Region> = new Map()
REGIONS.forEach(region => {
  region.prefectures.forEach(pref => {
    prefectureToRegionMap.set(pref, region)
    // 県/府/都 없는 버전도 추가
    const shortName = pref.replace(/[県府都道]$/, '')
    prefectureToRegionMap.set(shortName, region)
  })
})

// 주소에서 관할지역 찾기
export function matchAddressToRegion(address: string | null | undefined): Region | null {
  if (!address) return null

  // 도도부현 이름으로 매칭
  const entries = Array.from(prefectureToRegionMap.entries())
  for (const [pref, region] of entries) {
    if (address.includes(pref)) {
      return region
    }
  }

  // 사무소 키워드로 매칭
  for (const region of REGIONS) {
    for (const keyword of region.area.addressKeywords) {
      if (address.includes(keyword)) {
        return region
      }
    }
  }

  return null
}

// 라벨 이름 → 지역 매핑 테이블
const LABEL_TO_REGION_MAP: { [key: string]: string } = {
  // 지방 이름 키워드
  '北海道': 'A_HK',
  '東北': 'B_TH',
  '関東': 'B_KT',
  '中部': 'B_CB',
  '北陸': 'C_HR',
  '信越': 'C_HR',
  '近畿': 'C_KK',
  '関西': 'C_KK',
  '中国': 'C_CG',
  '四国': 'C_SK',
  '九州': 'D_KS',
  '沖縄': 'E_OK',
  // 섬 지역 (오키나와)
  '宮古島': 'E_OK',
  '石垣島': 'E_OK',
  '沖縄本島': 'E_OK',
}

// 라벨 이름에서 관할지역 찾기
export function matchLabelToRegion(labelName: string | null | undefined): Region | null {
  if (!labelName) return null

  // 라벨 이름에서 지역 키워드 검색
  for (const [keyword, regionCode] of Object.entries(LABEL_TO_REGION_MAP)) {
    if (labelName.includes(keyword)) {
      return REGIONS.find(r => r.code === regionCode) || null
    }
  }

  return null
}

// 주소에서 관할 사무소 찾기
export function matchAddressToArea(address: string | null | undefined): Area | null {
  const region = matchAddressToRegion(address)
  return region?.area || null
}

// 지역별 통계
export type RegionStats = {
  region: Region
  count: number
  totalValue: number
  items: Array<{ id: string | number; name: string; value?: number }>
}

// 아이템 목록을 지역별로 그룹화
export function groupByRegion<T extends { id: string | number; name: string; address?: string | null; value?: number }>(
  items: T[],
  addressGetter?: (item: T) => string | null | undefined
): RegionStats[] {
  const getAddress = addressGetter || ((item: T) => item.address)

  const statsMap = new Map<string, RegionStats>()

  // 모든 지역 초기화
  REGIONS.forEach(region => {
    statsMap.set(region.code, {
      region,
      count: 0,
      totalValue: 0,
      items: [],
    })
  })

  // 미지정 지역
  const unassigned: RegionStats = {
    region: {
      code: 'UNKNOWN',
      name: 'Unassigned',
      nameKo: '미지정',
      nameJa: '未指定',
      prefectures: [],
      area: {
        code: '?',
        name: 'Unknown',
        nameKo: '미지정',
        nameJa: '未指定',
        addressKeywords: [],
      },
      color: '#9ca3af',
    },
    count: 0,
    totalValue: 0,
    items: [],
  }

  // 아이템 분류
  items.forEach(item => {
    const address = getAddress(item)
    const region = matchAddressToRegion(address)

    if (region) {
      const stats = statsMap.get(region.code)!
      stats.count++
      stats.totalValue += item.value || 0
      stats.items.push({ id: item.id, name: item.name, value: item.value })
    } else {
      unassigned.count++
      unassigned.totalValue += item.value || 0
      unassigned.items.push({ id: item.id, name: item.name, value: item.value })
    }
  })

  // 결과 반환 (count > 0인 것만)
  const result = Array.from(statsMap.values()).filter(s => s.count > 0)
  if (unassigned.count > 0) {
    result.push(unassigned)
  }

  // count 기준 정렬
  return result.sort((a, b) => b.count - a.count)
}

// 사무소별 통계
export type AreaStats = {
  area: Area
  regions: string[]
  count: number
  totalValue: number
}

export function groupByArea<T extends { id: string | number; name: string; address?: string | null; value?: number }>(
  items: T[],
  addressGetter?: (item: T) => string | null | undefined
): AreaStats[] {
  const getAddress = addressGetter || ((item: T) => item.address)

  const statsMap = new Map<string, AreaStats>()

  // 모든 사무소 초기화
  Object.values(AREAS).forEach(area => {
    statsMap.set(area.code, {
      area,
      regions: [],
      count: 0,
      totalValue: 0,
    })
  })

  // 미지정
  const unassigned: AreaStats = {
    area: {
      code: '?',
      name: 'Unknown',
      nameKo: '미지정',
      nameJa: '未指定',
      addressKeywords: [],
    },
    regions: [],
    count: 0,
    totalValue: 0,
  }

  // 아이템 분류
  items.forEach(item => {
    const address = getAddress(item)
    const region = matchAddressToRegion(address)

    if (region) {
      const stats = statsMap.get(region.area.code)!
      stats.count++
      stats.totalValue += item.value || 0
      if (!stats.regions.includes(region.nameJa)) {
        stats.regions.push(region.nameJa)
      }
    } else {
      unassigned.count++
      unassigned.totalValue += item.value || 0
    }
  })

  // 결과 반환 (count > 0인 것만)
  const result = Array.from(statsMap.values()).filter(s => s.count > 0)
  if (unassigned.count > 0) {
    result.push(unassigned)
  }

  // count 기준 정렬
  return result.sort((a, b) => b.count - a.count)
}
