import { useState } from 'preact/hooks'

interface Props {
  placeholder: string
  button: string
  onSubmit: (name: string) => void
}

export function NameForm({ placeholder, button, onSubmit }: Props) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  return (
    <form
      class="name-form"
      onSubmit={e => {
        e.preventDefault()
        if (!trimmed) return
        onSubmit(trimmed)
        setName('')
      }}
    >
      <input value={name} onInput={e => setName(e.currentTarget.value)} placeholder={placeholder} />
      <button type="submit" class="btn" disabled={!trimmed}>
        {button}
      </button>
    </form>
  )
}
