'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Plus, Settings, TestTube, CheckCircle, XCircle, Trash2, Edit, Calendar, Mail, Send, AlertCircle, Save, Eye, EyeOff, Bot, MessageCircle, Globe, Database, Key, Shield, RefreshCw, Github, ExternalLink } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ConnectionTestResult = {
    success: boolean
    message: string
}

type ApiConfig = {
    id: string
    name: string
    apiType: string
    description?: string
    baseUrl?: string
    apiKey?: string
    webhookUrl?: string
    authType: string
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpSecure: boolean
    isActive: boolean
    lastTestedAt?: string
    lastTestResult?: string
    createdAt: string
}

type SystemSettings = {
    // Calendar
    GOOGLE_SERVICE_ACCOUNT_EMAIL: string
    GOOGLE_PRIVATE_KEY: string
    GOOGLE_CALENDAR_ID: string
    // Email
    SMTP_HOST: string
    SMTP_PORT: string
    SMTP_USER: string
    SMTP_PASSWORD: string
    SMTP_FROM: string
    NOTIFICATION_EMAILS: string
    // AI Chatbot
    ANTHROPIC_API_KEY: string
    OPENAI_API_KEY: string
    AI_MODEL: string
    // Google OAuth
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    ALLOWED_GOOGLE_EMAILS: string
    // Supabase
    DATABASE_URL: string
    DIRECT_URL: string
    // NextAuth
    NEXTAUTH_URL: string
    NEXTAUTH_SECRET: string
    // Jobcan
    JOBCAN_BASE_URL: string
    JOBCAN_API_TOKEN: string
}

const API_TYPES = ['GROUPWARE', 'SLACK', 'EMAIL', 'ERP', 'CUSTOM']
const AUTH_TYPES = ['API_KEY', 'OAUTH2', 'BASIC', 'BEARER']

