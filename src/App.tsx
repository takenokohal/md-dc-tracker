import { useEffect, useState } from 'preact/hooks'
import { backend } from './backend'
import type { Session } from './backend/types'
import { isIOS, isStandalone } from './format'
import { Login } from './screens/Login'
import { RecordScreen } from './screens/Record'
import { StatsMode } from './screens/StatsMode'
import { useAppData } from './store'

type Mode = 'record' | 'stats'

const MODE_KEY = 'md-dc-tracker:mode'

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => backend.onSession(setSession), [])

  if (session === undefined) return <p class="loading">読み込み中…</p>
  if (!session)
    return (
      <main class="content">
        <InstallHint />
        <Login />
      </main>
    )
  return <Main session={session} />
}

function InstallHint() {
  if (!isIOS() || isStandalone()) return null
  return <div class="banner">共有メニューから「ホーム画面に追加」すると、アプリみたいに全画面で使えるよ</div>
}

function Main({ session }: { session: Session }) {
  const [data, update] = useAppData(session.uid)
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem(MODE_KEY) === 'stats' ? 'stats' : 'record'))

  const switchTo = (m: Mode) => {
    localStorage.setItem(MODE_KEY, m)
    setMode(m)
  }

  if (!data) return <p class="loading">読み込み中…</p>
  if (mode === 'record')
    return (
      <main class="content record-mode">
        <RecordScreen data={data} update={update} onSwitch={() => switchTo('stats')} />
      </main>
    )
  return (
    <>
      <InstallHint />
      <StatsMode data={data} update={update} session={session} onSwitch={() => switchTo('record')} />
    </>
  )
}
