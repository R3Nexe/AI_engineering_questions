'use client'

import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Markdown,
} from '@/components/ui'
import type { GlossaryTerm, ChapterIndex } from '@/types'

interface Props {
  /** Term to show; null keeps the dialog closed. */
  term: GlossaryTerm | null
  termById: Record<string, string>
  categoryName?: string
  chaptersIndex?: ChapterIndex | null
  onClose: () => void
  /** Swap the dialog to another term (related chips). */
  onNavigate: (id: string) => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-mono uppercase tracking-wider text-text-dim">{title}</h3>
      <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermDetailDialog({
  term,
  termById,
  categoryName,
  chaptersIndex,
  onClose,
  onNavigate,
}: Props) {
  return (
    <Dialog open={term !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-bg-raised border-border-default">
        {term && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="text-lg font-semibold text-text-primary leading-tight">
                {term.term}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-text-dim">
                {[categoryName, ...(term.aliases ?? [])].filter(Boolean).join(' · ')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="text-sm text-text-primary leading-relaxed">
                <Markdown content={term.definition} />
              </div>

              {term.howItWorks && (
                <Section title="How it works">
                  <Markdown content={term.howItWorks} />
                </Section>
              )}
              {term.tradeoffs && (
                <Section title="Trade-offs">
                  <Markdown content={term.tradeoffs} />
                </Section>
              )}
              {term.failureModes && (
                <Section title="Failure modes">
                  <Markdown content={term.failureModes} />
                </Section>
              )}
              {term.codeSnippet && (
                <Section title="In practice">
                  <pre className="overflow-x-auto rounded-md bg-bg-overlay p-3 text-xs font-mono text-text-primary leading-relaxed">
                    <code>{term.codeSnippet}</code>
                  </pre>
                </Section>
              )}
              {term.example && (
                <Section title="Example">
                  <Markdown content={term.example} />
                </Section>
              )}

              {term.related.length > 0 && (
                <Section title="Related">
                  <div className="flex flex-wrap gap-1.5">
                    {term.related.map((rid) => (
                      <button
                        key={rid}
                        onClick={() => onNavigate(rid)}
                        className="rounded-md px-2 py-0.5 text-xs font-mono bg-bg-base text-text-secondary hover:bg-bg-overlay hover:text-text-primary transition-colors cursor-pointer border border-border-faint"
                      >
                        {termById[rid] ?? rid}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {term.chapters && term.chapters.length > 0 && (
                <Section title="Read more">
                  <div className="flex flex-wrap gap-1.5">
                    {term.chapters.map((slug) => {
                      const ch = chaptersIndex?.chapters.find((c) => c.slug === slug)
                      const label = ch ? `Ch ${String(ch.number).padStart(2, '0')} · ${ch.title}` : slug
                      return (
                        <Link
                          key={slug}
                          href={`/chapters/${slug}`}
                          className="rounded-md px-2 py-0.5 text-xs font-mono bg-bg-base text-text-secondary hover:bg-bg-overlay hover:text-accent transition-colors border border-border-faint"
                        >
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                </Section>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
