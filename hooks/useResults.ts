'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  SwimResult,
  Stroke,
  Distance,
  PoolSize,
  EventStats,
} from '@/lib/types'
import { makeEventKey } from '@/lib/types'

export function useResults() {
  const [results, setResults] = useState<SwimResult[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/results', { cache: 'no-store' })

    if (!res.ok) {
      throw new Error('Impossible de charger les résultats')
    }

    const data = await res.json()
    setResults(data)
  }, [])

  useEffect(() => {
    refresh().finally(() => setIsLoaded(true))
  }, [refresh])

  const addResult = useCallback(
    async (data: Omit<SwimResult, 'id' | 'isPersonalBest'>) => {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Impossible d’enregistrer le chrono')
      }

      const saved = await res.json()
      await refresh()
      return saved as SwimResult
    },
    [refresh]
  )

  const updateResult = useCallback(
    async (id: string, data: Omit<SwimResult, 'id' | 'isPersonalBest'>) => {
      const res = await fetch(`/api/results/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Impossible de modifier le chrono')
      }

      const saved = await res.json()
      await refresh()
      return saved as SwimResult
    },
    [refresh]
  )

  const removeResult = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Impossible de supprimer le chrono')
      }

      await refresh()
    },
    [refresh]
  )

  const recent = useCallback((limit = 10) => results.slice(0, limit), [results])

  const personalBests = useCallback(
    () => results.filter((r) => r.isPersonalBest),
    [results]
  )

  const eventStats = useCallback(
    (stroke: Stroke, distance: Distance, poolSize: PoolSize): EventStats | null => {
      const eventKey = makeEventKey(stroke, distance, poolSize)

      const eventResults = results
        .filter((r) => makeEventKey(r.stroke, r.distance, r.poolSize) === eventKey)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      if (eventResults.length === 0) return null

      const personalBest = eventResults.reduce((best, r) =>
        r.timeMs < best.timeMs ? r : best
      )

      const oldest = eventResults[eventResults.length - 1]
      const newest = eventResults[0]

      const improvement =
        eventResults.length >= 2 ? newest.timeMs - oldest.timeMs : null

      return {
        eventKey,
        stroke,
        distance,
        poolSize,
        personalBest,
        results: eventResults,
        improvement,
      }
    },
    [results]
  )

  return {
    results,
    isLoaded,
    addResult,
    updateResult,
    removeResult,
    recent,
    personalBests,
    eventStats,
    refresh,
  }
}