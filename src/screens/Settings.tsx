import { Circle, CircleCheck, Ellipsis, Eye, EyeOff, LogOut, PencilLine, Trash2 } from 'lucide-preact'
import { useState } from 'preact/hooks'
import { backend } from '../backend'
import type { Session } from '../backend/types'
import { saveFile, stamp, toCsv } from '../backup'
import { NameForm } from '../components/NameForm'
import { SortableList } from '../components/SortableList'
import { newDeck, newId, parseBackup, sortDecks, type Update } from '../store'
import type { AppData, DcEvent, Deck } from '../types'

interface Props {
  data: AppData
  update: Update
  session: Session
}

export function SettingsScreen({ data, update, session }: Props) {
  return (
    <div class="settings">
      <EventSection data={data} update={update} />
      <DeckSection data={data} update={update} />
      <DataSection data={data} update={update} />
      {session.email && (
        <section class="card">
          <h2>アカウント</h2>
          <div class="list-row">
            <span class="list-name">{session.email}</span>
            <button type="button" class="btn sm" onClick={() => void backend.signOut()}>
              <LogOut size={14} />
              ログアウト
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function EventSection({ data, update }: { data: AppData; update: Update }) {
  const count = (id: string) => data.matches.filter(m => m.eventId === id).length
  const rename = (ev: DcEvent) => {
    const name = prompt('新しい名前', ev.name)?.trim()
    if (name) update(d => ({ ...d, events: d.events.map(x => (x.id === ev.id ? { ...x, name } : x)) }))
  }
  const remove = (ev: DcEvent) => {
    if (confirm(`「${ev.name}」を削除する？`)) update(d => ({ ...d, events: d.events.filter(x => x.id !== ev.id) }))
  }
  const start = (name: string) => {
    const ev: DcEvent = { id: newId(), name, createdAt: Date.now() }
    update(d => ({ ...d, events: [...d.events, ev], currentEventId: ev.id }))
  }

  return (
    <section class="card">
      <h2>イベント</h2>
      <p class="help">選んだイベントに起票される。DC ごとに作ると、統計もイベント単位で見られるよ</p>
      <ul class="list">
        {[...data.events].reverse().map(ev => {
          const current = ev.id === data.currentEventId
          const n = count(ev.id)
          return (
            <li key={ev.id} class="list-row">
              <button
                type="button"
                class={`radio-row${current ? ' on' : ''}`}
                onClick={() => update(d => ({ ...d, currentEventId: ev.id }))}
              >
                {current ? <CircleCheck size={22} class="radio" /> : <Circle size={22} class="radio" />}
                <span class="list-name">
                  {ev.name}
                  <small>{n}戦</small>
                </span>
                {current && <span class="badge-current">起票先</span>}
              </button>
              <div class="row-actions">
                <button type="button" class="btn sm" onClick={() => rename(ev)}>
                  <PencilLine size={14} />
                  名前変更
                </button>
                {!current && n === 0 && (
                  <button type="button" class="btn sm danger" onClick={() => remove(ev)}>
                    <Trash2 size={14} />
                    削除
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <NameForm placeholder="例: DC 1st（2026/12）" button="新しく始める" onSubmit={start} />
    </section>
  )
}

function DeckSection({ data, update }: { data: AppData; update: Update }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const decks = sortDecks(data.decks)
  const normal = decks.filter(d => !d.pinned)
  const pinned = decks.filter(d => d.pinned)
  const used = (id: string) => data.matches.some(m => m.myDeckId === id || m.oppDeckId === id)

  const set = (fn: (ds: Deck[]) => Deck[]) => update(d => ({ ...d, decks: sortDecks(fn(sortDecks(d.decks))) }))
  const patch = (id: string, p: Partial<Deck>) => set(ds => ds.map(x => (x.id === id ? { ...x, ...p } : x)))
  const moveTo = (from: number, to: number) =>
    set(ds => {
      const a = ds.filter(x => !x.pinned)
      const [moved] = a.splice(from, 1)
      a.splice(to, 0, moved)
      return [...a, ...ds.filter(x => x.pinned)]
    })
  const rename = (deck: Deck) => {
    const name = prompt('新しい名前', deck.name)?.trim()
    if (name) patch(deck.id, { name })
  }
  const remove = (deck: Deck) => {
    if (confirm(`「${deck.name}」を削除する？`)) set(ds => ds.filter(x => x.id !== deck.id))
  }
  const hideAll = () => {
    if (confirm('固定以外のデッキを全部隠す？（過去の記録はそのまま）'))
      set(ds => ds.map(x => (x.pinned ? x : { ...x, hidden: true })))
  }

  const actions = (deck: Deck) => (
    <div class="row-actions deck-actions">
      <button type="button" class="btn sm" onClick={() => rename(deck)}>
        <PencilLine size={14} />
        名前変更
      </button>
      <button type="button" class="btn sm" onClick={() => patch(deck.id, { hidden: !deck.hidden })}>
        {deck.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
        {deck.hidden ? '表示' : '隠す'}
      </button>
      {!deck.pinned && !used(deck.id) && (
        <button type="button" class="btn sm danger" onClick={() => remove(deck)}>
          <Trash2 size={14} />
          削除
        </button>
      )}
    </div>
  )
  const body = (deck: Deck) => (
    <>
      <span class="list-name">
        {deck.name}
        {deck.pinned && <small>固定・相手用</small>}
        {deck.hidden && <small>非表示</small>}
      </span>
      <button
        type="button"
        class={`btn sm more${openId === deck.id ? ' open' : ''}`}
        aria-label="操作を開く"
        onClick={() => setOpenId(openId === deck.id ? null : deck.id)}
      >
        <Ellipsis size={16} />
      </button>
      {openId === deck.id && actions(deck)}
    </>
  )

  return (
    <section class="card">
      <h2>デッキプリセット</h2>
      <p class="help">
        自分のデッキ・相手のデッキ共通の一覧。左の ⠿ をドラッグで並べ替え。次の DC では「固定以外を全部隠す」→
        新しい環境デッキを追加、が楽。隠しても過去の記録はそのまま残るよ
      </p>
      <SortableList
        items={normal}
        onMove={moveTo}
        rowClass={deck => (deck.hidden ? 'dim' : '')}
        render={(deck, handle) => (
          <>
            {handle}
            {body(deck)}
          </>
        )}
      />
      <ul class="list pinned-list">
        {pinned.map(deck => (
          <li key={deck.id} class={`list-row${deck.hidden ? ' dim' : ''}`}>
            <span class="handle-spacer" />
            {body(deck)}
          </li>
        ))}
      </ul>
      <NameForm placeholder="デッキ名" button="追加" onSubmit={n => set(ds => [...ds, newDeck(n)])} />
      <button type="button" class="btn sm bulk" onClick={hideAll}>
        <EyeOff size={14} />
        固定以外を全部隠す
      </button>
    </section>
  )
}

function DataSection({ data, update }: { data: AppData; update: Update }) {
  const exportJson = () => saveFile(`md-dc-tracker-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json')
  const exportCsv = () => saveFile(`md-dc-tracker-${stamp()}.csv`, toCsv(data), 'text/csv')
  const importJson = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      alert('JSON として読めなかった')
      return
    }
    const imported = parseBackup(parsed)
    if (!imported) {
      alert('このアプリのバックアップじゃないみたい')
      return
    }
    if (confirm(`${imported.matches.length}戦分のデータで、今のデータを置き換える？`)) update(() => imported)
  }

  return (
    <section class="card">
      <h2>データ</h2>
      <p class="help">{data.matches.length}戦を記録中。JSON はバックアップ用、CSV は表計算ソフト用</p>
      <div class="row-actions">
        <button type="button" class="btn" onClick={() => void exportJson()}>
          JSON 書き出し
        </button>
        <label class="btn file-btn">
          JSON 読み込み
          <input type="file" accept="application/json,.json" onChange={importJson} />
        </label>
        <button type="button" class="btn" onClick={() => void exportCsv()}>
          CSV 書き出し
        </button>
      </div>
    </section>
  )
}
