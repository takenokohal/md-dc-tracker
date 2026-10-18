import { describe, expect, it, vi } from 'vitest'
import { createDefaultSettings, diff, migrateSettings, parseBackup, sortDecks } from './store'
import type { AppData, Match, SettingsV1 } from './types'

vi.mock('./backend', () => ({ backend: {} }))

const match = (id: string): Match => ({
  id,
  at: 0,
  eventId: 'e',
  myDeckId: 'm',
  oppDeckId: 'o',
  turn: 'first',
  result: 'win',
})

const base = (): AppData => ({ ...createDefaultSettings(0), matches: [match('a'), match('b')] })

const v1 = (): SettingsV1 => ({
  version: 1,
  myDecks: [{ id: 'm', name: 'スネークアイ', hidden: false }],
  oppDecks: [
    { id: 'p', name: '未確定', hidden: false, pinned: true },
    { id: 'o', name: 'キラーチューン', hidden: false },
  ],
  events: [{ id: 'e', name: 'DC 2nd', createdAt: 0 }],
  currentEventId: 'e',
  currentMyDeckId: 'm',
})

describe('diff', () => {
  it('試合を追加したら put だけ出る', () => {
    const prev = base()
    const added = match('c')
    expect(diff(prev, { ...prev, matches: [...prev.matches, added] })).toEqual({ put: [added], remove: [] })
  })

  it('試合を消したら remove に id が出る', () => {
    const prev = base()
    expect(diff(prev, { ...prev, matches: [prev.matches[1]] })).toEqual({ put: [], remove: ['a'] })
  })

  it('試合を書き換えたら put に出る', () => {
    const prev = base()
    const edited = { ...prev.matches[0], result: 'lose' as const }
    expect(diff(prev, { ...prev, matches: [edited, prev.matches[1]] })).toEqual({ put: [edited], remove: [] })
  })

  it('設定が変わったら settings に matches 抜きで出る', () => {
    const prev = base()
    const change = diff(prev, { ...prev, currentMyDeckId: 'x' })
    expect(change.settings?.currentMyDeckId).toBe('x')
    expect(change.settings).not.toHaveProperty('matches')
    expect(change.put).toEqual([])
  })
})

describe('createDefaultSettings', () => {
  it('デッキは固定の未確定と地雷だけ', () => {
    expect(createDefaultSettings().decks.map(d => [d.name, d.pinned])).toEqual([
      ['未確定', true],
      ['地雷', true],
    ])
  })
})

describe('sortDecks', () => {
  it('固定デッキを後ろに回す', () => {
    const decks = [
      { id: '1', name: 'p', hidden: false, pinned: true },
      { id: '2', name: 'a', hidden: false },
    ]
    expect(sortDecks(decks).map(d => d.id)).toEqual(['2', '1'])
  })
})

describe('migrateSettings', () => {
  it('自分用と相手用のデッキを1つのプリセットにまとめ、固定は後ろに置く', () => {
    const s = migrateSettings(v1())
    expect(s.version).toBe(2)
    expect(s.decks.map(d => d.id)).toEqual(['m', 'o', 'p'])
    expect(s).not.toHaveProperty('myDecks')
    expect(s.currentMyDeckId).toBe('m')
  })
})

describe('parseBackup', () => {
  it('今の形式のバックアップを受け付ける', () => {
    const backup = JSON.parse(JSON.stringify(base()))
    expect(parseBackup(backup)).toEqual(backup)
  })

  it('旧形式のバックアップは変換して受け付ける', () => {
    const parsed = parseBackup({ ...v1(), matches: [match('a')] })
    expect(parsed?.version).toBe(2)
    expect(parsed?.decks).toHaveLength(3)
    expect(parsed?.matches).toHaveLength(1)
  })

  it('形の違うデータは弾く', () => {
    expect(parseBackup({ version: 2, matches: [] })).toBeNull()
    expect(parseBackup(null)).toBeNull()
  })
})
