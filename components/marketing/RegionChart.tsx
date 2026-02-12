'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// 지역별 색상 지정
const REGION_COLORS: { [key: string]: string } = {
  '🇹🇼 台湾': '#10b981',     // 녹색 (에메랄드)
  '🇰🇷 韓国': '#3b82f6',     // 파랑
  '🇺🇸 米国': '#6366f1',     // 인디고
  '🇭🇰 香港': '#f59e0b',     // 주황 (앰버)
  '🇬🇧 英国': '#ec4899',     // 핑크
  '🇲🇾 マレーシア': '#8b5cf6', // 보라
}

const data = [
  { name: '🇯🇵 日本', clicks: 5419, percent: 96.3 },
  { name: '🇹🇼 台湾', clicks: 36, percent: 0.6 },
  { name: '🇰🇷 韓国', clicks: 30, percent: 0.5 },
  { name: '🇺🇸 米国', clicks: 23, percent: 0.4 },
  { name: '🇭🇰 香港', clicks: 17, percent: 0.3 },
  { name: '🇬🇧 英国', clicks: 10, percent: 0.2 },
  { name: '🇲🇾 マレーシア', clicks: 10, percent: 0.2 },
]

export default function RegionChart() {
  // 海外のみ表示（日本を除く）
  const overseasData = data.filter(d => d.name !== '🇯🇵 日本')
  const totalOverseas = overseasData.reduce((sum, d) => sum + d.clicks, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">🌏 地域別クリック（海外）</h3>
        <span className="badge badge-info">{totalOverseas}クリック (3.7%)</span>
      </div>
      <div className="card-body">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={overseasData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0}クリック`]}
              />
              <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                {overseasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REGION_COLORS[entry.name] || '#206bc4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* 범례 추가 */}
        <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs">
          {overseasData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: REGION_COLORS[entry.name] }}
              />
              <span>{entry.name.replace(/🇹🇼|🇰🇷|🇺🇸|🇭🇰|🇬🇧|🇲🇾/g, '').trim()}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>インサイト:</strong> 中華圏（台湾+香港）から月約50クリック、
            韓国から月約30クリックの潜在需要あり
          </p>
        </div>
      </div>
    </div>
  )
}
