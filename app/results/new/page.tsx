'use client'

import { useMemo, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useResults } from '@/hooks/useResults'
import { DISTANCES, STROKE_EMOJI, STROKE_LABELS, strokeLabel, Stroke, Distance, PoolSize, timeToMs } from '@/lib/types'
import { HUNGARY_SWIM_LOCATIONS } from '@/lib/locations'
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

const STROKE_ORDER: Stroke[] = ['free', 'back', 'breast', 'fly', 'im']

// Règles épreuves officielles jeunesse
// - Pas de 25m (toutes nages)
// - Pas de 50m brasse ni 50m papillon
// - Pas de 100m 4 nages
// - Pour IM : 200m et 400m seulement
function getAllowedDistances(stroke: Stroke): Distance[] {
  if (stroke === 'im') return [200, 400]
  if (stroke === 'breast' || stroke === 'fly') return [100, 200]
  // free, back : toutes sauf 25m
  return [50, 100, 200, 400, 800, 1500]
}

function NewResultForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const { addResult } = useResults()

  // Lire les query params
  const paramStroke     = searchParams.get('stroke') as Stroke | null
  const paramDistance   = searchParams.get('distance')
  const paramCompId     = searchParams.get('competitionId')
  const paramLocation   = searchParams.get('location')
  const paramDate       = searchParams.get('date')

  const [stroke,     setStroke]     = useState<Stroke>(paramStroke && STROKE_ORDER.includes(paramStroke) ? paramStroke : 'free')
  const [distance,   setDistance]   = useState<Distance>(() => {
    const d = paramDistance ? Number(paramDistance) as Distance : null
    if (d && getAllowedDistances(paramStroke || 'free').includes(d)) return d
    return 100
  })
  const [poolSize,   setPoolSize]   = useState<PoolSize>(50)
  const [minutes,    setMinutes]    = useState('00')
  const [seconds,    setSeconds]    = useState('00')
  const [hundredths, setHundredths] = useState('00')
  const [date,       setDate]       = useState(paramDate || new Date().toISOString().slice(0, 10))
  const [location,   setLocation]   = useState(paramLocation || '')
  const [notes,      setNotes]      = useState('')
  const [rank,       setRank]       = useState('')
  const [isUnranked, setIsUnranked] = useState(false)
  const [competitionId] = useState(paramCompId || null)
  const [error,      setError]      = useState('')
  const [saved,      setSaved]      = useState(false)
  const [isPB,       setIsPB]       = useState(false)

  // Quand on change de nage, recaler la distance si elle n'est plus valide
  useEffect(() => {
    const allowed = getAllowedDistances(stroke)
    if (!allowed.includes(distance)) {
      setDistance(allowed[0])
    }
  }, [stroke, distance])

  const allowedDistances = useMemo(() => getAllowedDistances(stroke), [stroke])

  const timeMs = useMemo(() => {
    return timeToMs(Number(minutes) || 0, Number(seconds) || 0, Number(hundredths) || 0)
  }, [minutes, seconds, hundredths])

  async function handleSubmit() {
    setError('')
    if (timeMs <= 0) { setError(tr(language, 'result.new.errorTime')); return }

    const result = await addResult({
      stroke, distance, poolSize, date, timeMs,
      location: location || null,
      notes: notes || null,
      rank: isUnranked || !rank ? null : Number(rank),
      isUnranked,
      ...(competitionId ? { competitionId } : {}),
    } as any)

    setIsPB(result.isPersonalBest)
    setSaved(true)

    setTimeout(() => {
      if (competitionId) router.push(`/competitions/${competitionId}`)
      else router.push('/')
    
      router.refresh()
    }, 1400)
  }

  const inputStyle: React.CSSProperties = {
    background: '#ffffff', border: '1px solid #d6e4f2', borderRadius: 14,
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 16,
    padding: '13px 16px', outline: 'none', width: '100%',
    boxShadow: '0 8px 18px rgba(15,27,45,0.04)',
  }
  const fieldLabel: React.CSSProperties = {
    fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--text-secondary)',
  }

  return (
    <div className="animate-[fadeIn_.4s_ease]">
      <div style={{ marginBottom: 28, padding: '28px 6px 8px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 0.95, marginBottom: 12 }}>
          {tr(language, 'result.new.title')}
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
          {tr(language, 'result.new.subtitle')}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 920, margin: '0 auto', padding: 36, background: 'rgba(255,255,255,0.92)', border: '1px solid #d9e7f5', boxShadow: '0 18px 45px rgba(15,27,45,0.08)' }}>

        {/* Nage */}
        <div style={{ marginBottom: 34 }}>
          <div style={fieldLabel}>{tr(language, 'result.new.stroke')}</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STROKE_ORDER.map((s) => {
              const active = stroke === s
              return (
                <button key={s} type="button" onClick={() => setStroke(s)}
                  style={{ borderRadius: 18, padding: '16px 10px', border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2', background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb', color: active ? 'var(--pool-glow)' : '#64748b', cursor: 'pointer' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{STROKE_EMOJI[s]}</div>
                  <div style={{ fontWeight: active ? 700 : 500, fontSize: 15 }}>{strokeLabel(s, language)}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Distance + Bassin */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div style={fieldLabel}>{tr(language, 'result.new.distance')}</div>
            <div className="flex flex-wrap gap-3">
              {allowedDistances.map((d) => {
                const active = distance === d
                return (
                  <button key={d} type="button" onClick={() => setDistance(d)}
                    style={{ borderRadius: 14, padding: '12px 18px', border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2', background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb', color: active ? 'var(--pool-glow)' : '#64748b', fontWeight: active ? 700 : 500, cursor: 'pointer' }}>
                    {d}m
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div style={fieldLabel}>{tr(language, 'result.new.poolType')}</div>
            <div className="flex gap-3">
              {([50, 25] as PoolSize[]).map((size) => {
                const active = poolSize === size
                return (
                  <button key={size} type="button" onClick={() => setPoolSize(size)}
                    style={{ flex: 1, borderRadius: 16, padding: '16px 18px', border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2', background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb', color: active ? 'var(--pool-glow)' : '#64748b', fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: 18 }}>
                    {size}m
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Temps */}
        <div style={{ marginTop: 42 }}>
          <div style={fieldLabel}>{tr(language, 'result.new.time')}</div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
            <input value={minutes} onChange={(e) => setMinutes(e.target.value)} maxLength={2} inputMode="numeric" style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, height: 68 }} />
            <div style={{ fontSize: 42, fontWeight: 700, color: '#7f93a8' }}>:</div>
            <input value={seconds} onChange={(e) => setSeconds(e.target.value)} maxLength={2} inputMode="numeric" style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, height: 68 }} />
            <div style={{ fontSize: 42, fontWeight: 700, color: '#7f93a8' }}>.</div>
            <input value={hundredths} onChange={(e) => setHundredths(e.target.value)} maxLength={2} inputMode="numeric" style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, height: 68 }} />
          </div>
        </div>

        {/* Date + Lieu */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <div style={fieldLabel}>{tr(language, 'result.new.date')}</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>{tr(language, 'result.new.location')}</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder={tr(language, 'result.new.locationPlaceholder')}
              list="swim-locations" style={inputStyle} />
            <datalist id="swim-locations">
              {HUNGARY_SWIM_LOCATIONS.map((l) => <option key={l} value={l} />)}
            </datalist>
          </div>
        </div>

        {/* Place */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <div style={fieldLabel}>{tr(language, 'result.new.rank')}</div>
            <input value={rank} onChange={(e) => setRank(e.target.value)} disabled={isUnranked}
              type="number" min="1" placeholder={tr(language, 'result.new.rankPlaceholder')}
              style={{ ...inputStyle, opacity: isUnranked ? 0.45 : 1 }} />
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', alignSelf: 'end', padding: '13px 16px', border: '1px solid #d6e4f2', borderRadius: 14, background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            <input checked={isUnranked} onChange={(e) => { setIsUnranked(e.target.checked); if (e.target.checked) setRank('') }} type="checkbox" />
            {tr(language, 'result.new.unranked')}
          </label>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 30 }}>
          <div style={fieldLabel}>{tr(language, 'result.new.notes')}</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={tr(language, 'result.new.notesPlaceholder')}
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        {error && <div style={{ marginTop: 18, color: '#dc2626', fontWeight: 600 }}>{error}</div>}

        {saved && (
          <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.18)', color: '#15803d', fontWeight: 700 }}>
            {isPB ? tr(language, 'result.new.savedPb') : tr(language, 'result.new.saved')}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4" style={{ marginTop: 36 }}>
          <button type="button" onClick={handleSubmit} className="btn-primary" style={{ flex: 1, height: 64, fontSize: 18, borderRadius: 18 }}>
            {tr(language, 'result.new.save')}
          </button>
          <button type="button" onClick={() => competitionId ? router.push(`/competitions/${competitionId}`) : router.back()} className="btn-ghost" style={{ height: 64, minWidth: 140, borderRadius: 18, fontSize: 18 }}>
            {tr(language, 'result.new.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewResultPage() {
  return (
    <Suspense>
      <NewResultForm />
    </Suspense>
  )
}
