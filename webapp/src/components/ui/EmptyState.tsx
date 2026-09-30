interface EmptyStateProps {
  /** Monospace message, lowercase. E.g. "no results — try a different filter" */
  message?: string
  /** Optional: action to clear filters */
  onClear?: () => void
  clearLabel?: string
  className?: string
}

/**
 * Empty state for list views and search results.
 *
 * ```tsx
 * <EmptyState
 *   message="no questions match this filter"
 *   onClear={() => setFilter('all')}
 * />
 * ```
 *
 * Monospace label `text-sm text-text-secondary`. No illustration, no icon.
 */
export default function EmptyState({
  message = 'no results — try a different filter',
  onClear,
  clearLabel = 'clear filters',
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`py-12 flex flex-col items-center gap-3 ${className}`}>
      <p className="font-mono text-sm text-text-secondary">{message}</p>
      {onClear && (
        <button
          onClick={onClear}
          className="font-mono text-xs text-accent hover:underline transition-colors"
        >
          {clearLabel}
        </button>
      )}
    </div>
  )
}
