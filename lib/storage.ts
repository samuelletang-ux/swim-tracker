/**
 * Couche de stockage — localStorage pour l'instant.
 * Pour passer à Supabase/Postgres, il suffit de remplacer ces fonctions.
 */

import {
  SwimResult,
  Stroke,
  Distance,
  PoolSize,
  EventKey,
  makeEventKey,
  EventStats,
} from './types'

const STORAGE_KEY = 'swim-tracker-results'

// ─── CRUD ────────────────────────────────────────────────────────────────────

function readAll(): SwimResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SwimResult[]) : []
  } catch {
    return []
  }
}

function writeAll(results: SwimResult[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
}

export function getAllResults(): SwimResult[] {
  return readAll().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getResultById(id: string): SwimResult | undefined {
  return readAll().find((r) => r.id === id)
}

export function saveResult(
  data: Omit<SwimResult, 'id' | 'isPersonalBest'>
): SwimResult {
  const all = readAll()

  // Calculer si c'est un record perso pour cet event
  const eventKey = makeEventKey(data.stroke, data.distance, data.poolSize)
  const existing = all.filter(
    (r) =>
      makeEventKey(r.stroke, r.distance, r.poolSize) === eventKey
  )
  const currentBest = existing.length
    ? Math.min(...existing.map((r) => r.timeMs))
    : Infinity

  const isPersonalBest = data.timeMs <= currentBest

  const newResult: SwimResult = {
    ...data,
    id: crypto.randomUUID(),
    isPersonalBest,
  }

  // Si nouveau PB, on retire le flag des anciens
  const updated = all.map((r) =>
    makeEventKey(r.stroke, r.distance, r.poolSize) === eventKey &&
    r.isPersonalBest &&
    isPersonalBest
      ? { ...r, isPersonalBest: false }
      : r
  )

  writeAll([...updated, newResult])
  return newResult
}

export function deleteResult(id: string): void {
  const all = readAll().filter((r) => r.id !== id)
  // Recalculer les PB après suppression
  const recalculated = recalcPBs(all)
  writeAll(recalculated)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getEventStats(
  stroke: Stroke,
  distance: Distance,
  poolSize: PoolSize
): EventStats | null {
  const all = readAll()
  const eventKey = makeEventKey(stroke, distance, poolSize)
  const results = all
    .filter((r) => makeEventKey(r.stroke, r.distance, r.poolSize) === eventKey)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (results.length === 0) return null

  const personalBest = results.reduce((best, r) =>
    r.timeMs < best.timeMs ? r : best
  )

  const oldest = results[results.length - 1]
  const newest = results[0]
  const improvement =
    results.length >= 2 ? newest.timeMs - oldest.timeMs : null

  return { eventKey, stroke, distance, poolSize, personalBest, results, improvement }
}

export function getPersonalBests(): SwimResult[] {
  return readAll().filter((r) => r.isPersonalBest)
}

export function getRecentResults(limit = 10): SwimResult[] {
  return getAllResults().slice(0, limit)
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

function recalcPBs(results: SwimResult[]): SwimResult[] {
  const bestByEvent = new Map<EventKey, number>()

  // Trouver le meilleur temps par event
  for (const r of results) {
    const key = makeEventKey(r.stroke, r.distance, r.poolSize)
    const current = bestByEvent.get(key) ?? Infinity
    if (r.timeMs < current) bestByEvent.set(key, r.timeMs)
  }

  return results.map((r) => ({
    ...r,
    isPersonalBest:
      r.timeMs === bestByEvent.get(makeEventKey(r.stroke, r.distance, r.poolSize)),
  }))
}

// ─── Données de demo ──────────────────────────────────────────────────────────

export function seedDemoData(): void {
  if (typeof window === 'undefined') return
  if (readAll().length > 0) return // Ne pas écraser des vraies données

  const demoResults: Omit<SwimResult, 'id' | 'isPersonalBest'>[] = [
    // 100m crawl — progression sur 6 mois
    { date: '2024-01-15', stroke: 'free', distance: 100, poolSize: 25, timeMs: 72800, location: 'Piscine du Stade' },
    { date: '2024-02-20', stroke: 'free', distance: 100, poolSize: 25, timeMs: 71200, location: 'Compétition hiver' },
    { date: '2024-03-10', stroke: 'free', distance: 100, poolSize: 25, timeMs: 70600, location: 'Piscine du Stade' },
    { date: '2024-04-05', stroke: 'free', distance: 100, poolSize: 25, timeMs: 69400, location: 'Championnat jeunes' },
    { date: '2024-05-18', stroke: 'free', distance: 100, poolSize: 25, timeMs: 68900, location: 'Piscine du Stade' },
    { date: '2024-06-22', stroke: 'free', distance: 100, poolSize: 50, timeMs: 71500, location: 'Bassin olympique' },
    // 50m crawl
    { date: '2024-02-20', stroke: 'free', distance: 50, poolSize: 25, timeMs: 30400, location: 'Compétition hiver' },
    { date: '2024-04-05', stroke: 'free', distance: 50, poolSize: 25, timeMs: 29800, location: 'Championnat jeunes' },
    { date: '2024-06-22', stroke: 'free', distance: 50, poolSize: 50, timeMs: 31200, location: 'Bassin olympique' },
    // 100m dos
    { date: '2024-02-20', stroke: 'back', distance: 100, poolSize: 25, timeMs: 80500, location: 'Compétition hiver' },
    { date: '2024-04-05', stroke: 'back', distance: 100, poolSize: 25, timeMs: 78900, location: 'Championnat jeunes' },
    // 100m brasse
    { date: '2024-03-10', stroke: 'breast', distance: 100, poolSize: 25, timeMs: 88200, location: 'Piscine du Stade' },
    { date: '2024-05-18', stroke: 'breast', distance: 100, poolSize: 25, timeMs: 85600, location: 'Piscine du Stade' },
  ]

  for (const d of demoResults) {
    saveResult(d)
  }
}
