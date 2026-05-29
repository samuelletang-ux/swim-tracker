import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLanguage, tr } from '@/lib/i18n'
import { strokeLabel, formatTime, STROKE_EMOJI } from '@/lib/types'
import type { Stroke } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'
import LiveToggleButton from './LiveToggleButton'

// Helper médailles / Oklevél
function RankBadge({ rank, isUnranked }: { rank: number | null | undefined; isUnranked?: boolean }) {
  if (isUnranked || !rank) return null
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>
  return <span style={{ fontSize: 11, color: '#1d4ed8', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.18)', padding: '3px 9px', borderRadius: 999, fontWeight: 800 }}>Oklevél</span>
}

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const comp = await prisma.competition.findUnique({
    where: { id },
    include: {
      entries: { orderBy: [{ stroke: 'asc' }, { distance: 'asc' }] },
      results: { orderBy: [{ date: 'asc' }] },
    },
  })

  if (!comp) notFound()

  const today = new Date().toISOString().split('T')[0]
  const isToday = comp.date === today
  const isUpcoming = comp.date >= today
  const daysUntil = Math.ceil((new Date(comp.date).getTime() - Date.now()) / 86400000)

  // Associer résultats à chaque entry
  const entriesWithResults = comp.entries.map((entry) => {
    const result = comp.results.find(
      (r) => r.stroke === entry.stroke && r.distance === entry.distance
    )
    return { ...entry, result: result ?? null }
  })

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Breadcrumb */}
      <Link href="/competitions" style={{ color: 'var(--pool-glow)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← {tr(language, 'competitions.title')}
      </Link>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            {/* Badge LIVE */}
            {comp.isLive && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999, padding: '4px 12px', marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live</span>
              </div>
            )}

            <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
              {comp.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: 'var(--text-secondary)', fontSize: 15 }}>
              <span>📅 {format(new Date(comp.date), 'd MMMM yyyy')}</span>
              {comp.location && <span>📍 {comp.location}</span>}
              {isUpcoming && !isToday && daysUntil >= 0 && (
                <span style={{ color: 'var(--pool-glow)', fontWeight: 700 }}>J-{daysUntil}</span>
              )}
              {isToday && !comp.isLive && (
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Aujourd'hui</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Bouton Live — visible le jour J ou si déjà live */}
            {(isToday || comp.isLive) && (
              <LiveToggleButton
                competitionId={id}
                isLive={comp.isLive}
              />
            )}
            <Link href={`/competitions/${id}/edit`}>
              <button className="btn-ghost" style={{ fontSize: 14 }}>
                {tr(language, 'competition.detail.edit')}
              </button>
            </Link>
          </div>
        </div>

        {comp.notes && (
          <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14, fontStyle: 'italic' }}>
            {comp.notes}
          </p>
        )}
      </div>

      {/* Épreuves */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>
            {tr(language, 'competition.detail.entries')}
          </h2>
          <Link href={`/competitions/${id}/edit`} style={{ fontSize: 13, color: 'var(--pool-glow)', textDecoration: 'none', fontWeight: 700 }}>
            {tr(language, 'competition.detail.editEntries')}
          </Link>
        </div>

        {entriesWithResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 14 }}>
            {tr(language, 'competition.detail.noEntries')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entriesWithResults.map((entry) => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 14,
                background: entry.result ? 'rgba(8,119,238,0.04)' : comp.isLive ? 'rgba(239,68,68,0.03)' : '#fafbfc',
                border: `1px solid ${entry.result ? 'rgba(8,119,238,0.12)' : comp.isLive ? 'rgba(239,68,68,0.15)' : '#e8f0f8'}`,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{STROKE_EMOJI[entry.stroke as Stroke]}</span>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {entry.distance}m {strokeLabel(entry.stroke as Stroke, language)}
                  </div>
                  {entry.result?.location && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {entry.result.location}
                    </div>
                  )}
                </div>

                {entry.result ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {entry.result.isPersonalBest && <span style={{ fontSize: 14 }}>⭐</span>}
                    <RankBadge rank={entry.result.rank} isUnranked={entry.result.isUnranked} />
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: entry.result.isPersonalBest ? 'var(--gold)' : 'var(--pool-glow)' }}>
                      {formatTime(entry.result.timeMs)}
                    </div>
                    <Link href={`/results/${entry.result.id}/edit`} style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>✎</Link>
                  </div>
                ) : (
                  <Link
                    href={`/results/new?stroke=${entry.stroke}&distance=${entry.distance}&competitionId=${id}&location=${encodeURIComponent(comp.location || '')}&date=${comp.date}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button
                      className={comp.isLive ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: 13, padding: '8px 16px', ...(comp.isLive ? { background: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,.25)' } : {}) }}
                    >
                      {comp.isLive ? '+ Chrono' : tr(language, 'competition.detail.addResult')}
                    </button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
