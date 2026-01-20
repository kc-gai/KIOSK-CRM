'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { DevTimer } from './DevTimer'

interface NavItem {
    href?: string
    icon?: string
    label: string
    type?: string
    adminOnly?: boolean
    progress?: number
    newCount?: number  // 신규안건 카운트
}

interface SidebarProps {
    navItems: NavItem[]
    isAdmin: boolean
    userName: string
    userEmail: string
    userRole?: string          // ADMIN, USER, EXTERNAL
    allowedMenus?: string[]    // 외부관계자인 경우 허용된 메뉴 목록
}

// href에서 메뉴 키 추출 (예: /dashboard/assets -> assets)
const getMenuKey = (href: string): string => {
    const parts = href.split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || ''
}

export function Sidebar({ navItems, isAdmin, userName, userEmail, userRole = 'ADMIN', allowedMenus = [] }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [showProgress, setShowProgress] = useState(true) // true: 개발진척도, false: 신규안건
    const pathname = usePathname()

    // localStorage에서 토글 상태 복원
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-show-progress')
        if (saved !== null) {
            setShowProgress(saved === 'true')
        }
    }, [])

    // 화면 크기 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 992) // lg breakpoint
            if (window.innerWidth >= 992) {
                setIsOpen(false) // 데스크톱에서는 항상 보임
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // 메뉴 클릭 시 모바일에서 사이드바 닫기
    const handleLinkClick = () => {
        if (isMobile) {
            setIsOpen(false)
        }
    }

    // 메뉴 접근 권한 체크
    const canAccessMenu = (item: NavItem): boolean => {
        // 섹션 헤더는 항상 표시 (내용이 있을 경우)
        if (item.type === 'section') return true

        // 관리자는 모든 메뉴 접근 가능
        if (userRole === 'ADMIN') return true

        // adminOnly 메뉴는 관리자만 접근 가능
        if (item.adminOnly) return false

        // 외부 관계자는 allowedMenus에 있는 메뉴만 접근 가능
        if (userRole === 'EXTERNAL') {
            if (!item.href) return false
            const menuKey = getMenuKey(item.href)
            return allowedMenus.includes(menuKey)
        }

        // 일반 사용자는 adminOnly 제외한 모든 메뉴 접근 가능
        return true
    }

    // 섹션 내에 표시할 메뉴가 있는지 체크
    const sectionHasVisibleMenus = (sectionIndex: number): boolean => {
        for (let i = sectionIndex + 1; i < navItems.length; i++) {
            const item = navItems[i]
            if (item.type === 'section') break
            if (canAccessMenu(item)) return true
        }
        return false
    }

    // 필터링된 메뉴 아이템
    const getFilteredNavItems = (): NavItem[] => {
        return navItems.filter((item, index) => {
            if (item.type === 'section') {
                return sectionHasVisibleMenus(index)
            }
            return canAccessMenu(item)
        })
    }

    const filteredItems = getFilteredNavItems()

    const getRoleBadge = () => {
        switch (userRole) {
            case 'ADMIN':
                return <span className="badge bg-purple-lt text-purple">Admin</span>
            case 'EXTERNAL':
                return <span className="badge bg-warning-lt text-warning">External</span>
            default:
                return <span className="badge bg-secondary-lt">User</span>
        }
    }

    // 진척도/신규안건 토글
    const toggleProgressMode = () => {
        const newValue = !showProgress
        setShowProgress(newValue)
        localStorage.setItem('sidebar-show-progress', String(newValue))
    }

    return (
        <>
            {/* Mobile Header */}
            {isMobile && (
                <div
                    className="d-flex align-items-center justify-content-between bg-dark text-white p-3"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001, height: '56px' }}
                >
                    <Link href="/dashboard" className="d-flex align-items-center text-decoration-none text-white">
                        <span className="badge bg-blue text-white me-2 p-2">
                            <i className="ti ti-device-desktop" style={{ fontSize: '1rem' }}></i>
                        </span>
                        <span className="fw-bold">Kiosk CRM</span>
                    </Link>
                    <div className="d-flex align-items-center gap-2">
                        {/* 진척도/신규안건 토글 버튼 (모바일) */}
                        <button
                            className="btn btn-ghost-light p-1"
                            onClick={toggleProgressMode}
                            title={showProgress ? '신규안건 표시로 전환' : '개발진척도 표시로 전환'}
                        >
                            <i className={`ti ${showProgress ? 'ti-chart-bar' : 'ti-bell'}`} style={{ fontSize: '1.2rem' }}></i>
                        </button>
                        <button
                            className="btn btn-ghost-light"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Toggle menu"
                        >
                            <i className={`ti ${isOpen ? 'ti-x' : 'ti-menu-2'}`} style={{ fontSize: '1.5rem' }}></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay for mobile */}
            {isMobile && isOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
                    style={{ opacity: 0.5, zIndex: 1002 }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`d-flex flex-column bg-dark text-white sidebar-nav ${isMobile ? (isOpen ? 'show' : 'hide') : ''}`}
                style={{
                    width: '250px',
                    height: '100vh',
                    position: 'fixed',
                    left: isMobile && !isOpen ? '-250px' : 0,
                    top: isMobile ? '56px' : 0,
                    overflow: 'hidden',
                    zIndex: 1003,
                    transition: 'left 0.3s ease-in-out',
                    ...(isMobile && { height: 'calc(100vh - 56px)' })
                }}
            >
                {/* Brand - Desktop only */}
                {!isMobile && (
                    <div className="p-3 border-bottom border-secondary" style={{ flexShrink: 0 }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <Link href="/dashboard" className="d-flex align-items-center text-decoration-none text-white">
                                <span className="badge bg-blue text-white me-2 p-2">
                                    <i className="ti ti-device-desktop" style={{ fontSize: '1.2rem' }}></i>
                                </span>
                                <span className="fw-bold fs-4">Kiosk CRM</span>
                            </Link>
                            {/* 진척도/신규안건 토글 버튼 */}
                            <button
                                className="btn btn-sm btn-ghost-light p-1"
                                onClick={toggleProgressMode}
                                title={showProgress ? '신규안건 표시로 전환' : '개발진척도 표시로 전환'}
                                style={{ opacity: 0.7 }}
                            >
                                <i className={`ti ${showProgress ? 'ti-chart-bar' : 'ti-bell'}`} style={{ fontSize: '1rem' }}></i>
                            </button>
                        </div>
                        {/* 개발 작업 시간 표시 - 자동 계산 */}
                        <DevTimer />
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-grow-1 p-3" style={{ overflowY: 'auto', minHeight: 0 }}>
                    <ul className="nav flex-column">
                        {filteredItems.map((item, idx) => {
                            // 섹션 헤더
                            if (item.type === 'section') {
                                return (
                                    <li key={idx} className="mt-3 mb-1">
                                        <small className="text-muted text-uppercase fw-bold px-3" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                            {item.label}
                                        </small>
                                    </li>
                                )
                            }

                            const progress = item.progress
                            const newCount = item.newCount
                            const isComplete = progress === 100
                            const isActive = pathname === item.href

                            // 배지 렌더링 함수
                            const renderBadge = () => {
                                if (showProgress) {
                                    // 개발진척도 모드
                                    if (progress === undefined) return null
                                    if (isComplete) {
                                        return (
                                            <span className="badge bg-success" style={{ fontSize: '0.65rem', minWidth: '18px' }}>
                                                <i className="ti ti-check" style={{ fontSize: '0.6rem' }}></i>
                                            </span>
                                        )
                                    }
                                    return (
                                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                            {progress}%
                                        </span>
                                    )
                                } else {
                                    // 신규안건 모드
                                    if (newCount === undefined || newCount === 0) return null
                                    return (
                                        <span className="badge bg-danger" style={{ fontSize: '0.65rem', minWidth: '18px' }}>
                                            {newCount}
                                        </span>
                                    )
                                }
                            }

                            return (
                                <li key={idx} className="nav-item">
                                    <Link
                                        href={item.href!}
                                        className={`nav-link text-white py-2 px-3 rounded mb-1 d-flex align-items-center justify-content-between ${isActive ? 'bg-primary' : ''}`}
                                        onClick={handleLinkClick}
                                        style={isActive ? {} : { opacity: 0.85 }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <i className={`ti ${item.icon} me-2`} style={{ fontSize: '1.1rem' }}></i>
                                            <span>{item.label}</span>
                                        </div>
                                        {renderBadge()}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-top border-secondary" style={{ flexShrink: 0 }}>
                    {/* Language Switcher */}
                    <div className="mb-3">
                        <LanguageSwitcher />
                    </div>

                    {/* User Info */}
                    <div className="d-flex align-items-center">
                        <span className="avatar avatar-sm bg-blue me-2 rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            {userName?.charAt(0) || 'D'}
                        </span>
                        <div className="small flex-grow-1">
                            <div className="d-flex align-items-center gap-1">
                                <span className="text-white">{userName || 'User'}</span>
                                {getRoleBadge()}
                            </div>
                            <div className="text-muted text-truncate" style={{ maxWidth: '150px' }}>{userEmail}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Spacer for main content */}
            <style jsx global>{`
                @media (min-width: 992px) {
                    .main-content {
                        margin-left: 250px !important;
                    }
                }
                @media (max-width: 991.98px) {
                    .main-content {
                        margin-left: 0 !important;
                        padding-top: 56px !important;
                    }
                }
                @media print {
                    .main-content {
                        margin-left: 0 !important;
                        padding-top: 0 !important;
                    }
                    .sidebar-nav {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    )
}
