import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const comp = await prisma.competition.findUnique({ where: { id } })
  if (!comp) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (comp.isLive) {
    // Désactiver le live
    const updated = await prisma.competition.update({
      where: { id },
      data: { isLive: false },
    })
    return NextResponse.json(updated)
  } else {
    // Désactiver tous les autres lives, activer celui-ci
    await prisma.competition.updateMany({
      where: { isLive: true },
      data: { isLive: false },
    })
    const updated = await prisma.competition.update({
      where: { id },
      data: { isLive: true },
    })
    return NextResponse.json(updated)
  }
}
