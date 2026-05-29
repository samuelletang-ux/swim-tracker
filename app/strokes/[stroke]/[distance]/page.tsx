import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLanguage, tr } from '@/lib/i18n'
import { strokeLabel, formatTime, STROKE_EMOJI } from '@/lib/types'
import type { Stroke } from '@/lib/types' 
import Link from 'next/link'
import { format } from 'date-fns'
import StrokeDetailClient from './StrokeDetailClient'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ stroke: string; distance: string }> }

async function addRivalTime(formData: FormData) {
  'use server'

  const stroke = String(formData.get('stroke') || '')
  const distance = Number(formData.get('distance'))
  const rivalId = String(formData.get('rivalId') || '')
  const newRivalName = String(formData.get('newRivalName') || '').trim()
  const minutes = Number(formData.get('minutes') || 0)
  const seconds = Number(formData.get('seconds') || 0)
  const hundredths = Number(formData.get('hundredths') || 0)
  const poolSize = Number(formData.get('poolSize') || 50)
  const date = String(formData.get('date') || new Date().toISOString().slice(0, 10))
  const location = String(formData.get('location') || '').trim()

  const timeMs =
    minutes * 60_000 +
    seconds * 1000 +
    hundredths * 10

  if (!stroke || !distance || timeMs <= 0) return

  let swimmerId = rivalId

  if (!swimmerId && newRivalName) {
    const rival = await prisma.swimmer.create({
      data: {
        name: newRivalName,
        role: 'RIVAL',
      },
    })

    swimmerId = rival.id
  }

  if (!swimmerId) return

  await prisma.swimResult.create({
    data: {
      swimmerId,
      resultType: 'RIVAL',
      stroke,
      distance,
      poolSize,
      timeMs,
      date,
      location: location || null,
      isPersonalBest: false,
      isUnranked: true,
    },
  })
}

async function deleteRivalTime(formData: FormData) {
  'use server'

  const id = String(formData.get('id') || '')
  const stroke = String(formData.get('stroke') || '')
  const distance = String(formData.get('distance') || '')

  if (!id) return

  await prisma.swimResult.delete({
    where: { id },
  })

  revalidatePath(`/strokes/${stroke}/${distance}`)
}

export default async function StrokeDetailPage({ params }: Props) {
  const { stroke, distance: distanceStr } = await params
  const distance = Number(distanceStr)

  const VALID_STROKES = ['free', 'back', 'breast', 'fly', 'im']
  if (!VALID_STROKES.includes(stroke) || isNaN(distance)) notFound()

  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const swimmer = await prisma.swimmer.findFirst({ where: { role: 'PRIMARY' } })

  const results = await prisma.swimResult.findMany({
    where: {
      ...(swimmer ? { swimmerId: swimmer.id } : {}),
      stroke,
      distance,
    },
    orderBy: { date: 'desc' },
  })

  const rivals = await prisma.swimmer.findMany({
    where: { role: 'RIVAL' },
    orderBy: { name: 'asc' },
  })
  
  const rivalResults = await prisma.swimResult.findMany({
    where: {
      swimmer: { role: 'RIVAL' },
      stroke,
      distance,
    },
    include: {
      swimmer: true,
    },
    orderBy: [
      { poolSize: 'asc' },
      { timeMs: 'asc' },
    ],
  })

  // Qualif pour cette épreuve
  const qualGoals = swimmer?.gender
    ? await prisma.qualificationStandard.findMany({
        where: { stroke, distance, gender: swimmer.gender },
        orderBy: { ageGroup: 'asc' },
      })
    : []

  if (results.length === 0) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <Link href="/strokes" style={{ color: 'var(--pool-glow)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← {tr(language, 'strokes.title')}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <span style={{ fontSize: 36 }}>{STROKE_EMOJI[stroke as Stroke]}</span>
          <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em' }}>
            {distance}m {strokeLabel(stroke, language)}
          </h1>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            {tr(language, 'stroke.page.noTimes')}
          </p>
          <Link href={`/results/new?stroke=${stroke}&distance=${distance}`}>
            <button className="btn-primary">{tr(language, 'stroke.page.addTime')}</button>
          </Link>
        </div>
      </div>
    )
  }

  const pb = Math.min(...results.map((r) => r.timeMs))
  const pbResult = results.find((r) => r.timeMs === pb)!

  // Progression : du 1er au dernier chrono
  const sorted = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const improvement = sorted.length >= 2 ? sorted[sorted.length - 1].timeMs - sorted[0].timeMs : null

  // Lieux uniques
  const locations = Array.from(
    new Set(results.map((r) => r.location).filter(Boolean))
  ) as string[]

  const serializedResults = results.map((r) => ({
    id: r.id,
    date: r.date,
    timeMs: r.timeMs,
    poolSize: r.poolSize,
    location: r.location ?? null,
    isPersonalBest: r.isPersonalBest,
    rank: r.rank ?? null,
    isUnranked: r.isUnranked,
    notes: r.notes ?? null,
  }))

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Breadcrumb */}
      <Link href="/strokes" style={{ color: 'var(--pool-glow)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← {tr(language, 'strokes.title')}
      </Link>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 44 }}>{STROKE_EMOJI[stroke as Stroke]}</span>
          <div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
              {distance}m {strokeLabel(stroke, language)}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
              {tr(language, 'strokes.times', { count: results.length })}
            </p>
          </div>
        </div>
        <Link href={`/results/new?stroke=${stroke}&distance=${distance}`}>
          <button className="btn-primary">{tr(language, 'stroke.page.addTime')}</button>
        </Link>
      </div>

     {/* Stats rapides */}
     <div
  className={rivalResults.length > 0 ? 'stroke-stats-grid with-rivals' : 'stroke-stats-grid'}
