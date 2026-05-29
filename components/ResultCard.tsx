'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SwimResult, STROKE_EMOJI, formatTime, strokeLabel } from '@/lib/types'
import { format } from 'date-fns'
import { useLanguage } from '@/hooks/useLanguage'

interface Props {
  result: SwimResult
  onDelete?: (id: string) => void | Promise<void>
  compact?: boolean
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function rankBadge(rank: number | null | undefined, isUnranked?: boolean) {
  if (isUnranked) return null
  if (!rank) return null
  if (rank <= 3) return { emoji: MEDAL[rank], label: null }
  return { emoji: null, label: 'Oklevél' }
}

export default function ResultCard({ result, onDelete, compact = false }: Props) {
  const router = useRouter()
  const { language } = useLanguage()
  const timeStr = formatTime(result.timeMs)
  const dateStr = format(new Date(result.date), compact ? 'd MMM yy' : 'd MMMM yyyy')
  const badge = rankBadge(result.rank, result.isUnranked)

  async function handleDelete() {
    if (!confirm('Supprimer ce chrono ?')) return

    if (onDelete) {
      await onDelete(result.id)
      router.refresh()
      return
    }

    const res = await fetch(`/api/results/${result.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      alert('Erreur pendant la suppression.')
      return
    }

    router.refresh()
  }

  return (
    <div
      className="card"
      style={{
        padding: compact ? '14px 16px' : '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: 'fadeIn 0.3s ease-out',
        background: '#ffffff',
        border: '1px solid #dbe6f2',
        boxShadow: '0 10px 26px rgba(15,27,45,0.06)',
      }}
    >
      <div style={{ width: compact ? 42 : 52, height: compact ? 42 : 52, borderRadius: 14, background: 'linear-gradient(135deg,#eef7ff,#dceeff)', border: '1px solid #cfe2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 20 : 25, flexShrink: 0 }}>
        {STROKE_EMOJI[result.stroke]}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: compact ? 14 : 16, color: 'var(--text-primary)' }}>
            {result.distance}m {strokeLabel(result.stroke, language)}
          </span>

          {result.isPersonalBest && <span className="badge-pb">PB</span>}

          {badge && (
            badge.emoji ? (
              <span style={{ fontSize: compact ? 16 : 20 }}>{badge.emoji}</span>
            ) : (
              <span style={{ fontSize: 11, color: '#1d4ed8', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.18)', padding: '3px 9px', borderRadius: 999, fontWeight: 800 }}>
                Oklevél
              </span>
            )
          )}

          <span style={{ fontSize: 11, color: 'var(--pool-glow)', background: 'rgba(8,119,238,0.08)', border: '1px solid rgba(8,119,238,0.14)', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
            {result.poolSize}m
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1" style={{ minWidth: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{dateStr}</span>
          {result.location && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              · {result.location}
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: compact ? 20 : 27, color: result.isPersonalBest ? 'var(--gold)' : 'var(--pool-glow)', letterSpacing: '-0.03em' }}>
          {timeStr}
        </div>
      </div>

      <Link href={`/results/${result.id}/edit`} style={{ textDecoration: 'none', background: '#f8fbff', border: '1px solid #dbe6f2', color: 'var(--pool-glow)', cursor: 'pointer', width: 34, height: 34, borderRadius: 10, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        ✎
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        aria-label="Supprimer"
        title="Supprimer"
        style={{
          background: '#fff5f5',
          border: '1px solid #fecaca',
          color: '#dc2626',
          cursor: 'pointer',
          width: 34,
          height: 34,
          borderRadius: 10,
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        🗑
      </button>
    </div>
  )
}