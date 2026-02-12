// KPI 목표 설정 파일 (연도별로 관리)
// 이 파일에서 월별 목표를 관리합니다

export const AVAILABLE_YEARS = [2025, 2026]
export const DEFAULT_YEAR = 2026

export interface MonthlyTarget {
  target: number
  actual?: number // API에서 자동으로 채워지거나 수동 입력
}

export interface KPIMetric {
  id: string
  nameJa: string
  nameKo: string
  unit: string
  category: 'gsc' | 'ga4' | 'conversion'
  apiField?: string // API에서 자동으로 가져올 필드
  months: { [month: number]: MonthlyTarget }
}

export interface YearlyKPIData {
  year: number
  metrics: KPIMetric[]
}

// 2025년 KPI 데이터 (실적 완료)
const kpi2025: KPIMetric[] = [
  // Search Console 지표
  {
    id: 'gsc_impressions',
    nameJa: 'Search Console 表示回数',
    nameKo: 'Search Console 노출 횟수',
    unit: '',
    category: 'gsc',
    apiField: 'impressions',
    months: {
      1: { target: 20000, actual: 16600 },
      2: { target: 20000, actual: 18300 },
      3: { target: 20000, actual: 21500 },
      4: { target: 20000, actual: 26200 },
      5: { target: 20000, actual: 41200 },
      6: { target: 20000, actual: 44900 },
      7: { target: 20000, actual: 62200 },
      8: { target: 20000, actual: 87700 },
      9: { target: 20000, actual: 112000 },
      10: { target: 20000, actual: 112800 },
      11: { target: 20000, actual: 142000 },
      12: { target: 20000, actual: 176000 },
    }
  },
  {
    id: 'gsc_clicks',
    nameJa: 'Search Console クリック数',
    nameKo: 'Search Console 클릭 수',
    unit: '',
    category: 'gsc',
    apiField: 'clicks',
    months: {
      1: { target: 2000, actual: 772 },
      2: { target: 2000, actual: 888 },
      3: { target: 2000, actual: 850 },
      4: { target: 2000, actual: 947 },
      5: { target: 2000, actual: 1396 },
      6: { target: 2000, actual: 1338 },
      7: { target: 2000, actual: 1696 },
      8: { target: 2000, actual: 1722 },
      9: { target: 2000, actual: 1943 },
      10: { target: 2000, actual: 1918 },
      11: { target: 2000, actual: 1857 },
      12: { target: 2000, actual: 1931 },
    }
  },
  // Google Analytics 지표
  {
    id: 'ga4_pageviews',
    nameJa: 'Google Analytics 表示回数',
    nameKo: 'Google Analytics 노출 횟수',
    unit: '',
    category: 'ga4',
    apiField: 'pageviews',
    months: {
      1: { target: 5000, actual: 3313 },
      2: { target: 5000, actual: 3481 },
      3: { target: 5000, actual: 3225 },
      4: { target: 5000, actual: 3842 },
      5: { target: 5000, actual: 4831 },
      6: { target: 5000, actual: 4788 },
      7: { target: 5000, actual: 5405 },
      8: { target: 5000, actual: 5197 },
      9: { target: 5000, actual: 5691 },
      10: { target: 5000, actual: 6622 },
      11: { target: 5000, actual: 5641 },
      12: { target: 5000, actual: 5986 },
    }
  },
  {
    id: 'ga4_users',
    nameJa: 'Google Analytics アクティブユーザー数',
    nameKo: 'Google Analytics 활성 사용자 수',
    unit: '',
    category: 'ga4',
    apiField: 'users',
    months: {
      1: { target: 2500, actual: 1152 },
      2: { target: 2500, actual: 1302 },
      3: { target: 2500, actual: 1276 },
      4: { target: 2500, actual: 1465 },
      5: { target: 2500, actual: 2237 },
      6: { target: 2500, actual: 2094 },
      7: { target: 2500, actual: 2551 },
      8: { target: 2500, actual: 2779 },
      9: { target: 2500, actual: 3047 },
      10: { target: 2500, actual: 3247 },
      11: { target: 2500, actual: 3241 },
      12: { target: 2500, actual: 3368 },
    }
  },
  // 전환 지표
  {
    id: 'demo_requests',
    nameJa: 'デモ申し込み',
    nameKo: '데모 신청',
    unit: '',
    category: 'conversion',
    apiField: 'demoRequests',
    months: {
      1: { target: 10, actual: 3 },
      2: { target: 10, actual: 4 },
      3: { target: 10, actual: 2 },
      4: { target: 10, actual: 3 },
      5: { target: 10, actual: 6 },
      6: { target: 10, actual: 3 },
      7: { target: 10, actual: 2 },
      8: { target: 10, actual: 4 },
      9: { target: 10, actual: 1 },
      10: { target: 10, actual: 0 },
      11: { target: 10, actual: 2 },
      12: { target: 10, actual: 4 },
    }
  },
  {
    id: 'inquiries',
    nameJa: 'お問合せ',
    nameKo: '문의',
    unit: '',
    category: 'conversion',
    apiField: 'inquiries',
    months: {
      1: { target: 10, actual: 3 },
      2: { target: 10, actual: 4 },
      3: { target: 10, actual: 10 },
      4: { target: 10, actual: 3 },
      5: { target: 10, actual: 3 },
      6: { target: 10, actual: 2 },
      7: { target: 10, actual: 5 },
      8: { target: 10, actual: 4 },
      9: { target: 10, actual: 9 },
      10: { target: 10, actual: 6 },
      11: { target: 10, actual: 5 },
      12: { target: 10, actual: 7 },
    }
  },
  {
    id: 'sales_leads',
    nameJa: '営業リード数',
    nameKo: '영업 리드 수',
    unit: '',
    category: 'conversion',
    apiField: 'salesLeads',
    months: {
      1: { target: 20, actual: 6 },
      2: { target: 20, actual: 8 },
      3: { target: 20, actual: 12 },
      4: { target: 20, actual: 6 },
      5: { target: 20, actual: 9 },
      6: { target: 20, actual: 5 },
      7: { target: 20, actual: 7 },
      8: { target: 20, actual: 8 },
      9: { target: 20, actual: 10 },
      10: { target: 20, actual: 6 },
      11: { target: 20, actual: 7 },
      12: { target: 20, actual: 11 },
    }
  },
]

