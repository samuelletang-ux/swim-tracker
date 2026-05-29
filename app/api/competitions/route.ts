import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const competitions = await prisma.competition.findMany({
    include: { entries: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(competitions)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, date, location, notes, entries = [] } = body

    if (!date) {
      return NextResponse.json({ error: 'date required' }, { status: 400 })
    }

    // Nom par défaut = lieu si pas de nom fourni
    const compName = (name && name.trim()) || location || 'Compétition'

    const swimmer = await prisma.swimmer.findFirst({ where: { role: 'PRIMARY' } })

    const competition = await prisma.competition.create({
      data: {
        name: compName,
        date,
        location: location || null,
        notes: notes || null,
        entries: swimmer && entries.length > 0
          ? {
              create: entries.map((e: { stroke: string; distance: number }) => ({
                swimmerId: swimmer.id,
                stroke: e.stroke,
                distance: e.distance,
              })),
            }
          : undefined,
      },
      include: { entries: true },
    })

    return NextResponse.json(competition)
  } catch (err) {
    console.error('Competition POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
