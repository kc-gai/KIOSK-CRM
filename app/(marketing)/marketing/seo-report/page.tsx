'use client'

import { FileText, AlertTriangle, Target, TrendingUp, TrendingDown, Smartphone, Monitor, Tablet, Globe, Calendar } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

// SEO Analysis Report Data (from SEO分析レポート_2026年2月.md)
const reportData = {
  period: '2025年11月1日 〜 2026年2月2日',
  createdAt: '2026年2月2日',

  summary: {
    impressions: { value: 550157, trend: 63.8, status: 'good' },
    clicks: { value: 5629, trend: -2.1, status: 'warning' },
    ctr: { value: 1.02, trend: -40.2, status: 'critical' },
    position: { value: 5.0, trend: -43.1, status: 'warning' },
  },

  mainIssue: {
    ja: '露出は64%増加したが、クリックは2%減少、順位は悪化傾向',
    ko: '노출은 64% 증가했지만, 클릭은 2% 감소, 순위는 악화 추세',
  },

  causes: [
    {
      ja: '検索結果には多く表示されているが、クリックしたくなるタイトル・説明文になっていない',
      ko: '검색 결과에 많이 노출되지만, 클릭하고 싶은 제목/설명문이 아님',
    },
    {
      ja: 'AI検索（ChatGPT、Perplexity等）によるゼロクリック検索の増加',
      ko: 'AI 검색(ChatGPT, Perplexity 등)으로 인한 제로클릭 검색 증가',
    },
    {
      ja: 'インバウンド市場の未活用 - 台湾・韓国・香港からのアクセスがあるが、専用コンテンツ不足',
      ko: '인바운드 시장 미활용 - 대만/한국/홍콩에서 접속이 있지만, 전용 콘텐츠 부족',
    },
  ],

  strategy: {
    ja: '方向性 A + B + AEO/GEO の組み合わせ',
    ko: '방향성 A + B + AEO/GEO 조합',
    details: [
      { ja: 'A: CTR改善 + 既存の強み（マイナ免許証）を最大化', ko: 'A: CTR개선 + 기존 강점(마이나 면허증) 최대화' },
      { ja: 'B: インバウンド特化 + チェックイン機販売への連携', ko: 'B: 인바운드 특화 + 체크인 기기 판매 연계' },
      { ja: 'AEO/GEO: AI検索時代に対応したコンテンツ最適化', ko: 'AEO/GEO: AI 검색 시대에 대응한 콘텐츠 최적화' },
    ],
  },

  topKeywords: [
    { keyword: 'マイナ免許証 デメリット', clicks: 397, impressions: 59383, ctr: 0.67, position: 2.74, evaluation: 'top' },
    { keyword: 'レンタカー開業 失敗', clicks: 47, impressions: 244, ctr: 19.26, position: 1.11, evaluation: 'highCtr' },
    { keyword: '外国人 レンタカー', clicks: 34, impressions: 287, ctr: 11.85, position: 1.98, evaluation: 'highCtr' },
    { keyword: 'レンタカー 外国人', clicks: 28, impressions: 155, ctr: 18.06, position: 1.43, evaluation: 'highCtr' },
    { keyword: 'マイナ免許証 レンタカー', clicks: 68, impressions: 4837, ctr: 1.41, position: 4.35, evaluation: 'good' },
  ],

  improvementKeywords: [
    { keyword: 'ジュネーブ条約', clicks: 23, impressions: 10185, ctr: 0.23, position: 5.42, issue: { ja: '表示多いがクリック少', ko: '노출 많지만 클릭 적음' } },
    { keyword: 'たびらい', clicks: 20, impressions: 5642, ctr: 0.35, position: 6.06, issue: { ja: 'メタ説明の改善必要', ko: '메타 설명 개선 필요' } },
    { keyword: '韓国 レンタカー', clicks: 25, impressions: 1115, ctr: 2.24, position: 7.33, issue: { ja: '順位改善の余地あり', ko: '순위 개선 여지 있음' } },
  ],

  deviceAnalysis: {
    mobile: { clicks: 3056, percentage: 54.3 },
    desktop: { clicks: 2524, percentage: 44.8 },
    tablet: { clicks: 49, percentage: 0.9 },
  },

  regionAnalysis: [
    { country: 'JP', flag: '🇯🇵', name: { ja: '日本', ko: '일본' }, clicks: 5419, percentage: 96.3 },
    { country: 'TW', flag: '🇹🇼', name: { ja: '台湾', ko: '대만' }, clicks: 36, percentage: 0.6 },
    { country: 'KR', flag: '🇰🇷', name: { ja: '韓国', ko: '한국' }, clicks: 30, percentage: 0.5 },
    { country: 'US', flag: '🇺🇸', name: { ja: 'アメリカ', ko: '미국' }, clicks: 23, percentage: 0.4 },
    { country: 'HK', flag: '🇭🇰', name: { ja: '香港', ko: '홍콩' }, clicks: 17, percentage: 0.3 },
  ],

  kpiTargets: {
    short: { // 3 months
      ctr: { current: 1.02, target: 1.5 },
      clicks: { current: 1876, target: 2500 },
      position: { current: 5.0, target: 4.2 },
    },
    mid: { // 6 months
      ctr: { current: 1.02, target: 2.0 },
      clicks: { current: 1876, target: 4000 },
      position: { current: 5.0, target: 3.8 },
    },
    long: { // 12 months
      ctr: { current: 1.02, target: 2.5 },
      clicks: { current: 1876, target: 6000 },
      position: { current: 5.0, target: 3.0 },
    },
  },
}

