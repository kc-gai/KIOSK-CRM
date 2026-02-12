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
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          {loading ? (
            <div className="mt-1 h-8 w-24 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="stat-value mt-1">{value}</p>
          )}
          {loading ? (
            <div className="mt-2 h-4 w-20 bg-gray-100 rounded animate-pulse" />
          ) : trend !== undefined ? (
            <p className={`stat-trend mt-2 ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}>
              {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(trend)}%
              {trendLabel && <span className="text-gray-500 ml-1">{trendLabel}</span>}
            </p>
          ) : null}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
