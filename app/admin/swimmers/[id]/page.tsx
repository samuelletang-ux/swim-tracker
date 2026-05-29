import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getLanguage, tr } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

async function updateSwimmer(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const birthYearRaw = String(formData.get('birthYear') || '').trim()
  const gender = String(formData.get('gender') || '').trim()
  const club = String(formData.get('club') || '').trim()
  const role = String(formData.get('role') || 'RIVAL')

  if (!id || !name) return

  if (role === 'PRIMARY') {
    await prisma.swimmer.updateMany({ where: { role: 'PRIMARY', id: { not: id } }, data: { role: 'RIVAL' } })
  }

  await prisma.swimmer.update({
    where: { id },
    data: { name, birthYear: birthYearRaw ? Number(birthYearRaw) : null, gender: gender || null, club: club || null, role: role === 'PRIMARY' ? 'PRIMARY' : 'RIVAL' },
  })

  redirect('/admin/swimmers')
}

async function deleteSwimmer(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  if (!id) return
  await prisma.swimmer.delete({ where: { id } })
  redirect('/admin/swimmers')
}

export default async function EditSwimmerPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const language = getLanguage(cookieStore.get('swimtrack_lang')?.value)

  const swimmer = await prisma.swimmer.findUnique({ where: { id } })
  if (!swimmer) notFound()

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {tr(language, 'admin.swimmer.edit.title')}
        </h1>
        <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{swimmer.name}</div>
      </div>

      <form action={updateSwimmer} className="card" style={{ display: 'grid', gap: 18, maxWidth: 720, padding: 28 }}>
        <input type="hidden" name="id" value={swimmer.id} />

        <div>
          <label style={labelStyle}>{tr(language, 'admin.swimmer.name')}</label>
          <input name="name" defaultValue={swimmer.name} required style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>{tr(language, 'admin.swimmer.birthYear')}</label>
          <input name="birthYear" type="number" defaultValue={swimmer.birthYear ?? ''} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>{tr(language, 'admin.swimmer.gender')}</label>
          <select name="gender" defaultValue={swimmer.gender ?? ''} style={inputStyle}>
            <option value="">{tr(language, 'admin.swimmer.genderUnset')}</option>
            <option value="male">{tr(language, 'admin.swimmer.genderMale')}</option>
            <option value="female">{tr(language, 'admin.swimmer.genderFemale')}</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>{tr(language, 'admin.swimmer.club')}</label>
          <input name="club" defaultValue={swimmer.club ?? ''} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>{tr(language, 'admin.swimmer.role')}</label>
          <select name="role" defaultValue={swimmer.role} style={inputStyle}>
            <option value="PRIMARY">{tr(language, 'admin.swimmer.rolePrimary')}</option>
            <option value="RIVAL">{tr(language, 'admin.swimmer.roleRival')}</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" className="btn-primary">{tr(language, 'admin.swimmer.edit.save')}</button>
          <Link href="/admin/swimmers" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {tr(language, 'admin.swimmer.edit.cancel')}
          </Link>
        </div>
      </form>

      <form action={deleteSwimmer} style={{ marginTop: 24 }}>
        <input type="hidden" name="id" value={swimmer.id} />
        <button type="submit" style={{ border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: 999, padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>
          {tr(language, 'admin.swimmer.edit.delete')}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 8, fontWeight: 800, color: 'var(--text-secondary)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 14,
  padding: '12px 14px', fontSize: 16, background: '#fff',
}
