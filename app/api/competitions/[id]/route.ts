import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const comp = await prisma.competition.findUnique({
    where: { id },
    include: { entries: true, results: true },
  })
  if (!comp) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(comp)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { name, date, location, notes, entries } = body

  const swimmer = await prisma.swimmer.findFirst({ where: { role: 'PRIMARY' } })

  const comp = await prisma.competition.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  if (entries !== undefined && swimmer) {
    await prisma.competitionEntry.deleteMany({ where: { competitionId: id } })
    for (const e of entries as { stroke: string; distance: number }[]) {
      await prisma.competitionEntry.create({
        data: { competitionId: id, swimmerId: swimmer.id, stroke: e.stroke, distance: e.distance },
      })
    }
  }

  return NextResponse.json(comp)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await prisma.competition.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
