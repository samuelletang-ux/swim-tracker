import { tr, type Language } from '@/lib/i18n'

// ─── Nages disponibles ────────────────────────────────────────────────────────
export type Stroke =
  | 'free'
  | 'back'
  | 'breast'
  | 'fly'
  | 'im'

// Clé i18n par nage
const STROKE_I18N_KEY: Record<Stroke, string> = {
  free:   'stroke.freestyle',
  back:   'stroke.backstroke',
  breast: 'stroke.breaststroke',
  fly:    'stroke.butterfly',
  im:     'stroke.medley',
}

// Noms français — utilisés comme fallback et pour conserver l'ordre des clés
export const STROKE_LABELS: Record<Stroke, string> = {
  free:   'Crawl',
  back:   'Dos',
  breast: 'Brasse',
  fly:    'Papillon',
  im:     '4 nages',
}

/**
 * Retourne le nom de la nage dans la langue courante.
 * Utiliser cette fonction partout où le nom est affiché à l'utilisateur.
 */
export function strokeLabel(stroke: Stroke | string, language: Language): string {
  const key = STROKE_I18N_KEY[stroke as Stroke]
  if (!key) return stroke
  return tr(language, key)
}

export const STROKE_EMOJI: Record<Stroke, string> = {
  free:   '🏊',
  back:   '🔄',
  breast: '🐸',
  fly:    '🦋',
  im:     '⭐',
}

export type Distance = 25 | 33 | 66 | 99 | 50 | 100 | 200 | 400 | 800 | 1500

export const DISTANCES: Distance[] = [25, 50, 100, 200, 400, 800, 1500]

export type PoolSize = 25 | 33 | 50

export interface SwimResult {
  id:            string
  date:          string
  stroke:        Stroke
  distance:      Distance
  poolSize:      PoolSize
  timeMs:        number
  location?:     string | null
  notes?:        string | null
  rank?:         number | null
  isUnranked?:   boolean
  isPersonalBest: boolean
  resultType?: 'COMPETITION' | 'TRAINING'
}

export function msToTime(ms: number): { minutes: number; seconds: number; hundredths: number } {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hundredths = Math.floor((ms % 1000) / 10)
  return { minutes, seconds, hundredths }
}

export function timeToMs(minutes: number, seconds: number, hundredths: number): number {
  return (minutes * 60 + seconds) * 1000 + hundredths * 10
}

export function formatTime(ms: number): string {
  const { minutes, seconds, hundredths } = msToTime(ms)
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
  if (minutes > 0) return `${minutes}:${pad(seconds)}.${pad(hundredths)}`
  return `${seconds}.${pad(hundredths)}`
}

export type EventKey = `${Stroke}-${Distance}-${PoolSize}`

export function makeEventKey(stroke: Stroke, distance: Distance, poolSize: PoolSize): EventKey {
  return `${stroke}-${distance}-${poolSize}`
}

export interface EventStats {
  eventKey:     EventKey
  stroke:       Stroke
  distance:     Distance
  poolSize:     PoolSize
  personalBest: SwimResult
  results:      SwimResult[]
  improvement:  number | null
}
