interface ProgressBarProps {
  /** 0–1 fraction */
  value: number
  /** Accessible label */
  label?: string
  className?: string
}

/**
 * 2px progress bar. Track: `bg-bg-overlay`. Fill: `bg-status-done`.
 *
 * ```tsx
 * <ProgressBar value={0.65} label="Mastery progress" />
 * ```
 *
 * Height: 2px. Radius: 2px (`rounded-sm`). Overflow hidden.
 */
export default function ProgressBar({ value, label = 'Progress', className = '' }: ProgressBarProps) {
  const pct = Math.min(1, Math.max(0, value)) * 100

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-0.5 w-full bg-bg-overlay rounded-sm overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-status-done rounded-sm"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
