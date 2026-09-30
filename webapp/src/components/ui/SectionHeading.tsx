import type { ReactNode } from 'react'

interface SectionHeadingProps {
  children: ReactNode
  /** Optional trailing meta/count */
  meta?: ReactNode
  className?: string
}

/**
 * h2-level section heading.
 *
 * ```tsx
 * <SectionHeading>Topics</SectionHeading>
 * <SectionHeading meta="18 terms">Glossary</SectionHeading>
 * ```
 *
 * Classes: `text-md font-semibold text-text-primary leading-[1.2] tracking-tight`
 */
export default function SectionHeading({ children, meta, className = '' }: SectionHeadingProps) {
  return (
    <h2
      className={`flex items-baseline gap-3 text-md font-semibold text-text-primary leading-none tracking-tight ${className}`}
    >
      {children}
      {meta && <span className="text-sm font-normal text-text-secondary font-mono">{meta}</span>}
    </h2>
  )
}
