import { deckName, isIOS, RESULT, TURN } from './format'
import type { AppData } from './types'

export async function saveFile(name: string, text: string, type: string) {
  const file = new File([text], name, { type })
  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') throw e
    }
    return
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function stamp(t = Date.now()) {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

function csvCell(s: string) {
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(d: AppData): string {
  const eventName = (id: string) => d.events.find(e => e.id === id)?.name ?? ''
  const rows = [
    ['日時', 'イベント', '自分のデッキ', '相手のデッキ', '先後', '勝敗', 'メモ'],
    ...[...d.matches]
      .sort((a, b) => a.at - b.at)
      .map(m => [
        new Date(m.at).toLocaleString('ja-JP'),
        eventName(m.eventId),
        deckName(d.decks, m.myDeckId),
        deckName(d.decks, m.oppDeckId),
        TURN[m.turn],
        RESULT[m.result],
        m.note ?? '',
      ]),
  ]
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')
}
