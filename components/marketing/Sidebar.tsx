'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  Target,
  TrendingUp,
  Settings,
  LayoutDashboard,
  FileText,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  PenTool,
  Globe,
  Send,
  Code2,
  CalendarDays,
} from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: 'pending' | 'new' | 'beta'
  menuKey?: string
  subItems?: {
    name: string
    href: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    description?: string
  }[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    inbound: true,
    analytics: true,
  })

  const navigation: NavItem[] = [
    { name: t.dashboard, href: '/marketing', icon: LayoutDashboard },
    {
      name: t.inboundMarketing,
      href: '/marketing/strategy',
      icon: Globe,
      menuKey: 'inbound',
      subItems: [
        {
          name: t.contentStrategy,
          href: '/marketing/strategy',
          icon: Target,
          description: t.contentStrategyDesc
        },
        {
          name: t.contentProduction,
          href: '/marketing/actions/publishing',
          icon: PenTool,
          description: t.contentProductionDesc
        },
        {
          name: t.contentOptimizationMenu,
          href: '/marketing/content-optimization',
          icon: RefreshCw,
          description: t.contentOptimizationMenuDesc
        },
        {
          name: t.seoAnalysis,
          href: '/marketing/seo-report',
          icon: FileText,
          description: t.seoAnalysisDesc
        },
      ]
    },
    { name: t.outboundMarketing, href: '/marketing/sales-tracking', icon: Send },
    {
      name: t.analyticsMenu,
      href: '/marketing',
      icon: BarChart3,
      menuKey: 'analytics',
      subItems: [
        {
          name: t.performanceStatus,
          href: '/marketing',
          icon: TrendingUp,
          description: t.performanceStatusDesc
        },
        {
          name: t.kpiTracking,
          href: '/marketing/kpi',
          icon: Target,
          description: t.kpiTrackingDesc
        },
      ]
    },
    { name: t.devTasks, href: '/marketing/dev-tasks', icon: Code2 },
    { name: t.workLogs, href: '/marketing/work-logs', icon: CalendarDays },
    { name: t.settings, href: '/settings', icon: Settings },
  ]

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isItemActive = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some(sub =>
        pathname === sub.href ||
        (sub.href !== '/' && sub.href !== '/marketing' && pathname.startsWith(sub.href))
      )
    }
    return pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  }

  return (
    <aside className="d-flex flex-column bg-white border-end" style={{ width: '16rem' }}>
      {/* Logo */}
      <div className="d-flex align-items-center px-4 border-bottom" style={{ height: '4rem' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center bg-primary rounded-lg" style={{ width: '2rem', height: '2rem' }}>
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <div className="text-sm fw-bold text-gray-900">SEO Marketing</div>
            <div className="text-xs text-gray-500">KAFLIX CLOUD</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-fill p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = isItemActive(item)
          const hasSubItems = item.subItems && item.subItems.length > 0
          const menuKey = item.menuKey || item.name.toLowerCase()
          const isExpanded = expandedMenus[menuKey]

          if (hasSubItems) {
            return (
              <div key={menuKey}>
                {/* Parent menu item */}
                <button
                  onClick={() => toggleMenu(menuKey)}
                  className={`nav-item w-100 justify-content-between ${isActive ? 'active' : ''}`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {/* Sub menu items */}
                {isExpanded && (
                  <div className="ms-3 mt-1 space-y-1 border-start border-2 ps-2">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = subItem.href === '/marketing'
                        ? pathname === '/marketing'
                        : (pathname === subItem.href || pathname.startsWith(subItem.href))
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`d-flex align-items-center gap-2 px-2 py-1 text-sm rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-primary-lt text-primary fw-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <subItem.icon size={16} />
                          <div className="d-flex flex-column">
                            <span>{subItem.name}</span>
                            {subItem.description && (
                              <span className="text-xs text-gray-400">{subItem.description}</span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
              {item.badge === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-yellow-400 ml-auto" title="保留 / 보류" />
              )}
              {item.badge === 'new' && (
                <span className="w-2 h-2 rounded-full bg-green-500 ml-auto" title="New" />
              )}
              {item.badge === 'beta' && (
                <span className="w-2 h-2 rounded-full bg-blue-500 ml-auto" title="Beta" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Module Switch */}
      <div className="p-2 border-top">
        <Link
          href="/dashboard"
          className="d-flex align-items-center gap-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LayoutDashboard size={16} />
          <span>&larr; Kiosk CRM</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="p-3 border-top">
        <div className="text-xs text-gray-500 text-center">
          {t.analysisPeriod}: 2025/11/1 〜 2026/2/2
        </div>
      </div>
    </aside>
  )
}
