import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

async function getPrimarySwimmer() {
  const primary = await prisma.swimmer.findFirst({ where: { role: 'PRIMARY' } })
  if (primary) return primary
  return prisma.swimmer.create({ data: { name: 'Nageur principal', role: 'PRIMARY' } })
}

async function recalcPBs(swimmerId: string) {
  const all = await prisma.swimResult.findMany({ where: { swimmerId } })
  const bestByEvent = new Map<string, number>()
  for (const r of all) {
    const key = `${r.stroke}-${r.distance}-${r.poolSize}`
    const current = bestByEvent.get(key) ?? Infinity
    if (r.timeMs < current) bestByEvent.set(key, r.timeMs)
  }
  await Promise.all(
    all.map((r) =>
      prisma.swimResult.update({
        where: { id: r.id },
        data: { isPersonalBest: r.timeMs === bestByEvent.get(`${r.stroke}-${r.distance}-${r.poolSize}`) },
      })
    )
  )
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const result = await prisma.swimResult.findUnique({ where: { id } })
  if (!result) return NextResponse.json({ error: 'Résultat introuvable' }, { status: 404 })
  return NextResponse.json(result)
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const data = await req.json()
  const primary = await getPrimarySwimmer()

  const result = await prisma.swimResult.update({
    where: { id },
    data: {
      swimmerId: primary.id,
      date: data.date,
      stroke: data.stroke,
      distance: Number(data.distance),
      poolSize: Number(data.poolSize),
      timeMs: Number(data.timeMs),
      location: data.location || null,
      notes: data.notes || null,
      rank: data.isUnranked ? null : data.rank ? Number(data.rank) : null,
      isUnranked: Boolean(data.isUnranked),
      ...(data.competitionId !== undefined ? { competitionId: data.competitionId || null } : {}),
    },
  })

  await recalcPBs(primary.id)
  return NextResponse.json(result)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const primary = await getPrimarySwimmer()
  await prisma.swimResult.delete({ where: { id } })
  await recalcPBs(primary.id)
  return NextResponse.json({ ok: true })
}
