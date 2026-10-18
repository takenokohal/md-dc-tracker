import { Check, Pencil, Trash2 } from 'lucide-preact'
import { useState } from 'preact/hooks'
import { FilterBar } from '../components/FilterBar'
import { Segmented } from '../components/Segmented'
import { deckName, fmtDate, fmtTime, RESULT_OPTIONS, TURN_OPTIONS } from '../format'
import { ALL, filterMatches, type Filter } from '../stats'
import { sortDecks, type Update } from '../store'
import type { AppData, Match } from '../types'

interface Props {
  data: AppData
  update: Update
  filter: Filter
  setFilter: (f: Filter) => void
}

export function HistoryScreen({ data, update, filter, setFilter }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const ms = filterMatches(data.matches, filter).sort((a, b) => b.at - a.at)
  const showMyDeck = filter.myDeckId === ALL && data.decks.filter(d => !d.pinned).length > 1

  const days: [string, Match[]][] = []
  for (const m of ms) {
    const key = fmtDate(m.at)
    const last = days[days.length - 1]
    if (last?.[0] === key) last[1].push(m)
    else days.push([key, [m]])
  }

  const toggleEdit = () => {
    setEditMode(!editMode)
    setEditing(null)
  }

  const rowContent = (m: Match) => (
    <>
      <span class="time">{fmtTime(m.at)}</span>
      <span class={`badge ${m.turn}`}>{m.turn === 'first' ? '先' : '後'}</span>
      <span class="vs">
        <span class="vs-main">vs {deckName(data.decks, m.oppDeckId)}</span>
        {(showMyDeck || m.note) && (
          <span class="vs-sub">
            {showMyDeck && deckName(data.decks, m.myDeckId)}
            {showMyDeck && m.note && '・'}
            {m.note}
          </span>
        )}
      </span>
      <span class={`res ${m.result}`}>{m.result === 'win' ? '勝' : '負'}</span>
    </>
  )

  return (
    <div>
      <FilterBar data={data} filter={filter} setFilter={setFilter} />
      <div class="history-tools">
        <span class="count">{ms.length}戦</span>
        <button type="button" class={`btn sm${editMode ? ' primary' : ''}`} onClick={toggleEdit}>
          {editMode ? <Check size={16} /> : <Pencil size={16} />}
          {editMode ? '完了' : '編集する'}
        </button>
      </div>
      {ms.length === 0 && <p class="empty">この条件の記録はまだないよ</p>}
      {days.map(([day, list]) => (
        <section key={day}>
          <h3 class="date-head">
            {day}　{list.filter(m => m.result === 'win').length}勝{list.filter(m => m.result === 'lose').length}敗
          </h3>
          <ul class="history">
            {list.map(m => (
              <li key={m.id}>
                {editMode ? (
                  <button type="button" class="hist-row editable" onClick={() => setEditing(editing === m.id ? null : m.id)}>
                    {rowContent(m)}
                    <Pencil size={16} class="edit-mark" />
                  </button>
                ) : (
                  <div class="hist-row">{rowContent(m)}</div>
                )}
                {editMode && editing === m.id && (
                  <MatchEditor match={m} data={data} update={update} close={() => setEditing(null)} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function MatchEditor({ match, data, update, close }: { match: Match; data: AppData; update: Update; close: () => void }) {
  const [m, setM] = useState(match)
  const decks = sortDecks(data.decks)

  const save = () => {
    const note = m.note?.trim()
    const next = { ...m, note: note || undefined }
    update(d => ({ ...d, matches: d.matches.map(x => (x.id === m.id ? next : x)) }))
    close()
  }
  const remove = () => {
    if (!confirm('この記録を削除する？')) return
    update(d => ({ ...d, matches: d.matches.filter(x => x.id !== m.id) }))
    close()
  }

  return (
    <div class="editor">
      <label>
        自分のデッキ
        <select value={m.myDeckId} onChange={e => setM({ ...m, myDeckId: e.currentTarget.value })}>
          {decks
            .filter(d => !d.pinned)
            .map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        相手のデッキ
        <select value={m.oppDeckId} onChange={e => setM({ ...m, oppDeckId: e.currentTarget.value })}>
          {decks.map(d => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        イベント
        <select value={m.eventId} onChange={e => setM({ ...m, eventId: e.currentTarget.value })}>
          {data.events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </label>
      <Segmented variant="choice" value={m.turn} options={TURN_OPTIONS} onChange={turn => setM({ ...m, turn })} />
      <Segmented variant="choice" value={m.result} options={RESULT_OPTIONS} onChange={result => setM({ ...m, result })} />
      <input value={m.note ?? ''} onInput={e => setM({ ...m, note: e.currentTarget.value })} placeholder="メモ" />
      <div class="editor-actions">
        <button type="button" class="btn danger" onClick={remove}>
          <Trash2 size={16} />
          削除
        </button>
        <button type="button" class="btn" onClick={close}>
          閉じる
        </button>
        <button type="button" class="btn primary" onClick={save}>
          <Check size={16} />
          保存
        </button>
      </div>
    </div>
  )
}
