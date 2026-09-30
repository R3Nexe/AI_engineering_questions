'use client'

import { useEffect, useRef } from 'react'
import { useShell } from './ShellContext'

const GLOBAL_SHORTCUTS = [
  { key: '/',        label: 'Focus search / command bar' },
  { key: 'g l',      label: 'Navigate → Library' },
  { key: 'g c',      label: 'Navigate → Concepts' },
  { key: 'g h',      label: 'Navigate → Chapters' },
  { key: 'g p',      label: 'Navigate → Progress' },
  { key: 'g v',      label: 'Navigate → Videos' },
  { key: 'g g',      label: 'Navigate → Glossary' },
  { key: 'g a',      label: 'Navigate → Answers' },
  { key: 'j / k',    label: 'Move selection down / up' },
  { key: 'Enter',    label: 'Open selected item' },
  { key: 'Esc',      label: 'Close overlay / blur search' },
]

const PRACTICE_SHORTCUTS = [
  { key: 'Space',    label: 'Start / pause timer' },
  { key: 'r',        label: 'Reset timer' },
  { key: 'f',        label: 'Toggle fullscreen' },
  { key: 'e',        label: 'Focus whiteboard' },
  { key: 'n',        label: 'Next question' },
  { key: 'Tab',      label: 'Switch panes' },
  { key: '1–5',      label: 'Self-grade after reveal' },
]

export default function HelpDialog() {
  const { helpOpen, setHelpOpen } = useShell()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dl = dialogRef.current
    if (!dl) return
    if (helpOpen) {
      if (!dl.open) dl.showModal()
    } else {
      if (dl.open) dl.close()
    }
  }, [helpOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setHelpOpen])

  if (!helpOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setHelpOpen(false)}
      onClick={(e) => { if (e.target === dialogRef.current) setHelpOpen(false) }}
      className="fixed inset-0 m-auto w-[480px] max-h-[80vh] overflow-y-auto bg-bg-raised border border-border-strong rounded-lg p-0 backdrop:bg-black/50 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
        <span className="text-sm font-semibold text-text-primary font-mono">Keyboard shortcuts</span>
        <button
          onClick={() => setHelpOpen(false)}
          aria-label="Close shortcuts help"
          className="text-text-dim hover:text-text-secondary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 space-y-6">
        <section>
          <h2 className="text-xs uppercase tracking-[0.08em] text-text-secondary mb-3">Global</h2>
          <table className="w-full border-collapse">
            <tbody>
              {GLOBAL_SHORTCUTS.map(({ key, label }) => (
                <tr key={key} className="border-b border-border-faint last:border-b-0">
                  <td className="py-1.5 pr-6 font-mono text-xs text-text-secondary whitespace-nowrap">
                    {key.split(' / ').map((k, i) => (
                      <span key={k} className="inline-flex items-center gap-1">
                        {i > 0 && <span className="text-text-dim mx-1">/</span>}
                        <kbd>{k}</kbd>
                      </span>
                    ))}
                  </td>
                  <td className="py-1.5 text-sm text-text-secondary">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.08em] text-text-secondary mb-3">Practice view</h2>
          <table className="w-full border-collapse">
            <tbody>
              {PRACTICE_SHORTCUTS.map(({ key, label }) => (
                <tr key={key} className="border-b border-border-faint last:border-b-0">
                  <td className="py-1.5 pr-6 font-mono text-xs text-text-secondary whitespace-nowrap">
                    <kbd>{key}</kbd>
                  </td>
                  <td className="py-1.5 text-sm text-text-secondary">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </dialog>
  )
}
