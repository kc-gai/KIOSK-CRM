'use client'

import { Target, Zap, Globe, Bot, Calendar, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

export default function StrategyPage() {
  const { t, locale } = useTranslation()

  const strategies = [
    {
      id: 'A',
      title: t.strategyA,
      subtitle: t.strategyADesc,
      color: 'blue',
      items: locale === 'ja'
        ? ['タイトル最適化', 'メタ説明改善', 'マイナ免許証強化']
        : ['타이틀 최적화', '메타 설명 개선', '마이나 면허증 강화'],
      product: 'REborn',
      icon: Zap
    },
    {
      id: 'B',
      title: t.strategyB,
      subtitle: t.strategyBDesc,
      color: 'green',
      items: locale === 'ja'
        ? ['国別ガイド制作', '多言語対応', '外国人対応強化']
        : ['국가별 가이드 제작', '다국어 대응', '외국인 대응 강화'],
      product: locale === 'ja' ? 'チェックイン機' : '체크인 기기',
      icon: Globe
    },
    {
      id: 'AEO/GEO',
      title: t.strategyAEO,
      subtitle: t.strategyAEODesc,
      color: 'purple',
      items: locale === 'ja'
        ? ['FAQ形式導入', 'Schema構造化データ', 'E-E-A-T強化']
        : ['FAQ 형식 도입', 'Schema 구조화 데이터', 'E-E-A-T 강화'],
      product: locale === 'ja' ? '全商品' : '전체 상품',
      icon: Bot
    }
  ]

  const seasonPlan = [
    { season: locale === 'ja' ? '桜シーズン（3-4月）' : '벚꽃 시즌 (3-4월)', publish: '1-2' + (locale === 'ja' ? '月' : '월'), status: 'active' },
    { season: locale === 'ja' ? 'GW（4月末-5月初）' : 'GW (4월말-5월초)', publish: '2-3' + (locale === 'ja' ? '月' : '월'), status: 'upcoming' },
    { season: locale === 'ja' ? '夏休み（7-8月）' : '여름휴가 (7-8월)', publish: '5-6' + (locale === 'ja' ? '月' : '월'), status: 'planned' },
    { season: locale === 'ja' ? '紅葉（9-11月）' : '단풍 (9-11월)', publish: '7-9' + (locale === 'ja' ? '月' : '월'), status: 'planned' },
    { season: locale === 'ja' ? '年末年始' : '연말연시', publish: '10-11' + (locale === 'ja' ? '月' : '월'), status: 'planned' },
  ]

  const quarterlyPlan = [
    { q: 'Q1', period: '2-4' + (locale === 'ja' ? '月' : '월'), theme: locale === 'ja' ? '春インバウンド + GW準備' : '봄 인바운드 + GW 준비', highlight: locale === 'ja' ? '桜→GW→夏' : '벚꽃→GW→여름' },
    { q: 'Q2', period: '5-7' + (locale === 'ja' ? '月' : '월'), theme: locale === 'ja' ? '東南アジア拡大 + 夏繁忙期' : '동남아 확대 + 여름 성수기', highlight: locale === 'ja' ? '夏→秋' : '여름→가을' },
    { q: 'Q3', period: '8-10' + (locale === 'ja' ? '月' : '월'), theme: locale === 'ja' ? '秋インバウンド + CTRリニューアル' : '가을 인바운드 + CTR 리뉴얼', highlight: locale === 'ja' ? '秋→年末' : '가을→연말' },
    { q: 'Q4', period: '11-1' + (locale === 'ja' ? '月' : '월'), theme: locale === 'ja' ? '冬インバウンド + 開業・システム' : '겨울 인바운드 + 창업·시스템', highlight: locale === 'ja' ? '年末→春' : '연말→봄' },
  ]

  const insights = locale === 'ja' ? [
    { finding: 'CTR 1.02%に微改善も依然低い', action: 'タイトル・メタ改善を最優先で継続' },
    { finding: '平均順位5.0位に悪化', action: 'コンテンツ質向上・内部リンク強化' },
    { finding: '台湾・香港から月50クリック', action: '繁体字LPの検討開始' },
    { finding: '韓国から月30クリック', action: '韓国人ドライバー記事を最優先' },
    { finding: 'モバイル54%に上昇', action: 'モバイルファースト対応強化' },
    { finding: 'ユーザー数11%増・PV2%減', action: '直帰率改善、回遊率向上施策' },
  ] : [
    { finding: 'CTR 1.02%로 미세 개선되었으나 여전히 낮음', action: '타이틀·메타 개선을 최우선으로 지속' },
    { finding: '평균 순위 5.0위로 악화', action: '콘텐츠 품질 향상·내부 링크 강화' },
    { finding: '대만·홍콩에서 월 50클릭', action: '번체자 LP 검토 시작' },
    { finding: '한국에서 월 30클릭', action: '한국인 드라이버 기사 최우선' },
    { finding: '모바일 54%로 상승', action: '모바일 퍼스트 대응 강화' },
    { finding: '사용자수 11%증·PV 2%감', action: '이탈률 개선, 회유율 향상 시책' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎯 {t.strategyTitle}</h1>
        <p className="text-gray-500 mt-1">
          {t.strategySubtitle}: A + B + AEO/GEO {locale === 'ja' ? 'の組み合わせ' : ' 조합'}
        </p>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="card">
            <div className={`h-2 bg-${strategy.color === 'blue' ? 'primary' : strategy.color === 'green' ? 'success' : 'purple'}`} />
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{strategy.title}</h3>
                  <p className="text-sm text-gray-500">{strategy.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${strategy.color === 'blue' ? 'blue' : strategy.color === 'green' ? 'green' : 'purple'}-50`}>
                  <strategy.icon className={`w-5 h-5 text-${strategy.color === 'blue' ? 'primary' : strategy.color}`} />
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {strategy.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{t.linkedProduct}:</span>
                <span className="ml-2 badge badge-info">{strategy.product}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Season Plan */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.seasonPlan}
          </h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.targetSeason}</th>
                  <th>{t.publishTiming}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {seasonPlan.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.season}</td>
                    <td>{item.publish}</td>
                    <td>
                      {item.status === 'active' && (
                        <span className="badge badge-success">✅ {t.inProgress}</span>
                      )}
                      {item.status === 'upcoming' && (
                        <span className="badge badge-warning">🟡 {t.inProduction}</span>
                      )}
                      {item.status === 'planned' && (
                        <span className="badge badge-info">⚪ {t.planned}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quarterly Plan */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t.quarterlyTheme}</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quarterlyPlan.map((item) => (
              <div key={item.q} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">{item.q}</span>
                  <span className="text-sm text-gray-500">{item.period}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{item.theme}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{item.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data-driven Insights */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔄 {t.dataInsights}</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{item.finding}</p>
                  <p className="text-sm text-primary mt-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
