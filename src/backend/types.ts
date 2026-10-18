import type { Match, Settings, StoredSettings } from '../types'

export interface Session {
  uid: string
  email: string | null
}

// settings が null のときは、まだ作られていない（初回ログイン）
export interface Snapshot {
  settings: StoredSettings | null
  matches: Match[]
}

export interface ChangeSet {
  settings?: Settings
  put: Match[]
  remove: string[]
}

// 保存先を差し替えるときは、これを実装して backend/index.ts で切り替える
export interface Backend {
  onSession(cb: (session: Session | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  subscribe(uid: string, cb: (snap: Snapshot) => void): () => void
  commit(uid: string, change: ChangeSet): Promise<void>
}
