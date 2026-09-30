import type { Difficulty } from '@/types'

interface DifficultyMarkProps {
  difficulty: Difficulty
  /** Show the text label alongside the dot. Defaults to true. */
  showLabel?: boolean
  className?: string
}

const CONFIG: Record<Difficulty, { color: string; label: string }> = {
  easy:   { color: 'var(--color-diff-easy)',   label: 'easy' },
  medium: { color: 'var(--color-diff-medium)', label: 'medium' },
  hard:   { color: 'var(--color-diff-hard)',   label: 'hard' },
}

/**
 * Difficulty indicator: 6×6px SVG dot + optional text label.
 *
 * ```tsx
 * <DifficultyMark difficulty="hard" />
 * <DifficultyMark difficulty="easy" showLabel={false} />
 * ```
 *
 * Dot: inline SVG circle in the semantic difficulty color.
 * Label: `text-xs text-text-secondary`
 */
export default function DifficultyMark({ difficulty, showLabel = true, className = '' }: DifficultyMarkProps) {
  const { color, label } = CONFIG[difficulty]
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
