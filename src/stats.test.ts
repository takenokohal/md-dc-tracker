import { describe, expect, it } from 'vitest'
import { ALL, distribution, filterMatches, groupBy, OTHERS, split, tally } from './stats'
import type { Match } from './types'

const at = (d: number, h: number) => new Date(2026, 9, d, h).getTime()
let seq = 0
const match = (p: Partial<Match> = {}): Match => ({
  id: String(seq++),
  at: at(18, 12),
  eventId: 'e1',
  myDeckId: 'me',
  oppDeckId: 'kt',
  turn: 'first',
  result: 'win',
  ...p,
})

describe('tally', () => {
  it('0戦なら勝率は null', () => {
    expect(tally([])).toEqual({ games: 0, wins: 0, losses: 0, rate: null })
  })

  it('勝敗数と勝率を数える', () => {
    expect(tally([match(), match({ result: 'lose' }), match()])).toEqual({ games: 3, wins: 2, losses: 1, rate: 2 / 3 })
  })
})

describe('split', () => {
  it('先攻と後攻に分けて数える', () => {
    const s = split([match(), match({ turn: 'second', result: 'lose' }), match({ turn: 'second' })])
    expect(s.all.games).toBe(3)
    expect(s.first).toMatchObject({ games: 1, rate: 1 })
    expect(s.second).toMatchObject({ games: 2, wins: 1, rate: 0.5 })
  })
})

describe('filterMatches', () => {
  const ms = [
    match({ eventId: 'e1', at: at(18, 9) }),
    match({ eventId: 'e1', at: at(17, 23) }),
    match({ eventId: 'e2', at: at(18, 10) }),
    match({ eventId: 'e1', myDeckId: 'other', at: at(18, 11) }),
  ]
  const now = at(18, 20)

  it('イベントで絞る', () => {
    expect(filterMatches(ms, { eventId: 'e1', myDeckId: ALL, period: 'all' }, now)).toHaveLength(3)
  })

  it('今日の分だけにする', () => {
    expect(filterMatches(ms, { eventId: ALL, myDeckId: ALL, period: 'today' }, now)).toHaveLength(3)
  })

  it('自分のデッキで絞る', () => {
    expect(filterMatches(ms, { eventId: ALL, myDeckId: 'other', period: 'all' }, now)).toEqual([ms[3]])
  })

  it('条件を組み合わせる', () => {
    expect(filterMatches(ms, { eventId: 'e1', myDeckId: ALL, period: 'today' }, now)).toEqual([ms[0], ms[3]])
  })
})

describe('groupBy', () => {
  it('試合数の多い順に並べ、遭遇率と先後別の勝率を出す', () => {
    const rows = groupBy(
      [match({ oppDeckId: 'a' }), match({ oppDeckId: 'b', turn: 'second', result: 'lose' }), match({ oppDeckId: 'b' })],
      'oppDeckId',
    )
    expect(rows.map(r => r.id)).toEqual(['b', 'a'])
    expect(rows[0].share).toBeCloseTo(2 / 3)
    expect(rows[0].first.rate).toBe(1)
    expect(rows[0].second.rate).toBe(0)
  })
})

describe('distribution', () => {
  // a を 7 戦、b を 6 戦 … g を 1 戦
  const decks = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  const ms = decks.flatMap((id, i) => Array.from({ length: decks.length - i }, () => match({ oppDeckId: id })))

  it('区分が上限以下ならそのまま返す', () => {
    const slices = distribution(groupBy(ms, 'oppDeckId'), 7)
    expect(slices.map(s => s.id)).toEqual(decks)
    expect(slices[0]).toEqual({ id: 'a', games: 7, share: 7 / 28 })
  })

  it('上限を超えたら上位とその他にまとめる', () => {
    const slices = distribution(groupBy(ms, 'oppDeckId'))
    expect(slices.map(s => s.id)).toEqual(['a', 'b', 'c', 'd', 'e', OTHERS])
    expect(slices[5].games).toBe(3)
    expect(slices[5].share).toBeCloseTo(3 / 28)
  })
})
