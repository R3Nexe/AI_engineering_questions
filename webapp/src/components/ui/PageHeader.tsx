import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** The page h1. */
  title: string
  /** Optional breadcrumbs above title */
  breadcrumb?: ReactNode
  /** Optional secondary inline metadata: counts, dates, etc. */
  meta?: ReactNode
  /** Optional multiline description or summary below the title */
  description?: ReactNode
  /** Optional action buttons aligned to the right. */
  actions?: ReactNode
  className?: string
}

/**
 * Standard page header with h1 + optional breadcrumb, meta, description, actions, and separator.
 */
export default function PageHeader({
  title,
  breadcrumb,
  meta,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={`shrink-0 min-h-14 px-6 py-3 flex items-start justify-between gap-4 border-b border-border-faint bg-bg-base ${className}`}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {breadcrumb && (
          <div className="text-xs text-text-secondary font-mono mb-0.5">
            {breadcrumb}
          </div>
        )}
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight leading-snug">
            {title}
          </h1>
          {meta && (
            <div className="text-xs text-text-secondary font-mono">
              {meta}
            </div>
          )}
        </div>
        {description && (
          <div className="text-sm text-text-secondary leading-relaxed max-w-[75ch] mt-1">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-0.5">{actions}</div>
      )}
    </header>
  )
}
