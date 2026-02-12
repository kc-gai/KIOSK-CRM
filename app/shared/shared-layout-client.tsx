'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface SharedLayoutClientProps {
    userName: string
    userEmail: string
    children: React.ReactNode
}

export function SharedLayoutClient({ userName, userEmail, children }: SharedLayoutClientProps) {
    const locale = useLocale()
    const isJa = locale === 'ja'

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
            {/* Header — 게이트와 동일 스타일 */}
            <header className="bg-dark text-white" style={{ height: '56px' }}>
                <div className="d-flex align-items-center justify-content-between h-100 px-4">
                    <div className="d-flex align-items-center gap-3">
                        <Link href="/" className="text-decoration-none d-flex align-items-center gap-2">
                            <span className="badge bg-primary text-white p-2">
                                <i className="ti ti-layout-grid" style={{ fontSize: '1.2rem' }}></i>
                            </span>
                            <span className="fw-bold fs-4 text-white">KC Unified CRM</span>
                        </Link>
                        <span className="text-muted mx-2">|</span>
                        <Link href="/" className="btn btn-ghost-light btn-sm text-white d-flex align-items-center gap-1">
                            <i className="ti ti-arrow-left"></i>
                            {isJa ? 'ゲートへ戻る' : '게이트로 돌아가기'}
                        </Link>
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
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="container-xl py-4">
                {children}
            </div>

            {/* Footer */}
            <div className="text-center py-3 border-top">
                <small className="text-muted">
                    © 2024-2026 KC Unified CRM v2.0.0 · Powered by KAFLIXCLOUD
                </small>
            </div>
        </div>
    )
}
