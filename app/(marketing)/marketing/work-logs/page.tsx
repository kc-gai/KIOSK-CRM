'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from '@/lib/translations'
import {
  Clock,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  FileText,
  FilePlus,
  ListTodo,
  Trash2,
  Pencil,
  Code2,
  Wrench,
  Users,
  Search,
  AlertCircle,
} from 'lucide-react'

// ==========================================
// Types
// ==========================================

interface WorkLog {
  id: string
  date: string
  title: string
  description?: string | null
  author: string
  startTime?: string | null
  endTime?: string | null
  workHours: number
  category: string
  module?: string
  tools?: string | null
  completedTasks?: string | null
  modifiedFiles?: string | null
  createdFiles?: string | null
  nextTasks?: string | null
  linesChanged?: number | null
  createdAt: string
}

interface CalendarDateInfo {
  hours: number
  count: number
  categories: string[]
}

interface Stats {
  totalHours: number
  codingHours: number
  manualHours: number
  totalCompleted: number
  totalFiles: number
  totalEntries: number
}

// ==========================================
// Helpers
// ==========================================

function parseJsonArray(val?: string | null): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: React.FC<{ className?: string; size?: number }> }> = {
  coding: { bg: 'bg-green-100', text: 'text-green-700', icon: Code2 },
  manual: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Wrench },
  meeting: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Users },
  review: { bg: 'bg-violet-100', text: 'text-violet-700', icon: Search },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle },
}

// ==========================================
// Calendar Component
// ==========================================

