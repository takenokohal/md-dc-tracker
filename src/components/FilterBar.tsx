import { ALL, type Filter } from '../stats'
import { sortDecks } from '../store'
import type { AppData } from '../types'
import { Segmented } from './Segmented'

interface Props {
  data: AppData
  filter: Filter
  setFilter: (f: Filter) => void
}

export function FilterBar({ data, filter, setFilter }: Props) {
  return (
    <div class="filters">
      <select value={filter.eventId} onChange={e => setFilter({ ...filter, eventId: e.currentTarget.value })}>
        {[...data.events].reverse().map(ev => (
          <option key={ev.id} value={ev.id}>
            {ev.name}
          </option>
        ))}
        <option value={ALL}>全イベント</option>
      </select>
      <select value={filter.myDeckId} onChange={e => setFilter({ ...filter, myDeckId: e.currentTarget.value })}>
        <option value={ALL}>全デッキ</option>
        {sortDecks(data.decks)
          .filter(d => !d.pinned)
          .map(d => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
      </select>
      <Segmented
        value={filter.period}
        options={[
          ['all', '全期間'],
          ['today', '今日'],
        ]}
        onChange={period => setFilter({ ...filter, period })}
      />
    </div>
  )
}
