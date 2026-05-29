import { prisma } from '@/lib/prisma'
import { formatTime, strokeLabel } from "@/lib/types"
import { cookies } from 'next/headers'
import { getLanguage, tr } from '@/lib/i18n'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const results = await prisma.swimResult.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        {tr(language, 'admin.title')}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        {tr(language, 'admin.resultsCount', { count: results.length })}
      </p>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: 14 }}>{tr(language, 'admin.date')}</th>
              <th style={{ padding: 14 }}>{tr(language, 'admin.event')}</th>
              <th style={{ padding: 14 }}>{tr(language, 'admin.pool')}</th>
              <th style={{ padding: 14 }}>{tr(language, 'admin.time')}</th>
              <th style={{ padding: 14 }}>{tr(language, 'admin.location')}</th>
              <th style={{ padding: 14 }}>{tr(language, 'admin.pb')}</th>
              <th style={{ padding: 14 }}>{tr(language, 'admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                <td style={{ padding: 14 }}>{r.date}</td>
                <td style={{ padding: 14 }}>
                  {r.distance}m {strokeLabel(r.stroke, language)}
                </td>
                <td style={{ padding: 14 }}>{r.poolSize}m</td>
                <td style={{ padding: 14, fontFamily: 'var(--font-mono)', color: 'var(--pool-glow)' }}>
                  {formatTime(r.timeMs)}
                </td>
                <td style={{ padding: 14, color: 'var(--text-secondary)' }}>
                  {r.location || '—'}
                </td>
                <td style={{ padding: 14 }}>{r.isPersonalBest ? '⭐' : ''}</td>
                <td style={{ padding: 14 }}>
                  <Link href={`/results/${r.id}/edit`}>
                    {tr(language, 'admin.edit')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
