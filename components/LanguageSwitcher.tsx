'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'

const LANGUAGES = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' }
]

export function LanguageSwitcher() {
    const locale = useLocale()
    const [isLoading, setIsLoading] = useState(false)

    const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0]

    const switchLocale = async (newLocale: string) => {
        if (newLocale === locale) return

        setIsLoading(true)
        try {
            await fetch('/api/locale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: newLocale })
            })
            window.location.reload()
        } catch (error) {
            console.error('Failed to switch locale:', error)
            setIsLoading(false)
        }
    }

    return (
        <div className="btn-group w-100" role="group">
            {LANGUAGES.map(lang => (
                <button
                    key={lang.code}
                    type="button"
                    onClick={() => switchLocale(lang.code)}
                    disabled={isLoading}
                    className={`btn btn-sm ${lang.code === locale ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ flex: 1 }}
                >
                    <span className="me-1">{lang.flag}</span>
                    {lang.label}
                </button>
            ))}
        </div>
    )
}