// 2026년 KPI 목표 설정 (API에서 실시간 데이터 가져옴)
const kpi2026: KPIMetric[] = [
  // Search Console 지표
  {
    id: 'gsc_impressions',
    nameJa: 'Search Console 表示回数',
    nameKo: 'Search Console 노출 횟수',
    unit: '',
    category: 'gsc',
    apiField: 'impressions',
    months: {
      1: { target: 200000, actual: 225341 },
      2: { target: 200000 },
      3: { target: 200000 },
      4: { target: 200000 },
      5: { target: 200000 },
      6: { target: 200000 },
      7: { target: 200000 },
      8: { target: 200000 },
      9: { target: 200000 },
      10: { target: 200000 },
      11: { target: 200000 },
      12: { target: 200000 },
    }
  },
  {
    id: 'gsc_clicks',
    nameJa: 'Search Console クリック数',
    nameKo: 'Search Console 클릭 수',
    unit: '',
    category: 'gsc',
    apiField: 'clicks',
    months: {
      1: { target: 2000, actual: 1794 },
      2: { target: 2000 },
      3: { target: 2000 },
      4: { target: 2000 },
      5: { target: 2000 },
      6: { target: 2000 },
      7: { target: 2000 },
      8: { target: 2000 },
      9: { target: 2000 },
      10: { target: 2000 },
      11: { target: 2000 },
      12: { target: 2000 },
    }
  },
  // Google Analytics 지표
  {
    id: 'ga4_pageviews',
    nameJa: 'Google Analytics 表示回数',
    nameKo: 'Google Analytics 노출 횟수',
    unit: '',
    category: 'ga4',
    apiField: 'pageviews',
    months: {
      1: { target: 5000, actual: 5605 },
      2: { target: 5000 },
      3: { target: 5000 },
      4: { target: 5000 },
      5: { target: 5000 },
      6: { target: 5000 },
      7: { target: 5000 },
      8: { target: 5000 },
      9: { target: 5000 },
      10: { target: 5000 },
      11: { target: 5000 },
      12: { target: 5000 },
    }
  },
  {
    id: 'ga4_users',
    nameJa: 'Google Analytics アクティブユーザー数',
    nameKo: 'Google Analytics 활성 사용자 수',
    unit: '',
    category: 'ga4',
    apiField: 'users',
    months: {
      1: { target: 2500, actual: 3491 },
      2: { target: 2500 },
      3: { target: 2500 },
      4: { target: 2500 },
      5: { target: 2500 },
      6: { target: 2500 },
      7: { target: 2500 },
      8: { target: 2500 },
      9: { target: 2500 },
      10: { target: 2500 },
      11: { target: 2500 },
      12: { target: 2500 },
    }
  },
  // 전환 지표 (GA4 이벤트 자동 연동)
  {
    id: 'demo_requests',
    nameJa: 'デモ申し込み',
    nameKo: '데모 신청',
    unit: '',
    category: 'conversion',
    apiField: 'demoRequests',
    months: {
      1: { target: 10, actual: 3 },
      2: { target: 10 },
      3: { target: 10 },
      4: { target: 10 },
      5: { target: 10 },
      6: { target: 10 },
      7: { target: 10 },
      8: { target: 10 },
      9: { target: 10 },
      10: { target: 10 },
      11: { target: 10 },
      12: { target: 10 },
    }
  },
  {
    id: 'inquiries',
    nameJa: 'お問合せ',
    nameKo: '문의',
    unit: '',
    category: 'conversion',
    apiField: 'inquiries',
    months: {
      1: { target: 10, actual: 5 },
      2: { target: 10 },
      3: { target: 10 },
      4: { target: 10 },
      5: { target: 10 },
      6: { target: 10 },
      7: { target: 10 },
      8: { target: 10 },
      9: { target: 10 },
      10: { target: 10 },
      11: { target: 10 },
      12: { target: 10 },
    }
  },
  {
    id: 'sales_leads',
    nameJa: '営業リード数',
    nameKo: '영업 리드 수',
    unit: '',
    category: 'conversion',
    apiField: 'salesLeads',
    months: {
      1: { target: 20, actual: 8 },
      2: { target: 20 },
      3: { target: 20 },
      4: { target: 20 },
      5: { target: 20 },
      6: { target: 20 },
      7: { target: 20 },
      8: { target: 20 },
      9: { target: 20 },
      10: { target: 20 },
      11: { target: 20 },
      12: { target: 20 },
    }
  },
]

// 모든 연도 데이터
export const allYearsData: YearlyKPIData[] = [
  { year: 2025, metrics: kpi2025 },
  { year: 2026, metrics: kpi2026 },
]

// 특정 연도의 KPI 데이터 가져오기
export function getKPIDataByYear(year: number): KPIMetric[] {
  const yearData = allYearsData.find(d => d.year === year)
  return yearData?.metrics || kpi2026
}

// 기본 export (현재 연도 또는 기본 연도)
export const kpiTargets = kpi2026

// 달성률 계산
export function calculateAchievementRate(actual: number | undefined, target: number): number {
  if (!actual || target === 0) return 0
  return Math.round((actual / target) * 100)
}

// 차이 계산
export function calculateDifference(actual: number | undefined, target: number): number {
  if (!actual) return -target
  return actual - target
}

// 색상 클래스 결정
export function getAchievementColor(rate: number): string {
  if (rate >= 100) return 'text-green-600 bg-green-50'
  if (rate >= 80) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}
