'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import { tr } from '@/lib/i18n'
import { strokeLabel, STROKE_EMOJI } from '@/lib/types'
import type { Stroke, Distance } from '@/lib/types'
import { HUNGARY_SWIM_LOCATIONS } from '@/lib/locations'

const STROKE_ORDER: Stroke[] = ['free', 'back', 'breast', 'fly', 'im']

// Mêmes règles que results/new
const EVENT_DISTANCES: Record<Stroke, Distance[]> = {
  free:   [50, 100, 200, 400, 800, 1500],
  back:   [50, 100, 200],
  breast: [100, 200],
  fly:    [100, 200],
  im:     [200, 400],
}

export default function NewCompetitionPage() {
  const router = useRouter()
  const { language } = useLanguage()

  const [location,        setLocation]        = useState('')
  const [name,            setName]            = useState('') // optionnel, sinon = lieu
  const [date,            setDate]            = useState(new Date().toISOString().slice(0, 10))
  const [notes,           setNotes]           = useState('')
  const [selectedEvents,  setSelectedEvents]  = useState<Set<string>>(new Set())
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState('')

  const toggleEvent = (stroke: Stroke, distance: Distance) => {
    const key = `${stroke}-${distance}`
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleSave() {
    if (!location.trim() && !name.trim()) {
      setError(tr(language, 'competition.new.location'))
      return
    }
    setSaving(true)
    try {
      const entries = Array.from(selectedEvents).map((key) => {
        const [stroke, distance] = key.split('-')
        return { stroke, distance: Number(distance) }
      })
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Nom = champ nom si rempli, sinon lieu
          name: name.trim() || location.trim(),
          location: location.trim() || null,
          date,
          notes: notes.trim() || null,
          entries,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const comp = await res.json()
      router.push(`/competitions/${comp.id}`)
    } catch (e) {
      console.error(e)
      setError('Erreur lors de la création.')
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#ffffff', border: '1px solid #d6e4f2', borderRadius: 14,
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 16,
    padding: '13px 16px', outline: 'none', width: '100%',
  }
  const fieldLabel: React.CSSProperties = {
    fontWeight: 700, fontSize: 15, marginBottom: 10, color: 'var(--text-secondary)',
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {tr(language, 'competition.new.title')}
        </h1>
      </div>

      <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Lieu — champ principal */}
        <div>
          <div style={fieldLabel}>{tr(language, 'competition.new.location')} *</div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            list="swim-locations"
            style={inputStyle}
            placeholder="Duna Aréna, BVSC Uszoda…"
          />
          <datalist id="swim-locations">
            {HUNGARY_SWIM_LOCATIONS.map((l) => <option key={l} value={l} />)}
          </datalist>
        </div>

        {/* Nom — optionnel */}
        <div>
          <div style={fieldLabel}>
            {tr(language, 'competition.new.name')}
            <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
              (facultatif — par défaut = lieu)
            </span>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder={location || 'Nom de la compétition…'}
          />
        </div>

        {/* Date */}
        <div>
          <div style={fieldLabel}>{tr(language, 'competition.new.date')}</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>

        {/* Sélection des nages */}
        <div>
          <div style={fieldLabel}>{tr(language, 'competition.new.selectEvents')}</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, marginTop: -4 }}>
            {tr(language, 'competition.new.eventsHelp')}
          </p>

          {STROKE_ORDER.map((stroke) => (
            <div key={stroke} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{STROKE_EMOJI[stroke]}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>
                  {strokeLabel(stroke, language)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EVENT_DISTANCES[stroke].map((d) => {
                  const key = `${stroke}-${d}`
                  const active = selectedEvents.has(key)
                  return (
                    <button key={d} type="button" onClick={() => toggleEvent(stroke, d)}
                      style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer', border: active ? '2px solid var(--pool-bright)' : '1px solid #d6e4f2', background: active ? 'rgba(11,131,255,.08)' : '#f1f6fb', color: active ? 'var(--pool-glow)' : '#64748b' }}>
                      {d}m
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <div style={fieldLabel}>{tr(language, 'competition.new.notes')}</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        {error && <div style={{ color: '#dc2626', fontWeight: 600, fontSize: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, height: 56, fontSize: 16 }}>
            {saving ? tr(language, 'common.loading') : tr(language, 'competition.new.save')}
          </button>
          <button onClick={() => router.back()} className="btn-ghost" style={{ height: 56, minWidth: 120 }}>
            {tr(language, 'competition.new.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
