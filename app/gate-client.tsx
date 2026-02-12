'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface GateClientProps {
    userName: string
    userEmail: string
    kioskStats: {
        totalKiosks: number
        deployedKiosks: number
        pendingOrders: number
        totalCorporations: number
    }
    marketingStats: {
        totalCompanies: number
        emailsSent: number
        contentPlans: number
        workLogs: number
    }
}

type ModuleStatus = 'active' | 'external' | 'planned'

interface FeatureItem {
    icon: string
    title: string
    desc: string
}

interface ModuleData {
    id: string
    title: string
    subtitle: string
    description: string
    href: string
    icon: string
    color: string
    status: ModuleStatus
    progress: number
    stats: { label: string; value: number }[]
    features?: FeatureItem[]
}

export function GateClient({ userName, userEmail, kioskStats, marketingStats }: GateClientProps) {
    const t = useTranslations('gate')

    const modules: ModuleData[] = [
        {
            id: 'kiosk',
            title: 'Kiosk Asset CRM',
            subtitle: t('kioskSubtitle'),
            description: t('kioskDesc'),
            href: '/dashboard',
            icon: 'ti-device-desktop',
            color: 'blue',
            status: 'active',
            progress: 90,
            stats: [
                { label: t('totalKiosks'), value: kioskStats.totalKiosks },
                { label: t('deployedKiosks'), value: kioskStats.deployedKiosks },
                { label: t('pendingOrders'), value: kioskStats.pendingOrders },
                { label: t('totalCorporations'), value: kioskStats.totalCorporations },
            ]
        },
        {
            id: 'marketing',
            title: 'Marketing SEO CRM',
            subtitle: t('marketingSubtitle'),
            description: t('marketingDesc'),
            href: '/marketing',
            icon: 'ti-chart-line',
            color: 'green',
            status: 'active',
            progress: 70,
            stats: [
                { label: t('totalCompanies'), value: marketingStats.totalCompanies },
                { label: t('emailsSent'), value: marketingStats.emailsSent },
                { label: t('contentPlans'), value: marketingStats.contentPlans },
                { label: t('workLogCount'), value: marketingStats.workLogs },
            ]
        },
        {
            id: 'pdf-tool',
            title: 'PDF Original Maker',
            subtitle: t('pdfSubtitle'),
            description: t('pdfDesc'),
            href: 'https://kc-presentation.vercel.app',
            icon: 'ti-file-type-pdf',
            color: 'red',
            status: 'external',
            progress: 50,
            stats: [],
            features: [
                {
                    icon: 'ti-file-pencil',
                    title: t('pdfFeature1Title'),
                    desc: t('pdfFeature1Desc'),
                },
                {
                    icon: 'ti-language',
                    title: t('pdfFeature2Title'),
                    desc: t('pdfFeature2Desc'),
                },
            ]
        },
        {
            id: 'contract',
            title: 'Contract Manager',
            subtitle: t('contractSubtitle'),
            description: t('contractDesc'),
            href: '#',
            icon: 'ti-file-invoice',
            color: 'orange',
            status: 'planned',
            progress: 0,
            stats: []
        },
        {
            id: 'sales-dashboard',
            title: 'Sales Dashboard',
            subtitle: t('salesDashSubtitle'),
            description: t('salesDashDesc'),
            href: '#',
            icon: 'ti-presentation-analytics',
            color: 'cyan',
            status: 'planned',
            progress: 0,
            stats: []
        },
        {
            id: 'weekly-meeting',
            title: 'Weekly Meeting Board',
            subtitle: t('weeklyMeetingSubtitle'),
            description: t('weeklyMeetingDesc'),
            href: '#',
            icon: 'ti-clipboard-text',
            color: 'indigo',
            status: 'planned',
            progress: 0,
            stats: []
        },
        {
            id: 'deepl-bot',
            title: 'Deepl Interpreter Bot',
            subtitle: t('deeplBotSubtitle'),
            description: t('deeplBotDesc'),
            href: '#',
            icon: 'ti-language-hiragana',
            color: 'pink',
            status: 'planned',
            progress: 0,
            stats: []
        },
    ]

    const sharedModules = [
        { href: '/dashboard/regions', icon: 'ti-map-pin', label: t('regionMgmt') },
        { href: '/dashboard/accounts', icon: 'ti-users', label: t('accountMgmt') },
        { href: '/shared/work-logs', icon: 'ti-clock-record', label: t('workLogs') },
        { href: '/shared/dev-tasks', icon: 'ti-list-check', label: t('devStatus') },
        { href: '/dashboard/api-settings', icon: 'ti-plug', label: t('apiSettings') },
        { href: '/dashboard/ai-search', icon: 'ti-sparkles', label: t('aiSearch') },
    ]

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
            {/* Header */}
            <header className="bg-dark text-white" style={{ height: '56px' }}>
                <div className="d-flex align-items-center justify-content-between h-100 px-4">
                    <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-primary text-white p-2">
                            <i className="ti ti-layout-grid" style={{ fontSize: '1.2rem' }}></i>
                        </span>
                        <span className="fw-bold fs-4">KC Unified CRM</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <LanguageSwitcher />
                        <div className="d-flex align-items-center gap-2">
                            <span className="avatar avatar-sm bg-blue rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                {userName?.charAt(0) || 'U'}
                            </span>
                            <div className="d-none d-sm-block">
                                <div className="small text-white">{userName}</div>
                                <div className="small text-muted" style={{ fontSize: '0.7rem' }}>{userEmail}</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-ghost-light btn-sm text-white"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            title={t('logout')}
                        >
                            <i className="ti ti-logout"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container-xl py-5">
                {/* Welcome Section */}
                <div className="text-center mb-5">
                    <h1 className="fw-bold mb-2" style={{ fontSize: '2rem', color: '#1e293b' }}>
                        KAFLIX CLOUD CRM
                    </h1>
                    <p className="text-muted fs-5">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Module Cards */}
                <div className="row g-4 justify-content-center">
                    {modules.map((mod) => (
                        <div key={mod.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                            {(mod.status === 'active' || mod.status === 'external') ? (
                                <a href={mod.href} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                    <ModuleCard module={mod} />
                                </a>
                            ) : (
                                <ModuleCard module={mod} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Shared Resources */}
                <div className="mt-5">
                    <h3 className="fw-bold mb-3" style={{ color: '#475569' }}>
                        <i className="ti ti-share me-2"></i>
                        {t('sharedModules')}
                    </h3>
                    <div className="row g-3">
                        {sharedModules.map((item) => (
                            <div key={item.href} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                <Link href={item.href} className="text-decoration-none">
                                    <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                        <i className={`ti ${item.icon} text-primary mb-1`} style={{ fontSize: '1.5rem' }}></i>
                                        <div className="small fw-medium">{item.label}</div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-5 pt-4 border-top">
                    <small className="text-muted">
                        &copy; 2024-2026 KC Unified CRM v2.0.0 &middot; Developed by gai &middot; Powered by KAFLIXCLOUD
                    </small>
                </div>
            </div>
        </div>
    )
}

function ModuleCard({ module }: { module: ModuleData }) {
    const t = useTranslations('gate')
    const isPlanned = module.status === 'planned'
    const isExternal = module.status === 'external'
    const isClickable = module.status === 'active' || module.status === 'external'

    return (
        <div
            className={`card h-100 ${isPlanned ? 'opacity-50' : ''}`}
            style={{
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: isPlanned ? '1px dashed #cbd5e1' : `2px solid var(--tblr-${module.color})`,
            }}
            onMouseEnter={(e) => {
                if (isClickable) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
            }}
        >
            <div className="card-body p-4">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className={`avatar bg-${module.color} text-white`} style={{ width: '48px', height: '48px' }}>
                        <i className={`ti ${module.icon}`} style={{ fontSize: '1.5rem' }}></i>
                    </span>
                    {isPlanned ? (
                        <span className="badge bg-secondary-lt">{t('comingSoon')}</span>
                    ) : isExternal ? (
                        <span className="badge bg-red-lt text-red">
                            <i className="ti ti-circle-filled me-1" style={{ fontSize: '0.5rem' }}></i>
                            {t('external')}
                        </span>
                    ) : (
                        <span className={`badge bg-${module.color}-lt`}>
                            <i className="ti ti-circle-filled me-1" style={{ fontSize: '0.5rem' }}></i>
                            {t('active')}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>{module.title}</h3>
                <p className="text-muted small mb-0">{module.subtitle}</p>
                <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>{module.description}</p>

                {/* Progress */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{t('completion')}</span>
                        <span className={`fw-bold text-${module.color}`} style={{ fontSize: '0.75rem' }}>{module.progress}%</span>
                    </div>
                    <div className="progress progress-sm" style={{ height: '6px' }}>
                        <div
                            className={`progress-bar bg-${module.color}`}
                            style={{ width: `${module.progress}%` }}
                            role="progressbar"
                            aria-valuenow={module.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                </div>

                {/* Stats */}
                {module.stats.length > 0 && (
                    <div className="row g-2">
                        {module.stats.map((stat, idx) => (
                            <div key={idx} className="col-6">
                                <div className={`bg-${module.color}-lt rounded p-2 text-center`}>
                                    <div className="h3 mb-0">{stat.value}</div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Features */}
                {module.features && module.features.length > 0 && (
                    <div className="d-flex flex-column gap-2">
                        {module.features.map((feat, idx) => (
                            <div key={idx} className={`bg-${module.color}-lt rounded p-3 d-flex align-items-start gap-3`}>
                                <span className={`avatar avatar-sm bg-${module.color} text-white flex-shrink-0`} style={{ width: '36px', height: '36px' }}>
                                    <i className={`ti ${feat.icon}`} style={{ fontSize: '1.1rem' }}></i>
                                </span>
                                <div>
                                    <div className="fw-bold small mb-1">{feat.title}</div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>{feat.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Planned placeholder */}
                {isPlanned && (
                    <div className="text-center py-3">
                        <i className="ti ti-clock text-muted" style={{ fontSize: '2rem' }}></i>
                        <p className="text-muted small mt-2 mb-0">{module.description}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`card-footer bg-${module.color}-lt text-center py-2`}>
                <span className={`text-${module.color} fw-medium small`}>
                    {isPlanned ? (
                        <><i className="ti ti-clock me-1"></i>{t('preparing')}</>
                    ) : (
                        <><i className="ti ti-external-link me-1"></i>{t('openExternal')}</>
                    )}
                </span>
            </div>
        </div>
    )
}
