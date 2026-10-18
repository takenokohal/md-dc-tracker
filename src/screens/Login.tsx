import { useState } from 'preact/hooks'
import { backend } from '../backend'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: Event) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await backend.signIn(email, password)
    } catch {
      setError('ログインできなかった。メールアドレスとパスワードを確認してね')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form class="card login" onSubmit={submit}>
      <h1>MD 戦績トラッカー</h1>
      <input
        type="email"
        autocomplete="username"
        placeholder="メールアドレス"
        value={email}
        onInput={e => setEmail(e.currentTarget.value)}
        required
      />
      <input
        type="password"
        autocomplete="current-password"
        placeholder="パスワード"
        value={password}
        onInput={e => setPassword(e.currentTarget.value)}
        required
      />
      <button type="submit" class="btn primary" disabled={busy}>
        ログイン
      </button>
      {error && <p class="error">{error}</p>}
    </form>
  )
}
