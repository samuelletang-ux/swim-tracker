'use client'

import { useState, useMemo } from 'react'
import { useResults } from '@/hooks/useResults'
import ProgressChart from '@/components/ProgressChart'
import { formatTime, makeEventKey, STROKE_LABELS, STROKE_EMOJI, strokeLabel } from "@/lib/types"
import type { Stroke, Distance, PoolSize } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

export default function ProgressPage() {
  const { language } = useLanguage()
  const { results, isLoaded } = useResults()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const events = useMemo(() => {
    const map = new Map<string, {
      key: string
      stroke: Stroke
      distance: Distance
      poolSize: PoolSize
      results: typeof results
      best: number
      improvement: number | null
    }>()

    for (const r of results) {
      const key = makeEventKey(r.stroke, r.distance, r.poolSize)
      if (!map.has(key)) {
        map.set(key, { key, stroke: r.stroke, distance: r.distance, poolSize: r.poolSize, results: [], best: Infinity, improvement: null })
      }
      map.get(key)!.results.push(r)
    }

    for (const ev of Array.from(map.values())) {
      ev.results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      ev.best = Math.min(...ev.results.map((r) => r.timeMs))
      if (ev.results.length >= 2) {
        ev.improvement = ev.results[ev.results.length - 1].timeMs - ev.results[0].timeMs
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.results.length - a.results.length || a.best - b.best
    )
  }, [results])

  const selectedEvent = useMemo(
    () => events.find((e) => e.key === selectedKey) ?? events[0] ?? null,
    [events, selectedKey]
  )

  if (!isLoaded) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>
        {tr(language, 'common.loading')}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>
          {tr(language, 'progress.noDataTitle')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          {tr(language, 'progress.noDataSubtitle')}
        </p>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', marginBottom: 4 }}>
          {tr(language, 'progress.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          {tr(language, 'progress.eventsCount', { count: events.length })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 240px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* Liste des events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((ev) => {
            const isActive = (selectedKey ?? events[0]?.key) === ev.key
            const improved = ev.improvement !== null && ev.improvement < 0
            return (
              <button
                key={ev.key}
                onClick={() => setSelectedKey(ev.key)}
                style={{ background: isActive ? 'rgba(0,150,199,0.2)' : 'var(--card-bg)', border: `1px solid ${isActive ? 'var(--pool-bright)' : 'var(--card-border)'}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontSize: 20 }}>{STROKE_EMOJI[ev.stroke]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: isActive ? 'var(--pool-glow)' : 'var(--text-primary)' }}>
                    {ev.distance}m {strokeLabel(ev.stroke, language)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {tr(language, 'progress.eventCount', { count: ev.results.length })} · {ev.poolSize}m
                  </div>
                </div>
                {improved && <span style={{ fontSize: 14, color: '#4ade80' }}>↓</span>}
              </button>
            )
          })}
        </div>

        {/* Détail de l'event sélectionné */}
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>{STROKE_EMOJI[selectedEvent.stroke]}</span>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 2 }}>
                    {selectedEvent.distance}m {strokeLabel(selectedEvent.stroke, language)}
                  </h2>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {tr(language, 'progress.pool', { size: selectedEvent.poolSize })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                <StatCard label={tr(language, 'progress.personalBest')} value={formatTime(selectedEvent.best)} gold />
                <StatCard
                  label={tr(language, 'progress.improvement')}
                  value={selectedEvent.improvement !== null ? `${selectedEvent.improvement < 0 ? '' : '+'}${(selectedEvent.improvement / 1000).toFixed(2)}s` : '—'}
                  positive={selectedEvent.improvement !== null && selectedEvent.improvement < 0}
                />
                <StatCard label={tr(language, 'progress.chronos')} value={String(selectedEvent.results.length)} />
              </div>

              {selectedEvent.results.length >= 2 ? (
                <ProgressChart results={selectedEvent.results} height={200} />
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 14, border: '1px dashed rgba(0,180,216,0.2)', borderRadius: 12 }}>
                  {tr(language, 'progress.needMoreData')}
                </div>
              )}
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                {tr(language, 'progress.history')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {Array.from(selectedEvent.results)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((r, i, arr) => {
                    const prev = arr[i + 1]
                    const diff = prev ? r.timeMs - prev.timeMs : null
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,180,216,0.08)' : 'none' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>
                          {format(new Date(r.date), 'd MMM yyyy', { locale: fr })}
                        </div>
                        <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.location || '—'}
                        </div>
                        {diff !== null && (
                          <div style={{ fontSize: 12, color: diff < 0 ? '#4ade80' : '#f87171', flexShrink: 0, width: 60, textAlign: 'right' }}>
                            {diff < 0 ? '' : '+'}{(diff / 1000).toFixed(2)}s
                          </div>
                        )}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: r.isPersonalBest ? 'var(--gold)' : 'var(--pool-glow)', width: 72, textAlign: 'right', flexShrink: 0 }}>
                          {formatTime(r.timeMs)}
                        </div>
                        {r.isPersonalBest && <span style={{ fontSize: 14 }}>⭐</span>}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, gold, positive }: { label: string; value: string; gold?: boolean; positive?: boolean }) {
  return (
    <div style={{ background: gold ? 'rgba(255,209,102,0.08)' : 'rgba(0,30,40,0.5)', border: `1px solid ${gold ? 'rgba(255,209,102,0.2)' : 'rgba(0,180,216,0.12)'}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 20, color: gold ? 'var(--gold)' : positive === true ? '#4ade80' : positive === false ? '#f87171' : 'var(--pool-glow)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  )
}
