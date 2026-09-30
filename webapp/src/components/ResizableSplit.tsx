'use client'

import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
  initialRightPct?: number
  minPct?: number
  storageKey?: string
}

export default function ResizableSplit({
  left,
  right,
  initialRightPct = 40,
  minPct = 20,
  storageKey,
}: Props) {
  const [rightPct, setRightPct] = useState<number>(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved !== null) {
        const n = parseFloat(saved)
        if (!isNaN(n)) return n
      }
    }
    return initialRightPct
  })

  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const clamp = useCallback(
    (pct: number) => Math.max(minPct, Math.min(100 - minPct, pct)),
    [minPct]
  )

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newRightPct = ((rect.right - e.clientX) / rect.width) * 100
      setRightPct(clamp(newRightPct))
    },
    [dragging, clamp]
  )

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  const resetPct = useCallback(() => {
    setRightPct(initialRightPct)
  }, [initialRightPct])

  // Persist to localStorage when storageKey is provided
  useEffect(() => {
    if (!storageKey) return
    localStorage.setItem(storageKey, String(rightPct))
  }, [rightPct, storageKey])

  const leftWidth = `${100 - rightPct}%`
  const rightWidth = `${rightPct}%`

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* Left pane — pointer-events disabled while dragging so Excalidraw/iframes
          don't swallow the drag events */}
      <div
        className="h-full min-w-0 relative"
        style={{ width: leftWidth, pointerEvents: dragging ? 'none' : undefined }}
      >
        {left}
      </div>

      {/* Divider — wider hit-target, slim visual bar */}
      <div
        className="relative z-10 flex shrink-0 w-2 cursor-col-resize items-center justify-center group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={resetPct}
      >
        <div
          className={`h-full w-px transition-colors ${
            dragging
              ? 'bg-border-strong'
              : 'bg-border-default group-hover:bg-border-strong'
          }`}
        />
      </div>

      {/* Right pane */}
      <div
        className="h-full min-w-0 relative"
        style={{ width: rightWidth, pointerEvents: dragging ? 'none' : undefined }}
      >
        {right}
      </div>
    </div>
  )
}
