'use client'

import { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan'
  loading?: boolean
}

const colorClasses = {
  blue: 'bg-blue-50 text-primary',
  green: 'bg-green-50 text-success',
  orange: 'bg-orange-50 text-warning',
  red: 'bg-red-50 text-danger',
  purple: 'bg-purple-50 text-purple',
  cyan: 'bg-cyan-50 text-cyan',
}

export default function StatCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color,
  loading = false
}: StatCardProps) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <div className="stat-card">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <p className="stat-label">{title}</p>
          {loading ? (
            <div className="mt-1 bg-gray-200 rounded animate-pulse" style={{ height: '2rem', width: '6rem' }} />
          ) : (
            <p className="stat-value mt-1">{value}</p>
          )}
          {loading ? (
            <div className="mt-2 bg-gray-100 rounded animate-pulse" style={{ height: '1rem', width: '5rem' }} />
          ) : trend !== undefined ? (
            <p className={`stat-trend mt-2 ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}>
              {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(trend)}%
              {trendLabel && <span className="text-gray-500 ms-1">{trendLabel}</span>}
            </p>
          ) : null}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
