'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

const desktopLinks = [
  { href: '/',             labelKey: 'nav.dashboard'    },
  { href: '/competitions', labelKey: 'nav.competitions' },
  { href: '/training',     labelKey: 'nav.training'     },
  { href: '/strokes',      labelKey: 'nav.strokes'      },
  { href: '/results',      labelKey: 'nav.results'      },
  { href: '/admin',        labelKey: 'nav.admin'        },
]

const mobileLinks = [
  {
    href: '/',
    labelKey: 'nav.dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },

  {
    href: '/competitions',
    labelKey: 'nav.competitions',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M5 3h14l-2 8H7L5 3z"/>
        <path d="M7 11c0 2.8 2.2 5 5 5s5-2.2 5-5"/>
      </svg>
    ),
  },

  {
    href: '/training',
    labelKey: 'nav.training',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18c2-2 4-3 6-3s4 2 6 2 4-1 6-1"/>
        <path d="M2 12c2-4 4-6 6-6s4 4 6 4 4-2 6-2"/>
      </svg>
    ),
  },

  {
    href: '/results',
    labelKey: 'nav.results',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <circle cx="3" cy="6" r="1" fill="currentColor"/>
        <circle cx="3" cy="12" r="1" fill="currentColor"/>
        <circle cx="3" cy="18" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  
  {
    href: '/strokes',
    labelKey: 'nav.strokes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
        <path d="M4 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
        <path d="M8 7h8"/>
      </svg>
    ),
  },
  {
    href: '/results/new',
    labelKey: 'nav.add',
    isCta: true,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },

]

export default function NavBar() {
  const path = usePathname()
  const { language } = useLanguage()

  const isActive = (href: string) =>
    href === '/' ? path === '/' : path === href || path.startsWith(href + '/')

  return (
    <>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(15,27,45,0.08)', boxShadow: '0 8px 24px rgba(15,27,45,0.04)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between h-16 gap-3">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0877ee,#0b83ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 10px 22px rgba(8,119,238,.25)' }}>🏊</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>SwimTrack</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {desktopLinks.map(({ href, labelKey }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} style={{ textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--pool-glow)' : 'var(--text-secondary)', padding: '8px 14px', borderRadius: 999, background: active ? 'rgba(8,119,238,0.1)' : 'transparent', border: active ? '1px solid rgba(8,119,238,0.16)' : '1px solid transparent', transition: 'all 0.2s' }}>
                  {tr(language, labelKey)}
                </Link>
              )
            })}
          </nav>

          <Link href="/account" title={tr(language, 'nav.account')} style={{ textDecoration: 'none', width: 36, height: 36, borderRadius: '50%', background: isActive('/account') ? 'linear-gradient(135deg,#0877ee,#0b83ff)' : 'rgba(8,119,238,0.1)', border: isActive('/account') ? '2px solid #0877ee' : '2px solid rgba(8,119,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, transition: 'all 0.2s', flexShrink: 0 }}>
            👤
          </Link>
        </div>
      </header>

      <nav className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(15,27,45,0.08)', boxShadow: '0 -8px 24px rgba(15,27,45,0.06)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileLinks.map(({ href, labelKey, icon, isCta }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px 8px', color: isCta ? '#0877ee' : active ? 'var(--pool-glow)' : 'var(--text-muted)', transition: 'color 0.15s', position: 'relative' }}>
              {active && !isCta && (
                <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 3, borderRadius: '0 0 3px 3px', background: 'var(--pool-glow)' }} />
              )}
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...(isCta ? { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0877ee,#0b83ff)', color: '#fff', boxShadow: '0 6px 18px rgba(8,119,238,.35)', marginTop: -10 } : {}) }}>
                {icon}
              </span>
              <span style={{ fontSize: 10, fontWeight: active || isCta ? 700 : 500, fontFamily: 'var(--font-body)' }}>
                {isCta ? '+' : tr(language, labelKey)}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
