import { flushSync } from 'preact/compat'
import { useEffect, useRef, useState } from 'preact/hooks'

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// 画面全体を横スライドで切り替える（向きは style.css の :root[data-slide]）。非対応ブラウザや動きを減らす設定では即切り替え
export function slideTo(dir: 'forward' | 'back', update: () => void) {
  if (!document.startViewTransition || reduceMotion()) return update()
  document.documentElement.dataset.slide = dir
  document.startViewTransition(() => flushSync(update))
}

// 数値を前の値から（初回は 0 から）なめらかに目標値へ動かす
export function useTween(target: number, ms = 700) {
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0))
  const current = useRef(value)

  useEffect(() => {
    const from = current.current
    if (from === target || reduceMotion()) {
      current.current = target
      setValue(target)
      return
    }
    const start = performance.now()
    let raf = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - start) / ms, 1)
      current.current = from + (target - from) * (1 - (1 - p) ** 3)
      setValue(current.current)
      if (p < 1) raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [target, ms])

  return value
}
