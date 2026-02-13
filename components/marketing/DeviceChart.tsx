'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'モバイル', value: 3056, percent: 54.3, color: '#206bc4' },
  { name: 'デスクトップ', value: 2524, percent: 44.8, color: '#2fb344' },
  { name: 'タブレット', value: 49, percent: 0.9, color: '#f59f00' },
]

export default function DeviceChart() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📱 デバイス別分布</h3>
      </div>
      <div className="card-body">
        <div style={{ height: '16rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) => [
                  `${(value ?? 0).toLocaleString()}クリック`,
                  name ?? ''
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle"
                  style={{ width: '0.75rem', height: '0.75rem', backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="text-sm">
                <span className="fw-medium">{item.percent}%</span>
                <span className="text-gray-400 ms-2">({item.value.toLocaleString()})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
