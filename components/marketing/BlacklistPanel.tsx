'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldBan, Plus, Trash2, X, AlertCircle, Loader2, UserX } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type BlacklistEntry = {
  companyId: string
  companyName: string
  email: string
  reason: 'bounce' | 'manual' | 'unsubscribe'
  blockedAt: string
}

type BlacklistPanelProps = {
  onUpdate?: () => void
}

export default function BlacklistPanel({ onUpdate }: BlacklistPanelProps) {
  const { t, locale } = useTranslation()

  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    companyId: '',
    companyName: '',
    email: '',
    reason: 'manual' as BlacklistEntry['reason'],
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchBlacklist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email-blacklist')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setEntries(json.data || [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlacklist()
  }, [fetchBlacklist])

  const handleRemove = async (companyId: string) => {
    setRemoving(companyId)
    try {
      const res = await fetch(`/api/email-blacklist?companyId=${encodeURIComponent(companyId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      setEntries((prev) => prev.filter((e) => e.companyId !== companyId))
      onUpdate?.()
    } catch {
      // Silently handle errors
    } finally {
      setRemoving(null)
    }
  }

  const handleAdd = async () => {
    if (!formData.companyId || !formData.email) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/email-blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to add')
      setShowAddForm(false)
      setFormData({ companyId: '', companyName: '', email: '', reason: 'manual' })
      await fetchBlacklist()
      onUpdate?.()
    } catch {
      // Silently handle errors
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getReasonBadge = (reason: BlacklistEntry['reason']) => {
    switch (reason) {
      case 'bounce':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            {t.bounced}
          </span>
        )
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {locale === 'ja' ? '手動' : '수동'}
          </span>
        )
      case 'unsubscribe':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {locale === 'ja' ? '配信停止' : '수신거부'}
          </span>
        )
    }
  }

  const reasonOptions: { value: BlacklistEntry['reason']; label: string }[] = [
    { value: 'bounce', label: t.bounced },
    { value: 'manual', label: locale === 'ja' ? '手動' : '수동' },
    { value: 'unsubscribe', label: locale === 'ja' ? '配信停止' : '수신거부' },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <ShieldBan size={20} className="text-red-500" />
            <h3 className="card-title">{t.blacklistLabel}</h3>
            <span className="d-inline-flex align-items-center justify-content-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {entries.length}
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            {t.add}
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="border-bottom bg-gray-50 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h4 className="text-sm fw-medium text-gray-800">
                {t.addToBlacklist}
              </h4>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ companyId: '', companyName: '', email: '', reason: 'manual' })
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <label className="form-label text-xs text-gray-500">
                  {locale === 'ja' ? '企業ID' : '업체 ID'}
                </label>
                <input
                  type="text"
                  value={formData.companyId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, companyId: e.target.value }))}
                  className="form-control form-control-sm"
                  placeholder="company-001"
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label text-xs text-gray-500">
                  {locale === 'ja' ? '企業名' : '업체명'}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="form-control form-control-sm"
                  placeholder={locale === 'ja' ? '株式会社サンプル' : '샘플 주식회사'}
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label text-xs text-gray-500">
                  {locale === 'ja' ? 'メールアドレス' : '이메일'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="form-control form-control-sm"
                  placeholder="info@example.com"
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label text-xs text-gray-500">
                  {t.reason}
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reason: e.target.value as BlacklistEntry['reason'],
                    }))
                  }
                  className="form-select form-select-sm"
                >
                  {reasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ companyId: '', companyName: '', email: '', reason: 'manual' })
                }}
                className="btn btn-ghost-secondary btn-sm"
              >
                {locale === 'ja' ? 'キャンセル' : '취소'}
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.companyId || !formData.email || submitting}
                className="btn btn-danger btn-sm"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShieldBan size={14} />
                )}
                {t.addToBlacklist}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-auto">
          <table className="table table-sm table-vcenter">
            <thead>
              <tr>
                <th className="text-start">
                  {locale === 'ja' ? '企業名' : '업체명'}
                </th>
                <th className="text-start">
                  {locale === 'ja' ? 'メールアドレス' : '이메일'}
                </th>
                <th className="text-center">
                  {t.reason}
                </th>
                <th className="text-center">
                  {t.blockedDate}
                </th>
                <th className="text-center">
                  {locale === 'ja' ? '操作' : '작업'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <Loader2 size={20} className="text-primary animate-spin" />
                      <span className="text-sm text-gray-500">{t.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center">
                    <div className="d-flex flex-column align-items-center gap-2 text-gray-400">
                      <UserX size={32} />
                      <p className="text-sm">
                        {locale === 'ja'
                          ? 'ブラックリストに登録された項目はありません'
                          : '블랙리스트에 등록된 항목이 없습니다'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={`${entry.companyId}-${entry.email}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="fw-medium text-gray-800">
                      {entry.companyName}
                    </td>
                    <td className="text-gray-600">
                      {entry.email}
                    </td>
                    <td className="text-center">
                      {getReasonBadge(entry.reason)}
                    </td>
                    <td className="text-center text-gray-600">
                      {formatDate(entry.blockedAt)}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleRemove(entry.companyId)}
                        disabled={removing === entry.companyId}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        title={t.removeFromBlacklist}
                      >
                        {removing === entry.companyId ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        {t.removeFromBlacklist}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
