import type { Deck, Match } from './types'

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

// 相手として当たった回数の多い順。同数ならもとの並びを保つ
export function byEncounter(decks: Deck[], ms: Match[]): Deck[] {
  const n = new Map<string, number>()
  for (const m of ms) n.set(m.oppDeckId, (n.get(m.oppDeckId) ?? 0) + 1)
  return [...decks].sort((a, b) => (n.get(b.id) ?? 0) - (n.get(a.id) ?? 0))
}

// 円グラフは区分が多いと読めないので、max を超えたら上位と「その他」にまとめる。
// last の区分は「その他」に混ぜず、常に独立させて末尾に置く
export function distribution(rows: GroupRow[], { max = 6, last }: { max?: number; last?: string } = {}): Slice[] {
  const toSlice = (r: GroupRow): Slice => ({ id: r.id, games: r.all.games, share: r.share })
  const tail = rows.filter(r => r.id === last).map(toSlice)
  const slices = rows.filter(r => r.id !== last).map(toSlice)
  const room = max - tail.length
  if (slices.length <= room) return [...slices, ...tail]
  const rest = slices.slice(room - 1)
  return [
    ...slices.slice(0, room - 1),
    {
      id: OTHERS,
      games: rest.reduce((n, s) => n + s.games, 0),
      share: rest.reduce((n, s) => n + s.share, 0),
    },
    ...tail,
  ]
}
