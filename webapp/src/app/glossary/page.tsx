'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useGlossary, useChapters } from '@/lib/data'
import { PageHeader, SearchInput, SegmentedFilter, SectionHeading, EmptyState } from '@/components/ui'
import AZBar from '@/components/glossary/AZBar'
import TermCard from '@/components/glossary/TermCard'
import TermDetailDialog from '@/components/glossary/TermDetailDialog'
import { flashAndScroll } from '@/components/glossary/glossaryUtils'
import type { GlossaryTerm } from '@/types'

type ViewMode = 'grid' | 'list'

export default function GlossaryPage() {
  const glossary = useGlossary()
  const chaptersIndex = useChapters()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [highlightId, setHighlightId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.location.hash.slice(1) || null : null,
  )
  const didHash = useRef(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const categories = useMemo(() => glossary?.categories ?? [], [glossary])
  const allTerms = useMemo(() => glossary?.terms ?? [], [glossary])

  // Build a fast id→term lookup for related-chip labels
  const termById = useMemo<Record<string, string>>(
    () => Object.fromEntries(allTerms.map((t) => [t.id, t.term])),
    [allTerms],
  )

  // Filter by search + active category
  const filtered = useMemo<GlossaryTerm[]>(() => {
    let terms = allTerms
    if (activeCategory) terms = terms.filter((t) => t.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          (t.aliases ?? []).some((a) => a.toLowerCase().includes(q)) ||
          t.definition.toLowerCase().includes(q),
      )
    }
    return terms
  }, [allTerms, activeCategory, search])

  // Scroll to URL hash after glossary loads (once)
  useEffect(() => {
    if (didHash.current || !glossary) return
    const h = window.location.hash.slice(1)
    if (h) {
      didHash.current = true
      flashAndScroll(h)
    }
  }, [glossary])

  const handleRelatedClick = (id: string) => {
    setHighlightId(id)
    flashAndScroll(id)
  }
  // Available first letters across all filtered terms (for AZ bar)
  const availableLetters = useMemo<Set<string>>(() => {
    const s = new Set<string>()
    for (const t of filtered) {
      const c = t.term[0]?.toUpperCase()
      if (c && c >= 'A' && c <= 'Z') s.add(c)
    }
    return s
  }, [filtered])

  // Map each term.id to its first-letter (only the alphabetically first term per letter
  // across all filtered terms, so the AZ anchors land consistently)
  const azAnchorFor = useMemo<Map<string, string>>(() => {
    const seen = new Set<string>()
    const map = new Map<string, string>()
    const sorted = [...filtered].sort((a, b) => a.term.localeCompare(b.term))
    for (const t of sorted) {
      const c = t.term[0]?.toUpperCase()
      if (c && c >= 'A' && c <= 'Z' && !seen.has(c)) {
        seen.add(c)
        map.set(t.id, c)
      }
    }
    return map
  }, [filtered])

  // Group filtered terms by category (preserving category order)
  const grouped = useMemo<[string, GlossaryTerm[]][]>(() => {
    const map = new Map<string, GlossaryTerm[]>()
    for (const c of categories) map.set(c.id, [])
    for (const t of filtered) {
      const arr = map.get(t.category)
      if (arr) arr.push(t)
    }
    return [...map.entries()].filter(([, ts]) => ts.length > 0)
  }, [filtered, categories])

  return (
    <div className="flex flex-col h-full bg-bg-deep overflow-hidden">
      <PageHeader
        title="Glossary"
        meta={`${filtered.length} terms across ${categories.length} categories`}
      />

      {/* Sticky Filter & Search Toolbar */}
      <div className="shrink-0 bg-bg-deep/95 backdrop-blur-sm border-b border-border-faint p-4 space-y-3">
        {/* Row 1: Search + View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="filter terms..."
              globalSlash
            />
          </div>

          <div
            className="flex items-center gap-1 bg-bg-raised p-1 rounded-md border border-border-default shrink-0"
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-bg-overlay text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-bg-overlay text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter */}
        <div className="overflow-x-auto pb-0.5">
          <SegmentedFilter
            segments={[
              { value: 'all', label: 'All' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={activeCategory ?? 'all'}
            onChange={(v: string) => setActiveCategory(v === 'all' ? null : v)}
          />
        </div>

        {/* Row 3: A-Z Jump Bar */}
        <AZBar available={availableLetters} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {grouped.length > 0 ? (
          grouped.map(([catId, terms]) => (
            <section key={catId} id={catId} className="space-y-4">
              <SectionHeading>
                {categories.find((c) => c.id === catId)?.name ?? catId}
                <span className="ml-2 text-xs font-mono text-text-dim font-normal">
                  ({terms.length})
                </span>
              </SectionHeading>

              {viewMode === 'grid' ? (
                /* Responsive Multi-column Grid (fills dead space) */
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {terms.map((t) => (
                    <div key={t.id} className="h-full">
                      {azAnchorFor.has(t.id) && (
                        <div id={`az-${azAnchorFor.get(t.id)}`} className="sr-only" aria-hidden="true" />
                      )}
                      <TermCard
                        term={t}
                        termById={termById}
                        highlighted={highlightId === t.id}
                        onRelatedClick={handleRelatedClick}
                        onOpen={setOpenId}
                        chaptersIndex={chaptersIndex}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Compact List View */
                <div className="border border-border-default rounded-md bg-bg-base overflow-hidden divide-y divide-border-faint">
                  {terms.map((t) => (
                    <div
                      key={t.id}
                      id={t.id}
                      className={`relative p-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3 transition-colors ${
                        highlightId === t.id ? 'bg-accent-subtle' : 'hover:bg-bg-raised'
                      }`}
                    >
                      {/* Term name & aliases */}
                      <div className="md:w-64 shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenId(t.id)}
                          aria-haspopup="dialog"
                          className="text-left text-sm font-semibold text-text-primary cursor-pointer outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-accent"
                        >
                          {t.term}
                        </button>
                        {t.aliases && t.aliases.length > 0 && (
                          <div className="text-xs text-text-secondary italic mt-0.5">
                            {t.aliases.join(' · ')}
                          </div>
                        )}
                        {t.concepts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {t.concepts.map((cid) => (
                              <span
                                key={cid}
                                className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-bg-overlay text-text-dim"
                              >
                                {cid}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Definition */}
                      <div className="flex-1 text-sm text-text-secondary leading-relaxed">
                        {t.definition}
                        {t.example && (
                          <div className="text-xs text-text-dim font-mono mt-1">
                            eg: {t.example}
                          </div>
                        )}
                      </div>

                      {/* Chapters & Related */}
                      <div className="relative z-10 md:w-56 shrink-0 flex flex-col items-end gap-1.5 text-xs font-mono">
                        {t.chapters && t.chapters.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1">
                            {t.chapters.map((slug) => (
                              <Link
                                key={slug}
                                href={`/chapters/${slug}`}
                                className="px-1.5 py-0.5 rounded bg-bg-raised border border-border-faint text-accent hover:underline text-[11px]"
                              >
                                {slug.replace(/^ch0?/, 'Ch ')}
                              </Link>
                            ))}
                          </div>
                        )}
                        {t.related.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1">
                            {t.related.slice(0, 3).map((rid) => (
                              <button
                                key={rid}
                                onClick={() => handleRelatedClick(rid)}
                                className="text-[11px] text-text-dim hover:text-text-primary hover:underline cursor-pointer"
                              >
                                {termById[rid] ?? rid}
                              </button>
                            ))}
                            {t.related.length > 3 && (
                              <span className="text-[11px] text-text-dim">
                                +{t.related.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))
        ) : (
          <EmptyState
            message="no terms found — try a different search"
            onClear={() => {
              setSearch('')
              setActiveCategory(null)
            }}
          />
        )}
      </div>
      <TermDetailDialog
        term={openId ? (allTerms.find((t) => t.id === openId) ?? null) : null}
        termById={termById}
        categoryName={categories.find((c) => c.id === allTerms.find((t) => t.id === openId)?.category)?.name}
        chaptersIndex={chaptersIndex}
        onClose={() => setOpenId(null)}
        onNavigate={setOpenId}
      />
    </div>
  )
}
