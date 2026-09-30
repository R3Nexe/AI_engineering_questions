'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useStore } from '@/store'
import { Markdown } from '@/components/ui'

interface Props {
  videoId: string
  iframeRef: RefObject<HTMLIFrameElement | null>
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VideoNotes({ videoId, iframeRef }: Props) {
  const notes = useStore((s) => s.videoNotes[videoId] ?? '')
  const setVideoNotes = useStore((s) => s.setVideoNotes)
  const [draft, setDraft] = useState(notes)
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const debounceRef = useRef<number | null>(null)
  const timestampCallbackRef = useRef<((time: number) => void) | null>(null)

  const handleChange = useCallback(
    (value: string) => {
      setDraft(value)
      setSaved(false)
      window.clearTimeout(debounceRef.current ?? undefined)
      debounceRef.current = window.setTimeout(() => {
        setVideoNotes(videoId, value)
        setSaved(true)
      }, 500)
    },
    [videoId, setVideoNotes],
  )

  // Listen for YouTube postMessage infoDelivery
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return
      try {
        const data = JSON.parse(e.data) as {
          event?: string
          info?: { currentTime?: number }
        }
        if (
          data.event === 'infoDelivery' &&
          typeof data.info?.currentTime === 'number'
        ) {
          timestampCallbackRef.current?.(data.info.currentTime)
          timestampCallbackRef.current = null
        }
      } catch {
        // non-JSON message, ignore
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const insertTimestamp = useCallback(() => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"listening"}', '*')
      timestampCallbackRef.current = (time: number) => {
        const ts = `[${formatTime(time)}]`
        setDraft((prev) => {
          const next = prev ? `${prev} ${ts}` : ts
          setVideoNotes(videoId, next)
          setSaved(true)
          return next
        })
      }
      setTimeout(() => {
        if (timestampCallbackRef.current) {
          timestampCallbackRef.current = null
          const ts = '[--:--]'
          setDraft((prev) => {
            const next = prev ? `${prev} ${ts}` : ts
            setVideoNotes(videoId, next)
            setSaved(true)
            return next
          })
        }
      }, 300)
    } else {
      const ts = '[--:--]'
      setDraft((prev) => {
        const next = prev ? `${prev} ${ts}` : ts
        setVideoNotes(videoId, next)
        setSaved(true)
        return next
      })
    }
  }, [iframeRef, videoId, setVideoNotes])

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border-faint bg-bg-raised shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={insertTimestamp}
            className="flex items-center gap-1.5 text-xs text-accent hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:rounded-sm"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            + Insert timestamp
          </button>

          <div className="flex items-center bg-bg-overlay rounded px-1 py-0.5 text-xs font-mono gap-1">
            <button
              onClick={() => setMode('write')}
              className={`px-2.5 py-1 rounded transition-colors ${mode === 'write' ? 'bg-bg-overlay text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Write
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 rounded transition-colors ${mode === 'preview' ? 'bg-bg-overlay text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Preview
            </button>
          </div>
        </div>

        <span
          className={`text-xs text-status-done transition-opacity duration-[80ms] ${saved ? 'opacity-100' : 'opacity-0'}`}
          aria-live="polite"
          aria-label={saved ? 'Notes saved' : ''}
        >
          Saved
        </span>
      </div>

      {/* Editor or Markdown Preview */}
      {mode === 'write' ? (
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Take notes while watching (Markdown supported)…"
          aria-label="Video notes"
          className="flex-1 resize-none bg-bg-base p-4 text-sm font-mono text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-accent/30 leading-relaxed"
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 bg-bg-base text-sm">
          {draft.trim() ? (
            <Markdown content={draft} />
          ) : (
            <span className="text-xs font-mono text-text-dim italic">No notes written yet. Switch to Write to add notes.</span>
          )}
        </div>
      )}
    </div>
  )
}
