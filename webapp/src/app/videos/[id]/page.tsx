'use client'

import { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVideos } from '@/lib/data'
import { useStore } from '@/store'
import ResizableSplit from '@/components/ResizableSplit'
import { Spinner } from '@/components/ui'
import VideoPlayer from '@/components/videos/VideoPlayer'
import VideoSidebar from '@/components/videos/VideoSidebar'

export default function VideoDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')
  const router = useRouter()
  const videos = useVideos()
  const videoProgress = useStore((s) => s.videoProgress)
  const setVideoProgress = useStore((s) => s.setVideoProgress)

  // Shared ref so sidebar Notes can request current time from the iframe
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const status = videoProgress[id] ?? 'not_started'

  // Auto-set to partial on first open if not_started
  useEffect(() => {
    if (id && status === 'not_started') {
      setVideoProgress(id, 'partial')
    }
    // Only run when the video id changes, not on every status update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Loading state
  if (videos === null) {
    return (
      <div className="flex h-screen items-center justify-center text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6 text-accent" />
          <span className="text-sm font-mono text-text-dim">Loading video…</span>
        </div>
      </div>
    )
  }

  const video = videos.find((v) => v.id === id)

  if (!video) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-text-secondary">
        <p className="text-base">
          Video{' '}
          <code className="rounded bg-bg-overlay px-1.5 py-0.5 text-sm text-text-primary">{id}</code>
          {' '}not found.
        </p>
        <button
          onClick={() => router.push('/videos')}
          className="text-accent hover:text-text-primary hover:underline text-sm"
        >
          ← Back to videos
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Back nav */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border-default bg-bg-raised">
        <button
          onClick={() => router.push('/videos')}
          className="text-sm text-accent hover:underline transition-colors"
        >
          ← Videos
        </button>
        <span className="text-border-default">|</span>
        <span className="text-sm text-text-secondary truncate">{video.title}</span>
      </div>

      {/* Split: player (left 60%) + sidebar (right 40%) */}
      <div className="flex-1 min-h-0">
        <ResizableSplit
          left={
            <VideoPlayer
              video={video}
              status={videoProgress[id] ?? 'not_started'}
              onStatusChange={(s) => setVideoProgress(id, s)}
              iframeRef={iframeRef}
            />
          }
          right={<VideoSidebar videoId={id} iframeRef={iframeRef} />}
          initialRightPct={40}
          storageKey="split_video_v1"
        />
      </div>
    </div>
  )
}
