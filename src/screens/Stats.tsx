import { DonutChart } from '../components/DonutChart'
import { FilterBar } from '../components/FilterBar'
import { deckName, pct, wl } from '../format'
import { distribution, filterMatches, groupBy, OTHERS, split, type Filter, type GroupRow, type Tally } from '../stats'
import type { AppData, Deck, Turn } from '../types'

interface Props {
  data: AppData
  filter: Filter
  setFilter: (f: Filter) => void
}

export function StatsScreen({ data, filter, setFilter }: Props) {
  const ms = filterMatches(data.matches, filter)
  const s = split(ms)
  const opp = groupBy(ms, 'oppDeckId')
  const mine = groupBy(ms, 'myDeckId')
  const dist = distribution(opp).map((d, i) => ({
    ...d,
    label: d.id === OTHERS ? 'その他' : deckName(data.decks, d.id),
    color: d.id === OTHERS ? 'var(--series-other)' : `var(--series-${i + 1})`,
  }))

  return (
    <div>
      <FilterBar data={data} filter={filter} setFilter={setFilter} />
      {ms.length === 0 ? (
        <p class="empty">この条件の記録はまだないよ</p>
      ) : (
        <div class="stats-grid">
          <section class="card summary">
            <div class="big-rate">{pct(s.all.rate)}</div>
            <div class="sub">
              {s.all.games}戦 {wl(s.all)}
            </div>
            <div class="turn-grid">
              <Cell label="先攻" t={s.first} kind="first" />
              <Cell label="後攻" t={s.second} kind="second" />
              <div class="cell">
                <div class="cell-label">先攻率</div>
                <div class="cell-value">{pct(s.first.games / s.all.games)}</div>
                <div class="cell-sub">
                  {s.first.games}/{s.all.games}
                </div>
              </div>
            </div>
          </section>
          <section class="card">
            <h2>相手デッキの分布</h2>
            <DonutChart slices={dist} label="相手デッキの分布" caption={`${opp.length}デッキ`} />
          </section>
          <GroupSection title="相手デッキ別" rows={opp} decks={data.decks} shareLabel="遭遇率" class="opp" />
          {mine.length > 1 && <GroupSection title="自分デッキ別" rows={mine} decks={data.decks} shareLabel="使用率" />}
        </div>
      )}
    </div>
  )
}

function Cell({ label, t, kind }: { label: string; t: Tally; kind: Turn }) {
  return (
    <div class={`cell ${kind}`}>
      <div class="cell-label">{label}</div>
      <div class="cell-value">{pct(t.rate)}</div>
      <div class="cell-sub">{wl(t)}</div>
    </div>
  )
}

const wlShort = (t: Tally) => `${t.wins}-${t.losses}`

interface GroupSectionProps {
  title: string
  rows: GroupRow[]
  decks: Deck[]
  shareLabel: string
  class?: string
}

function GroupSection({ title, rows, decks, shareLabel, class: cls }: GroupSectionProps) {
  return (
    <section class={cls ? `card ${cls}` : 'card'}>
      <h2>{title}</h2>
      {rows.map(r => (
        <div class="group-row" key={r.id}>
          <div class="group-head">
            <span class="group-name">{deckName(decks, r.id)}</span>
            <span class="group-games">
              {r.all.games}戦・{shareLabel} {pct(r.share)}
            </span>
          </div>
          <div class="bar">
            <div class="bar-fill" style={{ width: `${(r.all.rate ?? 0) * 100}%` }} />
          </div>
          <div class="group-stats">
            <span>
              勝率 <b>{pct(r.all.rate)}</b> ({wlShort(r.all)})
            </span>
            <span>
              先 {pct(r.first.rate)} ({wlShort(r.first)})
            </span>
            <span>
              後 {pct(r.second.rate)} ({wlShort(r.second)})
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
