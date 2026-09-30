# Layouts

## Overview
The app uses a single shared layout: a full-height two-column shell with a fixed `w-64` left sidebar and a `flex-1` main content area. Every route is wrapped by this shell.

There is no secondary layout (no nested `layout.tsx` in sub-directories).

---

## Root Layout

**File:** `src/app/layout.tsx`
**Description:** HTML shell — sets metadata, imports globals.css, applies body background + text, renders `Providers`.

```tsx
import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = { title: 'AI Interview Prep' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## App Shell / Providers

**File:** `src/components/Providers.tsx`
**Description:** Client component that initialises the Zustand store (`loadPack`) and renders the sidebar + main split. Acts as the true layout wrapper for all page content.

```tsx
'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'
import Sidebar from './Sidebar'

export default function Providers({ children }: { children: React.ReactNode }) {
  const loadPack = useStore((s) => s.loadPack)

  useEffect(() => {
    loadPack()
  }, [loadPack])

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="w-64 shrink-0 border-r border-zinc-800">
        <Sidebar />
      </div>
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
```

---

## Sidebar

**File:** `src/components/Sidebar.tsx`
**Description:** Left navigation panel. Contains: app branding header, top-level nav links (Library / Concepts / Progress / Videos / Glossary / Answers), divider, search input for questions, Practice section (Daily / All), Topics section (categories from loaded pack), and footer showing attempt count.

```tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store'

const NAV_LINKS = [
  { label: 'Library', href: '/' },
  { label: 'Concepts', href: '/concepts' },
  { label: 'Progress', href: '/progress' },
  { label: 'Videos', href: '/videos' },
  { label: 'Glossary', href: '/glossary' },
  { label: 'Answers', href: '/answers' },
]

export default function Sidebar() {
  const { pack, sidebarItem, setSidebarItem, search, setSearch, attempts } = useStore()
  const pathname = usePathname()
  const router = useRouter()

  const activeStyle = 'bg-violet-600/20 text-violet-300 rounded'
  const inactiveStyle = 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded'
  const baseItemStyle = 'flex items-center justify-between px-2 py-1.5 text-sm transition-colors'

  const getCount = (id: string) => {
    if (!pack) return 0
    if (id === 'all') return pack.questions.length
    if (id === 'daily') return 5
    return pack.questions.filter((q) => q.category === id).length
  }

  const handleSidebarItem = (item: string) => {
    setSidebarItem(item)
    router.push('/')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 p-3 gap-3">
      {/* Header */}
      <div className="pb-1">
        <h1 className="font-bold text-lg text-zinc-100">AI Prep</h1>
        <p className="text-xs text-zinc-500">Interview Practice</p>
      </div>

      {/* Top nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`block px-2 py-1.5 text-sm transition-colors ${pathname === href ? activeStyle : inactiveStyle}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <hr className="border-zinc-800" />

      {/* Search */}
      <input
        type="text"
        placeholder="Search questions…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-800 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 ring-violet-500 text-zinc-100"
      />

      {/* Practice Section */}
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Practice</div>
        <div
          onClick={() => handleSidebarItem('daily')}
          className={`${baseItemStyle} cursor-pointer ${sidebarItem === 'daily' && pathname === '/' ? activeStyle : inactiveStyle}`}
        >
          <span>Daily Practice</span>
          <span className="text-xs bg-zinc-800 px-1.5 rounded">{getCount('daily')}</span>
        </div>
        <div
          onClick={() => handleSidebarItem('all')}
          className={`${baseItemStyle} cursor-pointer ${sidebarItem === 'all' && pathname === '/' ? activeStyle : inactiveStyle}`}
        >
          <span>All Questions</span>
          <span className="text-xs bg-zinc-800 px-1.5 rounded">{getCount('all')}</span>
        </div>
      </div>

      {/* Topics Section */}
      {pack && (
        <div className="overflow-y-auto flex-1">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Topics</div>
          {pack.categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSidebarItem(cat.id)}
              className={`${baseItemStyle} cursor-pointer ${sidebarItem === cat.id && pathname === '/' ? activeStyle : inactiveStyle}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs bg-zinc-800 px-1.5 rounded">{getCount(cat.id)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto text-xs text-zinc-600 pt-2">
        {attempts.length} attempts
      </div>
    </div>
  )
}
```

---

## Reusable Layout Primitive: ResizableSplit

**File:** `src/components/ResizableSplit.tsx`
**Description:** Used by `/q/[id]` and `/videos/[id]` to create a two-panel horizontal split with a draggable divider. Persists ratio to `localStorage` when `storageKey` is provided. Not a page layout in itself, but acts as an intra-page layout container.

```tsx
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
      const stored = parseFloat(localStorage.getItem(storageKey) ?? '')
      if (!isNaN(stored)) return stored
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
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || !containerRef.current) return
      const { left, width } = containerRef.current.getBoundingClientRect()
      setRightPct(clamp(((width - (e.clientX - left)) / width) * 100))
    },
    [dragging, clamp]
  )

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  const resetPct = useCallback(() => {
    setRightPct(initialRightPct)
  }, [initialRightPct])

  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(rightPct))
  }, [rightPct, storageKey])

  const leftWidth = `${100 - rightPct}%`
  const rightWidth = `${rightPct}%`

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      <div style={{ width: leftWidth }} className="min-w-0 overflow-hidden">
        {left}
      </div>
      {/* Divider */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={resetPct}
        className={`shrink-0 w-1 cursor-col-resize select-none transition-colors ${
          dragging ? 'bg-violet-500' : 'bg-zinc-800 hover:bg-violet-500/50'
        }`}
      />
      <div style={{ width: rightWidth }} className="min-w-0 overflow-hidden">
        {right}
      </div>
    </div>
  )
}
```
