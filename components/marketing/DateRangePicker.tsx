'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

type DateRangePickerProps = {
  value: string
  onChange: (period: string, customRange?: { start: string; end: string }) => void
}

const periodOptions = [
  { value: '7d', labelJa: '過去7日間', labelKo: '최근 7일' },
  { value: '28d', labelJa: '過去28日間', labelKo: '최근 28일' },
  { value: '1m', labelJa: '過去1ヶ月', labelKo: '최근 1개월' },
  { value: '3m', labelJa: '過去3ヶ月', labelKo: '최근 3개월' },
  { value: '6m', labelJa: '過去6ヶ月', labelKo: '최근 6개월' },
  { value: '12m', labelJa: '過去12ヶ月', labelKo: '최근 12개월' },
  { value: 'custom', labelJa: 'カスタム', labelKo: '사용자 지정' },
]

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { locale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const selectedOption = periodOptions.find((opt) => opt.value === value)
  const displayLabel = selectedOption
    ? locale === 'ja'
      ? selectedOption.labelJa
      : selectedOption.labelKo
    : value

  const handleSelect = (period: string) => {
    if (period === 'custom') {
      setShowCustom(true)
    } else {
      onChange(period)
      setIsOpen(false)
      setShowCustom(false)
    }
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange('custom', { start: customStart, end: customEnd })
      setIsOpen(false)
      setShowCustom(false)
    }
  }

  return (
    <div className="position-relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="d-flex align-items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
      >
        <Calendar size={16} className="text-gray-500" />
        <span className="text-gray-700">{displayLabel}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="position-fixed" style={{ inset: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
          <div className="position-absolute end-0 top-100 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg" style={{ zIndex: 20, minWidth: '200px' }}>
            {!showCustom ? (
              <div className="py-1">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-100 text-start px-3 py-2 text-sm hover:bg-gray-50 ${
                      value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {locale === 'ja' ? option.labelJa : option.labelKo}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div>
                  <label className="d-block text-xs text-gray-500 mb-1">
                    {locale === 'ja' ? '開始日' : '시작일'}
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
                <div>
                  <label className="d-block text-xs text-gray-500 mb-1">
                    {locale === 'ja' ? '終了日' : '종료일'}
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-fill btn btn-ghost-secondary btn-sm"
                  >
                    {locale === 'ja' ? '戻る' : '뒤로'}
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                    className="flex-fill btn btn-primary btn-sm disabled:opacity-50"
                  >
                    {locale === 'ja' ? '適用' : '적용'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
