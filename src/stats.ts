import type { Match } from './types'

export const ALL = 'all'
export const OTHERS = 'others'

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

export interface Slice {
  id: string
  games: number
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

// 円グラフは区分が多いと読めないので、max を超えたら上位 max-1 件と「その他」にまとめる
export function distribution(rows: GroupRow[], max = 6): Slice[] {
  const slices = rows.map(r => ({ id: r.id, games: r.all.games, share: r.share }))
  if (slices.length <= max) return slices
  const rest = slices.slice(max - 1)
  return [
    ...slices.slice(0, max - 1),
    {
      id: OTHERS,
      games: rest.reduce((n, s) => n + s.games, 0),
      share: rest.reduce((n, s) => n + s.share, 0),
    },
  ]
}
