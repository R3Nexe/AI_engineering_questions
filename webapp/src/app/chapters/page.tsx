'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useChapters } from '@/lib/data'
import { useShell } from '@/components/shell'
import { PageHeader, SearchInput, Spinner, EmptyState } from '@/components/ui'
import type { Chapter } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesSearch(ch: Chapter, q: string): boolean {
  const s = q.toLowerCase()
  if (ch.title.toLowerCase().includes(s)) return true
  if (ch.summary.toLowerCase().includes(s)) return true
  for (const h of ch.headings) {
    if (h.text.toLowerCase().includes(s)) return true
  }
  return false
}

// ─── Chapter row ──────────────────────────────────────────────────────────────

interface RowProps {
  chapter: Chapter
  active: boolean
  onClick: () => void
  rowRef: (el: HTMLDivElement | null) => void
}

function ChapterRow({ chapter, active, onClick, rowRef }: RowProps) {
  return (
    <Link href={`/chapters/${chapter.slug}`} tabIndex={-1}>
      <div
        ref={rowRef}
        onClick={onClick}
        className={[
          'flex items-start gap-4 px-4 py-2.5 border-b border-border-faint cursor-pointer select-none transition-colors duration-[80ms]',
          active ? 'bg-accent-subtle' : 'hover:bg-bg-overlay',
        ].join(' ')}
      >
        {/* Number */}
        <span className="shrink-0 w-7 font-mono text-xs text-text-dim pt-0.5">
          {String(chapter.number).padStart(2, '0')}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium text-text-primary">{chapter.title}</span>
            <span className="text-xs font-mono text-text-dim shrink-0">
              {chapter.readingMinutes}m
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 truncate max-w-[65ch]">
            {chapter.summary}
          </p>
          {chapter.concepts.length > 0 && (
            <p className="text-xs text-text-dim mt-0.5 font-mono">
              {chapter.concepts.join(' · ')}
            </p>
          )}
        </div>

        {/* Figure count */}
        {chapter.figures.length > 0 && (
          <span className="shrink-0 text-xs font-mono text-text-dim pt-0.5">
            {chapter.figures.length}fig
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Volume section ───────────────────────────────────────────────────────────

interface VolumeSectionProps {
  volume: 1 | 2
  chapters: Chapter[]
  selectedIndex: number
  globalIndexOffset: number
  onSelect: (globalIdx: number) => void
  rowRefs: React.MutableRefObject<Map<number, HTMLDivElement>>
}

function VolumeSection({ volume, chapters, selectedIndex, globalIndexOffset, onSelect, rowRefs }: VolumeSectionProps) {
  if (chapters.length === 0) return null
  return (
    <div>
      <div className="px-4 py-2 bg-bg-raised border-b border-border-faint sticky top-0 z-10">
        <span className="text-xs font-mono text-text-secondary uppercase tracking-[0.06em]">
          Volume {volume}
        </span>
      </div>
      {chapters.map((ch, localIdx) => {
        const globalIdx = globalIndexOffset + localIdx
        return (
          <ChapterRow
            key={ch.slug}
            chapter={ch}
            active={selectedIndex === globalIdx}
            onClick={() => onSelect(globalIdx)}
            rowRef={(el) => {
              if (el) rowRefs.current.set(globalIdx, el)
              else rowRefs.current.delete(globalIdx)
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChaptersPage() {
  const index = useChapters()
  const router = useRouter()
  const { setStatusHints } = useShell()

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Filter chapters by search
  const allChapters = index?.chapters ?? []
  const filtered = search
    ? allChapters.filter((ch) => matchesSearch(ch, search))
    : allChapters

  const vol1 = filtered.filter((ch) => ch.volume === 1)
  const vol2 = filtered.filter((ch) => ch.volume === 2)

  const clampedIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1)
  const selected = filtered[clampedIndex] ?? null

  // Status bar hints
  useEffect(() => {
    setStatusHints([
      { key: 'j/k', label: 'navigate' },
      { key: '↵', label: 'open' },
    ])
    return () => setStatusHints([])
  }, [setStatusHints])

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          if (filtered.length > 0) {
            e.preventDefault()
            setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
          }
          break
        case 'ArrowUp':
        case 'k':
          if (filtered.length > 0) {
            e.preventDefault()
            setSelectedIndex((i) => Math.max(i - 1, 0))
          }
          break
        case 'Enter':
          if (selected) {
            e.preventDefault()
            router.push(`/chapters/${selected.slug}`)
          }
          break
      }
    },
    [filtered.length, selected, router],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Scroll selected row into view
  // Reset selection on search change (done in handler, not effect)
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    setSelectedIndex(0)
  }, [])


  const totalFigures = allChapters.reduce((sum, ch) => sum + ch.figures.length, 0)

  return (
    <div className="flex flex-col h-full bg-bg-deep overflow-hidden">
      <PageHeader
        title="Chapters"
        meta={
          index
            ? `${allChapters.length} chapters · ${totalFigures} figures`
            : undefined
        }
        actions={
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search chapters…"
            className="w-56"
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
        {index === null ? (
          <div className="h-full flex items-center justify-center text-text-dim text-xs font-mono gap-2">
            <Spinner className="size-3" />
            loading…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message="no chapters match this search"
            onClear={() => handleSearchChange('')}
            clearLabel="clear search"
          />
        ) : (
          <>
            <VolumeSection
              volume={1}
              chapters={vol1}
              selectedIndex={clampedIndex}
              globalIndexOffset={0}
              onSelect={setSelectedIndex}
              rowRefs={rowRefs}
            />
            <VolumeSection
              volume={2}
              chapters={vol2}
              selectedIndex={clampedIndex}
              globalIndexOffset={vol1.length}
              onSelect={setSelectedIndex}
              rowRefs={rowRefs}
            />
          </>
        )}
      </div>
    </div>
  )
}
