'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Markdown } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { GlossaryTerm, ChapterIndex } from '@/types'

interface Props {
  term: GlossaryTerm
  /** Lookup map: termId → display term string (for related chips labels) */
  termById: Record<string, string>
  highlighted: boolean
  onRelatedClick: (id: string) => void
  /** Opens the detail dialog for this term. */
  onOpen: (id: string) => void
  /** Chapter index for resolving chapter titles; omit if not loaded */
  chaptersIndex?: ChapterIndex | null
}

export default function TermCard({ term, termById, highlighted, onRelatedClick, onOpen, chaptersIndex }: Props) {
  return (
    <Card
      id={term.id}
      className={cn(
        'relative w-full h-full flex flex-col justify-between transition-colors bg-bg-base border-border-default hover:border-border-strong',
        highlighted && 'border-accent bg-accent-subtle',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-0">
        <div>
          {/* The ::after layer stretches this button over the whole card.
              Links and chips below sit at z-10 so they stay clickable. */}
          <button
            type="button"
            onClick={() => onOpen(term.id)}
            aria-haspopup="dialog"
            className="text-left cursor-pointer outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-accent focus-visible:after:rounded-[inherit]"
          >
            <CardTitle className="text-md font-semibold text-text-primary">
              {term.term}
            </CardTitle>
          </button>
          {term.aliases && term.aliases.length > 0 && (
            <p className="mt-1 text-sm text-text-secondary italic">
              {term.aliases.join(' · ')}
            </p>
          )}
        </div>

        {term.concepts.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-1">
            {term.concepts.map((cid) => (
              <Link
                key={cid}
                href={`/concepts/${cid}`}
                className="rounded-sm px-1.5 py-0.5 text-xs font-mono bg-bg-overlay text-text-secondary hover:text-text-primary transition-colors"
              >
                {cid}
              </Link>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 mt-3 space-y-3 flex-1">
        <div className="text-sm text-text-primary leading-relaxed">
          <Markdown content={term.definition} />
        </div>

        {term.example && (
          <div className="rounded-md bg-bg-overlay p-3">
            <div className="text-xs font-mono text-text-secondary mb-1">example:</div>
            <div className="text-sm text-text-secondary leading-relaxed">
              <Markdown content={term.example} />
            </div>
          </div>
        )}
      </CardContent>

      {term.related.length > 0 && (
        <CardFooter className="relative z-10 p-0 mt-3 flex flex-wrap items-center gap-1.5 border-t-0">
          <span className="text-xs uppercase tracking-wider text-text-dim mr-0.5 font-mono">Related:</span>
          {term.related.map((rid) => (
            <button
              key={rid}
              onClick={() => onRelatedClick(rid)}
              className="rounded-md px-2 py-0.5 text-xs font-mono bg-bg-raised text-text-secondary hover:bg-bg-overlay hover:text-text-primary transition-colors cursor-pointer border border-border-faint"
            >
              {termById[rid] ?? rid}
            </button>
          ))}
        </CardFooter>
      )}

      {term.chapters && term.chapters.length > 0 && (
        <CardFooter className="relative z-10 p-0 mt-2 flex flex-wrap items-center gap-1.5 border-t-0">
          <span className="text-xs uppercase tracking-wider text-text-dim mr-0.5 font-mono">Read:</span>
          {term.chapters.map((slug) => {
            const ch = chaptersIndex?.chapters.find((c) => c.slug === slug)
            const label = ch ? `Ch ${String(ch.number).padStart(2, '0')} · ${ch.title}` : slug
            return (
              <Link
                key={slug}
                href={`/chapters/${slug}`}
                className="rounded-md px-2 py-0.5 text-xs font-mono bg-bg-raised text-text-secondary hover:bg-bg-overlay hover:text-accent transition-colors border border-border-faint"
              >
                {label}
              </Link>
            )
          })}
        </CardFooter>
      )}
    </Card>
  )
}
