import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { strokeLabel } from "@/lib/types"
import { getLanguage, tr } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export const dynamic = 'force-dynamic'

type SwimEvent = { stroke: string; distance: number }

function eventKey(event: SwimEvent) {
  return `${event.stroke}-${event.distance}`
}

function eventLabel(event: SwimEvent, language: import("@/lib/i18n").Language) {
  const label = strokeLabel(event.stroke, language)
  return `${event.distance}m ${label}`
}

async function saveAccount(formData: FormData) {
  'use server'

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const birthYearRaw = String(formData.get('birthYear') || '').trim()
  const gender = String(formData.get('gender') || '').trim()
  const club = String(formData.get('club') || '').trim()
  const favoriteKeys = formData.getAll('favoriteEvents').map(String)

  if (!name) return

  let swimmerId = id

  if (swimmerId) {
    await prisma.swimmer.update({
      where: { id: swimmerId },
      data: { name, birthYear: birthYearRaw ? Number(birthYearRaw) : null, gender: gender || null, club: club || null, role: 'PRIMARY' },
    })
  } else {
    await prisma.swimmer.updateMany({ where: { role: 'PRIMARY' }, data: { role: 'RIVAL' } })
    const swimmer = await prisma.swimmer.create({
      data: { name, birthYear: birthYearRaw ? Number(birthYearRaw) : null, gender: gender || null, club: club || null, role: 'PRIMARY' },
    })
    swimmerId = swimmer.id
  }

  await prisma.favoriteEvent.deleteMany({ where: { swimmerId } })

  const favorites = favoriteKeys
    .map((key) => {
      const [stroke, distanceRaw] = key.split('-')
      const distance = Number(distanceRaw)
      if (!stroke || !distance) return null
      return { swimmerId, stroke, distance }
    })
    .filter(Boolean) as Array<{ swimmerId: string; stroke: string; distance: number }>

  for (const favorite of favorites) {
    await prisma.favoriteEvent.create({ data: favorite })
  }

  redirect('/account')
}

async function addRival(formData: FormData) {
  'use server'

  const name = String(formData.get('rivalName') || '').trim()
  const birthYearRaw = String(formData.get('rivalBirthYear') || '').trim()
  const club = String(formData.get('rivalClub') || '').trim()

  if (!name) return

  await prisma.swimmer.create({
    data: {
      name,
      birthYear: birthYearRaw ? Number(birthYearRaw) : null,
      club: club || null,
      role: 'RIVAL',
    },
  })

  redirect('/account')
}

async function deleteRival(formData: FormData) {
  'use server'

  const id = String(formData.get('rivalId') || '')
  if (!id) return

  await prisma.swimmer.delete({
    where: { id },
  })

  redirect('/account')
}

export default async function AccountPage() {
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const swimmer = await prisma.swimmer.findFirst({
    where: { role: 'PRIMARY' },
    include: { favoriteEvents: true },
  })

  const rivals = await prisma.swimmer.findMany({
    where: { role: 'RIVAL' },
    orderBy: { name: 'asc' },
  })

  const standards = await prisma.qualificationStandard.findMany({
    select: { stroke: true, distance: true },
    orderBy: [{ distance: 'asc' }, { stroke: 'asc' }],
  })

  const events = Array.from(
    new Map(standards.map((s) => [eventKey(s), { stroke: s.stroke, distance: s.distance }])).values()
  )

  const favoriteKeys = new Set(
    swimmer?.favoriteEvents.map((f) => eventKey({ stroke: f.stroke, distance: f.distance })) ?? []
  )

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {tr(language, 'account.title')}
        </h1>
        <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          {tr(language, 'account.subtitle')}
        </div>

        <div className="card" style={{ marginTop: 20, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, maxWidth: 860 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              {tr(language, 'account.languageCardTitle')}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {tr(language, 'account.languageCardSubtitle')}
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <form action={saveAccount} className="card" style={{ display: 'grid', gap: 28, maxWidth: 860, padding: 28 }}>
        <input type="hidden" name="id" value={swimmer?.id ?? ''} />

        <section style={{ display: 'grid', gap: 18 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>
            {tr(language, 'account.profile')}
          </h2>

          <div>
            <label style={label}>{tr(language, 'account.name')}</label>
            <input name="name" defaultValue={swimmer?.name ?? ''} required style={input} />
          </div>

          <div>
            <label style={label}>{tr(language, 'account.birthYear')}</label>
            <input name="birthYear" type="number" defaultValue={swimmer?.birthYear ?? ''} style={input} />
          </div>

          <div>
            <label style={label}>{tr(language, 'account.gender')}</label>
            <select name="gender" defaultValue={swimmer?.gender ?? ''} style={input}>
              <option value="">{tr(language, 'common.notSet')}</option>
              <option value="male">{tr(language, 'account.genderMale')}</option>
              <option value="female">{tr(language, 'account.genderFemale')}</option>
            </select>
          </div>

          <div>
            <label style={label}>{tr(language, 'account.club')}</label>
            <input name="club" defaultValue={swimmer?.club ?? ''} style={input} />
          </div>
        </section>

        <section style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>
              {tr(language, 'account.favoriteEvents')}
            </h2>
            <div style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
              {tr(language, 'account.favoriteHelp')}
            </div>
          </div>

          {events.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>
              {tr(language, 'account.noEvents')}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {events.map((event) => {
                const key = eventKey(event)
                return (
                  <label key={key} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#fff', fontWeight: 800 }}>
                    <input type="checkbox" name="favoriteEvents" value={key} defaultChecked={favoriteKeys.has(key)} style={{ width: 18, height: 18 }} />
                    {eventLabel(event, language)}
                  </label>
                )
              })}
            </div>
          )}
        </section>

       

        <div>
          <button type="submit" className="btn-primary">
            {tr(language, 'account.save')}
          </button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 24, display: 'grid', gap: 22, maxWidth: 860, padding: 28 }}>
  <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>
    Adversaires
  </h2>

  <form action={addRival} style={{ display: 'grid', gap: 12 }}>
    <input name="rivalName" placeholder="Nom de l’adversaire" required style={input} />
    <input name="rivalBirthYear" type="number" placeholder="Année de naissance" style={input} />
    <input name="rivalClub" placeholder="Club" style={input} />

    <button type="submit" className="btn-primary">
      + Ajouter un adversaire
    </button>
  </form>

  {rivals.length > 0 && (
    <div style={{ display: 'grid', gap: 10 }}>
      {rivals.map((rival) => (
        <div
          key={rival.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: 14,
            background: '#fff',
          }}
        >
          <div>
            <div style={{ fontWeight: 800 }}>{rival.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {[rival.club, rival.birthYear].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>

          <form action={deleteRival}>
            <input type="hidden" name="rivalId" value={rival.id} />
            <button
              type="submit"
              style={{
                border: '1px solid #fecaca',
                background: '#fff5f5',
                color: '#dc2626',
                borderRadius: 10,
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              🗑
            </button>
          </form>
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  )
}

const label: React.CSSProperties = {
  display: 'block', marginBottom: 8, fontWeight: 800, color: 'var(--text-secondary)',
}

const input: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 14,
  padding: '12px 14px', fontSize: 16, background: '#fff',
}
