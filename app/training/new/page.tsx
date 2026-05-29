'use client'

import { useMemo, useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useResults } from '@/hooks/useResults'
import {
  STROKE_EMOJI,
  strokeLabel,
  Stroke,
  Distance,
  timeToMs,
} from '@/lib/types'
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

const STROKE_ORDER: Stroke[] = [
  'free',
  'back',
  'breast',
  'fly',
  'im',
]

function getAllowedDistances(): Distance[] {
  return [33, 66, 99] as Distance[]
}

function NewTrainingForm() {
  const router = useRouter()
  const { language } = useLanguage()
  const { addResult } = useResults()

  const [stroke, setStroke] = useState<Stroke>('free')
  const [distance, setDistance] = useState<Distance>(33 as Distance)

  const [minutes, setMinutes] = useState('00')
  const [seconds, setSeconds] = useState('00')
  const [hundredths, setHundredths] = useState('00')

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [notes, setNotes] = useState('')

  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isPB, setIsPB] = useState(false)

  useEffect(() => {
    const allowed = getAllowedDistances()
  
    if (!allowed.includes(distance)) {
      setDistance(allowed[0])
    }
  }, [distance])

  const allowedDistances = useMemo(
    () => getAllowedDistances(),
    []
  )

  const timeMs = useMemo(() => {
    return timeToMs(
      Number(minutes) || 0,
      Number(seconds) || 0,
      Number(hundredths) || 0
    )
  }, [minutes, seconds, hundredths])

  async function handleSubmit() {
    setError('')

    if (timeMs <= 0) {
      setError(tr(language, 'result.new.errorTime'))
      return
    }

    const result = await addResult({
      resultType: 'TRAINING',
      stroke,
      distance,
      poolSize: 33,
      date,
      timeMs,
      location: null,
      notes: notes || null,
      rank: null,
      isUnranked: false,
    } as any)

    setIsPB(result.isPersonalBest)
    setSaved(true)

    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1200)
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
    boxShadow: '0 8px 18px rgba(15,27,45,0.04)',
  }

  const fieldLabel: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 12,
    color: 'var(--text-secondary)',
  }

  return (
    <div className="animate-[fadeIn_.4s_ease]">
      <div
        style={{
          marginBottom: 28,
          padding: '28px 6px 8px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            lineHeight: 0.95,
            marginBottom: 12,
          }}
        >
          {tr(language, 'training.new.title')}
        </div>

        <div
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
          }}
        >
          {tr(language, 'training.new.subtitle')}
        </div>
      </div>

      <div
        className="card"
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: 36,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #d9e7f5',
          boxShadow: '0 18px 45px rgba(15,27,45,0.08)',
        }}
      >
        <div style={{ marginBottom: 34 }}>
          <div style={fieldLabel}>
            {tr(language, 'result.new.stroke')}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STROKE_ORDER.map((s) => {
              const active = stroke === s

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStroke(s)}
                  style={{
                    borderRadius: 18,
                    padding: '16px 10px',
                    border: active
                      ? '2px solid var(--pool-bright)'
                      : '1px solid #d6e4f2',
                    background: active
                      ? 'rgba(11,131,255,.08)'
                      : '#f1f6fb',
                    color: active
                      ? 'var(--pool-glow)'
                      : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      marginBottom: 8,
                    }}
                  >
                    {STROKE_EMOJI[s]}
                  </div>

                  <div
                    style={{
                      fontWeight: active ? 700 : 500,
                      fontSize: 15,
                    }}
                  >
                    {strokeLabel(s, language)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={fieldLabel}>
            {tr(language, 'result.new.distance')}
          </div>

          <div className="flex flex-wrap gap-3">
            {allowedDistances.map((d) => {
              const active = distance === d

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistance(d)}
                  style={{
                    borderRadius: 14,
                    padding: '12px 18px',
                    border: active
                      ? '2px solid var(--pool-bright)'
                      : '1px solid #d6e4f2',
                    background: active
                      ? 'rgba(11,131,255,.08)'
                      : '#f1f6fb',
                    color: active
                      ? 'var(--pool-glow)'
                      : '#64748b',
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

        <div style={{ marginTop: 42 }}>
          <div style={fieldLabel}>
            {tr(language, 'result.new.time')}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              maxLength={2}
              inputMode="numeric"
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 26,
                fontWeight: 600,
                height: 68,
              }}
            />

            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: '#7f93a8',
              }}
            >
              :
            </div>

            <input
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              maxLength={2}
              inputMode="numeric"
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 26,
                fontWeight: 600,
                height: 68,
              }}
            />

            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: '#7f93a8',
              }}
            >
              .
            </div>

            <input
              value={hundredths}
              onChange={(e) => setHundredths(e.target.value)}
              maxLength={2}
              inputMode="numeric"
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 26,
                fontWeight: 600,
                height: 68,
              }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <div style={fieldLabel}>
              {tr(language, 'result.new.date')}
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={fieldLabel}>
              {tr(language, 'training.new.pool')}
            </div>

            <div
              style={{
                ...inputStyle,
                fontWeight: 800,
                color: 'var(--pool-glow)',
                textAlign: 'center',
              }}
            >
              33m
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <div style={fieldLabel}>
            {tr(language, 'result.new.notes')}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr(
              language,
              'result.new.notesPlaceholder'
            )}
            style={{
              ...inputStyle,
              minHeight: 90,
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: 18,
              color: '#dc2626',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {saved && (
          <div
            style={{
              marginTop: 20,
              padding: '14px 18px',
              borderRadius: 14,
              background: 'rgba(22,163,74,.08)',
              border: '1px solid rgba(22,163,74,.18)',
              color: '#15803d',
              fontWeight: 700,
            }}
          >
            {isPB
              ? tr(language, 'result.new.savedPb')
              : tr(language, 'result.new.saved')}
          </div>
        )}

        <div
          className="flex flex-col md:flex-row gap-4"
          style={{ marginTop: 36 }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            style={{
              flex: 1,
              height: 64,
              fontSize: 18,
              borderRadius: 18,
            }}
          >
            {tr(language, 'result.new.save')}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
            style={{
              height: 64,
              minWidth: 140,
              borderRadius: 18,
              fontSize: 18,
            }}
          >
            {tr(language, 'result.new.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewTrainingPage() {
  return (
    <Suspense>
      <NewTrainingForm />
    </Suspense>
  )
}