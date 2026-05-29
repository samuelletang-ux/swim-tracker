'use client'

import { LANGUAGES, languageLabels, type Language } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <select
      aria-label="Language"
      value={language}
      onChange={(event) => setLanguage(event.target.value as Language)}
      style={{
        border: '1px solid rgba(15, 27, 45, 0.12)',
        borderRadius: 999,
        padding: '8px 10px',
        background: '#ffffff',
        color: 'var(--text-primary)',
        fontWeight: 800,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {languageLabels[lang]}
        </option>
      ))}
    </select>
  )
}
