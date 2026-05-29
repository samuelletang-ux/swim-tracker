'use client'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/hooks/useLanguage'
import { tr } from '@/lib/i18n'

export default function AccountLanguageCard() {
  const { language } = useLanguage()

  return (
    <div
      className="card"
      style={{
        marginBottom: 24,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        maxWidth: 860,
      }}
    >
      <div>
        <div style={{ fontWeight: 900, marginBottom: 4 }}>
          {tr(language, 'account.language')}
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {tr(language, 'account.languageHelp')}
        </div>
      </div>

      <LanguageSwitcher />
    </div>
  )
}