'use client'

import { useState } from 'react'
import { RefreshCw, Download, Calendar, Bell, User, Globe } from 'lucide-react'
import { useTranslation, Locale } from '@/lib/translations'

const localeNames: Record<Locale, string> = {
  ja: '日本語',
  ko: '한국어',
}

const localeFlags: Record<Locale, string> = {
  ja: '🇯🇵',
  ko: '🇰🇷',
}

export default function Header() {
  const { locale, setLocale, t } = useTranslation()
  const [showLangMenu, setShowLangMenu] = useState(false)

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    setShowLangMenu(false)
    // Dispatch event for any components that need to react
    window.dispatchEvent(new CustomEvent('localeChange', { detail: newLocale }))
  }

  const today = new Date().toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="d-flex align-items-center justify-content-between px-4 bg-white border-bottom" style={{ height: '4rem' }}>
      {/* Left */}
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>{today}</span>
        </div>
      </div>

      {/* Right */}
      <div className="d-flex align-items-center gap-3">
        {/* Language Switcher */}
        <div className="position-relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="btn btn-ghost-secondary btn-sm d-flex align-items-center gap-2"
          >
            <Globe size={16} />
            <span>{localeFlags[locale]} {localeNames[locale]}</span>
          </button>
          {showLangMenu && (
            <div className="position-absolute end-0 top-100 mt-1 bg-white border rounded-lg shadow-lg py-1" style={{ minWidth: '140px', zIndex: 50 }}>
              {(Object.keys(localeNames) as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => changeLocale(loc)}
                  className={`w-100 px-3 py-2 text-start text-sm hover:bg-gray-50 d-flex align-items-center gap-2 border-0 bg-transparent ${
                    locale === loc ? 'bg-primary-lt text-primary fw-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                  {locale === loc && <span className="ms-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn btn-ghost-secondary btn-sm d-flex align-items-center gap-2">
          <RefreshCw size={16} />
          <span>{t.update}</span>
        </button>
        <button className="btn btn-ghost-secondary btn-sm d-flex align-items-center gap-2">
          <Download size={16} />
          <span>{t.export}</span>
        </button>
        <div className="vr mx-1" style={{ height: '1.5rem' }} />
        <button className="btn btn-ghost-secondary btn-icon btn-sm position-relative">
          <Bell size={20} />
          <span className="badge bg-danger badge-notification badge-blink position-absolute" style={{ top: '4px', right: '4px', width: '8px', height: '8px', padding: 0 }} />
        </button>
        <button className="btn btn-ghost-secondary btn-icon btn-sm">
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary-lt" style={{ width: '2rem', height: '2rem' }}>
            <User size={16} className="text-primary" />
          </div>
        </button>
      </div>
    </header>
  )
}
