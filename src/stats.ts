import type { Match } from './types'

export const ALL = 'all'

export interface Filter {
  eventId: string
  myDeckId: string
  period: 'all' | 'today'
}

export interface Tally {
  games: number
  wins: number
  losses: number
  rate: number | null
}

export interface Split {
  all: Tally
  first: Tally
  second: Tally
}

export interface GroupRow extends Split {
  id: string
  share: number
}

export function startOfDay(t: number) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function tally(ms: Match[]): Tally {
  const wins = ms.filter(m => m.result === 'win').length
  return { games: ms.length, wins, losses: ms.length - wins, rate: ms.length ? wins / ms.length : null }
}

export function split(ms: Match[]): Split {
  return {
    all: tally(ms),
    first: tally(ms.filter(m => m.turn === 'first')),
    second: tally(ms.filter(m => m.turn === 'second')),
  }
}

export function filterMatches(ms: Match[], f: Filter, now = Date.now()): Match[] {
  const from = f.period === 'today' ? startOfDay(now) : -Infinity
  return ms.filter(
    m =>
      (f.eventId === ALL || m.eventId === f.eventId) &&
      (f.myDeckId === ALL || m.myDeckId === f.myDeckId) &&
      m.at >= from,
  )
}

export function groupBy(ms: Match[], key: 'oppDeckId' | 'myDeckId'): GroupRow[] {
  const groups = new Map<string, Match[]>()
  for (const m of ms) groups.set(m[key], [...(groups.get(m[key]) ?? []), m])
  return [...groups]
    .map(([id, g]) => ({ id, share: g.length / ms.length, ...split(g) }))
    .sort((a, b) => b.all.games - a.all.games)
}
