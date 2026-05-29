import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getLanguage, tr } from '@/lib/i18n'
import { strokeLabel, formatTime, STROKE_EMOJI, DISTANCES } from '@/lib/types'
import type { Stroke, Distance } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

// Ordre d'affichage des nages
const STROKE_ORDER: Stroke[] = ['free', 'back', 'breast', 'fly', 'im']

export default async function StrokesPage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const swimmer = await prisma.swimmer.findFirst({ where: { role: 'PRIMARY' } })

  const results = await prisma.swimResult.findMany({
    where: swimmer ? { swimmerId: swimmer.id } : {},
    orderBy: [{ date: 'desc' }],
  })

  // Grouper par stroke+distance
  type EventGroup = {
    stroke: Stroke
    distance: Distance
    results: typeof results
    pb: number
    lastDate: string
  }

  const map = new Map<string, EventGroup>()

  for (const r of results) {
    const key = `${r.stroke}-${r.distance}`
    if (!map.has(key)) {
      map.set(key, {
        stroke: r.stroke as Stroke,
        distance: r.distance as Distance,
        results: [],
        pb: Infinity,
        lastDate: r.date,
      })
    }
    const g = map.get(key)!
    g.results.push(r)
    if (r.timeMs < g.pb) g.pb = r.timeMs
    if (r.date > g.lastDate) g.lastDate = r.date
  }

  // Trier : par nage (ordre STROKE_ORDER) puis par distance
  const groups = Array.from(map.values()).sort((a, b) => {
    const si = STROKE_ORDER.indexOf(a.stroke) - STROKE_ORDER.indexOf(b.stroke)
    if (si !== 0) return si
    return a.distance - b.distance
  })

  // Grouper par nage pour l'affichage
  const byStroke = STROKE_ORDER.map((stroke) => ({
    stroke,
    events: groups.filter((g) => g.stroke === stroke),
  })).filter((s) => s.events.length > 0)

  if (groups.length === 0) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
          {tr(language, 'strokes.title')}
        </h1>
        <div className="card" style={{ padding: 40, textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏊</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            {tr(language, 'strokes.noData')}
          </p>
          <Link href="/results/new">
            <button className="btn-primary">{tr(language, 'strokes.addFirst')}</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
          {tr(language, 'strokes.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          {tr(language, 'strokes.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {byStroke.map(({ stroke, events }) => (
          <section key={stroke}>
            {/* Titre de nage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 26 }}>{STROKE_EMOJI[stroke]}</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>
                {strokeLabel(stroke, language)}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {events.map((g) => (
                <Link
                  key={`${g.stroke}-${g.distance}`}
                  href={`/strokes/${g.stroke}/${g.distance}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="card"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {g.distance}m
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {tr(language, 'strokes.times', { count: g.results.length })}
                        {' · '}
                        {tr(language, 'strokes.lastSwum')} {format(new Date(g.lastDate), 'd MMM yy')}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {tr(language, 'strokes.pb')}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>
                        {formatTime(g.pb)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
