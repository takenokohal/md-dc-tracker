import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

// style.css の .hold.holding の transition と揃える
const HOLD_MS = 700

interface Props {
  icon: ComponentChildren
  label: string
  onHold: () => void
}

export function HoldButton({ icon, label, onHold }: Props) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const start = (e: PointerEvent) => {
    e.preventDefault()
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      onHold()
    }, HOLD_MS)
  }
  const cancel = () => {
    clearTimeout(timer.current)
    setHolding(false)
  }

  return (
    <button
      type="button"
      class={`hold${holding ? ' holding' : ''}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={e => e.preventDefault()}
    >
      <span class="hold-fill" />
      <span class="hold-icon">{icon}</span>
      <span class="hold-text">
        <span class="hold-label">{label}</span>
        <span class="hold-sub">長押しで切替</span>
      </span>
    </button>
  )
}
