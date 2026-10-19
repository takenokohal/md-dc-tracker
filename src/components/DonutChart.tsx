import { useState } from 'preact/hooks'
import { pct } from '../format'

export interface DonutSlice {
  id: string
  label: string
  games: number
  share: number
  color: string
}

interface Props {
  slices: DonutSlice[]
  label: string
  caption: string
}

// viewBox 100 の中での寸法。GAP は区分の間をカード背景で空ける幅（描画サイズで約 2px）
const R = 40
const WIDTH = 18
const C = 2 * Math.PI * R
const GAP = 1.8

export function DonutChart({ slices, label, caption }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const sel = slices.find(s => s.id === selected)
  const total = slices.reduce((n, s) => n + s.games, 0)
  const gap = slices.length > 1 ? GAP : 0
  const toggle = (id: string) => setSelected(sel?.id === id ? null : id)
  const dim = (id: string) => (sel && sel.id !== id ? ' dim' : '')

  let offset = 0
  const arcs = slices.map(s => {
    const len = s.share * C
    const dash = Math.max(len - gap, 0)
    const arc = (
      <circle
        key={s.id}
        class={dim(s.id)}
        cx={50}
        cy={50}
        r={R}
        fill="none"
        stroke-width={WIDTH}
        stroke-dasharray={`${dash} ${C - dash}`}
        stroke-dashoffset={-offset}
        style={{ stroke: s.color }}
        onClick={() => toggle(s.id)}
      />
    )
    offset += len
    return arc
  })

  return (
    <div class="donut">
      <div class="donut-figure">
        <svg viewBox="0 0 100 100" role="img" aria-label={label}>
          <g transform="rotate(-90 50 50)">{arcs}</g>
        </svg>
        <div class="donut-center">
          <b>{sel ? pct(sel.share) : `${total}戦`}</b>
          <span>{sel ? sel.label : caption}</span>
        </div>
      </div>
      <ul class="legend">
        {slices.map(s => (
          <li key={s.id}>
            <button
              type="button"
              class={`legend-row${sel?.id === s.id ? ' on' : ''}${dim(s.id)}`}
              onClick={() => toggle(s.id)}
            >
              <span class="swatch" style={{ background: s.color }} />
              <span class="legend-name">{s.label}</span>
              <span class="legend-value">{pct(s.share)}</span>
              <span class="legend-games">{s.games}戦</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
