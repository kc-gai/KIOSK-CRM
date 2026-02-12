'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

interface User {
    id: string
    email: string
    name: string | null
    role: string
    isActive: boolean
    allowedMenus: string | null
    linkedPartnerId: string | null
    lastLoginAt: string | null
    createdAt: string
}

interface Partner {
    id: string
    name: string
    nameJa: string | null
}

// 메뉴 목록 정의 (사이드바와 동일)
const ALL_MENUS = [
    { key: 'dashboard', labelKey: 'menuDashboard', icon: 'ti-dashboard', group: 'main' },
    { key: 'ai-search', labelKey: 'menuAiSearch', icon: 'ti-sparkles', group: 'main' },
    { key: 'order-process', labelKey: 'menuOrderProcess', icon: 'ti-list-check', group: 'process' },
    { key: 'delivery-process', labelKey: 'menuDeliveryProcess', icon: 'ti-truck-delivery', group: 'process' },
    { key: 'delivery-request', labelKey: 'menuDeliveryRequest', icon: 'ti-file-invoice', group: 'process' },
    { key: 'assets', labelKey: 'menuAssets', icon: 'ti-device-desktop', group: 'asset' },
    { key: 'history', labelKey: 'menuHistory', icon: 'ti-history', group: 'asset' },
    { key: 'pricing', labelKey: 'menuPricing', icon: 'ti-currency-yen', group: 'asset' },
    { key: 'statistics', labelKey: 'menuStatistics', icon: 'ti-chart-bar', group: 'stats' },
    { key: 'clients', labelKey: 'menuClients', icon: 'ti-building-store', group: 'partner' },
    { key: 'regions', labelKey: 'menuRegions', icon: 'ti-map-pin', group: 'internal', adminOnly: true },
    { key: 'assembly-manual', labelKey: 'menuAssemblyManual', icon: 'ti-tool', group: 'settings' },
    { key: 'manuals', labelKey: 'menuManuals', icon: 'ti-book', group: 'settings' },
    { key: 'accounts', labelKey: 'menuAccounts', icon: 'ti-users', group: 'settings', adminOnly: true },
    { key: 'api-settings', labelKey: 'menuApiSettings', icon: 'ti-plug', group: 'settings', adminOnly: true },
]

const MENU_GROUPS = [
    { key: 'main', labelKey: 'groupMain' },
    { key: 'process', labelKey: 'groupProcess' },
    { key: 'asset', labelKey: 'groupAsset' },
    { key: 'stats', labelKey: 'groupStats' },
    { key: 'partner', labelKey: 'groupPartner' },
    { key: 'internal', labelKey: 'groupInternal' },
    { key: 'settings', labelKey: 'groupSettings' },
]

