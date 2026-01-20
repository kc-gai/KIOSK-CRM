'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

interface NavItem {
    href?: string
    icon?: string
    label: string
    type?: string
    adminOnly?: boolean
    progress?: number
    newCount?: number
}

interface Category {
    id: string
    label: string
    icon: string
    items: NavItem[]
}

interface Tab {
    href: string
}

interface TopNavigationProps {
    categories: Category[]
    isAdmin: boolean
    userName: string
    userEmail: string
    userRole?: string
    allowedMenus?: string[]
    tabHomeLabel?: string
    settingsItems?: NavItem[]
}

const getMenuKey = (href: string): string => {
    const parts = href.split('/')
    return parts[parts.length - 1] || parts[parts.length - 2] || ''
}

export function TopNavigation({
    categories,
    isAdmin,
    userName,
    userEmail,
    userRole = 'ADMIN',
    allowedMenus = [],
    tabHomeLabel = '홈',
    settingsItems = []
}: TopNavigationProps) {
    const [openTabs, setOpenTabs] = useState<Tab[]>([])
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const pathname = usePathname()
    const router = useRouter()

    // localStorage에서 탭 상태 복원
    useEffect(() => {
        const savedTabs = localStorage.getItem('nav-open-tabs')
        if (savedTabs) {
            try {
                const parsed = JSON.parse(savedTabs)
                setOpenTabs(parsed)
            } catch {
                setOpenTabs([])
            }
        }
    }, [])

    // 탭 상태 저장
    useEffect(() => {
        localStorage.setItem('nav-open-tabs', JSON.stringify(openTabs))
    }, [openTabs])

    // 현재 경로에 해당하는 탭이 없으면 자동으로 추가
    useEffect(() => {
        if (pathname && pathname !== '/dashboard') {
            const existingTab = openTabs.find(tab => tab.href === pathname)
            if (!existingTab) {
                // 현재 경로에 해당하는 메뉴 아이템 찾기 (카테고리)
                let found = false
                for (const category of categories) {
                    const item = category.items.find(i => i.href === pathname)
                    if (item && item.href) {
                        addTab({ href: item.href })
                        found = true
                        break
                    }
                }
                // settingsItems에서 찾기
                if (!found) {
                    const settingsItem = settingsItems.find(i => i.href === pathname)
                    if (settingsItem && settingsItem.href) {
                        addTab({ href: settingsItem.href })
                    }
                }
            }
        }
    }, [pathname, categories, settingsItems])

    // href로 메뉴 아이템 정보 찾기 (다국어 지원)
    const getMenuItemByHref = (href: string): NavItem | null => {
        // 카테고리에서 찾기
        for (const category of categories) {
            const item = category.items.find(i => i.href === href)
            if (item) return item
        }
        // settingsItems에서 찾기
        const settingsItem = settingsItems.find(i => i.href === href)
        if (settingsItem) return settingsItem
        return null
    }

    // 메뉴 접근 권한 체크
    const canAccessMenu = (item: NavItem): boolean => {
        if (item.type === 'section') return true
        if (userRole === 'ADMIN') return true
        if (item.adminOnly) return false
        if (userRole === 'EXTERNAL') {
            if (!item.href) return false
            const menuKey = getMenuKey(item.href)
            return allowedMenus.includes(menuKey)
        }
        return true
    }

    // 탭 추가 (href만 저장)
    const addTab = (tab: Tab) => {
        setOpenTabs(prev => {
            const exists = prev.find(t => t.href === tab.href)
            if (exists) return prev
            return [...prev, { href: tab.href }]
        })
    }

    // 탭 제거
    const removeTab = (href: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpenTabs(prev => prev.filter(t => t.href !== href))
        // 현재 탭을 닫으면 다른 탭으로 이동
        if (pathname === href) {
            const remaining = openTabs.filter(t => t.href !== href)
            if (remaining.length > 0) {
                router.push(remaining[remaining.length - 1].href)
            } else {
                router.push('/dashboard')
            }
        }
    }

    // 메뉴 아이템 클릭
    const handleMenuClick = (item: NavItem) => {
        if (item.href) {
            addTab({ href: item.href })
            router.push(item.href)
            setActiveCategory(null)
        }
    }

    // 카테고리별 필터링된 메뉴
    const getFilteredItems = (items: NavItem[]): NavItem[] => {
        return items.filter(item => canAccessMenu(item))
    }

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
                    {/* Logo */}
                    <Link href="/dashboard" className="d-flex align-items-center text-decoration-none text-white me-4">
                        <span className="badge bg-blue text-white me-2 p-2">
                            <i className="ti ti-device-desktop" style={{ fontSize: '1rem' }}></i>
                        </span>
                        <span className="fw-bold">Kiosk CRM</span>
                    </Link>

                    {/* Categories */}
                    <nav className="d-flex align-items-center gap-1 flex-grow-1">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className="position-relative"
                                onMouseEnter={() => setActiveCategory(category.id)}
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <button
                                    className={`btn btn-ghost-light text-white px-3 py-2 d-flex align-items-center gap-2 ${activeCategory === category.id ? 'bg-primary' : ''}`}
                                    style={{
                                        border: 'none',
                                        borderRadius: '4px 4px 0 0',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <i className={`ti ${category.icon}`}></i>
                                    <span>{category.label}</span>
                                </button>

                                {/* Dropdown Menu */}
                                {activeCategory === category.id && (
                                    <div
                                        className="position-absolute bg-white shadow-lg rounded-bottom"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                            minWidth: '220px',
                                            zIndex: 1002,
                                            border: '1px solid #e6e8eb'
                                        }}
                                    >
                                        {getFilteredItems(category.items).map((item, idx) => (
                                            <button
                                                key={idx}
                                                className="btn btn-ghost-secondary w-100 text-start d-flex align-items-center py-2"
                                                onClick={() => handleMenuClick(item)}
                                                style={{
                                                    borderRadius: 0,
                                                    borderBottom: idx < category.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                    paddingLeft: '12px',
                                                    paddingRight: '12px'
                                                }}
                                            >
                                                <i className={`ti ${item.icon} text-muted me-2`} style={{ width: '16px', textAlign: 'center' }}></i>
                                                <span className="flex-grow-1">{item.label}</span>
                                                {item.newCount && item.newCount > 0 && (
                                                    <span className="badge bg-danger">{item.newCount}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Right Side - User Info & Language */}
                    <div className="d-flex align-items-center gap-3">
                        <LanguageSwitcher />
                        {/* Admin Dropdown with Settings */}
                        <div
                            className="position-relative"
                            onMouseEnter={() => setActiveCategory('admin-menu')}
                            onMouseLeave={() => setActiveCategory(null)}
                        >
                            <button
                                className={`btn btn-ghost-light text-white d-flex align-items-center gap-2 px-2 py-1 ${activeCategory === 'admin-menu' ? 'bg-primary' : ''}`}
                                style={{ border: 'none', borderRadius: '4px' }}
                            >
                                <span className="avatar avatar-sm bg-blue rounded d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                                    {userName?.charAt(0) || 'A'}
                                </span>
                                <span className="small">{userName || 'Admin'}</span>
                                <i className="ti ti-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                            </button>

                            {/* Admin Dropdown Menu */}
                            {activeCategory === 'admin-menu' && (
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
                                    {settingsItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            className="btn btn-ghost-secondary w-100 text-start d-flex align-items-center py-2"
                                            onClick={() => handleMenuClick(item)}
                                            style={{
                                                borderRadius: 0,
                                                borderBottom: idx < settingsItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                paddingLeft: '12px',
                                                paddingRight: '12px'
                                            }}
                                        >
                                            <i className={`ti ${item.icon} text-muted me-2`} style={{ width: '16px', textAlign: 'center' }}></i>
                                            <span className="flex-grow-1">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Bar */}
            <div
                className="bg-light border-bottom"
                style={{
                    position: 'fixed',
                    top: '48px',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: '38px',
                    display: 'flex',
                    alignItems: 'end',
                    paddingLeft: '8px',
                    backgroundColor: '#e9ecef'
                }}
            >
                {/* Home Tab - Always visible */}
                <Link
                    href="/dashboard"
                    className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none border-top border-start border-end rounded-top ${pathname === '/dashboard' ? 'bg-white text-dark' : 'bg-light text-muted'}`}
                    style={{
                        fontSize: '0.85rem',
                        marginRight: '2px',
                        marginBottom: pathname === '/dashboard' ? '-1px' : '0',
                        borderColor: pathname === '/dashboard' ? '#dee2e6' : 'transparent'
                    }}
                >
                    <i className="ti ti-home" style={{ fontSize: '0.9rem' }}></i>
                    <span>{tabHomeLabel}</span>
                </Link>

                {/* Dynamic Tabs */}
                {openTabs.map(tab => {
                    const menuItem = getMenuItemByHref(tab.href)
                    if (!menuItem) return null
                    return (
                        <div
                            key={tab.href}
                            className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none border-top border-start border-end rounded-top ${pathname === tab.href ? 'bg-white text-dark' : 'bg-light text-muted'}`}
                            style={{
                                fontSize: '0.85rem',
                                marginRight: '2px',
                                marginBottom: pathname === tab.href ? '-1px' : '0',
                                borderColor: pathname === tab.href ? '#dee2e6' : 'transparent',
                                cursor: 'pointer',
                                maxWidth: '180px'
                            }}
                            onClick={() => router.push(tab.href)}
                        >
                            <i className={`ti ${menuItem.icon || 'ti-file'}`} style={{ fontSize: '0.9rem', flexShrink: 0 }}></i>
                            <span className="text-truncate">{menuItem.label}</span>
                            <button
                                className="btn btn-ghost-secondary p-0 ms-1 d-flex align-items-center justify-content-center"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    flexShrink: 0
                                }}
                                onClick={(e) => removeTab(tab.href, e)}
                            >
                                <i className="ti ti-x" style={{ fontSize: '0.7rem' }}></i>
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Spacer for content */}
            <style jsx global>{`
                .main-content-tabs {
                    padding-top: 86px !important;
                    min-height: 100vh;
                    background-color: #f4f6fa;
                }
                @media print {
                    .main-content-tabs {
                        padding-top: 0 !important;
                    }
                    header, .tab-bar {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    )
}
