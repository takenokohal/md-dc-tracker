export type Turn = 'first' | 'second'
export type Result = 'win' | 'lose'

export interface Deck {
  id: string
  name: string
  hidden: boolean
  pinned?: boolean
}

export interface DcEvent {
  id: string
  name: string
  createdAt: number
}

export interface Match {
  id: string
  at: number
  eventId: string
  myDeckId: string
  oppDeckId: string
  turn: Turn
  result: Result
  note?: string
}

export interface Settings {
  version: 2
  decks: Deck[]
  events: DcEvent[]
  currentEventId: string
  currentMyDeckId: string | null
}

// 自分のデッキと相手のデッキを別々に持っていた頃の形式
export interface SettingsV1 {
  version: 1
  myDecks: Deck[]
  oppDecks: Deck[]
  events: DcEvent[]
  currentEventId: string
  currentMyDeckId: string | null
}

export type StoredSettings = Settings | SettingsV1

export interface AppData extends Settings {
  matches: Match[]
}
