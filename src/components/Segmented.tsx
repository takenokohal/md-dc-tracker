import type { ComponentChildren } from 'preact'

interface Props<T extends string> {
  value: T | null
  options: [T, ComponentChildren][]
  onChange: (v: T) => void
  variant?: 'pill' | 'choice'
}

export function Segmented<T extends string>({ value, options, onChange, variant = 'pill' }: Props<T>) {
  const index = options.findIndex(([v]) => v === value)
  return (
    <div class={`seg ${variant}`} style={{ '--n': options.length, '--i': index }}>
      {variant === 'pill' && index >= 0 && <span class="seg-thumb" />}
      {options.map(([v, label]) => (
        <button key={v} type="button" class={v === value ? 'on' : undefined} data-v={v} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}
