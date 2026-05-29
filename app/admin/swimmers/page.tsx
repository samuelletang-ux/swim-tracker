import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getLanguage, tr } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default async function AdminSwimmersPage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const swimmers = await prisma.swimmer.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    include: { results: true },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
            {tr(language, 'admin.swimmers.title')}
          </h1>
          <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
            {tr(language, 'admin.swimmers.subtitle')}
          </div>
        </div>
        <Link href="/admin/swimmers/new">
          <button className="btn-primary">{tr(language, 'admin.swimmers.add')}</button>
        </Link>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {swimmers.map((s) => {
          const age = s.birthYear ? new Date().getFullYear() - s.birthYear : null
          return (
            <Link key={s.id} href={`/admin/swimmers/${s.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {s.name} {s.role === 'PRIMARY' ? '⭐' : ''}
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 14 }}>
                    {age
                      ? tr(language, 'admin.swimmers.yearsOld', { age })
                      : tr(language, 'admin.swimmers.ageUnknown')}
                    {s.club ? ` · ${s.club}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--pool-glow)' }}>
                    {s.results.length}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {tr(language, 'admin.swimmers.chronos')}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
