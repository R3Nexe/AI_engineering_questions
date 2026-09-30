import type { ReactNode } from 'react'

interface KbdProps {
  children: ReactNode
  className?: string
}

/**
 * Keyboard hint chip.
 *
 * ```tsx
 * <Kbd>j</Kbd>
 * <Kbd>/</Kbd>
 * <Kbd>Space</Kbd>
 * ```
 *
 * Classes: `font-mono text-xs bg-bg-overlay border border-border-default rounded-md px-1.5 py-0.5 text-text-secondary`
 */
export default function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd
      className={[
        'inline-flex items-center justify-center',
        'font-mono text-xs',
        'bg-bg-overlay border border-border-default rounded-md',
        'px-1.5 py-0.5',
        'text-text-secondary',
        'leading-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </kbd>
  )
}
