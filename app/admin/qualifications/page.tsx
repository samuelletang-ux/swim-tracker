import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatTime, strokeLabel } from "@/lib/types"
import type { Stroke } from '@/lib/types'
import { cookies } from 'next/headers'
import { getLanguage, tr } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const AGE_GROUPS = [
  { key: 'adult',   label: 'Felnőtt' },
  { key: 'ifjusagi', label: 'Ifjúsági' },
  { key: 'serdulo', label: 'Serdülő' },
  { key: 'gy14',    label: 'Gy14' },
  { key: 'gy13',    label: 'Gy13' },
  { key: 'capa12',  label: 'Cápa12' },
  { key: 'capa11',  label: 'Cápa11' },
]

const STROKE_ORDER = ['free', 'fly', 'back', 'breast', 'im']

function eventSortKey(s: { distance: number; stroke: string }) {
  const strokeIndex = STROKE_ORDER.indexOf(s.stroke)
  return `${String(strokeIndex < 0 ? 99 : strokeIndex).padStart(2, '0')}-${String(s.distance).padStart(4, '0')}`
}

export default async function QualificationsPage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const primarySwimmer = await prisma.swimmer.findFirst({
    where: { role: 'PRIMARY' },
    include: { results: true },
  })

  const standards = await prisma.qualificationStandard.findMany({
    orderBy: [{ gender: 'asc' }, { stroke: 'asc' }, { distance: 'asc' }, { ageGroup: 'asc' }],
  })

  const bestByEvent = new Map<string, number>()
  for (const r of primarySwimmer?.results ?? []) {
    const key = `${r.stroke}-${r.distance}`
    const current = bestByEvent.get(key) ?? Infinity
    if (r.timeMs < current) bestByEvent.set(key, r.timeMs)
  }

  const subtitleText = primarySwimmer
    ? tr(language, 'admin.qualifications.subtitleWithSwimmer', { count: standards.length, name: primarySwimmer.name })
    : tr(language, 'admin.qualifications.subtitle', { count: standards.length })

  const genders = [
    { key: 'male',   title: 'Férfi/Fiú szinttáblázat' },
    { key: 'female', title: 'Női/leány szinttáblázat' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {tr(language, 'admin.qualifications.title')}
        </h1>
        <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          {subtitleText}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 34 }}>
        {genders.map((gender) => {
          const genderStandards = standards.filter((s) => s.gender === gender.key)
          const events = Array.from(
            new Map(genderStandards.map((s) => [`${s.distance}-${s.stroke}`, { distance: s.distance, stroke: s.stroke }])).values()
          ).sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))

          return (
            <section key={gender.key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: '#d9e4f4', borderBottom: '1px solid #7d8795', fontWeight: 900, textAlign: 'center', fontSize: 18 }}>
                {gender.title}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: 'left', minWidth: 170 }}>
                        {tr(language, 'admin.qualifications.events')}
                      </th>
                      {AGE_GROUPS.map((age) => (
                        <th key={age.key} style={th}>{age.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const best = bestByEvent.get(`${event.stroke}-${event.distance}`)
                      return (
                        <tr key={`${gender.key}-${event.distance}-${event.stroke}`}>
                          <td style={eventTd}>
                            {event.distance}m {strokeLabel(event.stroke, language)}
                          </td>
                          {AGE_GROUPS.map((ageGroup) => {
                            const standard = genderStandards.find(
                              (s) => s.ageGroup === ageGroup.key && s.distance === event.distance && s.stroke === event.stroke
                            )
                            if (!standard) return <td key={ageGroup.key} style={td} />
                            const diff = best ? best - standard.timeMs : null
                            const qualified = diff !== null && diff <= 0
                            return (
                              <td key={ageGroup.key} style={td}>
                                <div style={{ fontWeight: 900 }}>{standard.timeText}</div>
                                {best ? (
                                  <div style={{ marginTop: 4, fontSize: 12, color: qualified ? '#059669' : '#dc2626', fontWeight: 800 }}>
                                    {qualified ? tr(language, 'admin.qualifications.ok') : tr(language, 'admin.qualifications.todo')} · {formatTime(best)}
                                    <br />
                                    {qualified ? '-' : '+'}{formatTime(Math.abs(diff ?? 0))}
                                  </div>
                                ) : null}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/admin">{tr(language, 'admin.qualifications.backToAdmin')}</Link>
      </div>
    </div>
  )
}

const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 15, background: '#ffffff' }
const th: React.CSSProperties = { padding: '8px 10px', border: '1px solid #7d8795', background: '#d9e4f4', fontWeight: 900, textAlign: 'center', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '8px 10px', border: '1px solid #7d8795', textAlign: 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', verticalAlign: 'top' }
const eventTd: React.CSSProperties = { ...td, textAlign: 'left', fontWeight: 900 }
