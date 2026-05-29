'use client'

import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatTime } from '@/lib/types'
import { format } from 'date-fns'
import Link from 'next/link'

type Result = {
  id: string
  date: string
  timeMs: number
  poolSize: number
  location: string | null
  isPersonalBest: boolean
  rank: number | null
  isUnranked: boolean
  notes: string | null
}

interface Props {
  results: Result[]
  language: string
  labelHistory: string
  labelNeedMore: string
  labelPool: string
  labelPbTooltip: string
}

function CustomTooltip({ active, payload, labelPbTooltip }: any) {
  if (!active || !payload?.length) return null
  const { value, payload: p } = payload[0]

  return (
    <div style={{ background: '#fff', border: '1px solid #dbe6f2', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(15,27,45,.1)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{p.label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: p.isPB ? 'var(--gold)' : 'var(--pool-glow)' }}>
        {formatTime(value)}
      </div>
      {p.isPB && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 3 }}>{labelPbTooltip}</div>}
    </div>
  )
}

function RankBadge({ rank, isUnranked }: { rank: number | null | undefined; isUnranked?: boolean }) {
  if (isUnranked || !rank) return null
  if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>
  return <span style={{ fontSize: 11, color: '#1d4ed8', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.18)', padding: '2px 8px', borderRadius: 999, fontWeight: 800 }}>Oklevél</span>
}

export default function StrokeDetailClient({ results, labelHistory, labelNeedMore, labelPbTooltip }: Props) {
  const router = useRouter()

  async function deleteResult(id: string) {
    if (!confirm('Supprimer ce chrono ?')) return

    const res = await fetch(`/api/results/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      alert('Erreur pendant la suppression.')
      return
    }

    router.refresh()
  }

  const sorted = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const pb = Math.min(...results.map((r) => r.timeMs))

  const chartData = sorted.map((r) => ({
    label: format(new Date(r.date), 'd MMM yy'),
    time: r.timeMs,
    isPB: r.isPersonalBest,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: '20px 24px' }}>
        {results.length >= 2 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatTime(v)} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} reversed domain={['auto', 'auto']} width={52} />
              <Tooltip content={<CustomTooltip labelPbTooltip={labelPbTooltip} />} />
              <ReferenceLine y={pb} stroke="rgba(245,183,0,0.5)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="time"
                stroke="var(--pool-bright)"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={payload.isPB ? 6 : 4} fill={payload.isPB ? 'var(--gold)' : 'var(--pool-bright)'} stroke="#fff" strokeWidth={2} />
                }}
                activeDot={{ r: 7, fill: 'var(--pool-glow)', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 14, border: '1px dashed #cfe2f5', borderRadius: 10 }}>
            {labelNeedMore}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>{labelHistory}</h3>

        <div>
          {[...results]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((r, i, arr) => {
              const prev = arr[i + 1]
              const diff = prev ? r.timeMs - prev.timeMs : null

              return (
                <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '82px minmax(0,1fr) auto auto auto auto auto',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 0',
                  borderBottom:
                    i < arr.length - 1
                      ? '1px solid var(--card-border)'
                      : 'none',
                }}
              >
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', width: 86, flexShrink: 0 }}>
                    {format(new Date(r.date), 'd MMM yyyy')}
                  </div>

                  <div
  style={{
    minWidth: 0,
    fontSize: 13,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }}
>
                      {r.location || '—'}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--pool-glow)', background: 'rgba(8,119,238,0.08)', border: '1px solid rgba(8,119,238,0.14)', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                    {r.poolSize}m
                  </div>

                  <RankBadge rank={r.rank} isUnranked={r.isUnranked} />

                  {diff !== null && (
  <div
    className="history-diff"
    style={{ fontSize: 12, color: diff < 0 ? '#059669' : '#dc2626', width: 56, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>
                      {diff < 0 ? '' : '+'}{(diff / 1000).toFixed(2)}s
                    </div>
                  )}

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 800, color: r.isPersonalBest ? 'var(--gold)' : 'var(--pool-glow)', width: 68, textAlign: 'right', flexShrink: 0 }}>
                    {formatTime(r.timeMs)}
                  </div>

                  {r.isPersonalBest && <span style={{ fontSize: 14, flexShrink: 0 }}>⭐</span>}

                  <Link href={`/results/${r.id}/edit`} style={{ color: 'var(--text-muted)', fontSize: 15, flexShrink: 0, textDecoration: 'none' }}>
                    ✎
                  </Link>

                  <button
                    type="button"
                    onClick={() => deleteResult(r.id)}
                    title="Supprimer"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: 15,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    🗑
                  </button>
                </div>
              )
            })}
        </div>
      </div>
      <style>{`
  @media (max-width: 520px) {
    .history-diff {
      display: none;
    }
  }
`}</style>
    </div>
  )
}