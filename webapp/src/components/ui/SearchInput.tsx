'use client'

import { useRef, useEffect } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Aria label for the input. */
  label?: string
  /** Whether to bind the global "/" key to focus this input. */
  globalSlash?: boolean
  className?: string
}

/**
 * Full-width search input with "/" shortcut hint.
 *
 * ```tsx
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="filter questions…"
 *   globalSlash
 * />
 * ```
 *
 * Classes: `bg-bg-overlay border border-border-default rounded-md` h-9,
 * placeholder `text-text-dim`, magnifier icon at left, "/" hint or × at right.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'type to filter…',
  label = 'Search',
  globalSlash = false,
  className = '',
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!globalSlash) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.key === '/') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [globalSlash])

  return (
    <div className={`relative ${className}`}>
      {/* Magnifier */}
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </span>

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full h-9 bg-bg-overlay border border-border-default rounded-md pl-8 pr-8 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors duration-[80ms]"
      />

      {/* Right side: × when value, / hint when empty */}
      {value ? (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-secondary transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
          /
        </kbd>
      )}
    </div>
  )
}
