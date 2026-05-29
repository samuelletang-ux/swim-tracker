'use client'

import { createContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Language } from '@/lib/i18n'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export default function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode
  initialLanguage: Language
}) {
  const router = useRouter()
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage)

    document.cookie = `swimtrack_lang=${nextLanguage}; path=/; max-age=31536000; samesite=lax`
    localStorage.setItem('swimtrack_lang', nextLanguage)
    document.documentElement.lang = nextLanguage

    router.refresh()
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}