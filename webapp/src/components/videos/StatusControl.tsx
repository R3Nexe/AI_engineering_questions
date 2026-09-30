'use client'

import type { VideoStatus } from '@/types'

interface Props {
  status: VideoStatus
  onChange: (s: VideoStatus) => void
}

const OPTIONS: {
  value: VideoStatus
  glyph: string
  activeLabel: string
  activeCls: string
}[] = [
  {
    value: 'not_started',
    glyph: '○',
    activeLabel: 'TODO',
    activeCls: 'bg-bg-overlay text-text-primary border-border-strong',
  },
  {
    value: 'partial',
    glyph: '◑',
    activeLabel: 'WIP',
    activeCls: 'bg-status-partial text-text-inverse border-status-partial',
  },
  {
    value: 'completed',
    glyph: '●',
    activeLabel: 'DONE',
    activeCls: 'bg-status-done text-text-inverse border-status-done',
  },
]

export default function StatusControl({ status, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 font-mono text-xs" role="group" aria-label="Video status">
      {OPTIONS.map(({ value, glyph, activeLabel, activeCls }) => {
        const active = status === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={active}
            title={activeLabel}
            className={[
              'px-2 py-0.5 rounded-sm border transition-colors duration-[80ms]',
              'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1',
              active
                ? activeCls
                : 'border-border-default text-text-dim hover:text-text-primary hover:border-border-strong',
            ].join(' ')}
          >
            {active ? `${glyph} ${activeLabel}` : glyph}
          </button>
        )
      })}
    </div>
  )
}
