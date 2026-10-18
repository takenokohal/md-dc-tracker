import type { Backend, Snapshot } from './types'

const KEY = 'md-dc-tracker'
const listeners = new Set<(snap: Snapshot) => void>()

const read = (): Snapshot => JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? { settings: null, matches: [] }

// ブラウザ内だけに保存する。ログイン不要。`npm run dev:offline` で使う
export const localBackend: Backend = {
  onSession(cb) {
    cb({ uid: 'local', email: null })
    return () => {}
  },

  async signIn() {},

  async signOut() {},

  subscribe(_uid, cb) {
    listeners.add(cb)
    cb(read())
    return () => listeners.delete(cb)
  },

  async commit(_uid, { settings, put, remove }) {
    const cur = read()
    const replaced = new Set([...remove, ...put.map(m => m.id)])
    const next: Snapshot = {
      settings: settings ?? cur.settings,
      matches: [...cur.matches.filter(m => !replaced.has(m.id)), ...put],
    }
    localStorage.setItem(KEY, JSON.stringify(next))
    listeners.forEach(l => l(next))
  },
}
