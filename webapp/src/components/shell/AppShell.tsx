'use client'

import ActivityBar from './ActivityBar'
import ExplorerPane from './ExplorerPane'
import StatusBar from './StatusBar'
import HelpDialog from './HelpDialog'
import GlobalKeys from './GlobalKeys'

/**
 * AppShell is the full-screen IDE-style wrapper:
 *
 *  ┌── ActivityBar (48px) ─┬── ExplorerPane (220px, library only) ─┬── main ──┐
 *  │  icon nav             │  search + filters + category tree      │  {page}  │
 *  │                       │  (hidden on non-library routes)        │          │
 *  └───────────────────────┴────────────────────────────────────────┴──────────┘
 *  └── StatusBar (28px, full width) ──────────────────────────────────────────┘
 *
 * The main area is flex-1 min-h-0 overflow-hidden so pages can size
 * Excalidraw and other full-height content without blowing out the viewport.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalKeys />
      <div className="h-screen flex flex-col bg-bg-deep">
        {/* Top row: ActivityBar + ExplorerPane + main */}
        <div className="flex flex-1 min-h-0">
          <ActivityBar />
          <ExplorerPane />
          <main className="flex-1 min-h-0 bg-bg-base relative">
            {children}
          </main>
        </div>

        {/* Status bar spans full width */}
        <StatusBar />
      </div>

      <HelpDialog />
    </>
  )
}