export default function SEOReportPage() {
  const { t, locale } = useTranslation()
  const l = locale === 'ja' ? 'ja' : 'ko'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            {locale === 'ja' ? 'SEO分析レポート' : 'SEO 분석 리포트'}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {locale === 'ja' ? '分析期間' : '분석 기간'}: {reportData.period}
          </p>
        </div>
        <span className="badge badge-info">
          {locale === 'ja' ? '作成日' : '작성일'}: {reportData.createdAt}
        </span>
      </div>

      {/* Executive Summary */}
      <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <div className="card-header">
          <h2 className="card-title text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {locale === 'ja' ? '最重要課題' : '최중요 과제'}
          </h2>
        </div>
        <div className="card-body">
          <p className="text-lg font-semibold text-red-700 mb-4">
            {reportData.mainIssue[l]}
          </p>
          <div className="space-y-2">
            {reportData.causes.map((cause, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-red-500 font-bold">{locale === 'ja' ? '原因' : '원인'}{i + 1}:</span>
                <span className="text-gray-700">{cause[l]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">{locale === 'ja' ? '検索露出' : '검색 노출'}</p>
          <p className="stat-value">{reportData.summary.impressions.value.toLocaleString()}</p>
          <span className="badge badge-success">+{reportData.summary.impressions.trend}%</span>
        </div>
        <div className="stat-card">
          <p className="stat-label">{locale === 'ja' ? 'クリック数' : '클릭수'}</p>
          <p className="stat-value">{reportData.summary.clicks.value.toLocaleString()}</p>
          <span className="badge badge-warning">{reportData.summary.clicks.trend}%</span>
        </div>
        <div className="stat-card">
          <p className="stat-label">CTR</p>
          <p className="stat-value text-red-600">{reportData.summary.ctr.value}%</p>
          <span className="badge badge-danger">{reportData.summary.ctr.trend}%</span>
        </div>
        <div className="stat-card">
          <p className="stat-label">{locale === 'ja' ? '平均順位' : '평균 순위'}</p>
          <p className="stat-value">{reportData.summary.position.value}{locale === 'ja' ? '位' : '위'}</p>
          <span className="badge badge-warning">{locale === 'ja' ? '悪化傾向' : '악화 추세'}</span>
        </div>
      </div>

      {/* Selected Strategy */}
      <div className="card bg-green-50 border-green-200">
        <div className="card-header">
          <h2 className="card-title text-green-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            {locale === 'ja' ? '選定された戦略方向性' : '선정된 전략 방향성'}
          </h2>
        </div>
        <div className="card-body">
          <p className="text-lg font-bold text-green-700 mb-4">{reportData.strategy[l]}</p>
          <ul className="space-y-2">
            {reportData.strategy.details.map((detail, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-700">{detail[l]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top Keywords */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {locale === 'ja' ? '🏆 主力キーワード（強化継続）' : '🏆 주력 키워드 (강화 지속)'}
          </h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">{locale === 'ja' ? '検索クエリ' : '검색 쿼리'}</th>
                <th className="text-right p-2">{locale === 'ja' ? 'クリック' : '클릭'}</th>
                <th className="text-right p-2">{locale === 'ja' ? '表示回数' : '노출수'}</th>
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">{locale === 'ja' ? '順位' : '순위'}</th>
                <th className="text-center p-2">{locale === 'ja' ? '評価' : '평가'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topKeywords.map((kw, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{kw.keyword}</td>
                  <td className="p-2 text-right">{kw.clicks}</td>
                  <td className="p-2 text-right">{kw.impressions.toLocaleString()}</td>
                  <td className="p-2 text-right">{kw.ctr}%</td>
                  <td className="p-2 text-right">{kw.position}</td>
                  <td className="p-2 text-center">
                    {kw.evaluation === 'top' && <span className="badge badge-warning">🏆</span>}
                    {kw.evaluation === 'highCtr' && <span className="badge badge-success">💎 High CTR</span>}
                    {kw.evaluation === 'good' && <span className="badge badge-info">✅</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvement Needed Keywords */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {locale === 'ja' ? '⚠️ 改善余地のあるキーワード' : '⚠️ 개선 여지가 있는 키워드'}
          </h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">{locale === 'ja' ? '検索クエリ' : '검색 쿼리'}</th>
                <th className="text-right p-2">{locale === 'ja' ? 'クリック' : '클릭'}</th>
                <th className="text-right p-2">{locale === 'ja' ? '表示回数' : '노출수'}</th>
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">{locale === 'ja' ? '順位' : '순위'}</th>
                <th className="text-left p-2">{locale === 'ja' ? '課題' : '과제'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.improvementKeywords.map((kw, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{kw.keyword}</td>
                  <td className="p-2 text-right">{kw.clicks}</td>
                  <td className="p-2 text-right">{kw.impressions.toLocaleString()}</td>
                  <td className="p-2 text-right text-orange-600">{kw.ctr}%</td>
                  <td className="p-2 text-right">{kw.position}</td>
                  <td className="p-2 text-orange-700">{kw.issue[l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device & Region Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              {locale === 'ja' ? 'デバイス別分析' : '디바이스별 분석'}
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{locale === 'ja' ? 'モバイル' : '모바일'}</span>
                <span>{reportData.deviceAnalysis.mobile.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${reportData.deviceAnalysis.mobile.percentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{locale === 'ja' ? 'デスクトップ' : '데스크톱'}</span>
                <span>{reportData.deviceAnalysis.desktop.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${reportData.deviceAnalysis.desktop.percentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{locale === 'ja' ? 'タブレット' : '태블릿'}</span>
                <span>{reportData.deviceAnalysis.tablet.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-purple-500 h-4 rounded-full"
                  style={{ width: `${reportData.deviceAnalysis.tablet.percentage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-4">
              {locale === 'ja'
                ? '💡 モバイルが過半数 → モバイルファースト対応が必須'
                : '💡 모바일이 과반수 → 모바일 퍼스트 대응 필수'}
            </p>
          </div>
        </div>

        {/* Region */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {locale === 'ja' ? '国・地域別分析' : '국가/지역별 분석'}
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {reportData.regionAnalysis.map((region, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{region.flag}</span>
                    <span className="font-medium">{region.name[l]}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{region.clicks}</span>
                    <span className="text-gray-500 text-sm ml-2">({region.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                {locale === 'ja'
                  ? '🎯 重要発見: 日本以外からのアクセスが3.7%存在 → インバウンドコンテンツの拡充機会'
                  : '🎯 중요 발견: 일본 외 접속이 3.7% 존재 → 인바운드 콘텐츠 확충 기회'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Targets */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {locale === 'ja' ? 'KPI目標設定' : 'KPI 목표 설정'}
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Short term */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">
                {locale === 'ja' ? '📅 短期（3ヶ月後）' : '📅 단기 (3개월 후)'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>CTR</span>
                  <span>{reportData.kpiTargets.short.ctr.current}% → <strong>{reportData.kpiTargets.short.ctr.target}%</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>{locale === 'ja' ? 'クリック/月' : '클릭/월'}</span>
                  <span>{reportData.kpiTargets.short.clicks.current} → <strong>{reportData.kpiTargets.short.clicks.target}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>{locale === 'ja' ? '平均順位' : '평균 순위'}</span>
                  <span>{reportData.kpiTargets.short.position.current} → <strong>{reportData.kpiTargets.short.position.target}</strong></span>
                </div>
              </div>
            </div>

            {/* Mid term */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">
                {locale === 'ja' ? '📅 中期（6ヶ月後）' : '📅 중기 (6개월 후)'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>CTR</span>
                  <span>{reportData.kpiTargets.mid.ctr.current}% → <strong>{reportData.kpiTargets.mid.ctr.target}%</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>{locale === 'ja' ? 'クリック/月' : '클릭/월'}</span>
                  <span>{reportData.kpiTargets.mid.clicks.current} → <strong>{reportData.kpiTargets.mid.clicks.target}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>{locale === 'ja' ? '平均順位' : '평균 순위'}</span>
                  <span>{reportData.kpiTargets.mid.position.current} → <strong>{reportData.kpiTargets.mid.position.target}</strong></span>
                </div>
              </div>
            </div>

            {/* Long term */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-3">
                {locale === 'ja' ? '📅 長期（12ヶ月後）' : '📅 장기 (12개월 후)'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>CTR</span>
                  <span>{reportData.kpiTargets.long.ctr.current}% → <strong>{reportData.kpiTargets.long.ctr.target}%</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>{locale === 'ja' ? 'クリック/月' : '클릭/월'}</span>
                  <span>{reportData.kpiTargets.long.clicks.current} → <strong>{reportData.kpiTargets.long.clicks.target}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>{locale === 'ja' ? '平均順位' : '평균 순위'}</span>
                  <span>{reportData.kpiTargets.long.position.current} → <strong>{reportData.kpiTargets.long.position.target}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AEO/GEO Section */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="card-header">
          <h2 className="card-title text-purple-800">
            {locale === 'ja' ? '🤖 AI検索時代の対応戦略：AEO / GEO' : '🤖 AI 검색 시대 대응 전략: AEO / GEO'}
          </h2>
        </div>
        <div className="card-body">
          <div className="mb-4 p-4 bg-white/50 rounded-lg">
            <p className="text-purple-700 font-medium">
              {locale === 'ja'
                ? '重要な洞察: CTR低下は、タイトル・メタ説明の問題だけでなく、AI検索によるゼロクリック検索が影響している可能性が高い'
                : '중요한 인사이트: CTR 저하는 제목/메타 설명 문제뿐만 아니라, AI 검색으로 인한 제로클릭 검색이 영향을 미칠 가능성이 높음'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">AEO (Answer Engine Optimization)</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• FAQ{locale === 'ja' ? '形式の導入' : ' 형식 도입'}</li>
                <li>• {locale === 'ja' ? '構造化データ（Schema）' : '구조화 데이터(Schema)'}</li>
                <li>• {locale === 'ja' ? '簡潔な回答文' : '간결한 답변문'}</li>
                <li>• Featured Snippet{locale === 'ja' ? '狙い' : ' 노리기'}</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">GEO (Generative Engine Optimization)</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• E-E-A-T{locale === 'ja' ? '強化' : ' 강화'}</li>
                <li>• {locale === 'ja' ? '一次情報の提供' : '1차 정보 제공'}</li>
                <li>• {locale === 'ja' ? '明確な出典表記' : '명확한 출처 표기'}</li>
                <li>• {locale === 'ja' ? '定期的な更新' : '정기적인 업데이트'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4">
        {locale === 'ja'
          ? 'レポート作成: マーケティングチーム | 次回レビュー: 2026年3月1日'
          : '리포트 작성: 마케팅팀 | 다음 리뷰: 2026년 3월 1일'}
      </div>
    </div>
  )
}
