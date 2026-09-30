'use client'

import { useRouter } from 'next/navigation'
import type { Video, VideoStatus } from '@/types'
import StatusControl from './StatusControl'

interface Props {
  video: Video
  status: VideoStatus
  onStatusChange: (s: VideoStatus) => void
}

const LEVEL_CLS: Record<Video['level'], string> = {
  beginner:     'text-status-done',
  intermediate: 'text-status-partial',
  advanced:     'text-diff-hard',
}

const ROOT_CONCEPT_LABELS: Record<string, string> = {
  fundamentals: 'fundamentals',
  data: 'data',
  async: 'async',
  'ai-systems': 'ai-systems',
}

export default function VideoCard({ video, status, onStatusChange }: Props) {
  const router = useRouter()

  return (
    <tr
      className="hover:bg-bg-overlay transition-colors duration-[var(--duration-fast)] group border-b border-border-faint"
    >
      {/* Thumbnail placeholder */}
      <td className="py-2.5 px-4 w-16">
        <button
          onClick={() => router.push(`/videos/${video.id}`)}
          aria-label={`Watch ${video.title}`}
          className="w-10 h-8 bg-bg-deep flex items-center justify-center border border-border-default rounded-md text-text-dim hover:text-text-secondary hover:border-border-strong transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </td>

      {/* Title + channel + concepts */}
      <td className="py-2.5 px-4">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => router.push(`/videos/${video.id}`)}
            className="text-left text-base text-text-primary font-medium hover:text-accent hover:underline leading-snug focus-visible:outline-2 focus-visible:outline-accent focus-visible:rounded-md"
          >
            {video.title}
          </button>
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-text-secondary">
            <span>{video.channel}</span>
            {video.concepts.length > 0 && (
              <>
                <span className="text-text-dim" aria-hidden="true">·</span>
                <span className="text-text-dim">
                  {video.concepts.map((c) => ROOT_CONCEPT_LABELS[c] ?? c).join(', ')}
                </span>
              </>
            )}
          </div>
        </div>
      </td>

      {/* Level */}
      <td className="py-2.5 px-4 w-28">
        <span className={`font-mono text-xs uppercase ${LEVEL_CLS[video.level]}`}>
          {video.level}
        </span>
      </td>

      {/* Status control */}
      <td className="py-2.5 px-4 text-right w-48">
        <div
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
        >
          <StatusControl status={status} onChange={onStatusChange} />
        </div>
      </td>
    </tr>
  )
}