export default function AccountsPage() {
    const t = useTranslations('accounts')
    const tCommon = useTranslations('common')
    const [users, setUsers] = useState<User[]>([])
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'USER',
        isActive: true,
        allowedMenus: [] as string[],
        linkedPartnerId: ''
    })

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchPartners = useCallback(async () => {
        try {
            const res = await fetch('/api/partners')
            if (res.ok) {
                const data = await res.json()
                setPartners(data)
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
        fetchPartners()
    }, [fetchUsers, fetchPartners])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
            const method = editingUser ? 'PUT' : 'POST'

            // allowedMenus를 JSON string으로 변환
            const payload = {
                ...formData,
                allowedMenus: formData.role === 'EXTERNAL' ? JSON.stringify(formData.allowedMenus) : null,
                linkedPartnerId: formData.role === 'EXTERNAL' && formData.linkedPartnerId ? formData.linkedPartnerId : null
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert(editingUser ? t('updateSuccess') : t('createSuccess'))
                setShowForm(false)
                setEditingUser(null)
                resetForm()
                fetchUsers()
            } else {
                const error = await res.json()
                alert(error.error || (editingUser ? t('updateError') : t('createError')))
            }
        } catch (error) {
            alert(editingUser ? t('updateError') : t('createError'))
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm(t('deleteConfirm'))) return

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                alert(t('deleteSuccess'))
                fetchUsers()
            } else {
                const error = await res.json()
                alert(error.error || t('deleteError'))
            }
        } catch (error) {
            alert(t('deleteError'))
        }
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        let allowedMenus: string[] = []
        try {
            if (user.allowedMenus) {
                allowedMenus = JSON.parse(user.allowedMenus)
            }
        } catch {
            allowedMenus = []
        }

        setFormData({
            email: user.email,
            name: user.name || '',
            password: '', // Don't populate password
            role: user.role,
            isActive: user.isActive,
            allowedMenus,
            linkedPartnerId: user.linkedPartnerId || ''
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            email: '',
            name: '',
            password: '',
            role: 'USER',
            isActive: true,
            allowedMenus: [],
            linkedPartnerId: ''
        })
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingUser(null)
        resetForm()
    }

    const toggleMenu = (menuKey: string) => {
        setFormData(prev => ({
            ...prev,
            allowedMenus: prev.allowedMenus.includes(menuKey)
                ? prev.allowedMenus.filter(m => m !== menuKey)
                : [...prev.allowedMenus, menuKey]
        }))
    }

    const selectAllMenus = () => {
        const nonAdminMenus = ALL_MENUS.filter(m => !m.adminOnly).map(m => m.key)
        setFormData(prev => ({ ...prev, allowedMenus: nonAdminMenus }))
    }

    const clearAllMenus = () => {
        setFormData(prev => ({ ...prev, allowedMenus: [] }))
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <span className="badge bg-purple text-white">{t('roleAdmin')}</span>
            case 'EXTERNAL':
                return <span className="badge bg-warning text-dark">{t('roleExternal')}</span>
            default:
                return <span className="badge bg-secondary text-white">{t('roleUser')}</span>
        }
    }

    const getMenuCountBadge = (user: User) => {
        if (user.role === 'ADMIN') {
            return <span className="badge bg-blue-lt">{t('allMenus')}</span>
        }
        if (user.role === 'EXTERNAL' && user.allowedMenus) {
            try {
                const menus = JSON.parse(user.allowedMenus)
                return <span className="badge bg-orange-lt">{menus.length}개 메뉴</span>
            } catch {
                return <span className="badge bg-secondary-lt">-</span>
            }
        }
        return <span className="badge bg-secondary-lt">{t('defaultMenus')}</span>
    }

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{tCommon('loading')}</span>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="page-title mb-0">
                    <i className="ti ti-users me-2"></i>
                    {t('title')}
                </h2>
                {!showForm && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                        <i className="ti ti-plus me-1"></i>
                        {t('newUser')}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card mb-3">
                    <div className="card-header">
                        <h3 className="card-title">{editingUser ? tCommon('edit') : t('newUser')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label required">{t('email')}</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder={t('emailPlaceholder')}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('name')}</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('namePlaceholder')}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">
                                        {t('password')} {editingUser && <span className="text-muted">({t('passwordKeep')})</span>}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control form-control-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={t('passwordPlaceholder')}
                                        required={!editingUser}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('role')}</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value, allowedMenus: [] })}
                                        className="form-select form-select-sm"
                                    >
                                        <option value="USER">{t('roleUser')} - {t('roleUserDesc')}</option>
                                        <option value="ADMIN">{t('roleAdmin')} - {t('roleAdminDesc')}</option>
                                        <option value="EXTERNAL">{t('roleExternal')} - {t('roleExternalDesc')}</option>
                                    </select>
                                </div>

                                {/* 외부 관계자인 경우 연결 거래처 선택 */}
                                {formData.role === 'EXTERNAL' && (
                                    <div className="col-md-6">
                                        <label className="form-label">{t('linkedPartner')}</label>
                                        <select
                                            value={formData.linkedPartnerId}
                                            onChange={(e) => setFormData({ ...formData, linkedPartnerId: e.target.value })}
                                            className="form-select form-select-sm"
                                        >
                                            <option value="">{t('selectNone')}</option>
                                            {partners.map(partner => (
                                                <option key={partner.id} value={partner.id}>
                                                    {partner.name} {partner.nameJa && `(${partner.nameJa})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="col-12">
                                    <label className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="form-check-label">{t('active')}</span>
                                    </label>
                                </div>

                                {/* 외부 관계자인 경우 메뉴 권한 설정 */}
                                {formData.role === 'EXTERNAL' && (
                                    <div className="col-12">
                                        <div className="card bg-light">
                                            <div className="card-header">
                                                <h4 className="card-title mb-0">
                                                    <i className="ti ti-lock me-2"></i>
                                                    {t('menuPermissions')}
                                                </h4>
                                                <div className="card-actions">
                                                    <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={selectAllMenus}>
                                                        {t('allMenus')}
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearAllMenus}>
                                                        {tCommon('cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {MENU_GROUPS.map(group => (
                                                    <div key={group.key} className="mb-3">
                                                        <h5 className="text-muted small mb-2">{t(group.labelKey)}</h5>
                                                        <div className="row g-2">
                                                            {ALL_MENUS.filter(m => m.group === group.key && !m.adminOnly).map(menu => (
                                                                <div key={menu.key} className="col-md-4 col-lg-3">
                                                                    <label className="form-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={formData.allowedMenus.includes(menu.key)}
                                                                            onChange={() => toggleMenu(menu.key)}
                                                                        />
                                                                        <span className="form-check-label">
                                                                            <i className={`ti ${menu.icon} me-1`}></i>
                                                                            {t(menu.labelKey)}
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="alert alert-info mb-0 mt-3">
                                                    <i className="ti ti-info-circle me-2"></i>
                                                    {t('externalMenuNote')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary btn-sm me-2">
                                    <i className="ti ti-check me-1"></i>
                                    {tCommon('save')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCancel}>
                                    {tCommon('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 역할 설명 카드 */}
            <div className="row mb-3">
                <div className="col-md-4">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <span className="badge bg-purple text-white me-3 p-2">
                                    <i className="ti ti-crown"></i>
                                </span>
                                <div>
                                    <div className="fw-semibold">{t('roleAdmin')}</div>
                                    <div className="text-muted small">{t('roleAdminDesc')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <span className="badge bg-secondary text-white me-3 p-2">
                                    <i className="ti ti-user"></i>
                                </span>
                                <div>
                                    <div className="fw-semibold">{t('roleUser')}</div>
                                    <div className="text-muted small">{t('roleUserDesc')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card card-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <span className="badge bg-warning text-dark me-3 p-2">
                                    <i className="ti ti-user-shield"></i>
                                </span>
                                <div>
                                    <div className="fw-semibold">{t('roleExternal')}</div>
                                    <div className="text-muted small">{t('roleExternalDesc')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-sm">
                        <thead>
                            <tr>
                                <th>{t('email')}</th>
                                <th>{t('name')}</th>
                                <th>{t('role')}</th>
                                <th>{t('menuAccess')}</th>
                                <th>{t('status')}</th>
                                <th>{t('lastLogin')}</th>
                                <th>{t('createdAt')}</th>
                                <th className="w-1">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.email}</td>
                                    <td className="text-muted">{user.name || '-'}</td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td>{getMenuCountBadge(user)}</td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                            {user.isActive ? t('active') : t('inactive')}
                                        </span>
                                    </td>
                                    <td className="text-muted">
                                        {user.lastLoginAt
                                            ? format(new Date(user.lastLoginAt), 'yyyy-MM-dd HH:mm')
                                            : t('never')
                                        }
                                    </td>
                                    <td className="text-muted">
                                        {format(new Date(user.createdAt), 'yyyy-MM-dd')}
                                    </td>
                                    <td>
                                        <div className="btn-list flex-nowrap">
                                            <button
                                                className="btn btn-sm btn-icon btn-ghost-primary"
                                                onClick={() => handleEdit(user)}
                                                title={tCommon('edit')}
                                            >
                                                <i className="ti ti-edit"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-icon btn-ghost-danger"
                                                onClick={() => handleDelete(user.id)}
                                                title={tCommon('delete')}
                                            >
                                                <i className="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted py-4">
                                        {tCommon('noData')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
