import { useId, useState } from 'preact/hooks'
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
  const maskId = useId()
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
        class={sel?.id === s.id ? 'on' : dim(s.id)}
        cx={50}
        cy={50}
        r={R}
        fill="none"
        stroke-width={WIDTH}
        style={{ stroke: s.color, strokeDasharray: `${dash} ${C - dash}`, strokeDashoffset: -offset }}
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
          {/* 表示したときに 12 時から時計回りに描く。選んだ区分が外に膨らんでも切れないよう幅に余裕を持たせる */}
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={100}>
            <circle
              class="donut-sweep"
              cx={50}
              cy={50}
              r={R}
              fill="none"
              stroke="#fff"
              stroke-width={WIDTH + 10}
            />
          </mask>
          <g transform="rotate(-90 50 50)" mask={`url(#${maskId})`}>
            {arcs}
          </g>
        </svg>
        <div class="donut-center" key={sel?.id}>
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
