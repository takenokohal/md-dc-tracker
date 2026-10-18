import type { ComponentChildren } from 'preact'
import { GripVertical } from 'lucide-preact'
import { useRef, useState } from 'preact/hooks'

interface Props<T extends { id: string }> {
  items: T[]
  onMove: (from: number, to: number) => void
  render: (item: T, handle: ComponentChildren) => ComponentChildren
  rowClass?: (item: T) => string
}

interface Drag {
  from: number
  to: number
  dy: number
  startY: number
  mids: number[]
  shift: number
}

// ハンドル（⠿）を押したまま上下に動かして並べ替える。タッチとマウスの両方で動く
export function SortableList<T extends { id: string }>({ items, onMove, render, rowClass }: Props<T>) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const rows = useRef<(HTMLLIElement | null)[]>([])

  const down = (i: number) => (e: PointerEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const rects = items.map((_, j) => rows.current[j]!.getBoundingClientRect())
    setDrag({ from: i, to: i, dy: 0, startY: e.clientY, mids: rects.map(r => r.top + r.height / 2), shift: rects[i].height })
  }

  const move = (e: PointerEvent) => {
    if (!drag) return
    const dy = e.clientY - drag.startY
    const center = drag.mids[drag.from] + dy
    let to = drag.from
    for (let j = drag.from + 1; j < drag.mids.length; j++) if (center > drag.mids[j]) to = j
    for (let j = drag.from - 1; j >= 0; j--) if (center < drag.mids[j]) to = j
    setDrag({ ...drag, dy, to })
  }

  const up = () => {
    if (!drag) return
    if (drag.to !== drag.from) onMove(drag.from, drag.to)
    setDrag(null)
  }

  const offset = (i: number) => {
    if (!drag) return 0
    if (i === drag.from) return drag.dy
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -drag.shift
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return drag.shift
    return 0
  }

  return (
    <ul class={`list sortable${drag ? ' dragging' : ''}`}>
      {items.map((item, i) => (
        <li
          key={item.id}
          ref={el => {
            rows.current[i] = el
          }}
          class={`list-row${drag?.from === i ? ' lifted' : ''}${rowClass ? ` ${rowClass(item)}` : ''}`}
          style={{ transform: `translateY(${offset(i)}px)` }}
        >
          {render(
            item,
            <span
              class="handle"
              aria-label="ドラッグで並べ替え"
              onPointerDown={down(i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
            >
              <GripVertical size={20} />
            </span>,
          )}
        </li>
      ))}
    </ul>
  )
}
