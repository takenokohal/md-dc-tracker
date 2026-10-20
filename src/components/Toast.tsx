import type { ComponentChildren } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { reduceMotion } from '../motion'

// 指がこれだけ動いたらタップではなくスワイプとみなす
const SLOP_PX = 6
// 上にこれだけ引くか、素早く払えば閉じる
const DISMISS_PX = 32
const FLICK_PX = 10
const FLICK_MS = 250

interface Props {
  ms: number
  onClose: () => void
  children: ComponentChildren
}

export function Toast({ ms, onClose, children }: Props) {
  const [dy, setDy] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const drag = useRef<{ y: number; at: number; swiping: boolean } | null>(null)

  const down = (e: PointerEvent) => {
    drag.current = { y: e.clientY, at: e.timeStamp, swiping: false }
  }
  const move = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const delta = e.clientY - d.y
    // ボタンのタップを潰さないよう、動き出してから指を捕まえる
    if (!d.swiping && Math.abs(delta) > SLOP_PX) {
      d.swiping = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (d.swiping) setDy(Math.min(delta, 0))
  }
  const up = (e: PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d?.swiping) return
    const flick = dy < -FLICK_PX && e.timeStamp - d.at < FLICK_MS
    if (dy > -DISMISS_PX && !flick) return setDy(0)
    if (reduceMotion()) return onClose()
    setLeaving(true)
  }

  return (
    <div
      class={`toast${dy && !leaving ? ' dragging' : ''}${leaving ? ' leaving' : ''}`}
      style={leaving ? undefined : { transform: dy ? `translateY(${dy}px)` : undefined, opacity: 1 + dy / 160 }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onTransitionEnd={e => leaving && e.target === e.currentTarget && e.propertyName === 'transform' && onClose()}
    >
      {children}
      <div class="toast-timer" style={{ animationDuration: `${ms}ms` }} />
    </div>
  )
}
