'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { tr } from '@/lib/i18n'
import { useLanguage } from '@/hooks/useLanguage'

export default function NewSwimmerPage() {
  const router = useRouter()
  const { language } = useLanguage()

  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('male')
  const [club, setClub] = useState('')
  const [role, setRole] = useState('RIVAL')

  async function handleSave() {
    await fetch('/api/swimmers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, birthYear: birthYear ? Number(birthYear) : null, gender, club, role }),
    })
    router.push('/admin/swimmers')
  }

  return (
    <div className="card" style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 38, fontWeight: 800, marginBottom: 28 }}>
        {tr(language, 'admin.swimmer.new.title')}
      </h1>

      <div style={{ display: 'grid', gap: 20 }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>{tr(language, 'admin.swimmer.name')}</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>{tr(language, 'admin.swimmer.birthYear')}</div>
          <input value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="input" />
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>{tr(language, 'admin.swimmer.gender')}</div>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
            <option value="male">{tr(language, 'admin.swimmer.genderMale')}</option>
            <option value="female">{tr(language, 'admin.swimmer.genderFemale')}</option>
          </select>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>{tr(language, 'admin.swimmer.role')}</div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
            <option value="PRIMARY">{tr(language, 'admin.swimmer.rolePrimary')}</option>
            <option value="RIVAL">{tr(language, 'admin.swimmer.roleRival')}</option>
          </select>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>{tr(language, 'admin.swimmer.club')}</div>
          <input value={club} onChange={(e) => setClub(e.target.value)} className="input" />
        </div>

        <button onClick={handleSave} className="btn-primary" style={{ marginTop: 10, height: 56, fontSize: 18 }}>
          {tr(language, 'admin.swimmer.new.save')}
        </button>
      </div>
    </div>
  )
}
