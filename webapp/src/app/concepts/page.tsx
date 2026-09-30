'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useConcepts, useVideos } from '@/lib/data'
import { useStore } from '@/store'
import { conceptStats } from '@/lib/progress'
import { PageHeader, Button, ProgressBar, SegmentedFilter } from '@/components/ui'
import RoadmapGraph from '@/components/concepts/RoadmapGraph'
import type { ConceptNode, Question, AttemptRecord, Video, VideoStatus } from '@/types'

// ── Tree helpers ───────────────────────────────────────────────────────────

function childrenOf(parentId: string | null, concepts: ConceptNode[]): ConceptNode[] {
  return concepts
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}

// ── Leaf row ──────────────────────────────────────────────────────────────

interface LeafRowProps {
  node: ConceptNode
  concepts: ConceptNode[]
  questions: Question[]
  attempts: AttemptRecord[]
  videos: Video[] | null
  videoProgress: Record<string, VideoStatus>
  depth: number
}

function LeafRow({ node, concepts, questions, attempts, videos, videoProgress, depth }: LeafRowProps) {
  const stats = useMemo(
    () => conceptStats(node.id, concepts, questions, attempts, videos ?? undefined, videoProgress),
    [node.id, concepts, questions, attempts, videos, videoProgress],
  )

  return (
    <Link
      href={`/concepts/${node.id}`}
      className="flex items-center gap-2 py-2 text-text-primary text-sm hover:bg-bg-overlay"
    >
      <span className="text-text-dim font-mono" style={{ paddingLeft: `${depth * 16}px` }}>└</span>
      <span className="truncate">{node.name}</span>
      <div className="flex-1 flex items-center justify-end gap-2">
        <span className="font-mono text-text-secondary text-xs">{stats.mastered}/{stats.total}</span>
        <div className="w-24">
          <ProgressBar value={stats.total > 0 ? stats.mastered / stats.total : 0} className="h-[2px]" />
        </div>
      </div>
    </Link>
  )
}

// ── Root concept group ─────────────────────────────────────────────────────

interface RootGroupProps {
  root: ConceptNode
  expanded: boolean
  onToggle: () => void
  concepts: ConceptNode[]
  questions: Question[]
  attempts: AttemptRecord[]
  videos: Video[] | null
  videoProgress: Record<string, VideoStatus>
}

function RootGroup({ root, expanded, onToggle, concepts, questions, attempts, videos, videoProgress }: RootGroupProps) {
  const stats = useMemo(
    () => conceptStats(root.id, concepts, questions, attempts, videos ?? undefined, videoProgress),
    [root.id, concepts, questions, attempts, videos, videoProgress],
  )
  const children = useMemo(() => childrenOf(root.id, concepts), [root.id, concepts])

  return (
    <div className="bg-bg-base border border-border-default overflow-hidden">
      {/* Root header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-bg-raised hover:bg-bg-overlay transition-colors text-left"
      >
        <svg
          className={`w-4 h-4 text-text-dim transition-transform duration-200 shrink-0 ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-text-primary text-sm">{root.name}</span>
            <div className="flex items-center gap-3 shrink-0">
              {stats.videosTotal > 0 && (
                <span className="text-xs text-text-dim">
                  🎬 {stats.videosCompleted}/{stats.videosTotal}
                </span>
              )}
              <span className="text-xs font-medium text-text-accent tabular-nums">
                {stats.mastered}/{stats.total} mastered
              </span>
            </div>
          </div>
          <ProgressBar value={stats.total > 0 ? stats.mastered / stats.total : 0} className="mt-1.5 h-[2px]" />
        </div>
      </button>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div className="border-t border-border-faint divide-y divide-border-faint">
          {children.map((child) => {
            const grandchildren = childrenOf(child.id, concepts)
            if (grandchildren.length === 0) {
              return (
                <LeafRow
                  key={child.id}
                  node={child}
                  concepts={concepts}
                  questions={questions}
                  attempts={attempts}
                  videos={videos}
                  videoProgress={videoProgress}
                  depth={1}
                />
              )
            }
            return (
              <div key={child.id}>
                <Link
                  href={`/concepts/${child.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-overlay transition-colors"
                >
                  <span className="text-sm font-medium text-text-secondary">{child.name}</span>
                </Link>
                {grandchildren.map((gc) => (
                  <LeafRow
                    key={gc.id}
                    node={gc}
                    concepts={concepts}
                    questions={questions}
                    attempts={attempts}
                    videos={videos}
                    videoProgress={videoProgress}
                    depth={2}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {expanded && children.length === 0 && (
        <div className="px-4 py-3 border-t border-border-faint">
          <Link
            href={`/concepts/${root.id}`}
            className="text-sm text-text-accent hover:underline"
          >
            View details →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const [viewMode, setViewMode] = useState<'roadmap' | 'outline'>('roadmap')
  const concepts = useConcepts()
  const videos = useVideos()
  const { pack, attempts, videoProgress } = useStore()

  const roots = useMemo(
    () => (concepts ?? []).filter((c) => c.parentId === null).sort((a, b) => a.order - b.order),
    [concepts],
  )

  // Collapsed set: empty = all expanded by default (no useEffect needed)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set<string>())

  const expandedIds = useMemo(
    () => new Set(roots.filter((r) => !collapsed.has(r.id)).map((r) => r.id)),
    [roots, collapsed],
  )

  const allExpanded = roots.length > 0 && collapsed.size === 0

  function toggleAll() {
    setCollapsed(allExpanded ? new Set(roots.map((r) => r.id)) : new Set<string>())
  }

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const questions = useMemo(() => pack?.questions ?? [], [pack])

  return (
    <div className="flex flex-col h-full bg-bg-deep overflow-hidden">
      <PageHeader
        title="Concepts"
        meta={`${concepts?.length ?? 0} topics`}
        actions={
          <div className="flex items-center gap-3">
            <SegmentedFilter
              segments={[
                { value: 'roadmap', label: 'Roadmap' },
                { value: 'outline', label: 'Outline' },
              ]}
              value={viewMode}
              onChange={(v) => setViewMode(v as 'roadmap' | 'outline')}
            />
            {viewMode === 'outline' && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </Button>
            )}
          </div>
        }
      />
      {viewMode === 'roadmap' ? (
        <RoadmapGraph
          concepts={concepts ?? []}
          questions={questions}
          attempts={attempts}
          videos={videos}
          videoProgress={videoProgress}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
          {(concepts ?? [])
            .filter((c) => c.parentId === null)
            .sort((a, b) => a.order - b.order)
            .map((root) => (
              <RootGroup
                key={root.id}
                root={root}
                expanded={expandedIds.has(root.id)}
                onToggle={() => toggle(root.id)}
                concepts={concepts ?? []}
                questions={questions ?? []}
                attempts={attempts}
                videos={videos}
                videoProgress={videoProgress}
              />
            ))}
        </div>
      )}
    </div>
  )
}
