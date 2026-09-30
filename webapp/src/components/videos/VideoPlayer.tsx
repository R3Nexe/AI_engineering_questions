'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Video, VideoStatus } from '@/types'
import StatusControl from './StatusControl'
import { Button, Markdown } from '@/components/ui'

// Minimal Document Picture-in-Picture interface (Chrome/Edge 116+)
interface DocumentPiP {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>
}
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPiP
  }
}

interface Props {
  video: Video
  status: VideoStatus
  onStatusChange: (s: VideoStatus) => void
  /** Ref forwarded so the sidebar can send postMessage to get currentTime */
  iframeRef?: RefObject<HTMLIFrameElement | null>
}

export default function VideoPlayer({ video, status, onStatusChange, iframeRef }: Props) {
  const internalRef = useRef<HTMLIFrameElement>(null)
  const ref = iframeRef ?? internalRef
  const playerWrapRef = useRef<HTMLDivElement>(null)
  const pipWindowRef = useRef<Window | null>(null)
  const [isPip, setIsPip] = useState(false)
  const hasPip = typeof window !== 'undefined' && Boolean(window.documentPictureInPicture)

  const openPip = useCallback(async () => {
    if (!hasPip || !playerWrapRef.current) return
    const pipWin = await window.documentPictureInPicture!.requestWindow({
      width: 640,
      height: 360,
    })
    // Copy styles into PiP window
    ;[...document.styleSheets].forEach((ss) => {
      try {
        const el = document.createElement('link')
        el.rel = 'stylesheet'
        el.href = (ss as CSSStyleSheet & { href: string }).href
        pipWin.document.head.appendChild(el)
      } catch {
        // cross-origin stylesheet, skip
      }
    })
    pipWin.document.body.style.margin = '0'
    pipWin.document.body.appendChild(playerWrapRef.current)
    pipWindowRef.current = pipWin
    setIsPip(true)

    pipWin.addEventListener('pagehide', () => {
      if (playerWrapRef.current) {
        document.getElementById('pip-placeholder')?.replaceWith(playerWrapRef.current)
      }
      pipWindowRef.current = null
      setIsPip(false)
    })
  }, [hasPip])

  // Clean up PiP on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close()
      }
    }
  }, [])

  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?enablejsapi=1&rel=0`

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Video iframe */}
      <div className="relative w-full shrink-0">
        {isPip && (
          <div
            id="pip-placeholder"
            className="w-full aspect-video bg-bg-deep flex items-center justify-center text-text-dim text-sm"
          >
            Playing in PiP window ↗
          </div>
        )}
        <div
          ref={playerWrapRef}
          className={`w-full aspect-video ${isPip ? 'hidden' : ''}`}
        >
          <iframe
            ref={ref}
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-4 p-6 max-w-[72ch]">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-tight leading-snug">
              {video.title}
            </h1>
            <p className="text-sm text-text-secondary mt-1">{video.channel}</p>
          </div>

          {/* PiP button */}
          {hasPip ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={openPip}
              disabled={isPip}
              className="shrink-0"
              aria-label="Pop out player to picture-in-picture window"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {isPip ? 'In PiP' : 'Pop out'}
            </Button>
          ) : (
            <div className="relative group shrink-0">
              <Button
                variant="ghost"
                size="sm"
                disabled
                aria-label="Picture-in-picture not supported"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Pop out
              </Button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 rounded-md bg-bg-overlay border border-border-default px-2 py-1 text-xs text-text-secondary whitespace-nowrap">
                Requires Chrome/Edge 116+
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider font-mono mb-2">
            Mastery Status
          </p>
          <StatusControl status={status} onChange={onStatusChange} />
        </div>

        {/* Summary */}
        {video.summary && (
          <div>
            <h2 className="text-md font-semibold text-text-primary mb-2">Summary</h2>
            <div className="text-base text-text-secondary leading-relaxed max-w-[65ch]">
              <Markdown content={video.summary} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
