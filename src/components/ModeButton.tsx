import type { ComponentChildren } from 'preact'

interface Props {
  icon: ComponentChildren
  label: string
  onClick: () => void
}

export function ModeButton({ icon, label, onClick }: Props) {
  return (
    <button type="button" class="mode-btn" onClick={onClick}>
      <span class="mode-btn-icon">{icon}</span>
      {label}
    </button>
  )
}
