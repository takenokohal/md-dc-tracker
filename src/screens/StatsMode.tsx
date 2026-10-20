import type { ComponentChildren } from 'preact'
import { ChartColumn, History, NotebookPen, Settings } from 'lucide-preact'
import { useEffect, useState } from 'preact/hooks'
import type { Session } from '../backend/types'
import { ModeButton } from '../components/ModeButton'
import { Segmented } from '../components/Segmented'
import { ALL, type Filter } from '../stats'
import type { Update } from '../store'
import type { AppData } from '../types'
import { HistoryScreen } from './History'
import { SettingsScreen } from './Settings'
import { StatsScreen } from './Stats'

type Tab = 'stats' | 'history' | 'settings'

const TABS: [Tab, ComponentChildren][] = [
  [
    'stats',
    <>
      <ChartColumn size={16} />
      統計
    </>,
  ],
  [
    'history',
    <>
      <History size={16} />
      履歴
    </>,
  ],
  [
    'settings',
    <>
      <Settings size={16} />
      設定
    </>,
  ],
]

interface Props {
  data: AppData
  update: Update
  session: Session
  onSwitch: () => void
}

const tabIndex = (t: Tab) => TABS.findIndex(([v]) => v === t)

export function StatsMode({ data, update, session, onSwitch }: Props) {
  const [tab, setTab] = useState<Tab>('stats')
  // タブ切り替えで中身が入ってくる向き。最初の表示は動かさない
  const [from, setFrom] = useState<'left' | 'right' | null>(null)
  const [filter, setFilter] = useState<Filter>({ eventId: data.currentEventId, myDeckId: ALL, period: 'all' })

  useEffect(() => setFilter(f => ({ ...f, eventId: data.currentEventId })), [data.currentEventId])

  const changeTab = (t: Tab) => {
    if (t === tab) return
    setFrom(tabIndex(t) > tabIndex(tab) ? 'right' : 'left')
    setTab(t)
  }

  return (
    <>
      <header class="mode-header">
        <div class="mode-header-inner">
          <Segmented value={tab} options={TABS} onChange={changeTab} />
          <ModeButton icon={<NotebookPen size={20} />} label="起票モードへ" onClick={onSwitch} />
        </div>
      </header>
      <main class="content">
        <div key={tab} class={from ? `tab-pane from-${from}` : 'tab-pane'}>
          {tab === 'stats' && <StatsScreen data={data} filter={filter} setFilter={setFilter} />}
          {tab === 'history' && <HistoryScreen data={data} update={update} filter={filter} setFilter={setFilter} />}
          {tab === 'settings' && <SettingsScreen data={data} update={update} session={session} />}
        </div>
      </main>
    </>
  )
}
