'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'
import { Button, Spinner } from '@/components/ui'

// Dynamic import required because Excalidraw accesses window/navigator at import time
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((m) => ({ default: m.Excalidraw })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-bg-base text-xs font-mono text-text-dim gap-2">
        <Spinner className="size-3.5 text-accent" />
        <span>loading canvas…</span>
      </div>
    ),
  },
)

interface Props {
  storageKey: string
}

const DEBOUNCE_MS = 800

export default function WhiteboardPanel({ storageKey }: Props) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const lastSavedRef = useRef<string>('')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!api || !storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const elements = parsed.elements || []
        const rawAppState = parsed.appState || {}
        const appState = { ...rawAppState, collaborators: new Map() }
        api.updateScene({ elements, appState })
        lastSavedRef.current = saved
      } catch (e) {
        console.error('Failed to load whiteboard:', e)
      }
    }
    loadedRef.current = true
  }, [api, storageKey])

  const handleChange = useCallback(
    (elements: readonly unknown[], appState: object) => {
      if (!loadedRef.current || !storageKey) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        const json = JSON.stringify({ elements, appState })
        if (json === lastSavedRef.current) return
        localStorage.setItem(storageKey, json)
        lastSavedRef.current = json
      }, DEBOUNCE_MS)
    },
    [storageKey],
  )

  const handleExportPNG = async () => {
    if (!api) return
    const { exportToBlob } = await import('@excalidraw/excalidraw')
    const blob = await exportToBlob({
      elements: api.getSceneElements(),
      appState: { ...api.getAppState(), exportWithDarkMode: true },
      files: api.getFiles(),
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whiteboard-${storageKey}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
  }

  return (
    <div
      className={`flex flex-col bg-bg-base ${
        isFullscreen ? 'fixed inset-0 z-50 bg-bg-base' : 'h-full w-full'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-faint bg-bg-raised shrink-0">
        <span className="text-xs font-mono text-text-dim flex items-center gap-2">
          <span>whiteboard.excalidraw</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleExportPNG}>
            Export PNG
          </Button>
          <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full h-full min-h-0 relative">
        <Excalidraw
          excalidrawAPI={setApi}
          onChange={handleChange as never}
          theme="dark"
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              toggleTheme: false,
            },
          }}
        />
      </div>
    </div>
  )
}
