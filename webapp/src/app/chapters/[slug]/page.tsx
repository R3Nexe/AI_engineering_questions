'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useChapters, useChapterMarkdown, useGlossary } from '@/lib/data'
import { useShell } from '@/components/shell'
import { PageHeader, Spinner, EmptyState, SectionHeading } from '@/components/ui'
import ChapterMarkdown, { makeHeadingSlugger } from '@/components/chapters/ChapterMarkdown'
import type { ChapterHeading, GlossaryTerm } from '@/types'

// ─── Heading with deduped id ──────────────────────────────────────────────────

interface HeadingWithId extends ChapterHeading {
  id: string
}

/** Apply a fresh slugger to headings in document order — same logic as the renderer. */
function buildHeadingIds(headings: ChapterHeading[]): HeadingWithId[] {
  const slugger = makeHeadingSlugger()
  return headings.map((h) => ({ ...h, id: slugger(h.text) }))
}

// ─── TOC scroll-spy ───────────────────────────────────────────────────────────

function useScrollSpy(headings: HeadingWithId[]): string {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (headings.length === 0) return
    const ids = headings.map((h) => h.id)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 },
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => { observer.disconnect() }
  }, [headings])

  return activeId
}

// ─── TOC panel ────────────────────────────────────────────────────────────────

interface TocProps {
  headings: HeadingWithId[]
  activeId: string
}

