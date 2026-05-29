import 'dotenv/config'
import { PrismaClient } from '/client'
import { qualificationStandards2025 } from '../lib/data/qualification-standards-2025'

const prisma = new PrismaClient()

type Standard = {
  gender: 'male' | 'female'
  ageGroup: string
  stroke: string
  distance: number
  timeText: string
  timeMs: number
  source?: string
}

async function main() {
  const rows = qualificationStandards2025 as unknown as Standard[]

  console.log(`Import de ${rows.length} temps de qualification...`)

  for (const row of rows) {
    await prisma.qualificationStandard.upsert({
      where: {
        gender_ageGroup_stroke_distance: {
          gender: row.gender,
          ageGroup: row.ageGroup,
          stroke: row.stroke,
          distance: row.distance,
        },
      },
      update: {
        timeText: row.timeText,
        timeMs: row.timeMs,
        source: row.source ?? 'MÚSZ 2025',
      },
      create: {
        gender: row.gender,
        ageGroup: row.ageGroup,
        stroke: row.stroke,
        distance: row.distance,
        timeText: row.timeText,
        timeMs: row.timeMs,
        source: row.source ?? 'MÚSZ 2025',
      },
    })
  }

  console.log('Import terminé.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })