import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getLanguage, tr } from '@/lib/i18n'
import { strokeLabel } from '@/lib/types'
import type { Stroke } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function CompetitionsPage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const competitions = await prisma.competition.findMany({
    include: { entries: true },
    orderBy: { date: 'desc' },
  })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = competitions.filter((c) => c.date >= today)
  const past = competitions.filter((c) => c.date < today)

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
            {tr(language, 'competitions.title')}
          </h1>
        </div>
        <Link href="/competitions/new">
          <button className="btn-primary">{tr(language, 'competitions.add')}</button>
        </Link>
      </div>

      {competitions.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            {tr(language, 'competitions.noData')}
          </p>
          <Link href="/competitions/new">
            <button className="btn-primary">{tr(language, 'competitions.add')}</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {upcoming.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                {tr(language, 'competitions.upcoming')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map((c) => (
                  <CompCard key={c.id} comp={c} language={language} upcoming />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                {tr(language, 'competitions.past')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map((c) => (
                  <CompCard key={c.id} comp={c} language={language} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function CompCard({ comp, language, upcoming = false }: {
  comp: { id: string; name: string; date: string; location: string | null; entries: { stroke: string; distance: number }[] }
  language: ReturnType<typeof getLanguage>
  upcoming?: boolean
}) {
  const daysUntil = Math.ceil((new Date(comp.date).getTime() - Date.now()) / 86400000)

  return (
    <Link href={`/competitions/${comp.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, borderLeft: upcoming ? '4px solid var(--pool-glow)' : undefined }}>
        {/* Date block */}
        <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 22, color: upcoming ? 'var(--pool-glow)' : 'var(--text-primary)', lineHeight: 1 }}>
            {format(new Date(comp.date), 'd')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
            {format(new Date(comp.date), 'MMM')}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', marginBottom: 4 }}>
            {comp.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {comp.location && <span>{comp.location}</span>}
            {comp.entries.length > 0 && (
              <span>· {tr(language, 'competitions.entries', { count: comp.entries.length })}</span>
            )}
          </div>
          {comp.entries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {comp.entries.slice(0, 4).map((e, i) => (
                <span key={i} style={{ fontSize: 11, background: 'rgba(8,119,238,0.08)', border: '1px solid rgba(8,119,238,0.14)', borderRadius: 999, padding: '2px 10px', color: 'var(--pool-glow)', fontWeight: 600 }}>
                  {e.distance}m {strokeLabel(e.stroke as Stroke, language)}
                </span>
              ))}
              {comp.entries.length > 4 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 6px' }}>
                  +{comp.entries.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {upcoming && daysUntil >= 0 && daysUntil <= 30 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--pool-glow)', lineHeight: 1 }}>
              J-{daysUntil}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
