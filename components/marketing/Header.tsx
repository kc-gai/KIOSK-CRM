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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Globe className="w-4 h-4" />
            <span>{localeFlags[locale]} {localeNames[locale]}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
              {(Object.keys(localeNames) as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => changeLocale(loc)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    locale === loc ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                  {locale === loc && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span>{t.update}</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          <span>{t.export}</span>
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </button>
      </div>
    </header>
  )
}
