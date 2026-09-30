'use client'

export interface FilterSegment<T extends string = string> {
  value: T
  label: string
}

interface SegmentedFilterProps<T extends string = string> {
  segments: FilterSegment<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * Segmented filter bar. Active segment: `text-text-primary bg-bg-overlay border-border-default`.
 * Inactive: `text-text-secondary`. Accent marker: none (background fill only).
 *
 * ```tsx
 * <SegmentedFilter
 *   segments={[{ value: 'all', label: 'All' }, { value: 'easy', label: 'Easy' }]}
 *   value={filter}
 *   onChange={setFilter}
 * />
 * ```
 */
export default function SegmentedFilter<T extends string = string>({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedFilterProps<T>) {
  return (
    <div
      className={`inline-flex items-center border border-border-default rounded-md overflow-hidden ${className}`}
      role="group"
      aria-label="Filter"
    >
      {segments.map((seg) => {
        const active = seg.value === value
        return (
          <button
            key={seg.value}
            onClick={() => onChange(seg.value)}
            aria-pressed={active}
            className={[
              'px-3 py-1 text-xs transition-colors duration-[80ms] border-r border-border-default last:border-r-0',
              active
                ? 'bg-bg-overlay text-text-primary font-medium'
                : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary',
            ].join(' ')}
          >
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}
