import { ChartColumn, Check, ChevronDown, Plus, Undo2 } from 'lucide-preact'
import { useEffect, useState } from 'preact/hooks'
import { ModeButton } from '../components/ModeButton'
import { NameForm } from '../components/NameForm'
import { Segmented } from '../components/Segmented'
import { Toast } from '../components/Toast'
import { deckName, pct, RESULT, RESULT_OPTIONS, TURN, TURN_OPTIONS, wl } from '../format'
import { startOfDay, tally } from '../stats'
import { newDeck, newId, sortDecks, type Update } from '../store'
import type { AppData, DcEvent, Match, Result, Turn } from '../types'

const TOAST_MS = 5000

interface Props {
  data: AppData
  update: Update
  onSwitch: () => void
}

export function RecordScreen({ data, update, onSwitch }: Props) {
  const [turn, setTurn] = useState<Turn | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [opp, setOpp] = useState<string | null>(null)
  const [open, setOpen] = useState<'event' | 'mine' | null>(null)
  const [addingOpp, setAddingOpp] = useState(false)
  const [last, setLast] = useState<Match | null>(null)

  useEffect(() => {
    if (!last) return
    const t = setTimeout(() => setLast(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [last])

  const event = data.events.find(e => e.id === data.currentEventId)!
  const decks = sortDecks(data.decks).filter(d => !d.hidden)
  const myDecks = decks.filter(d => !d.pinned)
  const myDeck = data.decks.find(d => d.id === data.currentMyDeckId)
  const eventMatches = data.matches.filter(m => m.eventId === event.id)
  const today = tally(eventMatches.filter(m => m.at >= startOfDay(Date.now())))
  const total = tally(eventMatches)
  const missing = [!myDeck && '自分のデッキ', !opp && '相手のデッキ', !turn && '先攻/後攻', !result && '勝敗'].filter(Boolean)

  const toggle = (p: 'event' | 'mine') => setOpen(open === p ? null : p)

  const selectEvent = (id: string) => {
    update(d => ({ ...d, currentEventId: id }))
    setOpen(null)
  }
  const startEvent = (name: string) => {
    const ev: DcEvent = { id: newId(), name, createdAt: Date.now() }
    update(d => ({ ...d, events: [...d.events, ev], currentEventId: ev.id }))
    setOpen(null)
  }
  const selectMyDeck = (id: string) => {
    update(d => ({ ...d, currentMyDeckId: id }))
    setOpen(null)
  }
  const addMyDeck = (name: string) => {
    const deck = newDeck(name)
    update(d => ({ ...d, decks: sortDecks([...d.decks, deck]), currentMyDeckId: deck.id }))
    setOpen(null)
  }
  const addOpp = (name: string) => {
    const deck = newDeck(name)
    update(d => ({ ...d, decks: sortDecks([...d.decks, deck]) }))
    setOpp(deck.id)
    setAddingOpp(false)
  }

  const commit = () => {
    if (!myDeck || !turn || !opp || !result) return
    const m: Match = { id: newId(), at: Date.now(), eventId: event.id, myDeckId: myDeck.id, oppDeckId: opp, turn, result }
    update(d => ({ ...d, matches: [...d.matches, m] }))
    setTurn(null)
    setResult(null)
    setOpp(null)
    setLast(m)
  }
  const undo = () => {
    if (!last) return
    update(d => ({ ...d, matches: d.matches.filter(m => m.id !== last.id) }))
    setTurn(last.turn)
    setResult(last.result)
    setOpp(last.oppDeckId)
    setLast(null)
  }

  return (
    <div class="record">
      <header class="record-head">
        <div class="score">
          <span>
            今日 {wl(today)} <b>{pct(today.rate)}</b>
          </span>
          <span>
            通算 {wl(total)} <b>{pct(total.rate)}</b>
          </span>
        </div>
        <ModeButton icon={<ChartColumn size={20} />} label="統計モードへ" onClick={onSwitch} />
      </header>

      <div class="record-decks">
        <div class="selectors">
          <section class="field">
            <div class="label">イベント</div>
            <button type="button" class={`select-btn${open === 'event' ? ' open' : ''}`} onClick={() => toggle('event')}>
              <span>{event.name}</span>
              <ChevronDown size={18} class="caret" />
            </button>
          </section>
          <section class="field">
            <div class="label">自分のデッキ</div>
            <button type="button" class={`select-btn${open === 'mine' ? ' open' : ''}`} onClick={() => toggle('mine')}>
              <span>{myDeck?.name ?? 'タップして選ぶ'}</span>
              <ChevronDown size={18} class="caret" />
            </button>
          </section>
        </div>

        {open === 'event' && (
          <div class="picker">
            <div class="chips">
              {[...data.events].reverse().map(ev => (
                <button
                  key={ev.id}
                  type="button"
                  class={`chip${ev.id === event.id ? ' on' : ''}`}
                  onClick={() => selectEvent(ev.id)}
                >
                  {ev.name}
                </button>
              ))}
            </div>
            <NameForm placeholder="新しいイベント名" button="始める" onSubmit={startEvent} />
          </div>
        )}

        {(open === 'mine' || myDecks.length === 0) && (
          <div class="picker">
            {myDecks.length > 0 && (
              <div class="chips">
                {myDecks.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    class={`chip${d.id === myDeck?.id ? ' on' : ''}`}
                    onClick={() => selectMyDeck(d.id)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}
            <NameForm placeholder="自分のデッキ名を追加" button="追加" onSubmit={addMyDeck} />
          </div>
        )}

        <section class="field opp-field">
          <div class="label">相手のデッキ</div>
          <div class="opp-scroll">
            <div class="chips">
              {decks.map(d => (
                <button
                  key={d.id}
                  type="button"
                  class={`chip${d.pinned ? ' pinned' : ''}${d.id === opp ? ' on' : ''}`}
                  onClick={() => setOpp(d.id === opp ? null : d.id)}
                >
                  {d.name}
                </button>
              ))}
              <button type="button" class="chip add" onClick={() => setAddingOpp(!addingOpp)}>
                <Plus size={16} />
                追加
              </button>
            </div>
          </div>
          {addingOpp && <NameForm placeholder="相手のデッキ名" button="追加" onSubmit={addOpp} />}
        </section>
      </div>

      <div class="record-actions">
        <Segmented variant="choice" value={turn} options={TURN_OPTIONS} onChange={setTurn} />
        <Segmented variant="choice" value={result} options={RESULT_OPTIONS} onChange={setResult} />
        <button type="button" class="commit" disabled={missing.length > 0} onClick={commit}>
          <span class="commit-label">
            <Check size={22} />
            起票
          </span>
          {missing.length > 0 && <span class="commit-hint">{missing.join('・')}を選んでね</span>}
        </button>
      </div>

      {last && (
        <Toast key={last.id} ms={TOAST_MS} onClose={() => setLast(null)}>
          <div class="toast-body">
            <b>起票しました</b>
            <span>
              {RESULT[last.result]}・{TURN[last.turn]}・vs {deckName(data.decks, last.oppDeckId)}
            </span>
          </div>
          <button type="button" class="toast-undo" onClick={undo}>
            <Undo2 size={16} />
            取り消す
          </button>
        </Toast>
      )}
    </div>
  )
}
