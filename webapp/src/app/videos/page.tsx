'use client'

import { useState, useMemo } from 'react'
import type { Video, VideoStatus } from '@/types'
import { useVideos } from '@/lib/data'
import { useStore } from '@/store'
import VideoCard from '@/components/videos/VideoCard'
import { PageHeader, SearchInput, SegmentedFilter, EmptyState } from '@/components/ui'

type LevelFilter = Video['level'] | 'all'
type StatusFilter = VideoStatus | 'all'
type TopicFilter = string

const LEVEL_SEGMENTS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const STATUS_SEGMENTS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'partial', label: 'Partial' },
  { value: 'completed', label: 'Completed' },
]

const TOPIC_SEGMENTS: { value: TopicFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fundamentals', label: 'Fundamentals' },
  { value: 'data', label: 'Data' },
  { value: 'async', label: 'Async' },
  { value: 'ai-systems', label: 'AI Systems' },
]

export default function VideosPage() {
  const videos = useVideos()
  const videoProgress = useStore((s) => s.videoProgress)
  const setVideoProgress = useStore((s) => s.setVideoProgress)

  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all')

  const filtered = useMemo(() => {
    if (!videos) return []
    const q = query.toLowerCase()
    return videos.filter((v) => {
      const status = videoProgress[v.id] ?? 'not_started'
      if (levelFilter !== 'all' && v.level !== levelFilter) return false
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (topicFilter !== 'all' && !v.concepts.some((c) => c === topicFilter || c.startsWith(topicFilter))) return false
      if (q && !v.title.toLowerCase().includes(q) && !v.channel.toLowerCase().includes(q)) return false
      return true
    })
  }, [videos, videoProgress, query, levelFilter, statusFilter, topicFilter])

  // Completion summary counts
  const summary = useMemo(() => {
    if (!videos) return { completed: 0, partial: 0, not_started: 0 }
    return videos.reduce(
      (acc, v) => {
        const s = videoProgress[v.id] ?? 'not_started'
        acc[s] = (acc[s] ?? 0) + 1
        return acc
      },
      { completed: 0, partial: 0, not_started: 0 } as Record<VideoStatus, number>,
    )
  }, [videos, videoProgress])

  if (videos === null) {
    return (
      <div className="flex h-full items-center justify-center text-text-dim text-sm font-mono">
        loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-base">
      {/* Header */}
      <PageHeader
        title="Videos"
        meta={`${filtered.length} / ${videos.length}`}
        actions={
          <span className="text-xs font-mono text-text-secondary">
            <span className="text-status-done">{summary.completed} done</span>
            <span className="text-text-dim mx-1.5">·</span>
            <span className="text-status-partial">{summary.partial} partial</span>
            <span className="text-text-dim mx-1.5">·</span>
            <span className="text-text-dim">{summary.not_started} new</span>
          </span>
        }
      />

      {/* Search + filters */}
      <div className="shrink-0 border-b border-border-default bg-bg-raised">
        <div className="px-6 py-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search videos…"
            globalSlash
          />
        </div>

        {/* Filter rows */}
        <div className="flex flex-col gap-2 px-6 pb-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-mono text-text-dim uppercase tracking-wider w-16 shrink-0">Level</span>
            <SegmentedFilter
              segments={LEVEL_SEGMENTS}
              value={levelFilter}
              onChange={setLevelFilter}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-text-dim uppercase tracking-wider w-16 shrink-0">Status</span>
            <SegmentedFilter
              segments={STATUS_SEGMENTS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-text-dim uppercase tracking-wider w-16 shrink-0">Topic</span>
            <SegmentedFilter
              segments={TOPIC_SEGMENTS}
              value={topicFilter}
              onChange={setTopicFilter}
            />
          </div>
        </div>
      </div>

      {/* Dense list table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            message="no videos match — try a different filter"
            onClear={() => {
              setQuery('')
              setLevelFilter('all')
              setStatusFilter('all')
              setTopicFilter('all')
            }}
            clearLabel="clear filters"
          />
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-bg-base border-b border-border-default">
              <tr>
                <th className="text-left font-normal text-xs text-text-secondary uppercase tracking-wider py-2 px-4 w-16 font-mono">
                  Preview
                </th>
                <th className="text-left font-normal text-xs text-text-secondary uppercase tracking-wider py-2 px-4 font-mono">
                  Video
                </th>
                <th className="text-left font-normal text-xs text-text-secondary uppercase tracking-wider py-2 px-4 w-28 font-mono">
                  Level
                </th>
                <th className="text-right font-normal text-xs text-text-secondary uppercase tracking-wider py-2 px-4 w-48 font-mono">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-faint">
              {filtered.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  status={videoProgress[v.id] ?? 'not_started'}
                  onStatusChange={(s) => setVideoProgress(v.id, s)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
