'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { SwimResult, formatTime } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  results: SwimResult[]   // triés du plus ancien au plus récent
  height?: number
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number; payload: { label: string; isPB: boolean } }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const { value, payload: { label, isPB } } = payload[0]
  return (
    <div
      style={{
        background: 'rgba(0, 18, 25, 0.95)',
        border: '1px solid rgba(0, 180, 216, 0.3)',
        borderRadius: 10,
        padding: '10px 14px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          fontWeight: 500,
          color: isPB ? 'var(--gold)' : 'var(--pool-glow)',
        }}
      >
        {formatTime(value)}
      </div>
      {isPB && (
        <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>
          ⭐ Record personnel
        </div>
      )}
    </div>
  )
}

export default function ProgressChart({ results, height = 220 }: Props) {
  // Du plus ancien au plus récent pour le graphique
  const sorted = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const data = sorted.map((r) => ({
    label: format(new Date(r.date), 'd MMM yyyy', { locale: fr }),
    time: r.timeMs,
    isPB: r.isPersonalBest,
  }))

  const bestTime = Math.min(...results.map((r) => r.timeMs))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,180,216,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatTime(v)}
          tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          reversed  // Temps plus petit = meilleur = en haut
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={bestTime}
          stroke="rgba(255, 209, 102, 0.4)"
          strokeDasharray="4 4"
        />
        <Line
          type="monotone"
          dataKey="time"
          stroke="var(--pool-bright)"
          strokeWidth={2.5}
          dot={(props) => {
            const { cx, cy, payload } = props
            return (
              <circle
                key={`dot-${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={payload.isPB ? 6 : 4}
                fill={payload.isPB ? 'var(--gold)' : 'var(--pool-bright)'}
                stroke={payload.isPB ? 'var(--gold-dim)' : 'var(--pool-deep)'}
                strokeWidth={2}
              />
            )
          }}
          activeDot={{ r: 7, fill: 'var(--pool-glow)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
