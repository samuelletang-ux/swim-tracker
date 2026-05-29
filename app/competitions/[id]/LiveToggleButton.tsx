'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { tr } from '@/lib/i18n'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  competitionId: string
  isLive: boolean
}

export default function LiveToggleButton({ competitionId, isLive }: Props) {
  const { language } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/competitions/${competitionId}/live`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  if (isLive) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
          color: '#ef4444', fontWeight: 700, fontSize: 14,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
        {loading ? '...' : tr(language, 'live.end')}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer',
        color: '#fff', fontWeight: 800, fontSize: 14,
        boxShadow: '0 4px 14px rgba(239,68,68,.35)',
        transition: 'all 0.2s',
      }}
    >
      {loading ? '...' : tr(language, 'live.goLive')}
    </button>
  )
}
