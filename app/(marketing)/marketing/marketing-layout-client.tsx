'use client'

import './marketing.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { TranslationProvider, useTranslation } from '@/lib/translations'

function MarketingSidebar() {
    const pathname = usePathname()
    const { t } = useTranslation()
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        inbound: true,
        analytics: true,
    })

    const toggleMenu = (key: string) => {
        setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const isActive = (href: string) => {
        if (href === '/marketing') return pathname === '/marketing'
        return pathname === href || pathname.startsWith(href)
    }

    const menus = [
        {
            key: 'dashboard',
            icon: 'ti-layout-dashboard',
            label: t.dashboard,
            href: '/marketing',
        },
        {
            key: 'inbound',
            icon: 'ti-world',
            label: t.inboundMarketing,
            children: [
                { icon: 'ti-target', label: t.contentStrategy, href: '/marketing/strategy', desc: t.contentStrategyDesc },
                { icon: 'ti-pencil', label: t.contentProduction, href: '/marketing/actions/publishing', desc: t.contentProductionDesc },
                { icon: 'ti-refresh', label: t.contentOptimizationMenu, href: '/marketing/content-optimization', desc: t.contentOptimizationMenuDesc },
                { icon: 'ti-file-analytics', label: t.seoAnalysis, href: '/marketing/seo-report', desc: t.seoAnalysisDesc },
            ],
        },
        {
            key: 'outbound',
            icon: 'ti-send',
            label: t.outboundMarketing,
            href: '/marketing/sales-tracking',
        },
        {
            key: 'analytics',
            icon: 'ti-chart-bar',
            label: t.analyticsMenu,
            children: [
                { icon: 'ti-trending-up', label: t.performanceStatus, href: '/marketing', desc: t.performanceStatusDesc },
                { icon: 'ti-target', label: t.kpiTracking, href: '/marketing/kpi', desc: t.kpiTrackingDesc },
            ],
        },
        {
            key: 'dev-tasks',
            icon: 'ti-code',
            label: t.devTasks,
            href: '/marketing/dev-tasks',
        },
        {
            key: 'work-logs',
            icon: 'ti-calendar-event',
            label: t.workLogs,
            href: '/marketing/work-logs',
        },
        {
            key: 'settings',
            icon: 'ti-settings',
            label: t.settings,
            href: '/dashboard/api-settings',
        },
    ]

    return (
        <aside
            className="bg-white border-end"
            style={{
                width: '240px',
                minWidth: '240px',
                height: 'calc(100vh - 48px)',
                overflowY: 'auto',
            }}
        >
            {/* Module Logo */}
            <div className="px-3 py-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-blue text-white p-2" style={{ fontSize: '1rem' }}>
                        <i className="ti ti-chart-line"></i>
                    </span>
                    <div>
                        <div className="fw-bold small">SEO Marketing</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>KAFLIX CLOUD</div>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="p-2">
                {menus.map(menu => {
                    const hasChildren = menu.children && menu.children.length > 0
                    const isExpanded = expandedMenus[menu.key]
                    const isParentActive = hasChildren
                        ? menu.children!.some(c => isActive(c.href))
                        : isActive(menu.href!)

                    if (hasChildren) {
                        return (
                            <div key={menu.key} className="mb-1">
                                <button
                                    onClick={() => toggleMenu(menu.key)}
                                    className={`btn w-100 text-start d-flex align-items-center justify-content-between py-2 px-3 ${isParentActive ? 'btn-primary' : 'btn-ghost-secondary'}`}
                                    style={{ borderRadius: '6px', fontSize: '0.85rem' }}
                                >
                                    <span className="d-flex align-items-center gap-2">
                                        <i className={`ti ${menu.icon}`} style={{ fontSize: '1.1rem' }}></i>
                                        <span>{menu.label}</span>
                                    </span>
                                    <i className={`ti ${isExpanded ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontSize: '0.75rem' }}></i>
                                </button>

                                {isExpanded && (
                                    <div className="ms-3 mt-1 ps-3" style={{ borderLeft: '2px solid #e9ecef' }}>
                                        {menu.children!.map(child => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={`btn w-100 text-start d-flex align-items-center gap-2 py-2 px-2 text-decoration-none mb-1 ${isActive(child.href) ? 'btn-soft-primary fw-medium' : 'btn-ghost-secondary'}`}
                                                style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                                            >
                                                <i className={`ti ${child.icon}`} style={{ fontSize: '0.95rem' }}></i>
                                                <div>
                                                    <div>{child.label}</div>
                                                    {child.desc && (
                                                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{child.desc}</div>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={menu.key}
                            href={menu.href!}
                            className={`btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 mb-1 text-decoration-none ${isParentActive ? 'btn-soft-primary fw-medium' : 'btn-ghost-secondary'}`}
                            style={{ borderRadius: '6px', fontSize: '0.85rem' }}
                        >
                            <i className={`ti ${menu.icon}`} style={{ fontSize: '1.1rem' }}></i>
                            <span>{menu.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Module Switch */}
            <div className="p-2 border-top mt-auto">
                <Link
                    href="/"
                    className="btn btn-ghost-secondary w-100 text-start d-flex align-items-center gap-2 py-2 px-3 text-decoration-none"
                    style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                >
                    <i className="ti ti-layout-grid"></i>
                    <span>← Gate</span>
                </Link>
            </div>
        </aside>
    )
}

export function MarketingLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <TranslationProvider>
            <div className="d-flex">
                <MarketingSidebar />
                <div className="flex-grow-1 p-4" style={{ minHeight: 'calc(100vh - 100px)' }}>
                    {children}
                </div>
            </div>
        </TranslationProvider>
    )
}
