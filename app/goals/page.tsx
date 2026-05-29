'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatTime, strokeLabel } from "@/lib/types"
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

type QualificationRow = {
  id: string
  stroke: string
  distance: number
  ageGroup: string
  gender: string
  requiredTimeMs: number
  requiredTimeText: string
  bestTimeMs: number | null
  diffMs: number | null
  qualified: boolean
  favorite: boolean
}

type QualificationStatus = {
  swimmer: { id: string; name: string; birthYear: number | null; gender: string | null } | null
  ageGroup: string | null
  rows: QualificationRow[]
}

function diffLabel(diffMs: number) {
  const abs = Math.abs(diffMs)
  return `${diffMs <= 0 ? '-' : '+'}${formatTime(abs)}`
}

export default function GoalsPage() {
  const { language } = useLanguage()
  const [status, setStatus] = useState<QualificationStatus | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/qualification-status', { cache: 'no-store' })
      const data = await res.json()
      setStatus(data)
    }
    load()
  }, [])

  if (!status) {
    return <div style={{ paddingTop: 80 }}>{tr(language, 'common.loading')}</div>
  }

  if (!status.swimmer) {
    return (
      <div>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {tr(language, 'goals.title')}
        </h1>
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          {tr(language, 'goals.noSwimmer')}
        </div>
      </div>
    )
  }

  const qualifiedCount = status.rows.filter((r) => r.qualified).length

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {tr(language, 'goals.title')}
        </h1>
        <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          {status.swimmer.name} · {tr(language, 'home.category')} : {status.ageGroup || tr(language, 'goals.categoryUnset')} · {tr(language, 'goals.qualifiedCount', { count: qualifiedCount, total: status.rows.length })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {status.rows.map((q) => (
          <Link key={q.id} href={`/events/${q.distance}m-${q.stroke}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1.1fr .9fr .9fr auto', gap: 14, alignItems: 'center', background: q.qualified ? 'rgba(16,185,129,.08)' : '#ffffff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault()
                      await fetch('/api/favorite-events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stroke: q.stroke, distance: q.distance }),
                      })
                      const res = await fetch('/api/qualification-status', { cache: 'no-store' })
                      const data = await res.json()
                      setStatus(data)
                    }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22 }}
                  >
                    {q.favorite ? '⭐' : '☆'}
                  </button>
                  <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--text-primary)' }}>
                    {q.distance}m {strokeLabel(q.stroke, language)}
                  </div>
                </div>
                <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                  {tr(language, 'goals.required')} : {q.requiredTimeText}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tr(language, 'goals.best')}</div>
                <div style={{ marginTop: 4, fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>
                  {q.bestTimeMs ? formatTime(q.bestTimeMs) : '—'}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tr(language, 'goals.gap')}</div>
                <div style={{ marginTop: 4, fontWeight: 900, fontSize: 18, color: q.qualified ? '#059669' : '#dc2626' }}>
                  {q.diffMs !== null ? diffLabel(q.diffMs) : '—'}
                </div>
              </div>

              <div style={{ padding: '10px 15px', borderRadius: 999, fontWeight: 900, fontSize: 12, background: q.qualified ? 'rgba(16,185,129,.14)' : 'rgba(239,68,68,.12)', color: q.qualified ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                {q.qualified ? tr(language, 'admin.qualifications.ok') : tr(language, 'admin.qualifications.todo')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