>
    <StatBox
          label={tr(language, 'stroke.page.pb')}
          value={formatTime(pb)}
          sub={format(new Date(pbResult.date), 'd MMM yyyy')}
          gold
        />
        <StatBox
          label={tr(language, 'stroke.page.improvement')}
          value={improvement !== null
            ? `${improvement < 0 ? '' : '+'}${(improvement / 1000).toFixed(2)}s`
            : '—'}
          positive={improvement !== null && improvement < 0}
        />
        <StatBox
          label={tr(language, 'stroke.page.times')}
          value={String(results.length)}
        />
      
      {rivalResults.length > 0 && (
  <div
    className="card"
    style={{
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minHeight: '100%',
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}
    >
      Temps à battre
    </div>

    {rivalResults.slice(0, 4).map((r) => {
      const diff = pb - r.timeMs

      return (
        <div
          key={r.id}
          className="rival-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
          }}
        >
          <div
  style={{
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }}
>
  {r.swimmer?.name}
</div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--pool-glow)',
            }}
          >
            {formatTime(r.timeMs)}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: diff <= 0 ? '#059669' : '#dc2626',
              fontSize: 12,
            }}
          >
            {diff <= 0 ? 'OK' : `+${(diff / 1000).toFixed(2)}s`}
          </div>
        </div>
      )
    })}
  </div>
)}

      </div>

      


      {/* Graphique + historique (client component pour recharts) */}
      <StrokeDetailClient
        results={serializedResults}
        language={language}
        labelHistory={tr(language, 'stroke.page.history')}
        labelNeedMore={tr(language, 'stroke.page.needMore')}
        labelPool={tr(language, 'stroke.page.pool')}
        labelPbTooltip={tr(language, 'progress.personalBestTooltip')}
      />

      {/* Lieux */}
      {locations.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginTop: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 14 }}>
            {tr(language, 'stroke.page.locations')}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {locations.map((loc) => (
              <span key={loc} style={{ background: 'rgba(8,119,238,0.08)', border: '1px solid rgba(8,119,238,0.16)', borderRadius: 999, padding: '5px 14px', fontSize: 13, color: 'var(--pool-glow)', fontWeight: 600 }}>
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Objectifs / qualifs */}
      {qualGoals.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginTop: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 14 }}>
            {tr(language, 'stroke.page.goals')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {qualGoals.map((q) => {
              const diff = pb - q.timeMs
              const qualified = diff <= 0
              return (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: qualified ? 'rgba(16,185,129,.07)' : 'rgba(0,0,0,.02)', border: `1px solid ${qualified ? 'rgba(16,185,129,.2)' : 'var(--card-border)'}` }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{q.ageGroup}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {tr(language, 'goals.required')} : {q.timeText}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: qualified ? '#059669' : '#dc2626' }}>
                      {qualified ? '−' : '+'}{formatTime(Math.abs(diff))}
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: qualified ? 'rgba(16,185,129,.14)' : 'rgba(239,68,68,.1)', color: qualified ? '#059669' : '#dc2626' }}>
                      {qualified ? tr(language, 'common.done') : tr(language, 'common.todo')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        
      )}

