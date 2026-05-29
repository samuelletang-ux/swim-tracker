import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import NavBar from '@/components/NavBar'
import { getLanguage } from '@/lib/i18n'
import LanguageProvider from '@/components/LanguageProvider'

export const metadata: Metadata = {
  title: 'SwimTrack',
  description: 'Track swimming times, goals and progress',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  return (
    <html lang={language}>
      <body>
        <LanguageProvider initialLanguage={language}>
          <NavBar />
          {/*
            pt-24 : espace sous la top navbar
            pb-24 md:pb-12 : espace sous la bottom tab bar sur mobile, normal sur desktop
          */}
          <main className="min-h-screen pt-24 pb-24 md:pb-12 px-4 md:px-6 max-w-5xl mx-auto">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
