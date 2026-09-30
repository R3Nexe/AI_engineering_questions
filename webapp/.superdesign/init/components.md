# Components

Framework: **Next.js 16 / React 19** · CSS: **Tailwind v4** · State: **Zustand v5**
No component library (no shadcn, Radix, MUI, etc.) — all components are custom.
Path alias: `@/` → `src/`.

---

## LibraryView

**File:** `src/components/LibraryView.tsx` (108 lines)
**Description:** Question list page content — filters by sidebar category, search, and difficulty; each row navigates to `/q/[id]`.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { DIFFICULTY_COLOR, FORMAT_LABEL } from '@/types'
import type { Difficulty } from '@/types'

type DifficultyFilter = Difficulty | 'all'

const DIFFICULTY_FILTERS: { label: string; value: DifficultyFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
]

export default function LibraryView() {
  const { pack, sidebarItem, search, attempts } = useStore()
  const router = useRouter()
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

  const attemptedIds = new Set(attempts.map((a) => a.questionId))

  let questions = pack?.questions ?? []

  if (sidebarItem === 'daily') {
    questions = questions.slice(0, 5)
  } else if (sidebarItem !== 'all') {
    questions = questions.filter((q) => q.category === sidebarItem)
  }

  if (search) {
    const s = search.toLowerCase()
    questions = questions.filter(
      (q) =>
        q.title.toLowerCase().includes(s) ||
        q.tags.some((t) => t.toLowerCase().includes(s)),
    )
  }

  if (difficultyFilter !== 'all') {
    questions = questions.filter((q) => q.difficulty === difficultyFilter)
  }

  const title =
    sidebarItem === 'daily'
      ? 'Daily Practice'
      : sidebarItem === 'all'
        ? 'All Questions'
        : (pack?.categories.find((c) => c.id === sidebarItem)?.name ?? 'Questions')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <header className="mb-4 flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-zinc-100">{title}</h1>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            {questions.length}
          </span>
        </header>

        {/* Difficulty filter */}
        <div className="mb-4 flex gap-1">
          {DIFFICULTY_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDifficultyFilter(value)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                difficultyFilter === value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {questions.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-zinc-500">
            No questions match
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => router.push(`/q/${q.id}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800"
              >
                <div className={`h-2 w-2 shrink-0 rounded-full ${DIFFICULTY_COLOR[q.difficulty]}`} />
                <span className="flex-1 font-medium text-zinc-100">{q.title}</span>
                {attemptedIds.has(q.id) && (
                  <span className="text-emerald-400 text-sm" title="Attempted">✓</span>
                )}
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                  {FORMAT_LABEL[q.format]}
                </span>
                <span className="text-sm text-zinc-400">{q.timeLimitMinutes}min</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## InterviewView

**File:** `src/components/InterviewView.tsx` (310 lines)
**Description:** Full interview session UI — header with back/timer/submit, prompt display, answer textarea with voice dictation, scratchpad/notes tabs, post-submit grading panel with expected answer + key points + self-grade buttons.

Key props: `{ question: Question }`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import type { Question, SelfGrade } from '@/types'
import { GRADE_LABELS, DIFFICULTY_COLOR } from '@/types'

interface Props {
  question: Question
}

type TimerState = 'idle' | 'running' | 'paused'

function fmtTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function InterviewView({ question }: Props) {
  const router = useRouter()
  const { saveDraft, clearDraft, recordAttempt } = useStore()

  const initDraft = useStore.getState().drafts[question.id]
  const [answer, setAnswer] = useState(initDraft?.answer ?? '')
  const [scratchpad, setScratchpad] = useState(initDraft?.scratchpad ?? '')
  const [notes, setNotes] = useState(initDraft?.notes ?? '')
  const [elapsed, setElapsed] = useState(initDraft?.elapsedSeconds ?? 0)
  const [submitted, setSubmitted] = useState(initDraft?.submitted ?? false)
  const [timerState, setTimerState] = useState<TimerState>(() =>
    initDraft ? 'paused' : 'idle'
  )
  const [activeTab, setActiveTab] = useState<'scratchpad' | 'notes'>('scratchpad')
  const [keyPointsHit, setKeyPointsHit] = useState<Set<string>>(
    new Set(initDraft?.keyPointsHit ?? [])
  )
  const [isRecording, setIsRecording] = useState(false)

  // ... timer + autosave effects, dictation, submit/restart handlers

  const timeLimitSecs = question.timeLimitMinutes * 60
  const overLimit = elapsed > timeLimitSecs
  const nearLimit = !overLimit && timeLimitSecs > 0 && elapsed / timeLimitSecs >= 0.8
  const timerColor = overLimit ? 'text-red-400' : nearLimit ? 'text-amber-400' : 'text-zinc-100'

  return (
    <div className="flex flex-col h-full overflow-hidden text-zinc-100">
      <header className="shrink-0 border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white">←</button>
        <h1 className="font-semibold truncate flex-1">{question.title}</h1>
        <span className={`px-2 py-0.5 rounded text-xs ${DIFFICULTY_COLOR[question.difficulty]}`}>
          {question.difficulty.toUpperCase()}
        </span>
        <span className={`font-mono text-sm tabular-nums ${timerColor}`}>
          {fmtTime(elapsed)}
          {timeLimitSecs > 0 && <span className="text-zinc-500"> / {fmtTime(timeLimitSecs)}</span>}
        </span>
        {/* Timer controls: ▶ / ⏸ / ↻ */}
        <button
          disabled={!answer.trim() || submitted}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-3 py-1 rounded text-sm font-medium"
        >
          Submit
        </button>
      </header>

      {/* Prompt */}
      <div className="shrink-0 bg-zinc-900 mx-4 mt-4 mb-2 p-4 rounded-lg border border-zinc-800 max-h-48 overflow-y-auto">
        {/* rendered question.prompt */}
      </div>

      {/* Answer textarea */}
      <div className="flex-1 flex flex-col min-h-0 px-4">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-zinc-400">Your Answer</label>
          <button className="text-xs p-1 rounded text-zinc-500">🎤</button>
        </div>
        <textarea
          value={answer}
          disabled={submitted}
          className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 ring-violet-500"
        />
      </div>

      {/* Scratchpad / Notes tabs */}
      <div className="shrink-0 px-4 pb-4 mt-2">
        <div className="flex gap-4 border-b border-zinc-800 mb-2">
          <button className="pb-1 text-sm text-white border-b-2 border-violet-500">Scratchpad</button>
          <button className="pb-1 text-sm text-zinc-500">Notes</button>
        </div>
        <textarea className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm resize-none" />
      </div>

      {/* Post-submit grading panel */}
      {submitted && (
        <div className="mx-4 mb-4 bg-zinc-900 rounded-lg border border-zinc-800 p-4 space-y-4 overflow-y-auto">
          {/* Expected Answer, Key Points (checkboxes), Follow-ups, Rate yourself */}
          <div className="flex gap-2">
            {([0, 1, 2, 3] as SelfGrade[]).map(grade => (
              <button key={grade} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">
                {GRADE_LABELS[grade]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## MasteryBar

**File:** `src/components/concepts/MasteryBar.tsx` (26 lines)
**Description:** Horizontal progress bar showing mastered/total question count for a concept.

```tsx
'use client'

interface Props {
  mastered: number
  total: number
  className?: string
}

export default function MasteryBar({ mastered, total, className = '' }: Props) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 tabular-nums shrink-0">
        {mastered}/{total}
      </span>
    </div>
  )
}
```

---

## ActivityHeatmap

**File:** `src/components/concepts/ActivityHeatmap.tsx` (119 lines)
**Description:** GitHub-style 12-week activity heatmap. Columns = weeks (Mon–Sun rows). Cells colored violet based on attempt count. Month labels above columns.

```tsx
'use client'

import type { AttemptRecord } from '@/types'

interface Props {
  attempts: AttemptRecord[]
}

export default function ActivityHeatmap({ attempts }: Props) {
  // Builds 12-week grid (84 days) ending today, aligned to Monday.
  // Cell colors: zinc-800/40 (0), violet-900/60 (1), violet-700/80 (2), violet-500 (3+)
  // Day labels: Mon Wed Fri Sun
  // Month labels above grid columns

  return (
    <div className="select-none">
      {/* month labels row + 7-row day grid */}
      {/* each cell: 14×14px rounded-sm, tooltip title="YYYY-MM-DD: N attempts" */}
    </div>
  )
}
```

---

## TermCard

**File:** `src/components/glossary/TermCard.tsx` (75 lines)
**Description:** Glossary term display card — term name, concept links, aliases, definition, example blockquote, related term chips.

```tsx
'use client'

import Link from 'next/link'
import type { GlossaryTerm } from '@/types'

interface Props {
  term: GlossaryTerm
  termById: Record<string, string>
  highlighted: boolean
  onRelatedClick: (id: string) => void
}

export default function TermCard({ term, termById, highlighted, onRelatedClick }: Props) {
  return (
    <article
      id={term.id}
      className={`rounded-lg border bg-zinc-900 p-4 transition-colors ${
        highlighted ? 'border-violet-500' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-zinc-100">{term.term}</h3>
        {term.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {term.concepts.map((cid) => (
              <Link
                key={cid}
                href={`/concepts/${cid}`}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-900/40 text-violet-300 hover:bg-violet-800/60 transition-colors"
              >
                {cid}
              </Link>
            ))}
          </div>
        )}
      </div>
      {term.aliases && term.aliases.length > 0 && (
        <p className="mt-1 text-xs text-zinc-500 italic">{term.aliases.join(' · ')}</p>
      )}
      <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{term.definition}</p>
      {term.example && (
        <blockquote className="mt-3 rounded-md border-l-2 border-violet-500 bg-zinc-800/60 px-3 py-2">
          <p className="text-xs text-zinc-400 italic leading-relaxed">{term.example}</p>
        </blockquote>
      )}
      {term.related.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-0.5">Related:</span>
          {term.related.map((rid) => (
            <button
              key={rid}
              onClick={() => onRelatedClick(rid)}
              className="rounded px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            >
              {termById[rid] ?? rid}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}
```

---

## AZBar

**File:** `src/components/glossary/AZBar.tsx` (34 lines)
**Description:** A–Z jump bar for glossary. Active letters are clickable violet buttons; inactive letters are dim spans.

```tsx
'use client'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface Props {
  available: Set<string>
}

export default function AZBar({ available }: Props) {
  const scrollToLetter = (letter: string) => {
    document.getElementById(`az-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ALPHABET.map((l) =>
        available.has(l) ? (
          <button
            key={l}
            onClick={() => scrollToLetter(l)}
            className="w-6 h-6 rounded text-xs font-mono font-semibold bg-zinc-800 text-zinc-300 hover:bg-violet-600 hover:text-white transition-colors"
          >
            {l}
          </button>
        ) : (
          <span key={l} className="w-6 h-6 flex items-center justify-center text-xs font-mono text-zinc-700">
            {l}
          </span>
        ),
      )}
    </div>
  )
}
```

---

## CategoryChips

**File:** `src/components/glossary/CategoryChips.tsx` (43 lines)
**Description:** Pill-style category filter for glossary — "All" + one chip per category with term count.

```tsx
'use client'

import type { GlossaryCategory, GlossaryTerm } from '@/types'

interface Props {
  categories: GlossaryCategory[]
  terms: GlossaryTerm[]
  active: string | null
  onSelect: (id: string | null) => void
}

export default function CategoryChips({ categories, terms, active, onSelect }: Props) {
  const countFor = (id: string) => terms.filter((t) => t.category === id).length

  const chipClass = (selected: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      selected
        ? 'bg-violet-600 text-white'
        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
    }`

  return (
    <div className="flex flex-wrap gap-2">
      <button className={chipClass(active === null)} onClick={() => onSelect(null)}>
        All <span className={active === null ? 'opacity-70' : 'opacity-60'}>({terms.length})</span>
      </button>
      {categories.map((cat) => (
        <button key={cat.id} className={chipClass(active === cat.id)} onClick={() => onSelect(cat.id)}>
          {cat.name}{' '}
          <span className={active === cat.id ? 'opacity-70' : 'opacity-60'}>({countFor(cat.id)})</span>
        </button>
      ))}
    </div>
  )
}
```

---

## SearchBox

**File:** `src/components/glossary/SearchBox.tsx` (34 lines)
**Description:** Search input with inline SVG magnifier icon for glossary.

```tsx
'use client'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBox({ value, onChange }: Props) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="search"
        placeholder="Search terms, aliases, definitions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none transition-colors"
      />
    </div>
  )
}
```

---

## VideoCard

**File:** `src/components/videos/VideoCard.tsx` (78 lines)
**Description:** Video grid card — YouTube thumbnail with level badge overlay, title, channel, concept chips, and status control.

```tsx
'use client'

import { useRouter } from 'next/navigation'
import type { Video, VideoStatus } from '@/types'
import StatusControl from './StatusControl'

const LEVEL_BADGE: Record<Video['level'], string> = {
  beginner: 'bg-emerald-900/60 text-emerald-300 border-emerald-800',
  intermediate: 'bg-amber-900/60 text-amber-300 border-amber-800',
  advanced: 'bg-red-900/60 text-red-300 border-red-800',
}

const ROOT_CONCEPT_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  data: 'Data',
  async: 'Async',
  'ai-systems': 'AI Systems',
}

export default function VideoCard({ video, status, onStatusChange }: {
  video: Video; status: VideoStatus; onStatusChange: (s: VideoStatus) => void
}) {
  const router = useRouter()
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors">
      <button onClick={() => router.push(`/videos/${video.id}`)} className="relative w-full aspect-video block overflow-hidden bg-zinc-800">
        <img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt={video.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
        <span className={`absolute top-2 right-2 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${LEVEL_BADGE[video.level]}`}>
          {video.level}
        </span>
      </button>
      <div className="flex flex-col gap-2 p-3">
        <button onClick={() => router.push(`/videos/${video.id}`)} className="text-left">
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 hover:text-violet-300 transition-colors">{video.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{video.channel}</p>
        </button>
        {video.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.concepts.map((c) => (
              <span key={c} className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                {ROOT_CONCEPT_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <StatusControl status={status} onChange={onStatusChange} />
        </div>
      </div>
    </div>
  )
}
```

---

## StatusControl

**File:** `src/components/videos/StatusControl.tsx` (40 lines)
**Description:** Three-button segmented control for video watch status: Not started / Partial / Completed.

```tsx
'use client'

import type { VideoStatus } from '@/types'

const OPTIONS: { label: string; value: VideoStatus }[] = [
  { label: 'Not started', value: 'not_started' },
  { label: 'Partial', value: 'partial' },
  { label: 'Completed', value: 'completed' },
]

export default function StatusControl({ status, onChange, size = 'sm' }: {
  status: VideoStatus; onChange: (s: VideoStatus) => void; size?: 'sm' | 'md'
}) {
  const py = size === 'sm' ? 'py-1' : 'py-1.5'
  return (
    <div className="flex rounded-lg overflow-hidden border border-zinc-700 w-fit">
      {OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 ${py} text-xs font-medium transition-colors ${
            status === value
              ? value === 'completed' ? 'bg-emerald-600 text-white'
                : value === 'partial' ? 'bg-amber-600 text-white'
                : 'bg-zinc-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

---

## VideoSidebar

**File:** `src/components/videos/VideoSidebar.tsx` (52 lines)
**Description:** Tabbed panel (Notes / Whiteboard) shown in the right split of `/videos/[id]`. Both panels stay mounted; visibility toggled via CSS.

```tsx
'use client'

import { useState } from 'react'
import type { RefObject } from 'react'
import dynamic from 'next/dynamic'
import VideoNotes from './VideoNotes'

const WhiteboardPanel = dynamic(
  () => import('@/components/WhiteboardPanel'),
  { ssr: false }
)

type Tab = 'notes' | 'whiteboard'

export default function VideoSidebar({ videoId, iframeRef }: {
  videoId: string; iframeRef: RefObject<HTMLIFrameElement | null>
}) {
  const [tab, setTab] = useState<Tab>('notes')

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
      <div className="flex border-b border-zinc-800 shrink-0">
        {(['notes', 'whiteboard'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-violet-500 text-violet-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'notes' ? 'Notes' : 'Whiteboard'}
          </button>
        ))}
      </div>
      <div className={`flex-1 overflow-hidden ${tab === 'notes' ? 'block' : 'hidden'}`}>
        <VideoNotes key={videoId} videoId={videoId} iframeRef={iframeRef} />
      </div>
      <div className={`flex-1 overflow-hidden ${tab === 'whiteboard' ? 'block' : 'hidden'}`}>
        <WhiteboardPanel storageKey={`wb_video_${videoId}`} />
      </div>
    </div>
  )
}
```

---

## Markdown

**File:** `src/components/answers/Markdown.tsx` (118 lines)
**Description:** Custom lightweight markdown renderer (no external lib). Handles fenced code blocks, h1–h3, bullet lists, numbered lists, paragraphs, and inline **bold**, *italic*, `code`, [links](url).

```tsx
'use client'

import type { ReactNode } from 'react'

function parseInline(text: string, key: string): ReactNode {
  // Parses **bold**, *italic*, `code`, [text](url)
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((https?:\/\/[^)]+)\))/g
  // ... returns ReactNode array with styled spans
}

interface Props { content: string; className?: string }

export default function Markdown({ content, className }: Props) {
  // Splits on \n, processes: fenced code blocks, headings, bullet lists,
  // numbered lists, blank lines, paragraphs
  // Heading classes: text-xl font-bold mt-4, text-lg font-semibold mt-3, text-base font-semibold mt-2
  // Code block: bg-zinc-800 rounded-lg p-3 text-sm font-mono overflow-x-auto
  // Inline code: bg-zinc-800 px-1 py-0.5 font-mono text-[0.85em] text-violet-300
  return <div className={className}>{/* nodes */}</div>
}
```
