import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './style.css'

// ホーム画面のアプリはバックグラウンドから戻っても読み込み直さないので、戻ってきたときに新しい版を確認する。
// 見つかれば autoUpdate が入れ替えて再読み込みする。オフラインで確認できないときは次に戻ってきたときでいい
registerSW({
  onRegisteredSW(_url, r) {
    if (!r) return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') r.update().catch(() => {})
    })
  },
})

render(<App />, document.getElementById('app')!)
