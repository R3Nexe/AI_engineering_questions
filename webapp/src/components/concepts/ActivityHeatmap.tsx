'use client'

import type { AttemptRecord } from '@/types'

interface Props {
  attempts: AttemptRecord[]
}

function toYMD(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

function cellClass(count: number, future: boolean): string {
  if (future) return 'bg-bg-deep'
  if (count === 0) return 'bg-bg-overlay'
  if (count === 1) return 'bg-status-done/50'
  return 'bg-status-done'
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

export default function ActivityHeatmap({ attempts }: Props) {
  // Build count map: YYYY-MM-DD → attempt count
  const counts = new Map<string, number>()
  for (const a of attempts) {
    const d = toYMD(new Date(a.date))
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }

  // 12 weeks = 84 days, ending today
  const today = new Date()
  const todayYMD = toYMD(today)

  // Find start: go back 83 days from today, then align to Monday
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 83)
  const dow = startDate.getDay() // 0=Sun
  const daysBack = dow === 0 ? 6 : dow - 1
  startDate.setDate(startDate.getDate() - daysBack)

  // Build grid: weeks × days (Mon=0 … Sun=6)
  const weeks: Array<Array<{ ymd: string; count: number; future: boolean }>> = []
  const cursor = new Date(startDate)
  while (true) {
    const week: Array<{ ymd: string; count: number; future: boolean }> = []
    for (let d = 0; d < 7; d++) {
      const ymd = toYMD(cursor)
      week.push({ ymd, count: counts.get(ymd) ?? 0, future: ymd > todayYMD })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    if (weeks.length >= 13) break
    if (toYMD(cursor) > todayYMD) break
  }

  // Trim to 12 weeks max
  const grid = weeks.slice(-12)

  // Month labels: mark first week that's in a new month
  const monthLabels: Array<{ col: number; label: string }> = []
  let lastMonth = ''
  grid.forEach((week, col) => {
    const m = week[0].ymd.slice(0, 7)
    if (m !== lastMonth) {
      lastMonth = m
      const date = new Date(week[0].ymd)
      monthLabels.push({ col, label: date.toLocaleDateString('en-US', { month: 'short' }) })
    }
  })

  return (
    <div className="select-none">
      {/* Month labels */}
      <div className="flex gap-1 mb-1 pl-8">
        {grid.map((_, col) => {
          const lbl = monthLabels.find((m) => m.col === col)
          return (
            <div key={col} className="w-5 text-xs text-text-secondary text-center font-mono">
              {lbl ? lbl.label : ''}
            </div>
          )
        })}
      </div>
      {/* Grid rows: day of week */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((lbl, i) => (
            <div key={i} className="h-5 w-7 text-xs text-text-secondary font-mono flex items-center justify-end pr-1">
              {lbl}
            </div>
          ))}
        </div>
        {/* Week columns */}
        {grid.map((week, col) => (
          <div key={col} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.ymd}
                title={`${cell.ymd}: ${cell.count} attempt${cell.count !== 1 ? 's' : ''}`}
                className={`w-5 h-5 rounded-sm ${cellClass(cell.count, cell.future)}`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-text-secondary">Less</span>
        {[0, 1, 2].map((n) => (
          <div
            key={n}
            className={`w-4 h-4 rounded-sm ${cellClass(n, false)}`}
          />
        ))}
        <span className="text-xs text-text-dim">More</span>
      </div>
    </div>
  )
}
