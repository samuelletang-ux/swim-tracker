import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET() {
  const primary = await getPrimarySwimmer()
  const results = await prisma.swimResult.findMany({
    where: { swimmerId: primary.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(results)
}

export async function POST(req: Request) {
  const data = await req.json()
  const primary = await getPrimarySwimmer()

  const result = await prisma.swimResult.create({
    data: {
      swimmerId: primary.id,
      resultType: data.resultType || 'COMPETITION',
      date: data.date,
      stroke: data.stroke,
      distance: Number(data.distance),
      poolSize: Number(data.poolSize),
      timeMs: Number(data.timeMs),
      location: data.location || null,
      notes: data.notes || null,
      rank: data.resultType === 'TRAINING' ? null : data.isUnranked ? null : data.rank ? Number(data.rank) : null,
      isUnranked: data.resultType === 'TRAINING' ? false : Boolean(data.isUnranked),
      isPersonalBest: false,
      ...(data.competitionId ? { competitionId: data.competitionId } : {}),
    },
  })

  await recalcPBs(primary.id)

  const saved = await prisma.swimResult.findUnique({ where: { id: result.id } })
  return NextResponse.json(saved)
}
