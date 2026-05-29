'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useResults } from '@/hooks/useResults'
import ResultCard from '@/components/ResultCard'
import { Stroke, Distance, STROKE_LABELS } from '@/lib/types'
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

const STROKES: { value: '' | Stroke; label: string }[] = [
  { value: '', label: 'Toutes les nages' },
  { value: 'free', label: 'Crawl' },
  { value: 'back', label: 'Dos' },
  { value: 'breast', label: 'Brasse' },
  { value: 'fly', label: 'Papillon' },
  { value: 'im', label: '4 nages' },
]

export default function TrainingPage() {
  const { language } = useLanguage()
  const { results, isLoaded, removeResult } = useResults()

  const [filterStroke, setFilterStroke] = useState<'' | Stroke>('')
  const [filterDist, setFilterDist] = useState<'' | Distance>('' as '' | Distance)
  const [sortBy, setSortBy] = useState<'date' | 'time'>('date')

  const trainingResults = useMemo(() => {
    return results.filter((r) => r.resultType === 'TRAINING')
  }, [results])

  const filtered = useMemo(() => {
    let list = [...trainingResults]

    if (filterStroke) list = list.filter((r) => r.stroke === filterStroke)
    if (filterDist) list = list.filter((r) => r.distance === filterDist)

    if (sortBy === 'time') {
      list.sort((a, b) => a.timeMs - b.timeMs)
    } else {
      list.sort((a, b) => b.date.localeCompare(a.date))
    }

    return list
  }, [trainingResults, filterStroke, filterDist, sortBy])

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundColor: '#ffffff',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230f1b2d' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
    border: '1px solid #d6e4f2',
    borderRadius: 14,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 40px 10px 14px',
    outline: 'none',
    minWidth: 180,
    cursor: 'pointer',
    boxShadow: '0 6px 14px rgba(15,27,45,0.04)',
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: '-0.03em',
            }}
          >
            {tr(language, 'training.title')}
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 15,
              margin: '4px 0 0',
            }}
          >
            {tr(language, 'training.count', { count: filtered.length })}
          </p>
        </div>

        <Link href="/training/new">
          <button className="btn-primary">
            {tr(language, 'training.add')}
          </button>
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 24,
          padding: '16px 20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 14,
        }}
      >
        <select
          style={selectStyle}
          value={filterStroke}
          onChange={(e) => setFilterStroke(e.target.value as '' | Stroke)}
        >
          {STROKES.map(({ value, label }) => (
            <option key={value} value={value}>
              {value ? STROKE_LABELS[value] : label}
            </option>
          ))}
        </select>

        <select
          style={selectStyle}
          value={filterDist}
          onChange={(e) =>
            setFilterDist(
              e.target.value === ''
                ? ''
                : Number(e.target.value) as Distance
            )
          }
        >
          <option value="">Toutes distances</option>
          {[50, 100, 200, 400, 800, 1500].map((d) => (
            <option key={d} value={d}>
              {d}m
            </option>
          ))}
        </select>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Tri :
          </span>

          {(['date', 'time'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                background:
                  sortBy === s ? 'rgba(0,150,199,0.2)' : 'transparent',
                border: `1px solid ${
                  sortBy === s
                    ? 'rgba(0,180,216,0.4)'
                    : 'transparent'
                }`,
                borderRadius: 8,
                color:
                  sortBy === s
                    ? 'var(--pool-glow)'
                    : 'var(--text-secondary)',
                fontSize: 13,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              {s === 'date'
                ? tr(language, 'results.sortDate')
                : tr(language, 'results.sortTime')}
            </button>
          ))}
        </div>
      </div>

      {!isLoaded ? (
        <div
          style={{
            textAlign: 'center',
            paddingTop: 60,
            color: 'var(--text-muted)',
          }}
        >
          {tr(language, 'common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏊</div>
          <p>{tr(language, 'training.empty')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r) => (
            <ResultCard
            key={r.id}
            result={{
              ...r,
              isPersonalBest: false,
            }}
            onDelete={removeResult}
          />
          ))}
        </div>
      )}
    </div>
  )
}