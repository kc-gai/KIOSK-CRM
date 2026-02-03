'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { signOut } from 'next-auth/react'

interface MenuItem {
    id: string
    href: string
    icon: string
    label: string
    adminOnly?: boolean
}

interface NavItem {
    href?: string
    icon?: string
    label: string
    adminOnly?: boolean
}

interface TopNavigationProps {
    menuItems: MenuItem[]
    isAdmin: boolean
    userName: string
    userEmail: string
    userRole?: string
    allowedMenus?: string[]
    settingsItems?: NavItem[]
    logoutLabel?: string
}

const getMenuKey = (href: string): string => {
    const parts = href.split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || ''
}

export function TopNavigation({
    menuItems,
    isAdmin,
    userName,
    userEmail,
    userRole = 'ADMIN',
    allowedMenus = [],
    settingsItems = [],
    logoutLabel = '로그아웃'
}: TopNavigationProps) {
    const [adminMenuOpen, setAdminMenuOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    // 메뉴 접근 권한 체크
    const canAccessMenu = (item: MenuItem | NavItem): boolean => {
        if (userRole === 'ADMIN') return true
        if (item.adminOnly) return false
        if (userRole === 'EXTERNAL') {
            if (!('href' in item) || !item.href) return false
            const menuKey = getMenuKey(item.href)
            return allowedMenus.includes(menuKey)
        }
        return true
    }

    // 현재 경로가 메뉴와 일치하는지 확인
    const isActive = (href: string): boolean => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    // 필터링된 메뉴
    const filteredMenuItems = menuItems.filter(item => canAccessMenu(item))
    const filteredSettingsItems = settingsItems.filter(item => canAccessMenu(item))

    return (
        <>
            {/* Top Navigation Bar */}
            <header
                className="bg-dark text-white"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1001,
                    height: '48px'
                }}
            >
                <div className="d-flex align-items-center h-100 px-3">
                    {/* Mobile Hamburger Button */}
                    <button
                        className="btn btn-ghost-light text-white d-lg-none me-2 p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ border: 'none' }}
                    >
                        <i className={`ti ${mobileMenuOpen ? 'ti-x' : 'ti-menu-2'}`} style={{ fontSize: '1.2rem' }}></i>
                    </button>

                    {/* Logo */}
                    <Link href="/dashboard" className="d-flex align-items-center text-decoration-none text-white me-4">
                        <span className="badge bg-blue text-white me-2 p-2">
                            <i className="ti ti-device-desktop" style={{ fontSize: '1rem' }}></i>
                        </span>
                        <span className="fw-bold d-none d-sm-inline">Kiosk CRM</span>
                    </Link>

                    {/* Menu Items - Desktop Only */}
                    <nav className="d-none d-lg-flex align-items-center gap-1 flex-grow-1">
                        {filteredMenuItems.map(item => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`btn btn-ghost-light text-white px-3 py-2 d-flex align-items-center gap-2 text-decoration-none ${isActive(item.href) ? 'bg-primary' : ''}`}
                                style={{
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <i className={`ti ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Spacer for mobile */}
                    <div className="flex-grow-1 d-lg-none"></div>

                    {/* Right Side - User Info & Language */}
                    <div className="d-flex align-items-center gap-3">
                        <LanguageSwitcher />
                        {/* Admin Dropdown with Settings */}
                        <div
                            className="position-relative"
                            onMouseEnter={() => setAdminMenuOpen(true)}
                            onMouseLeave={() => setAdminMenuOpen(false)}
                        >
                            <button
                                className={`btn btn-ghost-light text-white d-flex align-items-center gap-2 px-2 py-1 ${adminMenuOpen ? 'bg-primary' : ''}`}
                                style={{ border: 'none', borderRadius: '4px' }}
                            >
                                <span className="avatar avatar-sm bg-blue rounded d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                                    {userName?.charAt(0) || 'A'}
                                </span>
                                <span className="small d-none d-sm-inline">{userName || 'Admin'}</span>
                                <i className="ti ti-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                            </button>

                            {/* Admin Dropdown Menu */}
                            {adminMenuOpen && (
                                <div
                                    className="position-absolute bg-white shadow-lg rounded"
                                    style={{
                                        top: '100%',
                                        right: 0,
                                        minWidth: '200px',
                                        zIndex: 1002,
                                        border: '1px solid #e6e8eb',
                                        paddingTop: '4px'
                                    }}
                                >
                                    {/* 사용자 정보 */}
                                    <div className="px-3 py-2 border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
                                        <div className="small fw-medium">{userName}</div>
                                        <div className="small text-muted">{userEmail}</div>
                                    </div>
                                    {filteredSettingsItems.map((item, idx) => (
                                        <Link
                                            key={idx}
                                            href={item.href || '#'}
                                            className="btn btn-ghost-secondary w-100 text-start d-flex align-items-center py-2 text-decoration-none"
                                            style={{
                                                borderRadius: 0,
                                                borderBottom: '1px solid #f0f0f0',
                                                paddingLeft: '12px',
                                                paddingRight: '12px'
                                            }}
                                            onClick={() => setAdminMenuOpen(false)}
                                        >
                                            <i className={`ti ${item.icon} text-muted me-2`} style={{ width: '16px', textAlign: 'center' }}></i>
                                            <span className="flex-grow-1">{item.label}</span>
                                        </Link>
                                    ))}
                                    {/* 로그아웃 버튼 */}
                                    <button
                                        className="btn btn-ghost-danger w-100 text-start d-flex align-items-center py-2"
                                        onClick={() => {
                                            signOut({ callbackUrl: '/login' })
                                        }}
                                        style={{
                                            borderRadius: 0,
                                            paddingLeft: '12px',
                                            paddingRight: '12px'
                                        }}
                                    >
                                        <i className="ti ti-logout text-danger me-2" style={{ width: '16px', textAlign: 'center' }}></i>
                                        <span className="flex-grow-1 text-danger">{logoutLabel}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="d-lg-none"
                        style={{
                            position: 'fixed',
                            top: '48px',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1050
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Menu Drawer */}
                    <div
                        className="d-lg-none bg-white shadow-lg"
                        style={{
                            position: 'fixed',
                            top: '48px',
                            left: 0,
                            width: '280px',
                            maxWidth: '85vw',
                            height: 'calc(100vh - 48px)',
                            overflowY: 'auto',
                            zIndex: 1051
                        }}
                    >
                        {/* User Info */}
                        <div className="p-3 bg-light border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <span className="avatar avatar-md bg-blue rounded">{userName?.charAt(0) || 'A'}</span>
                                <div>
                                    <div className="fw-medium">{userName}</div>
                                    <div className="small text-muted">{userEmail}</div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="border-bottom">
                            {filteredMenuItems.map(item => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`btn w-100 text-start d-flex align-items-center py-2 px-3 text-decoration-none ${isActive(item.href) ? 'btn-primary' : 'btn-ghost-secondary'}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    style={{ borderRadius: 0 }}
                                >
                                    <i className={`ti ${item.icon} me-2`} style={{ width: '20px' }}></i>
                                    <span className="flex-grow-1">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Settings */}
                        {filteredSettingsItems.length > 0 && (
                            <div className="border-bottom">
                                <div className="px-3 py-2 bg-light fw-medium small text-muted">설정</div>
                                {filteredSettingsItems.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        href={item.href || '#'}
                                        className="btn btn-ghost-secondary w-100 text-start d-flex align-items-center py-2 px-3 text-decoration-none"
                                        onClick={() => setMobileMenuOpen(false)}
                                        style={{ borderRadius: 0 }}
                                    >
                                        <i className={`ti ${item.icon} text-muted me-2`} style={{ width: '20px' }}></i>
                                        <span className="flex-grow-1">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Logout */}
                        <button
                            className="btn btn-ghost-danger w-100 text-start d-flex align-items-center py-2 px-3"
                            onClick={() => {
                                signOut({ callbackUrl: '/login' })
                            }}
                            style={{ borderRadius: 0 }}
                        >
                            <i className="ti ti-logout text-danger me-2" style={{ width: '20px' }}></i>
                            <span className="text-danger">{logoutLabel}</span>
                        </button>
                    </div>
                </>
            )}

            {/* Spacer for content - 탭바 없이 48px만 */}
            <style jsx global>{`
                .main-content-tabs {
                    padding-top: 48px !important;
                    min-height: 100vh;
                    background-color: #f4f6fa;
                }
                @media print {
                    .main-content-tabs {
                        padding-top: 0 !important;
                    }
                    header {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    )
}
