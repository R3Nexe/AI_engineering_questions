'use client'

import { useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useStore } from '@/store'
import { DifficultyMark, Button, Spinner } from '@/components/ui'
import Link from 'next/link'
import Markdown from '@/components/answers/Markdown'
import { useConcepts } from '@/lib/data'
import { GRADE_LABELS, FORMAT_LABEL } from '@/types'

export default function AnswerDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? '')
  const { pack, attempts, drafts } = useStore()
  const concepts = useConcepts()

  useEffect(() => {
    useStore.getState().loadPack()
  }, [])

  const q = useMemo(() => pack?.questions.find((x) => x.id === id) ?? null, [pack, id])
  const categoryObj = useMemo(() => pack?.categories.find((c) => c.id === q?.category) ?? null, [pack, q])
  const questionAttempts = useMemo(() => attempts.filter((a) => a.questionId === id), [attempts, id])
  const lastDraft = drafts[id]?.answer

  if (!pack || !q) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-deep text-text-dim font-mono text-xs gap-2">
        <Spinner className="size-4 text-accent" />
        <span>loading reference answer…</span>
      </div>
    )
  }

  const conceptNodes = concepts?.filter((c) => q.concepts.includes(c.id)) ?? []

  return (
    <div className="flex flex-col h-full bg-bg-deep overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
        {/* Notion-style Top Bar & Title */}
        <div className="space-y-4">
          <Link
            href="/answers"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>←</span>
            <span>All Reference Answers</span>
          </Link>

          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text-primary leading-snug max-w-[62ch]">
            {q.title}
          </h1>

          {/* Notion Database Properties Card */}
          <div className="bg-bg-base border border-border-default rounded-md p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">Category</span>
                  <span className="px-2 py-0.5 rounded-sm bg-accent-subtle text-accent text-xs font-medium border border-accent/30 font-mono">
                    {categoryObj?.name ?? q.category}
                  </span>
                </div>

                {/* Difficulty */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">Difficulty</span>
                  <DifficultyMark difficulty={q.difficulty} />
                </div>

                {/* Format */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">Format</span>
                  <span className="text-xs text-text-secondary font-medium">
                    {FORMAT_LABEL[q.format] ?? q.format}
                  </span>
                </div>

                {/* Time Limit */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">Time Limit</span>
                  <span className="text-xs font-mono text-text-secondary">{q.timeLimitMinutes} min</span>
                </div>
              </div>

              {/* Action Button */}
              <Link href={`/q/${q.id}`}>
                <Button variant="primary" size="md">
                  Practice this →
                </Button>
              </Link>
            </div>

            {/* Concepts tags */}
            {conceptNodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-faint">
                <span className="text-xs font-mono text-text-secondary mr-1">Concepts:</span>
                {conceptNodes.map((c) => (
                  <Link
                    key={c.id}
                    href={`/concepts/${c.id}`}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-bg-overlay border border-border-faint text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full-width Opening Section: Prompt Callout */}
        <section className="bg-bg-base border border-border-default rounded-md p-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary mb-3 pb-2 border-b border-border-faint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">Interview Prompt</h2>
          </div>
          <div className="max-w-[62ch]">
            <Markdown content={q.prompt} />
          </div>
        </section>

        {/* 2-Column Section: Expected Answer (Left) + Balanced Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Expected Answer (Biggest Field! ~68% width) */}
          <section className="lg:col-span-8 bg-bg-base border border-border-default rounded-md p-6 lg:p-8">
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-border-faint">
              <h2 className="text-md font-semibold text-text-primary tracking-tight">Expected Answer</h2>
              <span className="text-xs font-mono text-text-secondary">Canonical Model Answer</span>
            </div>
            <div className="max-w-[62ch]">
              <Markdown content={q.expectedAnswer} />
            </div>
          </section>

          {/* Right Column: Key Points on top, Follow-ups, Rubric, Attempts */}
          <div className="lg:col-span-4 space-y-6">
            {/* Key Points to Hit */}
            {q.keyPoints.length > 0 && (
              <div className="bg-bg-base border border-border-default rounded-md p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-faint">
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">Key Points to Hit</h2>
                  <span className="text-xs font-mono text-accent">{q.keyPoints.length} points</span>
                </div>
                <ul className="space-y-2.5 text-xs text-text-secondary max-w-[55ch]">
                  {q.keyPoints.map((kp, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-text-primary leading-relaxed">{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Questions (Below Key Points) */}
            {q.followUps.length > 0 && (
              <div className="bg-bg-base border border-border-default rounded-md p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-faint">
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">Follow-up Questions</h2>
                  <span className="text-xs font-mono text-text-secondary">Examiner Cues</span>
                </div>
                <ol className="divide-y divide-border-faint text-xs font-mono max-w-[55ch]">
                  {q.followUps.map((f, i) => (
                    <li key={i} className="py-2.5 flex items-start gap-2.5">
                      <span className="text-accent font-semibold">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-text-secondary font-sans leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Self-Evaluation Rubric Guide */}
            <div className="bg-bg-base border border-border-default rounded-md p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-faint">
                <h2 className="text-sm font-semibold text-text-primary tracking-tight">Scoring Rubric</h2>
                <span className="text-xs font-mono text-text-secondary">Guide</span>
              </div>
              <div className="divide-y divide-border-faint text-xs">
                <div className="py-2">
                  <span className="font-semibold text-status-done font-mono mr-1.5">Nailed it (4):</span>
                  <span className="text-text-secondary">Covered architecture, trade-offs, capacity math, and handled edge cases cleanly.</span>
                </div>
                <div className="py-2">
                  <span className="font-semibold text-status-done/80 font-mono mr-1.5">Solid (3):</span>
                  <span className="text-text-secondary">Hit all primary requirements and components with valid architectural choices.</span>
                </div>
                <div className="py-2">
                  <span className="font-semibold text-status-partial font-mono mr-1.5">Shaky (2):</span>
                  <span className="text-text-secondary">Correct direction but missed key bottleneck, data schema, or scale bottleneck.</span>
                </div>
                <div className="py-2">
                  <span className="font-semibold text-diff-hard font-mono mr-1.5">Missed it (1):</span>
                  <span className="text-text-secondary">Did not produce viable system design or misunderstood requirements.</span>
                </div>
              </div>
            </div>

            {/* Attempt History */}
            {questionAttempts.length > 0 && (
              <div className="bg-bg-base border border-border-default rounded-md p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-faint">
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">Attempt History</h2>
                  <span className="text-xs font-mono text-text-secondary">{questionAttempts.length} logged</span>
                </div>
                <div className="divide-y divide-border-faint font-mono text-xs">
                  {questionAttempts.map((a) => (
                    <div key={a.id} className="py-2 flex items-center justify-between">
                      <span className="text-text-secondary">{new Date(a.date).toLocaleDateString()}</span>
                      <span className={a.grade >= 2 ? 'text-status-done font-medium' : 'text-status-partial font-medium'}>
                        {GRADE_LABELS[a.grade]}
                      </span>
                      <span className="text-text-secondary">{Math.floor(a.durationSeconds / 60)}m {a.durationSeconds % 60}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Draft Toggle */}
            {lastDraft && (
              <details className="group bg-bg-base border border-border-default rounded-md p-4 text-xs font-mono">
                <summary className="cursor-pointer text-text-secondary hover:text-text-primary font-medium flex items-center justify-between">
                  <span>Your Last Draft</span>
                  <span className="text-text-secondary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 p-3 bg-bg-overlay border border-border-faint rounded max-h-60 overflow-y-auto max-w-[55ch]">
                  <Markdown content={lastDraft} />
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Bottom Sources & References Section (utilizing the bottom space) */}
        {q.sources.length > 0 && (
          <section className="bg-bg-base border border-border-default rounded-md p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-faint">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <h2 className="text-sm font-semibold text-text-primary">Reference Sources & Documentation</h2>
              </div>
              <span className="text-xs font-mono text-text-secondary">{q.sources.length} sources</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {q.sources.map((url, i) => {
                let domain = url
                try {
                  domain = new URL(url).hostname
                } catch {
                  // Fallback
                }
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3.5 rounded-md bg-bg-raised border border-border-default hover:border-accent hover:bg-bg-overlay transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-mono text-accent truncate group-hover:underline font-medium">
                        {domain}
                      </div>
                      <div className="text-xs text-text-secondary truncate mt-0.5 font-mono">
                        {url}
                      </div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-text-secondary group-hover:text-accent shrink-0 transition-colors"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
