'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Mail, FileText, Save, RotateCcw, ChevronDown, ChevronUp, Loader2, Check, Pencil } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type EmailTemplate = {
  id: string
  name: string
  contactRound: number
  subject: string
  bodyText: string
  bodyHtml: string
  isActive: boolean
}

type EmailSettingsData = {
  id: string
  senderEmail: string
  senderName: string
  dailyLimit: number
  intervalSeconds: number
  batchSize: number
  batchIntervalMin: number
  followUpDays: number
}

export default function EmailSettingsPanel() {
  const { t, locale } = useTranslation()

  // Settings state
  const [settings, setSettings] = useState<EmailSettingsData | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; subject: string; bodyText: string } | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateSaved, setTemplateSaved] = useState<string | null>(null)

  // Active section
  const [expandedSection, setExpandedSection] = useState<'sender' | 'send' | 'templates'>('templates')

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/email-settings')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.success) setSettings(json.data)
    } catch {
      // ignore
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/email-templates')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.success) setTemplates(json.data)
    } catch {
      // ignore
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchTemplates()
  }, [fetchSettings, fetchTemplates])

  // Save settings
  const saveSettings = async () => {
    if (!settings) return
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      const res = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 2000)
      }
    } catch {
      // ignore
    } finally {
      setSettingsSaving(false)
    }
  }

  // Start editing template
  const startEditTemplate = (tpl: EmailTemplate) => {
    setEditingTemplateId(tpl.id)
    setEditForm({ name: tpl.name, subject: tpl.subject, bodyText: tpl.bodyText })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingTemplateId(null)
    setEditForm(null)
  }

  // Save template
  const saveTemplate = async (tpl: EmailTemplate) => {
    if (!editForm) return
    setTemplateSaving(true)
    try {
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tpl.id,
          name: editForm.name,
          contactRound: tpl.contactRound,
          subject: editForm.subject,
          bodyText: editForm.bodyText,
          bodyHtml: '',
          isActive: tpl.isActive,
        }),
      })
      if (res.ok) {
        setTemplateSaved(tpl.id)
        setTimeout(() => setTemplateSaved(null), 2000)
        setEditingTemplateId(null)
        setEditForm(null)
        fetchTemplates()
      }
    } catch {
      // ignore
    } finally {
      setTemplateSaving(false)
    }
  }

  // Reset templates
  const resetTemplates = async () => {
    if (!confirm(t.resetConfirm)) return
    try {
      await fetch('/api/email-templates?init=true')
      fetchTemplates()
    } catch {
      // ignore
    }
  }

  const getRoundLabel = (round: number) => {
    const map: Record<number, string> = { 1: t.round1, 2: t.round2, 3: t.round3, 4: t.round4, 5: t.round5 }
    return map[round] || `${round}`
  }

  const SectionHeader = ({ section, icon: Icon, title }: { section: 'sender' | 'send' | 'templates'; icon: React.ElementType; title: string }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === section ? section : section)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        expandedSection === section ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      {expandedSection === section ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  )

  if (settingsLoading || templatesLoading) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="ml-2 text-sm text-gray-500">{t.loading}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="card-title">{t.emailSettings}</h3>
        </div>
      </div>

      <div className="card-body space-y-4">
        {/* ===== 발신자 설정 ===== */}
        <SectionHeader section="sender" icon={Mail} title={t.senderSettings} />
        {expandedSection === 'sender' && settings && (
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.senderEmail}</label>
                <input
                  type="email"
                  value={settings.senderEmail}
                  onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.senderName}</label>
                <input
                  type="text"
                  value={settings.senderName}
                  onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : settingsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {settingsSaving ? t.saving : settingsSaved ? t.saved : t.saveSettings}
              </button>
            </div>
          </div>
        )}

        {/* ===== 발송 설정 ===== */}
        <SectionHeader section="send" icon={Settings} title={t.sendSettings} />
        {expandedSection === 'send' && settings && (
          <div className="px-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.dailyLimitLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.dailyLimit}
                    onChange={(e) => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min={1}
                    max={500}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{t.emails}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.sendInterval}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.intervalSeconds}
                    onChange={(e) => setSettings({ ...settings, intervalSeconds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min={5}
                    max={300}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{t.seconds}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.batchSize}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.batchSize}
                    onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min={1}
                    max={50}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{t.companies}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.batchInterval}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.batchIntervalMin}
                    onChange={(e) => setSettings({ ...settings, batchIntervalMin: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min={1}
                    max={60}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{t.minutes}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.followUpDays}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.followUpDays}
                    onChange={(e) => setSettings({ ...settings, followUpDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min={1}
                    max={90}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{locale === 'ja' ? '日' : '일'}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : settingsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {settingsSaving ? t.saving : settingsSaved ? t.saved : t.saveSettings}
              </button>
            </div>
          </div>
        )}

        {/* ===== 템플릿 관리 ===== */}
        <SectionHeader section="templates" icon={FileText} title={t.templateSettings} />
        {expandedSection === 'templates' && (
          <div className="px-2 space-y-3">
            {/* Reset button */}
            <div className="flex justify-end">
              <button
                onClick={resetTemplates}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t.resetTemplates}
              </button>
            </div>

            {/* Template list */}
            {templates.map((tpl) => (
              <div key={tpl.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Template header */}
                <div className={`flex items-center justify-between px-4 py-3 ${
                  templateSaved === tpl.id ? 'bg-green-50' : 'bg-gray-50/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {getRoundLabel(tpl.contactRound)}
                    </span>
                    {editingTemplateId === tpl.id ? (
                      <input
                        type="text"
                        value={editForm?.name || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800">{tpl.name}</span>
                    )}
                    {templateSaved === tpl.id && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Check className="w-3 h-3" /> {t.saved}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingTemplateId === tpl.id ? (
                      <>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={() => saveTemplate(tpl)}
                          disabled={templateSaving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {templateSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {t.saveSettings}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditTemplate(tpl)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        {t.editTemplate}
                      </button>
                    )}
                  </div>
                </div>

                {/* Template content */}
                <div className="px-4 py-3 space-y-3">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t.mailSubject}</label>
                    {editingTemplateId === tpl.id ? (
                      <input
                        type="text"
                        value={editForm?.subject || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, subject: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{tpl.subject}</p>
                    )}
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t.mailBody}</label>
                    {editingTemplateId === tpl.id ? (
                      <textarea
                        value={editForm?.bodyText || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, bodyText: e.target.value } : null)}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                      />
                    ) : (
                      <pre className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg whitespace-pre-wrap font-sans leading-relaxed max-h-[200px] overflow-y-auto">
                        {tpl.bodyText}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                {locale === 'ja' ? 'テンプレートがありません' : '템플릿이 없습니다'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
