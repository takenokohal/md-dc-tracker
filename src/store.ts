import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { backend } from './backend'
import type { ChangeSet } from './backend/types'
import type { AppData, Deck, Match, Settings, StoredSettings } from './types'

export type Update = (fn: (d: AppData) => AppData) => void

export const UNKNOWN_OPP = '未確定'
const PINNED_OPP = [UNKNOWN_OPP, '地雷']
const SETTINGS_KEYS = ['version', 'decks', 'events', 'currentEventId', 'currentMyDeckId'] as const

export const newId = () => crypto.randomUUID()

export const newDeck = (name: string, pinned = false): Deck => ({
  id: newId(),
  name,
  hidden: false,
  ...(pinned ? { pinned: true } : {}),
})

export const sortDecks = (ds: Deck[]) => [...ds.filter(d => !d.pinned), ...ds.filter(d => d.pinned)]

export function createDefaultSettings(now = Date.now()): Settings {
  const event = { id: newId(), name: 'DC 2nd', createdAt: now }
  return {
    version: 2,
    decks: PINNED_OPP.map(n => newDeck(n, true)),
    events: [event],
    currentEventId: event.id,
    currentMyDeckId: null,
  }
}

export function migrateSettings(s: StoredSettings): Settings {
  if (s.version === 2) return s
  const { myDecks, oppDecks, ...rest } = s
  return { ...rest, version: 2, decks: sortDecks([...myDecks, ...oppDecks]) }
}

export function parseBackup(v: unknown): AppData | null {
  const d = v as StoredSettings & { matches: Match[] }
  if (!d || !Array.isArray(d.matches) || !Array.isArray(d.events)) return null
  const shapeOk =
    d.version === 2 ? Array.isArray(d.decks) : d.version === 1 && Array.isArray(d.myDecks) && Array.isArray(d.oppDecks)
  if (!shapeOk || !d.events.some(e => e.id === d.currentEventId)) return null
  return { ...migrateSettings(d), matches: d.matches }
}

export function diff(prev: AppData, next: AppData): ChangeSet {
  const before = new Map(prev.matches.map(m => [m.id, m]))
  const after = new Set(next.matches.map(m => m.id))
  const { matches: _, ...settings } = next
  return {
    ...(SETTINGS_KEYS.some(k => prev[k] !== next[k]) ? { settings } : {}),
    put: next.matches.filter(m => before.get(m.id) !== m),
    remove: prev.matches.filter(m => !after.has(m.id)).map(m => m.id),
  }
}

export function useAppData(uid: string): [AppData | null, Update] {
  const [data, setData] = useState<AppData | null>(null)
  const ref = useRef<AppData | null>(null)

  useEffect(
    () =>
      backend.subscribe(uid, ({ settings, matches }) => {
        if (!settings || settings.version !== 2) {
          const next = settings ? migrateSettings(settings) : createDefaultSettings()
          void backend.commit(uid, { settings: next, put: [], remove: [] })
          return
        }
        ref.current = { ...settings, matches }
        setData(ref.current)
      }),
    [uid],
  )

  const update = useCallback<Update>(
    fn => {
      const prev = ref.current
      if (!prev) return
      const next = fn(prev)
      ref.current = next
      setData(next)
      backend.commit(uid, diff(prev, next)).catch(e => alert(`保存に失敗した：${e instanceof Error ? e.message : e}`))
    },
    [uid],
  )

  return [data, update]
}