function Calendar({
  year,
  month,
  selectedDate,
  dateMap,
  onDateSelect,
  onMonthChange,
  isJa,
}: {
  year: number
  month: number
  selectedDate: string
  dateMap: Record<string, CalendarDateInfo>
  onDateSelect: (date: string) => void
  onMonthChange: (year: number, month: number) => void
  isJa: boolean
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = formatDate(new Date())

  const dayHeaders = isJa
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['일', '월', '화', '수', '목', '금', '토']

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, month - 1)
  }
  const nextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, month + 1)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      {/* Month header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-sm fw-semibold text-gray-800">
          {year}{isJa ? '年' : '년'} {month + 1}{isJa ? '月' : '월'}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="row g-1 mb-1">
        {dayHeaders.map((d, i) => (
          <div
            key={d}
            className={`col text-center text-xs fw-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="row g-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="col" />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const info = dateMap[dateStr]
          const dayOfWeek = (firstDayOfWeek + day - 1) % 7

          return (
            <div key={dateStr} className="col">
              <button
                onClick={() => onDateSelect(dateStr)}
                className={`position-relative aspect-square d-flex flex-column align-items-center justify-content-center rounded-lg text-sm transition-all w-100 ${
                  isSelected
                    ? 'bg-blue-600 text-white fw-bold shadow-sm'
                    : isToday
                      ? 'bg-blue-50 text-blue-700 fw-semibold ring-1 ring-blue-300'
                      : 'hover:bg-gray-50 text-gray-700'
                } ${dayOfWeek === 0 && !isSelected ? 'text-red-500' : ''} ${dayOfWeek === 6 && !isSelected ? 'text-blue-500' : ''}`}
              >
                <span className="text-xs">{day}</span>
                {info && (
                  <div className="d-flex gap-1 mt-1" style={{ gap: '2px' }}>
                    {info.categories.includes('coding') && (
                      <span className={`rounded-full ${isSelected ? 'bg-green-300' : 'bg-green-500'}`} style={{ width: 6, height: 6 }} />
                    )}
                    {info.categories.some(c => c !== 'coding') && (
                      <span className={`rounded-full ${isSelected ? 'bg-yellow-300' : 'bg-yellow-500'}`} style={{ width: 6, height: 6 }} />
                    )}
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="d-flex align-items-center gap-3 mt-3 pt-2 border-t border-gray-100">
        <div className="d-flex align-items-center gap-1 text-xs text-gray-500" style={{ gap: '6px' }}>
          <span className="rounded-full bg-green-500" style={{ width: 8, height: 8 }} />
          {isJa ? 'コーディング' : '코딩'}
        </div>
        <div className="d-flex align-items-center gap-1 text-xs text-gray-500" style={{ gap: '6px' }}>
          <span className="rounded-full bg-yellow-500" style={{ width: 8, height: 8 }} />
          {isJa ? 'その他' : '기타'}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// Add/Edit Modal
// ==========================================

function WorkLogModal({
  isOpen,
  onClose,
  onSave,
  editLog,
  defaultDate,
  isJa,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
  editLog?: WorkLog | null
  defaultDate: string
  isJa: boolean
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [category, setCategory] = useState('coding')
  const [author, setAuthor] = useState('Claude (Anthropic)')
  const [description, setDescription] = useState('')
  const [toolsStr, setToolsStr] = useState('')
  const [completedStr, setCompletedStr] = useState('')
  const [modifiedStr, setModifiedStr] = useState('')
  const [createdStr, setCreatedStr] = useState('')
  const [nextStr, setNextStr] = useState('')
  const [linesChanged, setLinesChanged] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editLog) {
      setTitle(editLog.title)
      setDate(editLog.date)
      setStartTime(editLog.startTime || '09:00')
      setEndTime(editLog.endTime || '18:00')
      setCategory(editLog.category)
      setAuthor(editLog.author)
      setDescription(editLog.description || '')
      setToolsStr(parseJsonArray(editLog.tools).join(', '))
      setCompletedStr(parseJsonArray(editLog.completedTasks).join('\n'))
      setModifiedStr(parseJsonArray(editLog.modifiedFiles).join('\n'))
      setCreatedStr(parseJsonArray(editLog.createdFiles).join('\n'))
      setNextStr(parseJsonArray(editLog.nextTasks).join('\n'))
      setLinesChanged(editLog.linesChanged?.toString() || '')
    } else {
      setTitle('')
      setDate(defaultDate)
      setStartTime('09:00')
      setEndTime('18:00')
      setCategory('coding')
      setAuthor('Claude (Anthropic)')
      setDescription('')
      setToolsStr('Next.js, TypeScript, Prisma')
      setCompletedStr('')
      setModifiedStr('')
      setCreatedStr('')
      setNextStr('')
      setLinesChanged('')
    }
  }, [editLog, defaultDate, isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const splitLines = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean)
      const data: Record<string, unknown> = {
        date,
        title: title.trim(),
        description: description.trim() || null,
        author,
        startTime,
        endTime,
        category,
        tools: toolsStr.split(',').map(s => s.trim()).filter(Boolean),
        completedTasks: splitLines(completedStr),
        modifiedFiles: splitLines(modifiedStr),
        createdFiles: splitLines(createdStr),
        nextTasks: splitLines(nextStr),
        linesChanged: linesChanged ? parseInt(linesChanged) : null,
      }
      if (editLog) data.id = editLog.id
      await onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const categories = [
    { value: 'coding', label: isJa ? 'コーディング' : '코딩/개발' },
    { value: 'manual', label: isJa ? '手作業' : '수작업' },
    { value: 'meeting', label: isJa ? 'ミーティング' : '미팅' },
    { value: 'review', label: isJa ? 'レビュー' : '리뷰' },
    { value: 'other', label: isJa ? 'その他' : '기타' },
  ]

  return (
    <div className="position-fixed inset-0 z-50 d-flex align-items-center justify-content-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-100 overflow-auto m-3"
        style={{ maxWidth: '42rem', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-gray-200">
          <h3 className="text-lg fw-bold text-gray-900">
            {editLog
              ? (isJa ? '作業日誌を編集' : '작업일지 수정')
              : (isJa ? '作業日誌を追加' : '작업일지 추가')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs fw-medium text-gray-600 d-block mb-1">
              {isJa ? 'タイトル' : '제목'} *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-control form-control-sm"
              placeholder={isJa ? '作業内容を入力' : '작업 내용을 입력'}
            />
          </div>

          {/* Date + Time + Category row */}
          <div className="row g-2">
            <div className="col-6 col-sm-3">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '日付' : '날짜'}
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-6 col-sm-3">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '開始' : '시작'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-6 col-sm-3">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '終了' : '종료'}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-6 col-sm-3">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '区分' : '구분'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-select form-select-sm"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Author + Tools + Lines */}
          <div className="row g-2">
            <div className="col-md-4">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '担当者' : '작성자'}
              </label>
              <input
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-4">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? 'ツール' : '도구'} (,{isJa ? '区切り' : '구분'})
              </label>
              <input
                value={toolsStr}
                onChange={e => setToolsStr(e.target.value)}
                className="form-control form-control-sm"
                placeholder="Next.js, TypeScript"
              />
            </div>
            <div className="col-md-4">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '変更行数' : '변경 줄 수'}
              </label>
              <input
                type="number"
                value={linesChanged}
                onChange={e => setLinesChanged(e.target.value)}
                className="form-control form-control-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs fw-medium text-gray-600 d-block mb-1">
              {isJa ? '説明' : '설명'}
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-control form-control-sm"
              placeholder={isJa ? '作業の概要' : '작업 개요'}
            />
          </div>

          {/* Completed Tasks */}
          <div>
            <label className="text-xs fw-medium text-gray-600 d-block mb-1">
              {isJa ? '完了した作業' : '완료한 작업'} ({isJa ? '1行1件' : '한 줄에 하나씩'})
            </label>
            <textarea
              value={completedStr}
              onChange={e => setCompletedStr(e.target.value)}
              rows={4}
              className="form-control form-control-sm font-mono"
              placeholder={isJa ? '完了した作業を1行ずつ入力' : '완료한 작업을 한 줄씩 입력'}
            />
          </div>

          {/* Modified + Created Files */}
          <div className="row g-2">
            <div className="col-6">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '修正ファイル' : '수정한 파일'} ({isJa ? '1行1件' : '한 줄에 하나씩'})
              </label>
              <textarea
                value={modifiedStr}
                onChange={e => setModifiedStr(e.target.value)}
                rows={3}
                className="form-control form-control-sm font-mono"
                placeholder="page.tsx"
              />
            </div>
            <div className="col-6">
              <label className="text-xs fw-medium text-gray-600 d-block mb-1">
                {isJa ? '作成ファイル' : '생성한 파일'} ({isJa ? '1行1件' : '한 줄에 하나씩'})
              </label>
              <textarea
                value={createdStr}
                onChange={e => setCreatedStr(e.target.value)}
                rows={3}
                className="form-control form-control-sm font-mono"
                placeholder="new-file.tsx"
              />
            </div>
          </div>

          {/* Next Tasks */}
          <div>
            <label className="text-xs fw-medium text-gray-600 d-block mb-1">
              {isJa ? '次の作業' : '다음 작업'} ({isJa ? '1行1件' : '한 줄에 하나씩'})
            </label>
            <textarea
              value={nextStr}
              onChange={e => setNextStr(e.target.value)}
              rows={2}
              className="form-control form-control-sm font-mono"
              placeholder={isJa ? '次に取り組む作業' : '다음에 진행할 작업'}
            />
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-end gap-2 px-4 py-3 border-top border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-sm btn-outline-secondary"
          >
            {isJa ? 'キャンセル' : '취소'}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="btn btn-sm btn-primary"
          >
            {saving
              ? (isJa ? '保存中...' : '저장 중...')
              : (isJa ? '保存' : '저장')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// Work Log Entry Card
// ==========================================

function WorkLogCard({
  log,
  isJa,
  onEdit,
  onDelete,
}: {
  log: WorkLog
  isJa: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  const completed = parseJsonArray(log.completedTasks)
  const modified = parseJsonArray(log.modifiedFiles)
  const created = parseJsonArray(log.createdFiles)
  const next = parseJsonArray(log.nextTasks)
  const tools = parseJsonArray(log.tools)
  const catStyle = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.other
  const CatIcon = catStyle.icon

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div className="flex-fill" style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <CatIcon size={16} className={catStyle.text} />
              <h3 className="text-sm fw-semibold text-gray-900 truncate">{log.title}</h3>
              {/* Progress bar */}
              <div className="bg-gray-100 rounded-full flex-shrink-0 ms-auto" style={{ width: '4rem', height: '0.5rem' }}>
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Meta row */}
            <div className="d-flex align-items-center gap-2 flex-wrap text-xs text-gray-500">
              <span className={`px-2 py-0 rounded-full text-[10px] fw-medium ${catStyle.bg} ${catStyle.text}`}>
                {log.author}
              </span>
              {log.module && log.module !== 'general' && (
                <span className={`px-2 py-0 rounded-full text-[10px] fw-medium ${
                  log.module === 'kiosk' ? 'bg-indigo-100 text-indigo-700' : 'bg-cyan-100 text-cyan-700'
                }`}>
                  {log.module === 'kiosk' ? 'Kiosk' : 'Marketing'}
                </span>
              )}
              {log.startTime && log.endTime && (
                <span className="d-flex align-items-center gap-1">
                  <Clock size={12} />
                  {log.startTime} ~ {log.endTime}
                </span>
              )}
              <span className="fw-medium">{log.workHours}{isJa ? '時間' : '시간'}</span>
              {log.linesChanged && (
                <span>{isJa ? '変更' : '변경'} {log.linesChanged}{isJa ? '行' : '줄'}</span>
              )}
            </div>

            {/* Tools */}
            {tools.length > 0 && (
              <div className="d-flex align-items-center gap-1 mt-2 flex-wrap" style={{ gap: '6px' }}>
                <span className="text-xs text-gray-400">{isJa ? 'ツール:' : '도구:'}</span>
                {tools.map((tool, i) => (
                  <span key={i} className="px-2 py-0 text-[10px] bg-gray-100 text-gray-600 rounded fw-medium">
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <Pencil size={14} className="text-gray-400" />
            </button>
            <button onClick={onDelete} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3">
          {log.description && (
            <p className="text-xs text-gray-500">{log.description}</p>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-1 mb-2" style={{ gap: '6px' }}>
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs fw-semibold text-gray-700">
                  {isJa ? '完了した作業' : '완료한 작업'} ({completed.length})
                </span>
              </div>
              <ul className="space-y-1 ms-4">
                {completed.map((task, i) => (
                  <li key={i} className="text-xs text-gray-600 d-flex align-items-start gap-1" style={{ gap: '6px' }}>
                    <span className="text-green-400 mt-1">&#8226;</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Modified files */}
          {modified.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-1 mb-2" style={{ gap: '6px' }}>
                <FileText size={14} className="text-blue-500" />
                <span className="text-xs fw-semibold text-gray-700">
                  {isJa ? '修正したファイル' : '수정한 파일'} ({modified.length})
                </span>
              </div>
              <div className="d-flex flex-wrap gap-1 ms-4" style={{ gap: '6px' }}>
                {modified.map((file, i) => (
                  <span key={i} className="text-[10px] px-2 py-0 bg-blue-50 text-blue-700 rounded font-mono">
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Created files */}
          {created.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-1 mb-2" style={{ gap: '6px' }}>
                <FilePlus size={14} className="text-emerald-500" />
                <span className="text-xs fw-semibold text-gray-700">
                  {isJa ? '作成したファイル' : '생성한 파일'} ({created.length})
                </span>
              </div>
              <div className="d-flex flex-wrap gap-1 ms-4" style={{ gap: '6px' }}>
                {created.map((file, i) => (
                  <span key={i} className="text-[10px] px-2 py-0 bg-emerald-50 text-emerald-700 rounded font-mono">
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next tasks */}
          {next.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-1 mb-2" style={{ gap: '6px' }}>
                <ListTodo size={14} className="text-amber-500" />
                <span className="text-xs fw-semibold text-gray-700">
                  {isJa ? '次の作業' : '다음 작업'}
                </span>
              </div>
              <ul className="space-y-1 ms-4">
                {next.map((task, i) => (
                  <li key={i} className="text-xs text-gray-600 d-flex align-items-start gap-1" style={{ gap: '6px' }}>
                    <span className="text-amber-400 mt-1">&#8226;</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==========================================
// Main Page Component
// ==========================================

export default function WorkLogsPage() {
  const { locale } = useTranslation()
  const isJa = locale === 'ja'

  const today = formatDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  const [logs, setLogs] = useState<WorkLog[]>([])
  const [dateMap, setDateMap] = useState<Record<string, CalendarDateInfo>>({})
  const [stats, setStats] = useState<Stats>({ totalHours: 0, codingHours: 0, manualHours: 0, totalCompleted: 0, totalFiles: 0, totalEntries: 0 })
  const [monthHours, setMonthHours] = useState(0)
  const [monthCompleted, setMonthCompleted] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editLog, setEditLog] = useState<WorkLog | null>(null)
  const [loading, setLoading] = useState(false)

  const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`

  // Fetch data
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, calRes, statsRes] = await Promise.all([
        fetch(`/api/work-logs?date=${selectedDate}&month=${monthStr}`),
        fetch(`/api/work-logs?type=calendar&month=${monthStr}`),
        fetch(`/api/work-logs?type=stats`),
      ])
      const logsData = await logsRes.json()
      const calData = await calRes.json()
      const statsData = await statsRes.json()

      setLogs(logsData.logs || [])
      setMonthHours(logsData.monthHours || 0)
      setMonthCompleted(logsData.monthCompleted || 0)
      setDateMap(calData.dateMap || {})
      setStats(statsData)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, monthStr])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Selected day stats
  const dayStats = useMemo(() => {
    const hours = logs.reduce((sum, l) => sum + l.workHours, 0)
    const completed = logs.reduce((sum, l) => sum + parseJsonArray(l.completedTasks).length, 0)
    const files = logs.reduce((sum, l) => sum + parseJsonArray(l.modifiedFiles).length, 0)
    return { hours: Math.round(hours * 10) / 10, completed, files }
  }, [logs])

  // Save handler
  const handleSave = async (data: Record<string, unknown>) => {
    const method = data.id ? 'PUT' : 'POST'
    await fetch('/api/work-logs', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchLogs()
  }

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm(isJa ? 'この作業日誌を削除しますか？' : '이 작업일지를 삭제하시겠습니까?')) return
    await fetch(`/api/work-logs?id=${id}`, { method: 'DELETE' })
    await fetchLogs()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="text-2xl fw-bold text-gray-900 d-flex align-items-center gap-2">
            <CalendarDays size={28} className="text-primary" />
            {isJa ? '作業日誌' : '작업 일지'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isJa ? '開発作業レポート自動集計' : '개발 작업 리포트 자동 집계'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {stats.totalEntries === 0 && (
            <button
              onClick={async () => {
                if (!confirm(isJa ? '過去の作業履歴をインポートしますか？' : '과거 작업 이력을 불러올까요?')) return
                const res = await fetch('/api/work-logs?type=seed')
                const data = await res.json()
                alert(`${isJa ? 'インポート完了' : '불러오기 완료'}: ${data.migratedCount}${isJa ? '件 追加' : '건 추가'}, ${data.skippedCount}${isJa ? '件 スキップ' : '건 스킵'}`)
                fetchLogs()
              }}
              className="btn btn-warning d-flex align-items-center gap-2 text-sm shadow-sm"
            >
              <TrendingUp size={16} />
              {isJa ? '履歴インポート' : '이력 불러오기'}
            </button>
          )}
          <button
            onClick={() => { setEditLog(null); setModalOpen(true) }}
            className="btn btn-primary d-flex align-items-center gap-2 text-sm shadow-sm"
          >
            <Plus size={16} />
            {isJa ? '作業追加' : '작업 추가'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-lg bg-blue-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">{isJa ? '選択日の作業時間' : '선택일 작업 시간'}</div>
                <div className="text-2xl fw-bold text-gray-900">
                  {dayStats.hours}<span className="text-sm fw-normal text-gray-400">{isJa ? '時間' : '시간'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-lg bg-green-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">{isJa ? '選択日の完了作業' : '선택일 완료 작업'}</div>
                <div className="text-2xl fw-bold text-gray-900">
                  {dayStats.completed}<span className="text-sm fw-normal text-gray-400">{isJa ? '件' : '건'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-lg bg-orange-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                <CalendarDays size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">{isJa ? '今月合計' : '이번 달 (합계)'}</div>
                <div className="text-2xl fw-bold text-gray-900">
                  {monthHours}<span className="text-sm fw-normal text-gray-400">{isJa ? '時間' : '시간'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-lg bg-violet-50 d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                <TrendingUp size={20} className="text-violet-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">{isJa ? '全体作業時間' : '전체 작업 시간'}</div>
                <div className="text-2xl fw-bold text-gray-900">
                  {stats.totalHours}<span className="text-sm fw-normal text-gray-400">{isJa ? '時間' : '시간'}</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  {isJa ? 'コーディング' : '코딩'} {stats.codingHours} + {isJa ? '手作業' : '수작업'} {stats.manualHours}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: Calendar + Details */}
      <div className="row g-4">
        {/* Left: Calendar + Monthly Stats */}
        <div className="col-lg-5 space-y-4">
          <Calendar
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            dateMap={dateMap}
            onDateSelect={(d) => setSelectedDate(d)}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m) }}
            isJa={isJa}
          />

          {/* Monthly stats card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <h3 className="text-sm fw-semibold text-gray-800 mb-2">
              {isJa ? '全体統計' : '전체 통계'}
            </h3>
            <div className="space-y-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-xs text-gray-500">{isJa ? '総作業時間' : '총 작업 시간'}</span>
                <span className="text-sm fw-bold text-gray-900">{stats.totalHours}{isJa ? '時間' : '시간'}</span>
              </div>
              <div className="w-100 bg-gray-100 rounded-full h-2">
                <div className="d-flex h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 transition-all" style={{ width: stats.totalHours > 0 ? `${(stats.codingHours / stats.totalHours * 100)}%` : '0%' }} />
                  <div className="bg-yellow-400 transition-all" style={{ width: stats.totalHours > 0 ? `${(stats.manualHours / stats.totalHours * 100)}%` : '0%' }} />
                </div>
              </div>
              <div className="d-flex gap-3 text-xs text-gray-500">
                <div className="d-flex align-items-center gap-1" style={{ gap: '6px' }}>
                  <span className="rounded-full bg-green-500" style={{ width: 8, height: 8 }} />
                  {isJa ? 'コーディング' : '코딩/개발'} {stats.codingHours}h
                </div>
                <div className="d-flex align-items-center gap-1" style={{ gap: '6px' }}>
                  <span className="rounded-full bg-yellow-400" style={{ width: 8, height: 8 }} />
                  {isJa ? '手作業' : '수작업'} {stats.manualHours}h
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="d-flex justify-content-between text-xs">
                  <span className="text-gray-500">{isJa ? '完了した作業' : '완료한 작업'}</span>
                  <span className="fw-medium text-gray-700">{stats.totalCompleted}{isJa ? '件' : '건'}</span>
                </div>
                <div className="d-flex justify-content-between text-xs">
                  <span className="text-gray-500">{isJa ? '修正ファイル' : '수정한 파일'}</span>
                  <span className="fw-medium text-gray-700">{stats.totalFiles}{isJa ? '個' : '개'}</span>
                </div>
                <div className="d-flex justify-content-between text-xs">
                  <span className="text-gray-500">{isJa ? '作業レポート' : '작업 리포트'}</span>
                  <span className="fw-medium text-gray-700">{stats.totalEntries}{isJa ? '件' : '건'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Work log details for selected date */}
        <div className="col-lg-7">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Date header */}
            <div className="px-3 py-3 border-bottom border-gray-100 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <CalendarDays size={16} className="text-gray-400" />
                <span className="text-sm fw-semibold text-gray-800">
                  {selectedDate} {isJa ? '作業内訳' : '작업 내역'}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {dayStats.completed > 0 && (
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full fw-medium">
                    {dayStats.completed}{isJa ? '件 完了' : '건 완료'}
                  </span>
                )}
                {dayStats.files > 0 && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full fw-medium">
                    {dayStats.files}{isJa ? 'ファイル' : '파일'}
                  </span>
                )}
              </div>
            </div>

            {/* Log entries */}
            <div className="p-3 space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  {isJa ? '読み込み中...' : '로딩중...'}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-4">
                  <CalendarDays size={40} className="text-gray-200 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">
                    {isJa ? 'この日の作業記録はありません' : '이 날의 작업 기록이 없습니다'}
                  </div>
                  <button
                    onClick={() => { setEditLog(null); setModalOpen(true) }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 fw-medium"
                  >
                    + {isJa ? '作業を追加' : '작업 추가'}
                  </button>
                </div>
              ) : (
                logs.map(log => (
                  <WorkLogCard
                    key={log.id}
                    log={log}
                    isJa={isJa}
                    onEdit={() => { setEditLog(log); setModalOpen(true) }}
                    onDelete={() => handleDelete(log.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <WorkLogModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditLog(null) }}
        onSave={handleSave}
        editLog={editLog}
        defaultDate={selectedDate}
        isJa={isJa}
      />
    </div>
  )
}