function Toc({ headings, activeId }: TocProps) {
  const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3)
  if (filtered.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="space-y-0.5">
      {filtered.map((h) => {
        const isActive = activeId === h.id
        return (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={[
              'block text-xs leading-snug py-0.5 transition-colors duration-[80ms]',
              h.depth === 3 ? 'pl-3' : '',
              isActive
                ? 'text-accent font-medium'
                : 'text-text-dim hover:text-text-secondary',
            ].join(' ')}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {h.text}
          </a>
        )
      })}
    </nav>
  )
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChapterPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const router = useRouter()
  const { setStatusHints } = useShell()

  const index = useChapters()
  const { content, notFound } = useChapterMarkdown(slug)
  const glossaryData = useGlossary()

  const chapter = useMemo(
    () => (index?.chapters ?? []).find((c) => c.slug === slug) ?? null,
    [index, slug],
  )

  const chapters = useMemo(() => index?.chapters ?? [], [index])
  const chapterIdx = useMemo(
    () => chapters.findIndex((c) => c.slug === slug),
    [chapters, slug],
  )
  const prevChapter = useMemo(
    () => (chapterIdx > 0 ? chapters[chapterIdx - 1] : null),
    [chapters, chapterIdx],
  )
  const nextChapter = useMemo(
    () => (chapterIdx >= 0 && chapterIdx < chapters.length - 1 ? chapters[chapterIdx + 1] : null),
    [chapters, chapterIdx],
  )

  // Derive deduplicated heading ids — same order as the markdown renderer
  const headingsWithId = useMemo(
    () => buildHeadingIds(chapter?.headings ?? []),
    [chapter],
  )
  const activeId = useScrollSpy(headingsWithId)

  // Related glossary terms (terms whose chapters include this slug)
  const relatedTerms = useMemo<GlossaryTerm[]>(
    () => (glossaryData?.terms ?? []).filter((t) => t.chapters?.includes(slug)),
    [glossaryData, slug],
  )

  // Shell hints & prev/next keyboard nav
  useEffect(() => {
    const hints = [{ key: '[/]', label: 'prev/next chapter' }]
    setStatusHints(hints)
    return () => setStatusHints([])
  }, [setStatusHints])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '[' && prevChapter) {
        e.preventDefault()
        router.push(`/chapters/${prevChapter.slug}`)
      } else if (e.key === ']' && nextChapter) {
        e.preventDefault()
        router.push(`/chapters/${nextChapter.slug}`)
      }
    },
    [prevChapter, nextChapter, router],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // ── Loading / not-found states ────────────────────────────────────────────

  if (index === null || (content === null && !notFound)) {
    return (
      <div className="h-full flex items-center justify-center text-text-dim text-xs font-mono gap-2">
        <Spinner className="size-3" />
        loading…
      </div>
    )
  }

  if (notFound || (index !== null && chapter === null)) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-3">
        <EmptyState message={`chapter "${slug}" not found`} />
        <Link href="/chapters" className="text-xs text-accent hover:underline font-mono">
          ← Back to Chapters
        </Link>
      </div>
    )
  }

  if (!chapter) return null

  const totalFigures = chapter.figures.length + chapter.unreferencedImages.length

  return (
    <div className="flex flex-col h-full bg-bg-deep overflow-hidden">
      <PageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5">
            <Link href="/chapters" className="hover:text-text-primary">Chapters</Link>
            <span className="text-text-dim">/</span>
            <span className="text-text-primary">Ch {String(chapter.number).padStart(2, '0')}</span>
          </nav>
        }
        title={chapter.title}
        meta={
          <span>
            Vol {chapter.volume} · {chapter.readingMinutes} min · {totalFigures} figure{totalFigures !== 1 ? 's' : ''}
          </span>
        }
      />

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: sticky TOC */}
        <aside className="w-48 shrink-0 border-r border-border-faint bg-bg-raised overflow-y-auto p-4 hidden lg:block">
          <div className="text-xs font-mono text-text-dim uppercase tracking-[0.06em] mb-3">Contents</div>
          <Toc headings={headingsWithId} activeId={activeId} />
        </aside>

        {/* Center: article */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8" id="chapter-article">
          <article className="max-w-[72ch] mx-auto">
            {content && <ChapterMarkdown content={content} />}

            {/* Additional figures (unreferenced) */}
            {chapter.unreferencedImages.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border-faint">
                <SectionHeading className="mb-4">Additional Figures</SectionHeading>
                <div className="space-y-4">
                  {chapter.unreferencedImages.map((src, i) => {
                    const figId = `fig-${chapter.figures.length + i + 1}`
                    const filename = src.split('/').pop() ?? src
                    return (
                      <figure key={src} id={figId} className="chapter-figure" data-figure-src={src} data-figure-alt={filename}>
                        <div className="chapter-figure-frame">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={filename} loading="lazy" decoding="async" className="chapter-figure-img" />
                        </div>
                        <figcaption className="chapter-figure-caption">{filename}</figcaption>
                      </figure>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="mt-10 pt-6 border-t border-border-faint flex items-center justify-between gap-4">
              {prevChapter ? (
                <Link
                  href={`/chapters/${prevChapter.slug}`}
                  className="group flex flex-col gap-0.5 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="text-xs font-mono text-text-dim">← Previous</span>
                  <span className="text-sm font-medium">{prevChapter.title}</span>
                </Link>
              ) : <div />}
              {nextChapter ? (
                <Link
                  href={`/chapters/${nextChapter.slug}`}
                  className="group flex flex-col gap-0.5 text-right text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="text-xs font-mono text-text-dim">Next →</span>
                  <span className="text-sm font-medium">{nextChapter.title}</span>
                </Link>
              ) : <div />}
            </div>

            {/* Attribution footer */}
            <footer className="mt-8 pt-4 border-t border-border-faint text-xs text-text-dim font-mono">
              Notes from{' '}
              <a
                href="https://github.com/liquidslr/system-design-notes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                liquidslr/system-design-notes
              </a>
              {' '}· based on{' '}
              <em className="not-italic text-text-secondary">System Design Interview (Alex Xu)</em>
            </footer>
          </article>
        </main>

        {/* Right rail: concepts, glossary terms, figure list */}
        <aside className="w-52 shrink-0 border-l border-border-faint bg-bg-raised overflow-y-auto p-4 hidden xl:block">
          {chapter.concepts.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-mono text-text-dim uppercase tracking-[0.06em] mb-2">Concepts</div>
              <div className="space-y-1">
                {chapter.concepts.map((cid) => (
                  <Link
                    key={cid}
                    href={`/concepts/${cid}`}
                    className="block text-xs font-mono text-text-secondary hover:text-accent transition-colors py-0.5"
                  >
                    {cid}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedTerms.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-mono text-text-dim uppercase tracking-[0.06em] mb-2">Glossary</div>
              <div className="space-y-1">
                {relatedTerms.map((t) => (
                  <Link
                    key={t.id}
                    href={`/glossary#${t.id}`}
                    className="block text-xs text-text-secondary hover:text-accent transition-colors py-0.5 truncate"
                    title={t.term}
                  >
                    {t.term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {chapter.figures.length > 0 && (
            <div>
              <div className="text-xs font-mono text-text-dim uppercase tracking-[0.06em] mb-2">Figures</div>
              <div className="space-y-1">
                {chapter.figures.map((fig, i) => {
                  const figId = `fig-${i + 1}`
                  return (
                    <a
                      key={figId}
                      href={`#${figId}`}
                      className="block text-xs text-text-dim hover:text-text-secondary transition-colors py-0.5 truncate"
                      title={fig.alt}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(figId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    >
                      Fig {i + 1}: {fig.alt || fig.src.split('/').pop()}
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
