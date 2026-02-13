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
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900 d-flex align-items-center gap-2">
            <FileText size={24} className="text-primary" />
            {locale === 'ja' ? 'SEO分析レポート' : 'SEO 분석 리포트'}
          </h1>
          <p className="text-gray-500 mt-1 d-flex align-items-center gap-2">
            <Calendar size={16} />
            {locale === 'ja' ? '分析期間' : '분석 기간'}: {reportData.period}
          </p>
        </div>
        <span className="badge badge-info">
          {locale === 'ja' ? '作成日' : '작성일'}: {reportData.createdAt}
        </span>
      </div>

      {/* Executive Summary */}
      <div className="card bg-red-50 border-red-200">
        <div className="card-header">
          <h2 className="card-title text-red-800 d-flex align-items-center gap-2">
            <AlertTriangle size={20} />
            {locale === 'ja' ? '最重要課題' : '최중요 과제'}
          </h2>
        </div>
        <div className="card-body">
          <p className="text-lg fw-semibold text-red-700 mb-3">
            {reportData.mainIssue[l]}
          </p>
          <div className="space-y-2">
            {reportData.causes.map((cause, i) => (
              <div key={i} className="d-flex align-items-start gap-2">
                <span className="text-red-500 fw-bold">{locale === 'ja' ? '原因' : '원인'}{i + 1}:</span>
                <span className="text-gray-700">{cause[l]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="stat-card">
            <p className="stat-label">{locale === 'ja' ? '検索露出' : '검색 노출'}</p>
            <p className="stat-value">{reportData.summary.impressions.value.toLocaleString()}</p>
            <span className="badge badge-success">+{reportData.summary.impressions.trend}%</span>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="stat-card">
            <p className="stat-label">{locale === 'ja' ? 'クリック数' : '클릭수'}</p>
            <p className="stat-value">{reportData.summary.clicks.value.toLocaleString()}</p>
            <span className="badge badge-warning">{reportData.summary.clicks.trend}%</span>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="stat-card">
            <p className="stat-label">CTR</p>
            <p className="stat-value text-red-600">{reportData.summary.ctr.value}%</p>
            <span className="badge badge-danger">{reportData.summary.ctr.trend}%</span>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="stat-card">
            <p className="stat-label">{locale === 'ja' ? '平均順位' : '평균 순위'}</p>
            <p className="stat-value">{reportData.summary.position.value}{locale === 'ja' ? '位' : '위'}</p>
            <span className="badge badge-warning">{locale === 'ja' ? '悪化傾向' : '악화 추세'}</span>
          </div>
        </div>
      </div>

      {/* Selected Strategy */}
      <div className="card bg-green-50 border-green-200">
        <div className="card-header">
          <h2 className="card-title text-green-800 d-flex align-items-center gap-2">
            <Target size={20} />
            {locale === 'ja' ? '選定された戦略方向性' : '선정된 전략 방향성'}
          </h2>
        </div>
        <div className="card-body">
          <p className="text-lg fw-bold text-green-700 mb-3">{reportData.strategy[l]}</p>
          <ul className="space-y-2">
            {reportData.strategy.details.map((detail, i) => (
              <li key={i} className="d-flex align-items-center gap-2">
                <span className="rounded-full bg-green-500" style={{ width: 8, height: 8, display: 'inline-block' }} />
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
          <table className="table table-sm table-hover">
            <thead>
              <tr>
                <th className="text-start">{locale === 'ja' ? '検索クエリ' : '검색 쿼리'}</th>
                <th className="text-end">{locale === 'ja' ? 'クリック' : '클릭'}</th>
                <th className="text-end">{locale === 'ja' ? '表示回数' : '노출수'}</th>
                <th className="text-end">CTR</th>
                <th className="text-end">{locale === 'ja' ? '順位' : '순위'}</th>
                <th className="text-center">{locale === 'ja' ? '評価' : '평가'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topKeywords.map((kw, i) => (
                <tr key={i}>
                  <td className="fw-medium">{kw.keyword}</td>
                  <td className="text-end">{kw.clicks}</td>
                  <td className="text-end">{kw.impressions.toLocaleString()}</td>
                  <td className="text-end">{kw.ctr}%</td>
                  <td className="text-end">{kw.position}</td>
                  <td className="text-center">
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
          <table className="table table-sm table-hover">
            <thead>
              <tr>
                <th className="text-start">{locale === 'ja' ? '検索クエリ' : '검색 쿼리'}</th>
                <th className="text-end">{locale === 'ja' ? 'クリック' : '클릭'}</th>
                <th className="text-end">{locale === 'ja' ? '表示回数' : '노출수'}</th>
                <th className="text-end">CTR</th>
                <th className="text-end">{locale === 'ja' ? '順位' : '순위'}</th>
                <th className="text-start">{locale === 'ja' ? '課題' : '과제'}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.improvementKeywords.map((kw, i) => (
                <tr key={i}>
                  <td className="fw-medium">{kw.keyword}</td>
                  <td className="text-end">{kw.clicks}</td>
                  <td className="text-end">{kw.impressions.toLocaleString()}</td>
                  <td className="text-end text-orange-600">{kw.ctr}%</td>
                  <td className="text-end">{kw.position}</td>
                  <td className="text-orange-700">{kw.issue[l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device & Region Analysis */}
      <div className="row g-4">
        {/* Device */}
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title d-flex align-items-center gap-2">
                <Smartphone size={20} className="text-primary" />
                {locale === 'ja' ? 'デバイス別分析' : '디바이스별 분석'}
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="d-flex justify-content-between text-sm mb-1">
                  <span>{locale === 'ja' ? 'モバイル' : '모바일'}</span>
                  <span>{reportData.deviceAnalysis.mobile.percentage}%</span>
                </div>
                <div className="progress" style={{ height: '1rem' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${reportData.deviceAnalysis.mobile.percentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between text-sm mb-1">
                  <span>{locale === 'ja' ? 'デスクトップ' : '데스크톱'}</span>
                  <span>{reportData.deviceAnalysis.desktop.percentage}%</span>
                </div>
                <div className="progress" style={{ height: '1rem' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${reportData.deviceAnalysis.desktop.percentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between text-sm mb-1">
                  <span>{locale === 'ja' ? 'タブレット' : '태블릿'}</span>
                  <span>{reportData.deviceAnalysis.tablet.percentage}%</span>
                </div>
                <div className="progress" style={{ height: '1rem' }}>
                  <div
                    className="progress-bar bg-purple-500"
                    style={{ width: `${reportData.deviceAnalysis.tablet.percentage}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-3">
                {locale === 'ja'
                  ? '💡 モバイルが過半数 → モバイルファースト対応が必須'
                  : '💡 모바일이 과반수 → 모바일 퍼스트 대응 필수'}
              </p>
            </div>
          </div>
        </div>

        {/* Region */}
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title d-flex align-items-center gap-2">
                <Globe size={20} className="text-primary" />
                {locale === 'ja' ? '国・地域別分析' : '국가/지역별 분석'}
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {reportData.regionAnalysis.map((region, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-lg">{region.flag}</span>
                      <span className="fw-medium">{region.name[l]}</span>
                    </div>
                    <div className="text-end">
                      <span className="fw-semibold">{region.clicks}</span>
                      <span className="text-gray-500 text-sm ms-2">({region.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {locale === 'ja'
                    ? '🎯 重要発見: 日本以外からのアクセスが3.7%存在 → インバウンドコンテンツの拡充機会'
                    : '🎯 중요 발견: 일본 외 접속이 3.7% 존재 → 인바운드 콘텐츠 확충 기회'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Targets */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title d-flex align-items-center gap-2">
            <Target size={20} className="text-primary" />
            {locale === 'ja' ? 'KPI目標設定' : 'KPI 목표 설정'}
          </h2>
        </div>
        <div className="card-body">
          <div className="row g-4">
            {/* Short term */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="fw-semibold text-blue-800 mb-2">
                  {locale === 'ja' ? '📅 短期（3ヶ月後）' : '📅 단기 (3개월 후)'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="d-flex justify-content-between">
                    <span>CTR</span>
                    <span>{reportData.kpiTargets.short.ctr.current}% → <strong>{reportData.kpiTargets.short.ctr.target}%</strong></span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>{locale === 'ja' ? 'クリック/月' : '클릭/월'}</span>
                    <span>{reportData.kpiTargets.short.clicks.current} → <strong>{reportData.kpiTargets.short.clicks.target}</strong></span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>{locale === 'ja' ? '平均順位' : '평균 순위'}</span>
                    <span>{reportData.kpiTargets.short.position.current} → <strong>{reportData.kpiTargets.short.position.target}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mid term */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="fw-semibold text-green-800 mb-2">
                  {locale === 'ja' ? '📅 中期（6ヶ月後）' : '📅 중기 (6개월 후)'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="d-flex justify-content-between">
                    <span>CTR</span>
                    <span>{reportData.kpiTargets.mid.ctr.current}% → <strong>{reportData.kpiTargets.mid.ctr.target}%</strong></span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>{locale === 'ja' ? 'クリック/月' : '클릭/월'}</span>
                    <span>{reportData.kpiTargets.mid.clicks.current} → <strong>{reportData.kpiTargets.mid.clicks.target}</strong></span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>{locale === 'ja' ? '平均順位' : '평균 순위'}</span>
                    <span>{reportData.kpiTargets.mid.position.current} → <strong>{reportData.kpiTargets.mid.position.target}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Long term */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h3 className="fw-semibold text-purple-800 mb-2">
                  {locale === 'ja' ? '📅 長期（12ヶ月後）' : '📅 장기 (12개월 후)'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="d-flex justify-content-between">
                    <span>CTR</span>
                    <span>{reportData.kpiTargets.long.ctr.current}% → <strong>{reportData.kpiTargets.long.ctr.target}%</strong></span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>{locale === 'ja' ? 'クリック/月' : '클릭/월'}</span>
                    <span>{reportData.kpiTargets.long.clicks.current} → <strong>{reportData.kpiTargets.long.clicks.target}</strong></span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>{locale === 'ja' ? '平均順位' : '평균 순위'}</span>
                    <span>{reportData.kpiTargets.long.position.current} → <strong>{reportData.kpiTargets.long.position.target}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AEO/GEO Section */}
      <div className="card bg-purple-50 border-purple-200">
        <div className="card-header">
          <h2 className="card-title text-purple-800">
            {locale === 'ja' ? '🤖 AI検索時代の対応戦略：AEO / GEO' : '🤖 AI 검색 시대 대응 전략: AEO / GEO'}
          </h2>
        </div>
        <div className="card-body">
          <div className="mb-3 p-3 bg-white\/50 rounded-lg">
            <p className="text-purple-700 fw-medium">
              {locale === 'ja'
                ? '重要な洞察: CTR低下は、タイトル・メタ説明の問題だけでなく、AI検索によるゼロクリック検索が影響している可能性が高い'
                : '중요한 인사이트: CTR 저하는 제목/메타 설명 문제뿐만 아니라, AI 검색으로 인한 제로클릭 검색이 영향을 미칠 가능성이 높음'}
            </p>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-lg">
                <h3 className="fw-semibold text-gray-800 mb-2">AEO (Answer Engine Optimization)</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• FAQ{locale === 'ja' ? '形式の導入' : ' 형식 도입'}</li>
                  <li>• {locale === 'ja' ? '構造化データ（Schema）' : '구조화 데이터(Schema)'}</li>
                  <li>• {locale === 'ja' ? '簡潔な回答文' : '간결한 답변문'}</li>
                  <li>• Featured Snippet{locale === 'ja' ? '狙い' : ' 노리기'}</li>
                </ul>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-lg">
                <h3 className="fw-semibold text-gray-800 mb-2">GEO (Generative Engine Optimization)</h3>
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
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-3">
        {locale === 'ja'
          ? 'レポート作成: マーケティングチーム | 次回レビュー: 2026年3月1日'
          : '리포트 작성: 마케팅팀 | 다음 리뷰: 2026년 3월 1일'}
      </div>
    </div>
  )
}
