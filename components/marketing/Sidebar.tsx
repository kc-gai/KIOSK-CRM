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
  icon: React.ComponentType<{ className?: string }>
  badge?: 'pending' | 'new' | 'beta'
  menuKey?: string
  subItems?: {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">SEO Marketing</div>
            <div className="text-xs text-gray-500">KAFLIX CLOUD</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
                  className={`nav-item w-full justify-between ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Sub menu items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = subItem.href === '/marketing'
                        ? pathname === '/marketing'
                        : (pathname === subItem.href || pathname.startsWith(subItem.href))
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <div className="flex flex-col">
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
              <item.icon className="w-5 h-5" />
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
      <div className="p-3 border-t border-gray-200">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>← Kiosk CRM</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {t.analysisPeriod}: 2025/11/1 〜 2026/2/2
        </div>
      </div>
    </aside>
  )
}
