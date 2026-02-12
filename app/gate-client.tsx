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

export function GateClient({ userName, userEmail, kioskStats, marketingStats }: GateClientProps) {
    const t = useTranslations()

    const modules = [
        {
            id: 'kiosk',
            title: 'Kiosk Asset CRM',
            titleJa: 'キオスク資産管理',
            titleKo: '키오스크 자산관리',
            description: '키오스크 자산·발주·납품·거래처 통합 관리',
            descriptionJa: 'キオスク資産・発注・納品・取引先統合管理',
            href: '/dashboard',
            icon: 'ti-device-desktop',
            color: 'blue',
            status: 'active' as const,
            stats: [
                { label: '총 키오스크', labelJa: '総キオスク', value: kioskStats.totalKiosks },
                { label: '배치 완료', labelJa: '配置済', value: kioskStats.deployedKiosks },
                { label: '진행중 발주', labelJa: '進行中発注', value: kioskStats.pendingOrders },
                { label: '거래처', labelJa: '取引先', value: kioskStats.totalCorporations },
            ]
        },
        {
            id: 'marketing',
            title: 'Marketing SEO CRM',
            titleJa: 'マーケティングSEO CRM',
            titleKo: '마케팅 SEO CRM',
            description: '영업 추적·이메일 캠페인·콘텐츠·KPI 관리',
            descriptionJa: '営業追跡・メールキャンペーン・コンテンツ・KPI管理',
            href: '/marketing',
            icon: 'ti-chart-line',
            color: 'green',
            status: 'active' as const,
            stats: [
                { label: '관리 업체', labelJa: '管理企業', value: marketingStats.totalCompanies },
                { label: '발송 메일', labelJa: '送信メール', value: marketingStats.emailsSent },
                { label: '콘텐츠 플랜', labelJa: 'コンテンツプラン', value: marketingStats.contentPlans },
                { label: '작업일지', labelJa: '作業日誌', value: marketingStats.workLogs },
            ]
        },
        {
            id: 'hr',
            title: 'HR Management',
            titleJa: '人事管理',
            titleKo: '인사관리',
            description: '직원 관리·근태·평가 (예정)',
            descriptionJa: '社員管理・勤怠・評価（予定）',
            href: '#',
            icon: 'ti-users-group',
            color: 'purple',
            status: 'planned' as const,
            stats: []
        },
        {
            id: 'finance',
            title: 'Finance',
            titleJa: '経理・財務',
            titleKo: '경리·재무',
            description: '매출·비용·청구서 관리 (예정)',
            descriptionJa: '売上・費用・請求書管理（予定）',
            href: '#',
            icon: 'ti-report-money',
            color: 'yellow',
            status: 'planned' as const,
            stats: []
        },
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
                            title="로그아웃"
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
                        통합 업무 관리 시스템 · 統合業務管理システム
                    </p>
                </div>

                {/* Module Cards */}
                <div className="row g-4 justify-content-center">
                    {modules.map((mod) => (
                        <div key={mod.id} className="col-12 col-md-6 col-lg-6 col-xl-3">
                            {mod.status === 'active' ? (
                                <Link href={mod.href} className="text-decoration-none">
                                    <ModuleCard module={mod} />
                                </Link>
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
                        공통 모듈 · 共通モジュール
                    </h3>
                    <div className="row g-3">
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                            <Link href="/dashboard/regions" className="text-decoration-none">
                                <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                    <i className="ti ti-map-pin text-primary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                    <div className="small fw-medium">지역관리</div>
                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>地域管理</div>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                            <Link href="/dashboard/accounts" className="text-decoration-none">
                                <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                    <i className="ti ti-users text-primary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                    <div className="small fw-medium">계정관리</div>
                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>アカウント管理</div>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                            <Link href="/dashboard/work-logs" className="text-decoration-none">
                                <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                    <i className="ti ti-clock-record text-primary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                    <div className="small fw-medium">작업일지</div>
                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>作業日誌</div>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                            <Link href="/dashboard/dev-tasks" className="text-decoration-none">
                                <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                    <i className="ti ti-list-check text-primary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                    <div className="small fw-medium">개발현황</div>
                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>開発状況</div>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                            <Link href="/dashboard/api-settings" className="text-decoration-none">
                                <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                    <i className="ti ti-plug text-primary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                    <div className="small fw-medium">API 설정</div>
                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>API設定</div>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
                            <Link href="/dashboard/ai-search" className="text-decoration-none">
                                <div className="card card-sm text-center py-3 h-100" style={{ cursor: 'pointer' }}>
                                    <i className="ti ti-sparkles text-primary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                    <div className="small fw-medium">AI 검색</div>
                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>AI検索</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-5 pt-4 border-top">
                    <small className="text-muted">
                        © 2024-2026 KC Unified CRM v2.0.0 · Developed by gai · Powered by KAFLIXCLOUD
                    </small>
                </div>
            </div>
        </div>
    )
}

function ModuleCard({ module }: { module: {
    id: string
    title: string
    titleKo: string
    description: string
    descriptionJa: string
    icon: string
    color: string
    status: 'active' | 'planned'
    stats: { label: string; labelJa: string; value: number }[]
}}) {
    const isPlanned = module.status === 'planned'

    return (
        <div
            className={`card h-100 ${isPlanned ? 'opacity-50' : ''}`}
            style={{
                cursor: isPlanned ? 'default' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: isPlanned ? '1px dashed #cbd5e1' : `2px solid var(--tblr-${module.color})`,
            }}
            onMouseEnter={(e) => {
                if (!isPlanned) {
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
                        <span className="badge bg-secondary-lt">Coming Soon</span>
                    ) : (
                        <span className={`badge bg-${module.color}-lt`}>
                            <i className="ti ti-circle-filled me-1" style={{ fontSize: '0.5rem' }}></i>
                            Active
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>{module.title}</h3>
                <p className="text-muted small mb-0">{module.titleKo}</p>
                <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>{module.description}</p>

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

                {/* Planned placeholder */}
                {isPlanned && (
                    <div className="text-center py-3">
                        <i className="ti ti-clock text-muted" style={{ fontSize: '2rem' }}></i>
                        <p className="text-muted small mt-2 mb-0">{module.descriptionJa}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isPlanned && (
                <div className={`card-footer bg-${module.color}-lt text-center py-2`}>
                    <span className={`text-${module.color} fw-medium small`}>
                        <i className="ti ti-arrow-right me-1"></i>
                        모듈 열기 · モジュールを開く
                    </span>
                </div>
            )}
        </div>
    )
}
