'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Settings, TestTube, CheckCircle, XCircle, Trash2, Edit, Calendar, Mail, Send, AlertCircle, Save, Eye, EyeOff, Bot, MessageCircle } from 'lucide-react'
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
}

const API_TYPES = ['GROUPWARE', 'SLACK', 'EMAIL', 'ERP', 'CUSTOM']
const AUTH_TYPES = ['API_KEY', 'OAUTH2', 'BASIC', 'BEARER']

export default function ApiSettingsPage() {
    const t = useTranslations('apiSettings')
    const tc = useTranslations('common')
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
    })
    const [savingSettings, setSavingSettings] = useState(false)
    const [showPrivateKey, setShowPrivateKey] = useState(false)
    const [showSmtpPassword, setShowSmtpPassword] = useState(false)
    const [showAnthropicKey, setShowAnthropicKey] = useState(false)
    const [showOpenAIKey, setShowOpenAIKey] = useState(false)
    const [testingAI, setTestingAI] = useState(false)
    const [aiTestResult, setAiTestResult] = useState<ConnectionTestResult | null>(null)

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
    const saveSystemSettings = async (category: 'CALENDAR' | 'EMAIL' | 'AI') => {
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
