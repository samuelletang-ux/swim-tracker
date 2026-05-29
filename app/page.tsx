import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getLanguage, tr } from '@/lib/i18n'
import { strokeLabel, formatTime, STROKE_EMOJI } from '@/lib/types'
import type { Stroke } from '@/lib/types'
import Link from 'next/link'
import HomeLiveButton from '@/components/HomeLiveButton'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

function RankBadge({ rank, isUnranked }: { rank: number | null | undefined; isUnranked?: boolean }) {
  if (isUnranked || !rank) return null
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>
  return (
    <span style={{ fontSize: 11, color: '#1d4ed8', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.18)', padding: '3px 9px', borderRadius: 999, fontWeight: 800 }}>
      Oklevél
    </span>
  )
}

function getAgeGroup(age: number): string {
  if (age <= 11) return 'capa11'
  if (age <= 12) return 'capa12'
  if (age <= 13) return 'gy13'
  if (age <= 14) return 'gy14'
  if (age <= 16) return 'serdulo'
  if (age <= 18) return 'ifjusagi'
  return 'adult'
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const swimmer = await prisma.swimmer.findFirst({
    where: { role: 'PRIMARY' },
    include: { favoriteEvents: true },
  })

  const today = new Date().toISOString().split('T')[0]

  const liveComp = await prisma.competition.findFirst({
    where: { isLive: true },
    include: {
      entries: { orderBy: [{ stroke: 'asc' }, { distance: 'asc' }] },
      results: true,
    },
  })

  const nextComp = liveComp ? null : await prisma.competition.findFirst({
    where: { date: { gte: today }, isLive: false },
    orderBy: { date: 'asc' },
    include: { entries: true },
  })

  let qualRows: {
    id: string; stroke: string; distance: number
    requiredTimeText: string; requiredTimeMs: number
    bestTimeMs: number | null; diffMs: number | null; qualified: boolean
  }[] = []

  if (swimmer) {
    const favoriteKeys = new Set(swimmer.favoriteEvents.map((f) => `${f.stroke}-${f.distance}`))
    const standards = await prisma.qualificationStandard.findMany({
      where: swimmer.gender ? { gender: swimmer.gender } : {},
    })
    const ageGroup = swimmer.birthYear ? getAgeGroup(new Date().getFullYear() - swimmer.birthYear) : null
    const byEvent = new Map<string, typeof standards[0]>()
    for (const s of standards) {
      const key = `${s.stroke}-${s.distance}`
      if (!byEvent.has(key) || (ageGroup && s.ageGroup === ageGroup)) byEvent.set(key, s)
    }
    const results = await prisma.swimResult.findMany({ where: { swimmerId: swimmer.id } })
    const bestByEvent = new Map<string, number>()
    for (const r of results) {
      const key = `${r.stroke}-${r.distance}`
      const cur = bestByEvent.get(key) ?? Infinity
      if (r.timeMs < cur) bestByEvent.set(key, r.timeMs)
    }
    qualRows = Array.from(byEvent.entries())
      .filter(([key]) => favoriteKeys.has(key))
      .map(([, s]) => {
        const key = `${s.stroke}-${s.distance}`
        const bestTimeMs = bestByEvent.get(key) ?? null
        const diffMs = bestTimeMs !== null ? bestTimeMs - s.timeMs : null
        return { id: s.id, stroke: s.stroke, distance: s.distance, requiredTimeText: s.timeText, requiredTimeMs: s.timeMs, bestTimeMs, diffMs, qualified: diffMs !== null && diffMs <= 0 }
      })
      .slice(0, 6)
  }

  const daysUntil = nextComp
    ? Math.ceil((new Date(nextComp.date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

      {/* Hero */}
      <section style={{ marginBottom: 24, padding: '20px 28px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(8,119,238,.96), rgba(11,131,255,.72))', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 20%, rgba(255,255,255,.22), transparent 30%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,5vw,42px)', letterSpacing: '-0.05em', lineHeight: 1.05, color: '#fff', marginBottom: 10 }}>
            {tr(language, 'home.hello')}{swimmer ? `, ${swimmer.name}` : ''} 🏊
          </h1>
        </div>
      </section>

      {/* LIVE */}
      {liveComp && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <h2 style={{ fontWeight: 900, fontSize: 20, color: '#ef4444' }}>
              {tr(language, 'live.badge')} — {liveComp.name}
            </h2>
            {liveComp.location && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>📍 {liveComp.location}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liveComp.entries.map((entry) => {
              const result = liveComp.results.find((r) => r.stroke === entry.stroke && r.distance === entry.distance)
              const href = result
                ? `/results/${result.id}/edit`
                : `/results/new?stroke=${entry.stroke}&distance=${entry.distance}&competitionId=${liveComp.id}&location=${encodeURIComponent(liveComp.location || '')}&date=${liveComp.date}`
              return (
                <Link key={entry.id} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 18, background: result ? '#fff' : 'rgba(239,68,68,0.03)', border: `2px solid ${result ? 'rgba(8,119,238,0.14)' : 'rgba(239,68,68,0.22)'}`, boxShadow: '0 4px 16px rgba(15,27,45,0.07)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 30, flexShrink: 0 }}>{STROKE_EMOJI[entry.stroke as Stroke]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                        {entry.distance}m {strokeLabel(entry.stroke as Stroke, language)}
                      </div>
                      {!result && (
                        <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginTop: 3 }}>
                          {tr(language, 'live.tapToAdd')}
                        </div>
                      )}
                    </div>
                    {result ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {result.isPersonalBest && <span style={{ fontSize: 16 }}>⭐</span>}
                        <RankBadge rank={result.rank} isUnranked={result.isUnranked} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 26, color: result.isPersonalBest ? 'var(--gold)' : 'var(--pool-glow)' }}>
                          {formatTime(result.timeMs)}
                        </span>
                        <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>✎</span>
                      </div>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(239,68,68,.35)' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1 }}>+</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <Link href={`/competitions/${liveComp.id}`} style={{ fontSize: 13, color: 'var(--pool-glow)', fontWeight: 700, textDecoration: 'none' }}>
              {tr(language, 'live.viewComp')}
            </Link>
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </section>
      )}

      {/* Prochaine compétition */}
      {!liveComp && (
        <section style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18 }}>{tr(language, 'home.nextComp')}</h2>
            <Link href="/competitions" style={{ fontSize: 13, color: 'var(--pool-glow)', fontWeight: 700, textDecoration: 'none' }}>
              {tr(language, 'competitions.title')} →
            </Link>
          </div>
          {nextComp ? (
            <div className="card" style={{ padding: '18px 22px', borderLeft: `4px solid ${daysUntil === 0 ? '#ef4444' : 'var(--pool-glow)'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <Link href={`/competitions/${nextComp.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: 'var(--text-primary)' }}>{nextComp.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>📅 {format(new Date(nextComp.date), 'd MMMM yyyy')}</span>
                    {nextComp.location && <span>📍 {nextComp.location}</span>}
                  </div>
                </Link>
                {daysUntil === 0 ? (
                  <HomeLiveButton competitionId={nextComp.id} labelGoLive={tr(language, 'live.goLive')} />
                ) : daysUntil !== null && daysUntil > 0 ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 28, color: 'var(--pool-glow)', lineHeight: 1, flexShrink: 0 }}>
                    J-{daysUntil}
                  </div>
                ) : null}
              </div>
              {nextComp.entries.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    {tr(language, 'home.compEvents')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {nextComp.entries.map((e, i) => (
                      <span key={i} style={{ fontSize: 12, background: 'rgba(8,119,238,0.08)', border: '1px solid rgba(8,119,238,0.14)', borderRadius: 999, padding: '3px 12px', color: 'var(--pool-glow)', fontWeight: 600 }}>
                        {e.distance}m {strokeLabel(e.stroke as Stroke, language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{tr(language, 'home.noComp')}</span>
              <Link href="/competitions/new">
                <button className="btn-ghost" style={{ fontSize: 13 }}>{tr(language, 'home.addComp')}</button>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Objectifs */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{tr(language, 'home.goalsTitle')}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{tr(language, 'home.goalsSubtitle')}</p>
          </div>
          <Link href="/strokes" style={{ fontSize: 13, color: 'var(--pool-glow)', fontWeight: 700, textDecoration: 'none' }}>
            {tr(language, 'home.viewAllStrokes')}
          </Link>
        </div>
        {qualRows.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{tr(language, 'home.noFavoriteGoal')}</p>
            <Link href="/goals">
              <button className="btn-primary">{tr(language, 'home.chooseGoals')}</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {qualRows.map((q) => (
              <Link key={q.id} href={`/strokes/${q.stroke}/${q.distance}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 16, background: q.qualified ? 'rgba(16,185,129,.05)' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{STROKE_EMOJI[q.stroke as Stroke]}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>
                        {q.distance}m {strokeLabel(q.stroke as Stroke, language)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {tr(language, 'home.goalRequired')} : {q.requiredTimeText}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{tr(language, 'home.goalBest')}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16 }}>
                      {q.bestTimeMs ? formatTime(q.bestTimeMs) : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{tr(language, 'home.goalGap')}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: q.qualified ? '#059669' : '#dc2626' }}>
                      {q.diffMs !== null ? `${q.diffMs <= 0 ? '' : '+'}${(q.diffMs / 1000).toFixed(2)}s` : '—'}
                    </div>
                  </div>
                  <div style={{ padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: q.qualified ? 'rgba(16,185,129,.14)' : 'rgba(239,68,68,.1)', color: q.qualified ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                    {q.qualified ? tr(language, 'common.done') : tr(language, 'common.todo')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
