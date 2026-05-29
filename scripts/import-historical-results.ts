import { PrismaClient } from '../lib/generated/prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

type ImportRow = {
  shouldImport: boolean
  sourceOrder: number
  date: string
  resultType: 'COMPETITION' | 'TRAINING'
  poolSize: number
  distance: number
  stroke: string
  timeMs: number
  notes?: string
  sourceLabel?: string
  rawCell?: string
}

function loadRows(): ImportRow[] {
  const file = path.join(process.cwd(), 'scripts', 'data', 'swim_results_import_data.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as ImportRow[]
}

async function getPrimarySwimmer() {
  return prisma.swimmer.findFirst({
    where: { role: 'PRIMARY' },
  })
}

async function recomputePersonalBests(swimmerId: string) {
  await prisma.swimResult.updateMany({
    where: {
      swimmerId,
      resultType: 'COMPETITION',
    },
    data: { isPersonalBest: false },
  })

  const results = await prisma.swimResult.findMany({
    where: {
      swimmerId,
      resultType: 'COMPETITION',
    },
    orderBy: [{ timeMs: 'asc' }, { date: 'desc' }],
  })

  const bestByEvent = new Map<string, string>()

  for (const r of results) {
    const key = `${r.stroke}|${r.distance}|${r.poolSize}|${r.resultType}`
    if (!bestByEvent.has(key)) bestByEvent.set(key, r.id)
  }

  const bestIds = Array.from(bestByEvent.values())

  for (const id of bestIds) {
    await prisma.swimResult.update({
      where: { id },
      data: { isPersonalBest: true },
    })
  }
}

async function main() {
  const swimmer = await getPrimarySwimmer()

  if (!swimmer) {
    throw new Error('Aucun nageur principal trouvé. Crée d’abord un swimmer avec role = PRIMARY.')
  }

  const rows = loadRows().filter((r) => r.shouldImport)

  let created = 0
  let skipped = 0

  for (const row of rows) {
    const existing = await prisma.swimResult.findFirst({
      where: {
        swimmerId: swimmer.id,
        resultType: row.resultType,
        date: row.date,
        stroke: row.stroke,
        distance: row.distance,
        poolSize: row.poolSize,
        timeMs: row.timeMs,
      },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.swimResult.create({
      data: {
        swimmerId: swimmer.id,
        resultType: row.resultType,
        date: row.date,
        stroke: row.stroke,
        distance: row.distance,
        poolSize: row.poolSize,
        timeMs: row.timeMs,
        location: row.sourceLabel || null,
        notes: row.notes || null,
        rank: null,
        isUnranked: false,
        isPersonalBest: false,
      },
    })

    created++
  }

  await recomputePersonalBests(swimmer.id)

  console.log(`Import terminé : ${created} chrono(s) ajouté(s), ${skipped} doublon(s) ignoré(s).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