<div className="card" style={{ padding: '20px 24px', marginTop: 24, marginBottom: 24 }}>
  <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 16 }}>
    Temps à battre
  </h3>

  {rivalResults.length === 0 ? (
    <div style={{ color: 'var(--text-muted)', marginBottom: 18 }}>
      Aucun temps adversaire pour cette nage.
    </div>
  ) : (
    <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
      {rivalResults.map((r) => {
        const diff = pb - r.timeMs

        return (
          <div
            key={r.id}
            className="rival-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto auto auto',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid var(--card-border)',
              background: '#fff',
            }}
          >
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontWeight: 800 }}>{r.swimmer?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {r.location || '—'} · {format(new Date(r.date), 'd MMM yyyy')}
              </div>
            </div>

            <span style={{ fontSize: 11, color: 'var(--pool-glow)', background: 'rgba(8,119,238,0.08)', border: '1px solid rgba(8,119,238,0.14)', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
              {r.poolSize}m
            </span>

            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 18, color: 'var(--pool-glow)' }}>
              {formatTime(r.timeMs)}
            </div>

            <div
  className="rival-diff"
  style={{
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
    fontSize: 14,
    color: diff <= 0 ? '#059669' : '#dc2626',
  }}
>
              {diff <= 0 ? 'battu' : `+${(diff / 1000).toFixed(2)}s`}
            </div>
            <form action={deleteRivalTime}>
  <input type="hidden" name="id" value={r.id} />
  <input type="hidden" name="stroke" value={stroke} />
  <input type="hidden" name="distance" value={distance} />
  <button
    type="submit"
    title="Supprimer"
    style={{
      border: 'none',
      background: 'transparent',
      color: '#dc2626',
      cursor: 'pointer',
      fontSize: 15,
      padding: 0,
    }}
  >
    🗑
  </button>
</form>
          </div>
        )
      })}
    </div>
  )}

  <form action={addRivalTime} style={{ display: 'grid', gap: 12 }}>
  <input type="hidden" name="stroke" value={stroke} />
  <input type="hidden" name="distance" value={distance} />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <select name="rivalId" defaultValue="" style={inputSmall}>
        <option value="">Nouvel adversaire</option>
        {rivals.map((rival) => (
          <option key={rival.id} value={rival.id}>
            {rival.name}
          </option>
        ))}
      </select>

      <input name="newRivalName" placeholder="Nom si nouvel adversaire" style={inputSmall} />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
      <input name="minutes" placeholder="min" inputMode="numeric" style={inputSmall} />
      <input name="seconds" placeholder="sec" inputMode="numeric" style={inputSmall} />
      <input name="hundredths" placeholder="cent." inputMode="numeric" style={inputSmall} />

      <select name="poolSize" defaultValue="50" style={inputSmall}>
        <option value="25">25m</option>
        <option value="33">33m</option>
        <option value="50">50m</option>
      </select>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} style={inputSmall} />
      <input name="location" placeholder="Lieu" style={inputSmall} />
    </div>

    <button type="submit" className="btn-primary">
      + Ajouter un temps adversaire
    </button>
  </form>
</div>

<style>{`
  .stroke-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
    align-items: stretch;
  }

  .stroke-stats-grid.with-rivals {
    grid-template-columns: repeat(3, minmax(140px, 1fr)) minmax(320px, 1.4fr);
  }

  @media (max-width: 768px) {
    .stroke-stats-grid,
    .stroke-stats-grid.with-rivals {
      grid-template-columns: 1fr;
    }
  }

  .rival-row {
  min-width: 0;
}

@media (max-width: 520px) {
  .rival-row {
    grid-template-columns: minmax(0,1fr) auto auto !important;
  }

  .rival-diff {
    display: none;
  }
}

`}</style>

    </div>
  )
}

function StatBox({ label, value, sub, gold, positive }: { label: string; value: string; sub?: string; gold?: boolean; positive?: boolean }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: gold ? 'var(--gold)' : positive === true ? '#059669' : positive === false ? '#dc2626' : 'var(--pool-glow)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const inputSmall: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff',
}
