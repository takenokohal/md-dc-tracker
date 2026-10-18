import type { Tally } from './stats'
import type { Deck, Result, Turn } from './types'

export const TURN: Record<Turn, string> = { first: '先攻', second: '後攻' }
export const RESULT: Record<Result, string> = { win: '勝ち', lose: '負け' }
export const TURN_OPTIONS: [Turn, string][] = [['first', '先攻'], ['second', '後攻']]
export const RESULT_OPTIONS: [Result, string][] = [['win', '勝ち'], ['lose', '負け']]

export const pct = (r: number | null) => (r === null ? '—' : `${(r * 100).toFixed(1)}%`)
export const wl = (t: Tally) => `${t.wins}勝${t.losses}敗`
export const deckName = (decks: Deck[], id: string) => decks.find(d => d.id === id)?.name ?? '（削除済み）'

const WEEKDAYS = '日月火水木金土'
export const fmtDate = (t: number) => {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`
}
export const fmtTime = (t: number) => new Date(t).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

export const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