export default function ApiSettingsPage() {
    const t = useTranslations('apiSettings')
    const tc = useTranslations('common')
    const locale = useLocale()
    const [configs, setConfigs] = useState<ApiConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)

    // 시스템 설정 상태
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        GOOGLE_SERVICE_ACCOUNT_EMAIL: '',
        GOOGLE_PRIVATE_KEY: '',
        GOOGLE_CALENDAR_ID: '',
        SMTP_HOST: '',
        SMTP_PORT: '587',
        SMTP_USER: '',
        SMTP_PASSWORD: '',
        SMTP_FROM: '',
        NOTIFICATION_EMAILS: '',
        ANTHROPIC_API_KEY: '',
        OPENAI_API_KEY: '',
        AI_MODEL: 'claude-sonnet-4-20250514',
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        ALLOWED_GOOGLE_EMAILS: 'gai@kaflixcloud.co.jp',
        DATABASE_URL: '',
        DIRECT_URL: '',
        NEXTAUTH_URL: '',
        NEXTAUTH_SECRET: '',
        JOBCAN_BASE_URL: 'https://ssl.wf.jobcan.jp/wf_api',
        JOBCAN_API_TOKEN: '',
    })
    const [savingSettings, setSavingSettings] = useState(false)
    const [showPrivateKey, setShowPrivateKey] = useState(false)
    const [showSmtpPassword, setShowSmtpPassword] = useState(false)
    const [showJobcanToken, setShowJobcanToken] = useState(false)
    const [testingJobcan, setTestingJobcan] = useState(false)
    const [jobcanTestResult, setJobcanTestResult] = useState<ConnectionTestResult | null>(null)
    const [showAnthropicKey, setShowAnthropicKey] = useState(false)
    const [showOpenAIKey, setShowOpenAIKey] = useState(false)
    const [testingAI, setTestingAI] = useState(false)
    const [aiTestResult, setAiTestResult] = useState<ConnectionTestResult | null>(null)

    // 배포 설정 관련 상태
    const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false)
    const [showDatabaseUrl, setShowDatabaseUrl] = useState(false)
    const [showDirectUrl, setShowDirectUrl] = useState(false)
    const [showNextAuthSecret, setShowNextAuthSecret] = useState(false)
    const [testingDb, setTestingDb] = useState(false)
    const [dbTestResult, setDbTestResult] = useState<ConnectionTestResult | null>(null)

    // 환경변수 기반 연결 테스트 상태
    const [calendarTestResult, setCalendarTestResult] = useState<ConnectionTestResult | null>(null)
    const [emailTestResult, setEmailTestResult] = useState<ConnectionTestResult | null>(null)
    const [testingCalendar, setTestingCalendar] = useState(false)
    const [testingEmail, setTestingEmail] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const [sendingTestEmail, setSendingTestEmail] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        apiType: 'CUSTOM',
        description: '',
        baseUrl: '',
        apiKey: '',
        webhookUrl: '',
        authType: 'API_KEY',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpSecure: true,
        isActive: true,
    })

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/api-settings')
            if (res.ok) {
                setConfigs(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // 시스템 설정 불러오기
    const fetchSystemSettings = async () => {
        try {
            const res = await fetch('/api/system-settings')
            if (res.ok) {
                const settings = await res.json()
                const newSettings: Partial<SystemSettings> = {}
                settings.forEach((s: { key: string; value: string }) => {
                    if (s.key in systemSettings) {
                        newSettings[s.key as keyof SystemSettings] = s.value
                    }
                })
                setSystemSettings(prev => ({ ...prev, ...newSettings }))
            }
        } catch (e) {
            console.error('Failed to fetch system settings:', e)
        }
    }

    // 시스템 설정 저장
    const saveSystemSettings = async (category: 'CALENDAR' | 'EMAIL' | 'AI' | 'OAUTH' | 'DATABASE' | 'NEXTAUTH' | 'JOBCAN') => {
        setSavingSettings(true)
        try {
            const settingsToSave: Record<string, string> = {}

            if (category === 'CALENDAR') {
                settingsToSave.GOOGLE_SERVICE_ACCOUNT_EMAIL = systemSettings.GOOGLE_SERVICE_ACCOUNT_EMAIL
                settingsToSave.GOOGLE_PRIVATE_KEY = systemSettings.GOOGLE_PRIVATE_KEY
                settingsToSave.GOOGLE_CALENDAR_ID = systemSettings.GOOGLE_CALENDAR_ID
            } else if (category === 'EMAIL') {
                settingsToSave.SMTP_HOST = systemSettings.SMTP_HOST
                settingsToSave.SMTP_PORT = systemSettings.SMTP_PORT
                settingsToSave.SMTP_USER = systemSettings.SMTP_USER
                settingsToSave.SMTP_PASSWORD = systemSettings.SMTP_PASSWORD
                settingsToSave.SMTP_FROM = systemSettings.SMTP_FROM
                settingsToSave.NOTIFICATION_EMAILS = systemSettings.NOTIFICATION_EMAILS
            } else if (category === 'AI') {
                settingsToSave.ANTHROPIC_API_KEY = systemSettings.ANTHROPIC_API_KEY
                settingsToSave.OPENAI_API_KEY = systemSettings.OPENAI_API_KEY
                settingsToSave.AI_MODEL = systemSettings.AI_MODEL
            } else if (category === 'OAUTH') {
                settingsToSave.GOOGLE_CLIENT_ID = systemSettings.GOOGLE_CLIENT_ID
                settingsToSave.GOOGLE_CLIENT_SECRET = systemSettings.GOOGLE_CLIENT_SECRET
                settingsToSave.ALLOWED_GOOGLE_EMAILS = systemSettings.ALLOWED_GOOGLE_EMAILS
            } else if (category === 'DATABASE') {
                settingsToSave.DATABASE_URL = systemSettings.DATABASE_URL
                settingsToSave.DIRECT_URL = systemSettings.DIRECT_URL
            } else if (category === 'NEXTAUTH') {
                settingsToSave.NEXTAUTH_URL = systemSettings.NEXTAUTH_URL
                settingsToSave.NEXTAUTH_SECRET = systemSettings.NEXTAUTH_SECRET
            } else if (category === 'JOBCAN') {
                settingsToSave.JOBCAN_BASE_URL = systemSettings.JOBCAN_BASE_URL
                settingsToSave.JOBCAN_API_TOKEN = systemSettings.JOBCAN_API_TOKEN
            }

            const res = await fetch('/api/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: settingsToSave })
            })

            if (res.ok) {
                alert(t('settingSaved'))
            } else {
                alert(t('settingSaveFailed'))
            }
        } catch (e) {
            console.error('Failed to save settings:', e)
            alert(t('settingSaveError'))
        } finally {
            setSavingSettings(false)
        }
    }

    useEffect(() => {
        fetchConfigs()
        fetchSystemSettings()
    }, [])

    const getApiTypeBadge = (apiType: string) => {
        const colors: Record<string, string> = {
            GROUPWARE: 'bg-purple',
            SLACK: 'bg-orange',
            EMAIL: 'bg-blue',
            ERP: 'bg-green',
            CUSTOM: 'bg-secondary',
        }
        const typeKey = `type${apiType.charAt(0) + apiType.slice(1).toLowerCase()}` as keyof typeof t
        return <span className={`badge ${colors[apiType] || 'bg-secondary'} text-white`}>{t(typeKey)}</span>
    }

    // Google Calendar 연결 테스트
    const handleTestCalendar = async () => {
        setTestingCalendar(true)
        setCalendarTestResult(null)
        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'GOOGLE_CALENDAR' })
            })
            const result = await res.json()
            setCalendarTestResult(result)
        } catch (e) {
            setCalendarTestResult({ success: false, message: t('testError') })
        } finally {
            setTestingCalendar(false)
        }
    }

    // Email SMTP 연결 테스트
    const handleTestEmail = async () => {
        setTestingEmail(true)
        setEmailTestResult(null)
        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'EMAIL' })
            })
            const result = await res.json()
            setEmailTestResult(result)
        } catch (e) {
            setEmailTestResult({ success: false, message: t('testError') })
        } finally {
            setTestingEmail(false)
        }
    }

    // Jobcan API 연결 테스트
    const handleTestJobcan = async () => {
        setTestingJobcan(true)
        setJobcanTestResult(null)
        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'JOBCAN' })
            })
            const result = await res.json()
            setJobcanTestResult(result)
        } catch {
            setJobcanTestResult({ success: false, message: t('testError') })
        } finally {
            setTestingJobcan(false)
        }
    }

    // AI API 연결 테스트
    const handleTestAI = async () => {
        setTestingAI(true)
        setAiTestResult(null)
        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'AI_CHATBOT' })
            })
            const result = await res.json()
            setAiTestResult(result)
        } catch (e) {
            setAiTestResult({ success: false, message: t('aiTestError') })
        } finally {
            setTestingAI(false)
        }
    }

    // DB 연결 테스트
    const handleTestDb = async () => {
        setTestingDb(true)
        setDbTestResult(null)
        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'DATABASE' })
            })
            const result = await res.json()
            setDbTestResult(result)
        } catch (e) {
            setDbTestResult({ success: false, message: t('testError') })
        } finally {
            setTestingDb(false)
        }
    }

    // NEXTAUTH_SECRET 자동 생성
    const generateNextAuthSecret = () => {
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        const secret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
        setSystemSettings(prev => ({ ...prev, NEXTAUTH_SECRET: secret }))
    }

    // 테스트 이메일 발송
    const handleSendTestEmail = async () => {
        if (!testEmail) {
            alert(t('testEmailRequired'))
            return
        }
        setSendingTestEmail(true)
        try {
            const res = await fetch('/api/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'EMAIL_SEND', testEmail })
            })
            const result = await res.json()
            alert(result.message)
        } catch (e) {
            alert(t('testEmailError'))
        } finally {
            setSendingTestEmail(false)
        }
    }

    const handleTestConnection = async (config: ApiConfig) => {
        if (config.apiType === 'SLACK' && config.webhookUrl) {
            try {
                const res = await fetch('/api/test-connection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'SLACK', webhookUrl: config.webhookUrl })
                })
                const result = await res.json()
                alert(result.message)
            } catch (e) {
                alert(t('slackTestError'))
            }
        } else {
            alert(`${config.name} ${t('testNotSupported')}`)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return
        try {
            const res = await fetch(`/api/api-settings/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchConfigs()
            } else {
                alert(t('deleteFailed'))
            }
        } catch (e) {
            console.error(e)
            alert(t('errorOccurred'))
        }
    }

    const handleEdit = (config: ApiConfig) => {
        setEditingConfig(config)
        setFormData({
            name: config.name,
            apiType: config.apiType,
            description: config.description || '',
            baseUrl: config.baseUrl || '',
            apiKey: config.apiKey || '',
            webhookUrl: config.webhookUrl || '',
            authType: config.authType,
            smtpHost: config.smtpHost || '',
            smtpPort: config.smtpPort || 587,
            smtpUser: config.smtpUser || '',
            smtpSecure: config.smtpSecure,
            isActive: config.isActive,
        })
        setShowModal(true)
    }

    const handleSubmit = async () => {
        try {
            const url = editingConfig
                ? `/api/api-settings/${editingConfig.id}`
                : '/api/api-settings'
            const method = editingConfig ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingConfig(null)
                fetchConfigs()
            } else {
                alert(t('saveFailed'))
            }
        } catch (e) {
            console.error(e)
            alert(t('errorOccurred'))
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            apiType: 'CUSTOM',
            description: '',
            baseUrl: '',
            apiKey: '',
            webhookUrl: '',
            authType: 'API_KEY',
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpSecure: true,
            isActive: true,
        })
        setEditingConfig(null)
    }

    return (
        <div className="container-xl">
            {/* 헤더 */}
            <div className="page-header d-print-none mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <h2 className="page-title">{t('title')}</h2>
                        <div className="text-muted mt-1">{t('subtitle')}</div>
                    </div>
                    <div className="col-auto ms-auto">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                resetForm()
                                setShowModal(true)
                            }}
                        >
                            <Plus size={16} className="me-1" />
                            {t('newApi')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 시스템 연동 설정 */}
            <div className="row row-deck row-cards mb-4">
                {/* Google Calendar */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Calendar size={20} className="me-2 text-primary" />
                                <h3 className="card-title mb-0">Google Calendar</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('googleCalendarDesc')}
                            </p>

                            <div className="mb-3">
                                <label className="form-label">{t('serviceAccountEmail')}</label>
                                <input
                                    type="email"
                                    className="form-control form-control-sm"
                                    placeholder="your-service@project.iam.gserviceaccount.com"
                                    value={systemSettings.GOOGLE_SERVICE_ACCOUNT_EMAIL}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        GOOGLE_SERVICE_ACCOUNT_EMAIL: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('privateKey')}</label>
                                <div className="input-group input-group-sm">
                                    <textarea
                                        className="form-control form-control-sm"
                                        rows={3}
                                        placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                                        value={showPrivateKey ? systemSettings.GOOGLE_PRIVATE_KEY : (systemSettings.GOOGLE_PRIVATE_KEY ? '••••••••' : '')}
                                        onChange={(e) => {
                                            if (e.target.value !== '••••••••') {
                                                setSystemSettings(prev => ({
                                                    ...prev,
                                                    GOOGLE_PRIVATE_KEY: e.target.value
                                                }))
                                            }
                                        }}
                                        onFocus={() => setShowPrivateKey(true)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                    >
                                        {showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <small className="text-muted">{t('privateKeyHint')}</small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('calendarId')}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="your-calendar@group.calendar.google.com"
                                    value={systemSettings.GOOGLE_CALENDAR_ID}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        GOOGLE_CALENDAR_ID: e.target.value
                                    }))}
                                />
                            </div>

                            {calendarTestResult && (
                                <div className={`alert ${calendarTestResult.success ? 'alert-success' : 'alert-danger'} py-2 mb-0`}>
                                    <div className="d-flex align-items-center">
                                        {calendarTestResult.success ? (
                                            <CheckCircle size={16} className="me-2" />
                                        ) : (
                                            <AlertCircle size={16} className="me-2" />
                                        )}
                                        <span className="small">{calendarTestResult.message}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-footer d-flex justify-content-between">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleTestCalendar}
                                disabled={testingCalendar}
                            >
                                {testingCalendar ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        {t('testing')}
                                    </>
                                ) : (
                                    <>
                                        <TestTube size={14} className="me-1" />
                                        {t('connectionTest')}
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('CALENDAR')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>
                                        <Save size={14} className="me-1" />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Email SMTP */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Mail size={20} className="me-2 text-blue" />
                                <h3 className="card-title mb-0">Email (SMTP)</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('emailSmtpDesc')}
                            </p>

                            <div className="row g-2 mb-3">
                                <div className="col-8">
                                    <label className="form-label">{t('smtpHost')}</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="smtp.gmail.com"
                                        value={systemSettings.SMTP_HOST}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            SMTP_HOST: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="col-4">
                                    <label className="form-label">{t('port')}</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="587"
                                        value={systemSettings.SMTP_PORT}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            SMTP_PORT: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <label className="form-label">{t('user')}</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-sm"
                                        placeholder="your-email@gmail.com"
                                        value={systemSettings.SMTP_USER}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            SMTP_USER: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label">{t('password')}</label>
                                    <div className="input-group input-group-sm">
                                        <input
                                            type={showSmtpPassword ? 'text' : 'password'}
                                            className="form-control form-control-sm"
                                            placeholder="App Password"
                                            value={systemSettings.SMTP_PASSWORD}
                                            onChange={(e) => {
                                                if (e.target.value !== '••••••••') {
                                                    setSystemSettings(prev => ({
                                                        ...prev,
                                                        SMTP_PASSWORD: e.target.value
                                                    }))
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                        >
                                            {showSmtpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('from')}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Kiosk CRM <noreply@example.com>"
                                    value={systemSettings.SMTP_FROM}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        SMTP_FROM: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('notificationEmails')}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="manager@example.com, team@example.com"
                                    value={systemSettings.NOTIFICATION_EMAILS}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        NOTIFICATION_EMAILS: e.target.value
                                    }))}
                                />
                                <small className="text-muted">{t('notificationEmailsHint')}</small>
                            </div>

                            {emailTestResult && (
                                <div className={`alert ${emailTestResult.success ? 'alert-success' : 'alert-danger'} py-2 mb-3`}>
                                    <div className="d-flex align-items-center">
                                        {emailTestResult.success ? (
                                            <CheckCircle size={16} className="me-2" />
                                        ) : (
                                            <AlertCircle size={16} className="me-2" />
                                        )}
                                        <span className="small">{emailTestResult.message}</span>
                                    </div>
                                </div>
                            )}

                            <div className="input-group input-group-sm">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder={t('testEmailPlaceholder')}
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={handleSendTestEmail}
                                    disabled={sendingTestEmail}
                                    title="테스트 메일 발송"
                                >
                                    {sendingTestEmail ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                        <Send size={14} />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-between">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleTestEmail}
                                disabled={testingEmail}
                            >
                                {testingEmail ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        {t('testing')}
                                    </>
                                ) : (
                                    <>
                                        <TestTube size={14} className="me-1" />
                                        {t('smtpConnectionTest')}
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('EMAIL')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>
                                        <Save size={14} className="me-1" />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI 챗봇 설정 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Bot size={20} className="me-2 text-purple" />
                                <h3 className="card-title mb-0">{t('aiChatbotTitle')}</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('aiChatbotDesc')}
                            </p>

                            <div className="row g-3">
                                {/* Anthropic Claude API */}
                                <div className="col-lg-6">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="avatar avatar-sm bg-orange-lt me-2">
                                                    <span className="text-orange">C</span>
                                                </div>
                                                <div>
                                                    <h4 className="card-title mb-0">Anthropic Claude</h4>
                                                    <small className="text-muted">{t('anthropicRecommended')}</small>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">{t('apiKeyLabel')}</label>
                                                <div className="input-group input-group-sm">
                                                    <input
                                                        type={showAnthropicKey ? 'text' : 'password'}
                                                        className="form-control form-control-sm"
                                                        placeholder="sk-ant-api03-..."
                                                        value={systemSettings.ANTHROPIC_API_KEY}
                                                        onChange={(e) => setSystemSettings(prev => ({
                                                            ...prev,
                                                            ANTHROPIC_API_KEY: e.target.value
                                                        }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                                    >
                                                        {showAnthropicKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                <small className="text-muted">
                                                    <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
                                                        {t('anthropicConsoleLink')}
                                                    </a>
                                                </small>
                                            </div>

                                            <div className="mb-0">
                                                <label className="form-label">{t('modelLabel')}</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={systemSettings.AI_MODEL}
                                                    onChange={(e) => setSystemSettings(prev => ({
                                                        ...prev,
                                                        AI_MODEL: e.target.value
                                                    }))}
                                                    disabled={!!systemSettings.OPENAI_API_KEY && !systemSettings.ANTHROPIC_API_KEY}
                                                >
                                                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 ({t('modelRecommended')})</option>
                                                    <option value="claude-opus-4-20250514">Claude Opus 4</option>
                                                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                                    <option value="claude-3-haiku-20240307">Claude 3 Haiku ({t('modelFast')})</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* OpenAI API */}
                                <div className="col-lg-6">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="avatar avatar-sm bg-green-lt me-2">
                                                    <span className="text-green">O</span>
                                                </div>
                                                <div>
                                                    <h4 className="card-title mb-0">OpenAI</h4>
                                                    <small className="text-muted">{t('openaiAlt')}</small>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">{t('apiKeyLabel')}</label>
                                                <div className="input-group input-group-sm">
                                                    <input
                                                        type={showOpenAIKey ? 'text' : 'password'}
                                                        className="form-control form-control-sm"
                                                        placeholder="sk-..."
                                                        value={systemSettings.OPENAI_API_KEY}
                                                        onChange={(e) => setSystemSettings(prev => ({
                                                            ...prev,
                                                            OPENAI_API_KEY: e.target.value
                                                        }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                                    >
                                                        {showOpenAIKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                <small className="text-muted">
                                                    <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer">
                                                        {t('openaiPlatformLink')}
                                                    </a>
                                                </small>
                                            </div>

                                            <div className="alert alert-info py-2 mb-0">
                                                <small>
                                                    <strong>{t('note')}</strong> {t('openaiNote')}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {aiTestResult && (
                                <div className={`alert ${aiTestResult.success ? 'alert-success' : 'alert-danger'} py-2 mt-3 mb-0`}>
                                    <div className="d-flex align-items-center">
                                        {aiTestResult.success ? (
                                            <CheckCircle size={16} className="me-2" />
                                        ) : (
                                            <AlertCircle size={16} className="me-2" />
                                        )}
                                        <span className="small">{aiTestResult.message}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-footer d-flex justify-content-between">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleTestAI}
                                disabled={testingAI}
                            >
                                {testingAI ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        {t('testing')}
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle size={14} className="me-1" />
                                        {t('aiConnectionTest')}
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('AI')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>
                                        <Save size={14} className="me-1" />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 배포 환경 설정 */}
            <h3 className="mb-3 d-flex align-items-center gap-2">
                <Globe size={20} className="text-cyan" />
                {t('deploymentSettingsTitle')}
            </h3>
            <p className="text-muted mb-4">{t('deploymentSettingsDesc')}</p>

            <div className="row row-deck row-cards mb-4">
                {/* Google OAuth */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Key size={20} className="me-2 text-red" />
                                <h3 className="card-title mb-0">{t('googleOAuthTitle')}</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('googleOAuthDesc')}
                            </p>

                            <div className="mb-3">
                                <label className="form-label">{t('googleClientId')}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="1234567890-xxxxx.apps.googleusercontent.com"
                                    value={systemSettings.GOOGLE_CLIENT_ID}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        GOOGLE_CLIENT_ID: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('googleClientSecret')}</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type={showGoogleClientSecret ? 'text' : 'password'}
                                        className="form-control form-control-sm"
                                        placeholder="GOCSPX-..."
                                        value={systemSettings.GOOGLE_CLIENT_SECRET}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            GOOGLE_CLIENT_SECRET: e.target.value
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowGoogleClientSecret(!showGoogleClientSecret)}
                                    >
                                        {showGoogleClientSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <small className="text-muted">
                                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                                        {t('googleConsoleLink')} <ExternalLink size={12} className="ms-1" />
                                    </a>
                                </small>
                            </div>

                            <div className="mb-0">
                                <label className="form-label">{t('allowedEmails')}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="user@example.com, admin@company.com"
                                    value={systemSettings.ALLOWED_GOOGLE_EMAILS}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        ALLOWED_GOOGLE_EMAILS: e.target.value
                                    }))}
                                />
                                <small className="text-muted">{t('allowedEmailsHint')}</small>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-end">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('OAUTH')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>
                                        <Save size={14} className="me-1" />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Supabase Database */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Database size={20} className="me-2 text-green" />
                                <h3 className="card-title mb-0">{t('supabaseTitle')}</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('supabaseDesc')}
                            </p>

                            <div className="mb-3">
                                <label className="form-label">{t('databaseUrl')}</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type={showDatabaseUrl ? 'text' : 'password'}
                                        className="form-control form-control-sm"
                                        placeholder="postgresql://postgres:password@db.xxx.supabase.co:6543/postgres"
                                        value={systemSettings.DATABASE_URL}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            DATABASE_URL: e.target.value
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowDatabaseUrl(!showDatabaseUrl)}
                                    >
                                        {showDatabaseUrl ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <small className="text-muted">{t('databaseUrlHint')}</small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('directUrl')}</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type={showDirectUrl ? 'text' : 'password'}
                                        className="form-control form-control-sm"
                                        placeholder="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
                                        value={systemSettings.DIRECT_URL}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            DIRECT_URL: e.target.value
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowDirectUrl(!showDirectUrl)}
                                    >
                                        {showDirectUrl ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <small className="text-muted">{t('directUrlHint')}</small>
                            </div>

                            <small className="text-muted">
                                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                                    {t('supabaseDashboardLink')} <ExternalLink size={12} className="ms-1" />
                                </a>
                            </small>

                            {dbTestResult && (
                                <div className={`alert ${dbTestResult.success ? 'alert-success' : 'alert-danger'} py-2 mt-3 mb-0`}>
                                    <div className="d-flex align-items-center">
                                        {dbTestResult.success ? (
                                            <CheckCircle size={16} className="me-2" />
                                        ) : (
                                            <AlertCircle size={16} className="me-2" />
                                        )}
                                        <span className="small">{dbTestResult.message}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-footer d-flex justify-content-between">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleTestDb}
                                disabled={testingDb}
                            >
                                {testingDb ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        {t('testing')}
                                    </>
                                ) : (
                                    <>
                                        <TestTube size={14} className="me-1" />
                                        {t('dbConnectionTest')}
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('DATABASE')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>
                                        <Save size={14} className="me-1" />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* NextAuth 설정 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Shield size={20} className="me-2 text-indigo" />
                                <h3 className="card-title mb-0">{t('nextAuthTitle')}</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('nextAuthDesc')}
                            </p>

                            <div className="mb-3">
                                <label className="form-label">{t('nextAuthUrl')}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="https://your-app.vercel.app"
                                    value={systemSettings.NEXTAUTH_URL}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        NEXTAUTH_URL: e.target.value
                                    }))}
                                />
                                <small className="text-muted">{t('nextAuthUrlHint')}</small>
                            </div>

                            <div className="mb-0">
                                <label className="form-label">{t('nextAuthSecret')}</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type={showNextAuthSecret ? 'text' : 'password'}
                                        className="form-control form-control-sm"
                                        placeholder="complex-secret-key-here"
                                        value={systemSettings.NEXTAUTH_SECRET}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            NEXTAUTH_SECRET: e.target.value
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowNextAuthSecret(!showNextAuthSecret)}
                                    >
                                        {showNextAuthSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={generateNextAuthSecret}
                                        title={t('generateSecret')}
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                                <small className="text-muted">{t('nextAuthSecretHint')}</small>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-end">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('NEXTAUTH')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>
                                        <Save size={14} className="me-1" />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vercel 배포 정보 */}
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex align-items-center">
                                <Github size={20} className="me-2" />
                                <h3 className="card-title mb-0">{t('vercelTitle')}</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {t('vercelDesc')}
                            </p>

                            <div className="list-group list-group-flush">
                                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span className="text-muted">{t('currentEnv')}</span>
                                    <span className="badge bg-green">{process.env.NODE_ENV === 'production' ? t('production') : t('development')}</span>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span className="text-muted">{t('vercelProjectUrl')}</span>
                                    <a href={systemSettings.NEXTAUTH_URL || '#'} target="_blank" rel="noopener noreferrer" className="text-primary">
                                        {systemSettings.NEXTAUTH_URL || 'localhost:3000'}
                                        <ExternalLink size={12} className="ms-1" />
                                    </a>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span className="text-muted">{t('vercelGitRepo')}</span>
                                    <a href="https://github.com/your-repo/kiosk-crm" target="_blank" rel="noopener noreferrer" className="text-primary">
                                        GitHub <ExternalLink size={12} className="ms-1" />
                                    </a>
                                </div>
                            </div>

                            <div className="alert alert-info py-2 mt-3 mb-0">
                                <small>
                                    <strong>{t('note')}</strong> 환경 변수 변경 후 Vercel에서 재배포가 필요합니다. 환경 변수는 Vercel Dashboard에서 직접 설정하는 것을 권장합니다.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobcan Workflow 설정 */}
            <div className="row row-deck row-cards mb-4">
                <div className="col-12 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <i className="ti ti-file-check me-2"></i>
                                Jobcan Workflow ({locale === 'ja' ? '稟議連携' : '품의 연동'})
                            </h3>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small mb-3">
                                {locale === 'ja'
                                    ? 'Jobcan Workflowの稟議承認状態を自動同期します。管理画面からAPIトークンを取得してください。'
                                    : 'Jobcan Workflow 품의 승인 상태를 자동 동기화합니다. 관리자 페이지에서 API 토큰을 발급받으세요.'}
                            </p>
                            <div className="mb-3">
                                <label className="form-label">API Base URL</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={systemSettings.JOBCAN_BASE_URL}
                                    onChange={e => setSystemSettings(prev => ({ ...prev, JOBCAN_BASE_URL: e.target.value }))}
                                    placeholder="https://ssl.wf.jobcan.jp/wf_api"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">API Token</label>
                                <div className="input-group">
                                    <input
                                        type={showJobcanToken ? 'text' : 'password'}
                                        className="form-control"
                                        value={systemSettings.JOBCAN_API_TOKEN}
                                        onChange={e => setSystemSettings(prev => ({ ...prev, JOBCAN_API_TOKEN: e.target.value }))}
                                        placeholder={locale === 'ja' ? 'Jobcan管理画面から取得' : 'Jobcan 관리 화면에서 발급'}
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() => setShowJobcanToken(!showJobcanToken)}
                                    >
                                        <i className={`ti ti-eye${showJobcanToken ? '-off' : ''}`}></i>
                                    </button>
                                </div>
                            </div>
                            {jobcanTestResult && (
                                <div className={`alert ${jobcanTestResult.success ? 'alert-success' : 'alert-danger'} py-2`}>
                                    <small>{jobcanTestResult.success ? <i className="ti ti-check me-1"></i> : <i className="ti ti-alert-circle me-1"></i>}{jobcanTestResult.message}</small>
                                </div>
                            )}
                        </div>
                        <div className="card-footer d-flex justify-content-between">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleTestJobcan}
                                disabled={testingJobcan}
                            >
                                {testingJobcan ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-plug me-1"></i>}
                                {locale === 'ja' ? '接続テスト' : '연결 테스트'}
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => saveSystemSettings('JOBCAN')}
                                disabled={savingSettings}
                            >
                                {savingSettings ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-device-floppy me-1"></i>}
                                {locale === 'ja' ? '保存' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* API 설정 목록 */}
            <h3 className="mb-3">{t('customApiTitle')}</h3>
            <div className="row row-deck row-cards">
                {loading ? (
                    <div className="col-12 text-center py-5">
                        <div className="spinner-border" role="status"></div>
                        <div className="mt-2">{tc('loading')}</div>
                    </div>
                ) : configs.length === 0 ? (
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5 text-muted">
                                <Settings size={48} className="mb-3 opacity-50" />
                                <div>{t('noApis')}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    configs.map((config) => (
                        <div key={config.id} className="col-md-6 col-lg-4">
                            <div className={`card ${!config.isActive ? 'opacity-50' : ''}`}>
                                <div className="card-header">
                                    <div className="d-flex justify-content-between align-items-center w-100">
                                        <h3 className="card-title mb-0">{config.name}</h3>
                                        {getApiTypeBadge(config.apiType)}
                                    </div>
                                </div>
                                <div className="card-body">
                                    {config.description && (
                                        <p className="text-muted small mb-3">{config.description}</p>
                                    )}

                                    <div className="mb-2">
                                        <small className="text-muted">{t('authType')}:</small>
                                        <span className="ms-2">{config.authType}</span>
                                    </div>

                                    {config.apiType === 'SLACK' && config.webhookUrl && (
                                        <div className="mb-2">
                                            <small className="text-muted">{t('webhookUrl')}:</small>
                                            <div className="text-truncate small">{config.webhookUrl}</div>
                                        </div>
                                    )}

                                    {config.apiType === 'EMAIL' && config.smtpHost && (
                                        <div className="mb-2">
                                            <small className="text-muted">{t('smtpHost')}:</small>
                                            <div className="small">{config.smtpHost}:{config.smtpPort}</div>
                                        </div>
                                    )}

                                    {config.baseUrl && (
                                        <div className="mb-2">
                                            <small className="text-muted">{t('baseUrl')}:</small>
                                            <div className="text-truncate small">{config.baseUrl}</div>
                                        </div>
                                    )}

                                    {/* 연결 상태 */}
                                    {config.lastTestedAt && (
                                        <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top">
                                            {config.lastTestResult === 'SUCCESS' ? (
                                                <CheckCircle size={16} className="text-success" />
                                            ) : (
                                                <XCircle size={16} className="text-danger" />
                                            )}
                                            <span className="small">
                                                {t('lastTested')}: {new Date(config.lastTestedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleTestConnection(config)}
                                        >
                                            <TestTube size={14} className="me-1" />
                                            {t('testConnection')}
                                        </button>
                                    </div>
                                    <div className="d-flex gap-1">
                                        <button
                                            className="btn btn-sm btn-ghost-secondary"
                                            onClick={() => handleEdit(config)}
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-ghost-danger"
                                            onClick={() => handleDelete(config.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 모달 */}
            {showModal && (
                <div className="modal modal-blur fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingConfig ? `${editingConfig.name} ${t('editTitle')}` : t('newApi')}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">{t('name')}</label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('apiType')}</label>
                                        <select
                                            className="form-select"
                                            value={formData.apiType}
                                            onChange={(e) => setFormData({ ...formData, apiType: e.target.value })}
                                        >
                                            {API_TYPES.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('description')}</label>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {formData.apiType === 'SLACK' && (
                                        <div className="col-12">
                                            <label className="form-label">{t('webhookUrl')}</label>
                                            <Input
                                                value={formData.webhookUrl}
                                                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                                placeholder="https://hooks.slack.com/services/..."
                                            />
                                        </div>
                                    )}

                                    {formData.apiType === 'EMAIL' && (
                                        <>
                                            <div className="col-md-6">
                                                <label className="form-label">{t('smtpHost')}</label>
                                                <Input
                                                    value={formData.smtpHost}
                                                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                                    placeholder="smtp.gmail.com"
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">{t('smtpPort')}</label>
                                                <Input
                                                    type="number"
                                                    value={formData.smtpPort}
                                                    onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">{t('smtpSecure')}</label>
                                                <div className="form-check form-switch mt-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={formData.smtpSecure}
                                                        onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">{t('smtpUser')}</label>
                                                <Input
                                                    value={formData.smtpUser}
                                                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {(formData.apiType === 'GROUPWARE' || formData.apiType === 'ERP' || formData.apiType === 'CUSTOM') && (
                                        <>
                                            <div className="col-12">
                                                <label className="form-label">{t('baseUrl')}</label>
                                                <Input
                                                    value={formData.baseUrl}
                                                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                                    placeholder="https://api.example.com"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">{t('authType')}</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.authType}
                                                    onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                                                >
                                                    {AUTH_TYPES.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">{t('apiKey')}</label>
                                                <Input
                                                    type="password"
                                                    value={formData.apiKey}
                                                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="col-12">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label className="form-check-label">{t('isActive')}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                >
                                    {tc('cancel')}
                                </Button>
                                <Button onClick={handleSubmit}>{tc('save')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
