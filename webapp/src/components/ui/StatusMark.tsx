type MasteryState = 'new' | 'attempted' | 'mastered'
type VideoState = 'not_started' | 'partial' | 'completed'

export type StatusState = MasteryState | VideoState

interface StatusMarkProps {
  state: StatusState
  /** Show the text label alongside the dot. Defaults to true. */
  showLabel?: boolean
  className?: string
}

const CONFIG: Record<StatusState, { color: string; label: string }> = {
  new:         { color: 'var(--color-status-new)',     label: 'new' },
  attempted:   { color: 'var(--color-status-partial)', label: 'attempted' },
  mastered:    { color: 'var(--color-status-done)',    label: 'mastered' },
  not_started: { color: 'var(--color-status-new)',     label: 'not started' },
  partial:     { color: 'var(--color-status-partial)', label: 'in progress' },
  completed:   { color: 'var(--color-status-done)',    label: 'completed' },
}

/**
 * One-status-dot-per-item. A 6×6px SVG circle + optional text label.
 *
 * ```tsx
 * <StatusMark state="mastered" />
 * <StatusMark state="attempted" showLabel={false} />
 * ```
 *
 * Dot: inline SVG 6×6px circle in the semantic status color.
 * Label: `text-xs text-text-secondary`
 */
export default function StatusMark({ state, showLabel = true, className = '' }: StatusMarkProps) {
  const { color, label } = CONFIG[state]
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg
        width="6"
        height="6"
        viewBox="0 0 6 6"
        aria-hidden="true"
        role="presentation"
        className="shrink-0"
      >
        <circle cx="3" cy="3" r="3" fill={color} />
      </svg>
      {showLabel && (
        <span className="text-xs text-text-secondary">{label}</span>
      )}
    </span>
  )
}
