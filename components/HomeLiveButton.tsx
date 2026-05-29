'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  competitionId: string
  labelGoLive: string
}

export default function HomeLiveButton({ competitionId, labelGoLive }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault() // ne pas naviguer vers la compét
    e.stopPropagation()
    setLoading(true)
    await fetch(`/api/competitions/${competitionId}/live`, { method: 'POST' })
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
        border: 'none', borderRadius: 10,
        padding: '8px 16px',
        color: '#fff', fontWeight: 800, fontSize: 13,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(239,68,68,.35)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '...' : <><span style={{ fontSize: 10 }}>🔴</span> {labelGoLive}</>}
    </button>
  )
}
