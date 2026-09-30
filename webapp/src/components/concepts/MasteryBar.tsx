'use client'

import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  mastered: number
  total: number
  /** extra className for the outer wrapper */
  className?: string
  /** Show fraction label next to bar. Defaults to true. */
  showFraction?: boolean
}

export default function MasteryBar({ mastered, total, className = '', showFraction = true }: Props) {
  const value = total > 0 ? mastered / total : 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ProgressBar value={value} label={`${mastered} of ${total} mastered`} className="flex-1" />
      {showFraction && (
        <span className="font-mono text-xs text-text-dim shrink-0 tabular-nums">
          {mastered}/{total}
        </span>
      )}
    </div>
  )
}
