'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { useShell } from '@/components/shell'
import {
  DifficultyMark,
  SegmentedFilter,
  StatusMark,
  EmptyState,
  Button,
  Markdown,
  Kbd,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui'
import type { StatusState } from '@/components/ui'
import type { Difficulty, AttemptRecord, Question } from '@/types'
import { GRADE_LABELS } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type DifficultyFilter = Difficulty | 'all'

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_SEGMENTS: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const SHORT_FORMAT: Record<string, string> = {
  short: 'quick',
  concept: 'concept',
  design: 'design',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function questionStatus(questionId: string, attempts: AttemptRecord[]): StatusState {
  const qAttempts = attempts.filter((a) => a.questionId === questionId)
  if (qAttempts.length === 0) return 'new'
  const latest = qAttempts[qAttempts.length - 1]
  return latest.grade >= 2 ? 'mastered' : 'attempted'
}

function lastAttemptInfo(
  questionId: string,
  attempts: AttemptRecord[],
): { gradeLabel: string; daysAgo: number } | null {
  const qAttempts = attempts.filter((a) => a.questionId === questionId)
  if (qAttempts.length === 0) return null
  const latest = qAttempts[qAttempts.length - 1]
  const daysAgo = Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000)
  return { gradeLabel: GRADE_LABELS[latest.grade], daysAgo }
}

function promptExcerpt(text: string): string {
  const MAX = 300
  if (text.length <= MAX) return text
  const trimmed = text.slice(0, MAX)
  const lastSpace = trimmed.lastIndexOf(' ')
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '…'
}

// ─── Preview pane ─────────────────────────────────────────────────────────────

interface PreviewPaneProps {
  question: Question
  attempts: AttemptRecord[]
  onPractice: () => void
  onAnswer: () => void
}

function PreviewPane({ question, attempts, onPractice, onAnswer }: PreviewPaneProps) {
  const lastAttempt = lastAttemptInfo(question.id, attempts)
  const conceptText =
    question.concepts.length > 0
      ? question.concepts.join(' · ')
      : question.tags.slice(0, 5).join(' · ')

  const daysAgoLabel =
    lastAttempt === null
      ? null
      : lastAttempt.daysAgo === 0
        ? 'today'
        : lastAttempt.daysAgo === 1
          ? 'yesterday'
          : `${lastAttempt.daysAgo} days ago`

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-10" style={{ maxWidth: '65ch' }}>

        <h2 className="text-md font-semibold text-text-primary leading-snug mb-5">
          {question.title}
        </h2>

        <div className="space-y-5">
          {/* Prompt excerpt */}
          <div className="text-sm text-text-primary leading-relaxed max-w-[65ch]">
            <Markdown content={promptExcerpt(question.prompt)} />
          </div>

          {/* Concepts */}
          {conceptText && (
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="text-text-dim">Concepts</span>
              {' — '}
              {conceptText}
            </p>
          )}

          {/* Meta */}
          <div className="pt-4 flex flex-col gap-1.5 border-t border-border-faint">
            <div className="font-mono text-xs text-text-secondary uppercase tracking-[0.08em]">
              Requirements
            </div>
            <p className="text-sm text-text-secondary">
              Time limit:{' '}
              <span className="text-text-primary">{question.timeLimitMinutes} min</span>
            </p>
            {lastAttempt !== null ? (
              <p className="text-sm text-text-secondary">
                Last attempt:{' '}
                <span className="text-text-primary">
                  {lastAttempt.gradeLabel} · {daysAgoLabel}
                </span>
              </p>
            ) : (
              <p className="text-sm text-text-dim">Not yet attempted</p>
            )}
          </div>

          {/* CTAs */}
          <div className="pt-3 flex items-center gap-3">
            <Button variant="primary" onClick={onPractice}>
              Start practice →
            </Button>
            <Button variant="ghost" onClick={onAnswer}>
              View answer
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" aria-label="More question options">
                    •••
                  </Button>
                }
              />
              <DropdownMenuContent
                align="start"
                className="bg-bg-raised border border-border-default text-text-primary p-1 rounded-md shadow-lg min-w-44"
              >
                <DropdownMenuItem
                  onClick={onPractice}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs font-mono rounded cursor-pointer hover:bg-bg-overlay hover:text-text-primary"
                >
                  <span>Practice</span>
                  <Kbd className="text-[10px]">↵</Kbd>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onAnswer}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs font-mono rounded cursor-pointer hover:bg-bg-overlay hover:text-text-primary"
                >
                  <span>Reference Answer</span>
                  <Kbd className="text-[10px]">o</Kbd>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-t border-border-faint" />
                <DropdownMenuItem
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/q/${question.id}`)
                    }
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs font-mono rounded cursor-pointer hover:bg-bg-overlay hover:text-text-primary"
                >
                  <span>Copy Question Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LibraryView() {
  const { pack, sidebarItem, search, attempts } = useStore()
  const router = useRouter()
  const { setStatusHints } = useShell()

  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // ref map: row index → <tr> element for scroll-into-view
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  // ── Filter questions (preserves original logic) ────────────────────────────
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

  const clampedIndex = questions.length === 0 ? 0 : Math.min(selectedIndex, questions.length - 1)
  const selected = questions[clampedIndex] ?? null

  // ── Title & mastery stats ──────────────────────────────────────────────────
  const title =
    sidebarItem === 'daily'
      ? 'Daily Practice'
      : sidebarItem === 'all'
        ? 'All Questions'
        : (pack?.categories.find((c) => c.id === sidebarItem)?.name ?? 'Questions')

  const totalCount = pack?.questions.length ?? 0
  const masteredCount = (pack?.questions ?? []).filter((q) => {
    const qa = attempts.filter((a) => a.questionId === q.id)
    return qa.length > 0 && qa[qa.length - 1].grade >= 2
  }).length

  // ── Shell hints ────────────────────────────────────────────────────────────
  useEffect(() => {
    setStatusHints([
      { key: 'j/k', label: 'navigate' },
      { key: '↵', label: 'practice' },
      { key: 'o', label: 'answer' },
    ])
    return () => setStatusHints([])
  }, [setStatusHints])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const questionsLen = questions.length
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          if (questionsLen > 0) {
            e.preventDefault()
            setSelectedIndex((i) => Math.min(i + 1, questionsLen - 1))
          }
          break
        case 'ArrowUp':
        case 'k':
          if (questionsLen > 0) {
            e.preventDefault()
            setSelectedIndex((i) => Math.max(i - 1, 0))
          }
          break
        case 'Enter':
          if (selected) {
            e.preventDefault()
            router.push(`/q/${selected.id}`)
          }
          break
        case 'o':
          if (selected) {
            e.preventDefault()
            router.push(`/answers/${selected.id}`)
          }
          break
      }
    },
    [questionsLen, selected, router],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Scroll selected row into view
  useEffect(() => {
    rowRefs.current.get(clampedIndex)?.scrollIntoView({ block: 'nearest' })
  }, [clampedIndex])

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      {/* List - 45% */}
      <div className="w-[45%] flex flex-col border-r border-border-default">
        <div className="h-14 px-4 flex items-center justify-between border-b border-border-default">
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          <span className="font-mono text-sm text-text-secondary">
            {masteredCount}/{totalCount} mastered
          </span>
        </div>
        
        <div className="px-4 py-2 border-b border-border-faint">
          <SegmentedFilter
            segments={DIFFICULTY_SEGMENTS}
            value={difficultyFilter}
            onChange={setDifficultyFilter}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {questions.length === 0 ? (
            <EmptyState message="no results" onClear={() => setDifficultyFilter('all')} />
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-bg-raised text-xs text-text-secondary uppercase">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => {
                  const active = idx === clampedIndex
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`cursor-pointer ${active ? 'bg-accent-subtle' : 'hover:bg-bg-overlay'}`}
                    >
                      <td className="p-3 font-mono text-sm text-text-secondary">{q.id}</td>
                      <td className="p-3">
                        <div className="text-sm text-text-primary">{q.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <DifficultyMark difficulty={q.difficulty} />
                          <span className="text-xs text-text-dim">·</span>
                          <span className="text-xs text-text-secondary">{SHORT_FORMAT[q.format] ?? q.format}</span>
                          <span className="text-xs text-text-dim">·</span>
                          <span className="text-xs text-text-secondary">{q.timeLimitMinutes}m</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <StatusMark state={questionStatus(q.id, attempts)} showLabel={false} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail - 55% */}
      <div className="w-[55%] flex flex-col overflow-y-auto">
        {selected ? (
          <PreviewPane
            question={selected}
            attempts={attempts}
            onPractice={() => router.push(`/q/${selected.id}`)}
            onAnswer={() => router.push(`/answers/${selected.id}`)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-dim">
            Select a question
          </div>
        )}
      </div>
    </div>
  )
}
