'use client'

import { useMemo, useState, useCallback } from 'react'
import { marked } from 'marked'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui'

interface Props {
  content: string
  className?: string
}

interface FigureState {
  src: string
  alt: string
}

/** Convert heading text to a URL-safe slug base. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Returns a stateful slugger that deduplicates heading ids within one document,
 * matching GitHub's behaviour: first occurrence → 'slug', second → 'slug-1', etc.
 * Call once per document render and apply to headings in document order.
 */
export function makeHeadingSlugger(): (text: string) => string {
  const counts: Record<string, number> = {}
  return (text: string): string => {
    const base = slugifyHeading(text)
    const n = counts[base] ?? 0
    counts[base] = n + 1
    return n === 0 ? base : `${base}-${n}`
  }
}

export default function ChapterMarkdown({ content, className = '' }: Props) {
  const [figure, setFigure] = useState<FigureState | null>(null)

  const html = useMemo(() => {
    if (!content) return ''
    const renderer = new marked.Renderer()

    // Headings: add id for TOC scroll-spy; use per-render slugger for dedup
    const slugify = makeHeadingSlugger()
    renderer.heading = function ({ tokens, depth }) {
      const text = this.parser.parseInline(tokens)
      const id = slugify(text.replace(/<[^>]+>/g, ''))
      return `<h${depth} id="${id}">${text}</h${depth}>\n`
    }

    // Images: render as figure with stable document-order id (fig-1, fig-2 …)
    let figCount = 0
    renderer.image = function ({ href, text }) {
      figCount++
      const figId = `fig-${figCount}`
      const alt = text ?? ''
      const safeSrc = href ?? ''
      const safeAlt = alt.replace(/"/g, '&quot;')
      return (
        `<figure id="${figId}" class="chapter-figure" data-figure-src="${safeSrc}" data-figure-alt="${safeAlt}">` +
        `<div class="chapter-figure-frame">` +
        `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" class="chapter-figure-img" />` +
        `</div>` +
        `<figcaption class="chapter-figure-caption">${safeAlt}</figcaption>` +
        `</figure>`
      )
    }

    return marked.parse(content, { gfm: true, breaks: false, renderer }) as string
  }, [content])

  // Event delegation: catch clicks on any figure in the container
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const fig = (e.target as HTMLElement).closest<HTMLElement>('[data-figure-src]')
    if (!fig) return
    const src = fig.dataset.figureSrc ?? ''
    const alt = fig.dataset.figureAlt ?? ''
    if (src) {
      e.preventDefault()
      setFigure({ src, alt })
    }
  }, [])

  return (
    <>
      <div
        role="presentation"
        className={`chapter-content ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleContainerClick}
        onKeyDown={undefined}
      />

      <Dialog open={figure !== null} onOpenChange={(open) => { if (!open) setFigure(null) }}>
        <DialogContent className="max-w-3xl bg-bg-raised border-border-default" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-text-primary text-sm font-mono sr-only">
              {figure?.alt ?? 'Figure'}
            </DialogTitle>
            <DialogDescription className="sr-only">Full-size diagram view</DialogDescription>
          </DialogHeader>
          {figure && (
            <div className="flex flex-col gap-3">
              <div className="rounded-md border border-border-default bg-white p-3 flex items-center justify-center">
                {/* white bg so PNG diagrams with white backgrounds show well */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={figure.src}
                  alt={figure.alt}
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
              {figure.alt && (
                <p className="text-xs font-mono text-text-secondary">{figure.alt}</p>
              )}
              <a
                href={figure.src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline font-mono self-start"
              >
                Open original ↗
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
