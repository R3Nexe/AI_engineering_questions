'use client'

import { useStore } from '@/store'
import { streakDays } from '@/lib/progress'
import { useShell } from './ShellContext'

export default function StatusBar() {
  const { attempts } = useStore()
  const { statusHints, helpOpen, setHelpOpen } = useShell()

  const streak = streakDays(attempts)

  return (
    <footer
      className="h-7 shrink-0 flex items-center px-3 gap-4 bg-bg-raised border-t border-border-default text-xs text-text-secondary font-mono select-none"
      aria-label="Status bar"
    >
      {/* Left: stats */}
      <span className="flex items-center gap-1" title="Total attempts">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
        {attempts.length}
      </span>

      <span className="flex items-center gap-1" title="Day streak">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        {streak}d
      </span>

      {/* Separator */}
      <span className="w-px h-3.5 bg-border-default" aria-hidden="true" />

      {/* Key hints from context (set by page) */}
      {statusHints.length > 0 && (
        <div className="flex items-center gap-3" aria-label="Keyboard shortcuts">
          {statusHints.map((h) => (
            <span key={h.key} className="flex items-center gap-1 text-text-dim">
              <kbd className="inline-flex">{h.key}</kbd>
              <span>{h.label}</span>
            </span>
          ))}
          <span className="w-px h-3.5 bg-border-default" aria-hidden="true" />
        </div>
      )}

      {/* Default nav hints */}
      <div className="flex items-center gap-2 text-text-dim">
        <span className="flex items-center gap-1">
          <kbd>g</kbd><kbd>l</kbd><span className="text-text-dim">lib</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd>/</kbd><span>search</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd>?</kbd><span>shortcuts</span>
        </span>
      </div>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Help toggle */}
      <button
        onClick={() => setHelpOpen(!helpOpen)}
        aria-label="Toggle keyboard shortcuts help"
        aria-expanded={helpOpen}
        className="text-text-dim hover:text-text-secondary transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </footer>
  )
}
