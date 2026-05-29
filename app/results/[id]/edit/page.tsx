'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useResults } from '@/hooks/useResults'
import {
  DISTANCES,
  STROKE_EMOJI,
  STROKE_LABELS,
  Stroke,
  Distance,
  PoolSize,
  timeToMs,
  msToTime,
} from '@/lib/types'
import type { SwimResult } from '@/lib/types'
import { HUNGARY_SWIM_LOCATIONS } from '@/lib/locations'

export default function EditResultPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id)

  const { updateResult } = useResults()

  const [loaded, setLoaded] = useState(false)
  const [stroke, setStroke] = useState<Stroke>('free')
  const [distance, setDistance] = useState<Distance>(50)
  const [poolSize, setPoolSize] = useState<PoolSize>(25)
  const [minutes, setMinutes] = useState('00')
  const [seconds, setSeconds] = useState('00')
  const [hundredths, setHundredths] = useState('00')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [rank, setRank] = useState('')
  const [isUnranked, setIsUnranked] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/results/${id}`, { cache: 'no-store' })
      const data = (await res.json()) as SwimResult

      setStroke(data.stroke)
      setDistance(data.distance)
      setPoolSize(data.poolSize)
      setDate(data.date)
      setLocation(data.location || '')
      setNotes(data.notes || '')
      setRank(data.rank ? String(data.rank) : '')
      setIsUnranked(Boolean(data.isUnranked))

      const t = msToTime(data.timeMs)
      setMinutes(String(t.minutes).padStart(2, '0'))
      setSeconds(String(t.seconds).padStart(2, '0'))
      setHundredths(String(t.hundredths).padStart(2, '0'))

      setLoaded(true)
    }

    load()
  }, [id])

  const timeMs = useMemo(() => {
    return timeToMs(Number(minutes) || 0, Number(seconds) || 0, Number(hundredths) || 0)
  }, [minutes, seconds, hundredths])

  async function handleSubmit() {
    setError('')

    if (timeMs <= 0) {
      setError('Saisis un temps valide.')
      return
    }

    await updateResult(id, {
      stroke,
      distance,
      poolSize,
      date,
      timeMs,
      location,
      notes,
      rank: isUnranked || !rank ? null : Number(rank),
      isUnranked,
    })

    router.push('/results')
  }

  const inputStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #d6e4f2',
    borderRadius: 14,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    padding: '13px 16px',
    outline: 'none',
    width: '100%',
    boxShadow: '0 8px 18px rgba(15, 27, 45, 0.04)',
  }

  const fieldLabel: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 12,
    color: 'var(--text-secondary)',
  }

  if (!loaded) {
    return <div style={{ paddingTop: 80 }}>Chargement…</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 28, padding: '28px 6px 8px' }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          Modifier le chrono
        </h1>
      </div>

      <div className="card" style={{ maxWidth: 920, margin: '0 auto', padding: 36 }}>
        <div style={{ marginBottom: 34 }}>
          <div style={fieldLabel}>Nage</div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(STROKE_LABELS) as Stroke[]).map((s) => {
              const active = stroke === s

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStroke(s)}
                  style={{
                    borderRadius: 18,
                    padding: '16px 10px',
                    border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2',
                    background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb',
                    color: active ? 'var(--pool-glow)' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{STROKE_EMOJI[s]}</div>
                  <div style={{ fontWeight: active ? 700 : 500, fontSize: 15 }}>
                    {STROKE_LABELS[s]}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div style={fieldLabel}>Distance</div>

            <div className="flex flex-wrap gap-3">
              {DISTANCES.map((d) => {
                const active = distance === d

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistance(d)}
                    style={{
                      borderRadius: 14,
                      padding: '12px 18px',
                      border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2',
                      background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb',
                      color: active ? 'var(--pool-glow)' : '#64748b',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {d}m
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={fieldLabel}>Type de bassin</div>

            <div className="flex gap-3">
              {[25, 50].map((size) => {
                const active = poolSize === size

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPoolSize(size as PoolSize)}
                    style={{
                      flex: 1,
                      borderRadius: 16,
                      padding: '16px 18px',
                      border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2',
                      background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb',
                      color: active ? 'var(--pool-glow)' : '#64748b',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >
                    {size}m
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 42 }}>
          <div style={fieldLabel}>Temps</div>

          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
            <input value={minutes} onChange={(e) => setMinutes(e.target.value)} maxLength={2} inputMode="numeric" style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, height: 68 }} />
            <div style={{ fontSize: 42, fontWeight: 700, color: '#7f93a8' }}>:</div>
            <input value={seconds} onChange={(e) => setSeconds(e.target.value)} maxLength={2} inputMode="numeric" style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, height: 68 }} />
            <div style={{ fontSize: 42, fontWeight: 700, color: '#7f93a8' }}>.</div>
            <input value={hundredths} onChange={(e) => setHundredths(e.target.value)} maxLength={2} inputMode="numeric" style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, height: 68 }} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <div style={fieldLabel}>Date</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={fieldLabel}>Lieu / Compétition</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} list="hungary-swim-locations" style={inputStyle} />
            <datalist id="hungary-swim-locations">
              {HUNGARY_SWIM_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <div style={fieldLabel}>Place</div>
            <input
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              disabled={isUnranked}
              type="number"
              min="1"
              placeholder="1, 2, 3..."
              style={{
                ...inputStyle,
                opacity: isUnranked ? 0.45 : 1,
              }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              alignSelf: 'end',
              padding: '13px 16px',
              border: '1px solid #d6e4f2',
              borderRadius: 14,
              background: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <input
              checked={isUnranked}
              onChange={(e) => {
                setIsUnranked(e.target.checked)
                if (e.target.checked) setRank('')
              }}
              type="checkbox"
            />
            Non classé
          </label>
        </div>

        <div style={{ marginTop: 30 }}>
          <div style={fieldLabel}>Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {error && <div style={{ marginTop: 18, color: '#dc2626', fontWeight: 600 }}>{error}</div>}

        <div className="flex flex-col md:flex-row gap-4" style={{ marginTop: 36 }}>
          <button type="button" onClick={handleSubmit} className="btn-primary" style={{ flex: 1, height: 64, fontSize: 18, borderRadius: 18 }}>
            Enregistrer les modifications
          </button>

          <button type="button" onClick={() => router.push('/results')} className="btn-ghost" style={{ height: 64, minWidth: 140, borderRadius: 18, fontSize: 18 }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}