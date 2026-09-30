'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useConcepts, useGlossary, useVideos, useChapters } from '@/lib/data'
import { useStore } from '@/store'
import { conceptStats } from '@/lib/progress'
import { PageHeader, DifficultyMark, StatusMark, Button, SectionHeading, Spinner } from '@/components/ui'
import type { GlossaryTerm, Difficulty } from '@/types'

const DIFF_ORDER: Difficulty[] = ['easy', 'medium', 'hard']
const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export default function ConceptDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const concepts = useConcepts()
  const glossaryData = useGlossary()
  const videos = useVideos()
  const chaptersIndex = useChapters()
  const { pack, attempts, videoProgress } = useStore()
  const questions = useMemo(() => pack?.questions ?? [], [pack])

  const concept = useMemo(() => (concepts ?? []).find((c) => c.id === id) ?? null, [concepts, id])
  const stats = useMemo(
    () => (concept ? conceptStats(id, concepts ?? [], questions, attempts, videos ?? undefined, videoProgress) : null),
    [concept, id, concepts, questions, attempts, videos, videoProgress],
  )
  const relatedQuestions = useMemo(() => questions.filter((q) => q.concepts.includes(id)), [questions, id])
  const relatedVideos = useMemo(() => (videos ?? []).filter((v) => v.concepts.includes(id)), [videos, id])
  const relatedTerms = useMemo<GlossaryTerm[]>(() => (glossaryData?.terms ?? []).filter((t) => t.concepts.includes(id)), [glossaryData, id])
  const relatedChapters = useMemo(
    () => (chaptersIndex?.chapters ?? []).filter((ch) => ch.concepts.includes(id)),
    [chaptersIndex, id],
  )

  if (concepts === null) {
    return (
      <div className="h-full flex items-center justify-center text-text-dim text-xs font-mono gap-2">
        <Spinner className="size-4 text-accent" />
        <span>Loading concept…</span>
      </div>
    )
  }
  if (!concept) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-3">
        <p className="text-text-secondary text-lg font-medium">Concept not found</p>
        <Link href="/concepts" className="text-accent hover:underline text-sm font-mono">← Back to Concepts</Link>
      </div>
    )
  }

  const byDiff = DIFF_ORDER.map((d) => ({ d, qs: relatedQuestions.filter((q) => q.difficulty === d) })).filter(({ qs }) => qs.length > 0)

  return (
    <div className="flex flex-col h-full bg-bg-deep overflow-hidden">
      <PageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 flex-wrap">
            <Link href="/concepts" className="hover:text-text-primary">Concepts</Link>
            <span className="text-text-dim">/</span>
            <span>{concept.parentId ? 'Sub-concept' : 'Root'}</span>
            <span className="text-text-dim">/</span>
            <span className="text-text-primary">{concept.name}</span>
          </nav>
        }
        title={concept.name}
        description={
          <div className="space-y-1.5">
            <p className="text-sm text-text-secondary leading-relaxed max-w-[72ch]">{concept.summary}</p>
            {stats && (
              <p className="text-text-dim font-mono text-xs">
                {stats.mastered}/{stats.total} questions mastered · {stats.videosCompleted}/{stats.videosTotal} videos completed
              </p>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-[75ch]">
        {byDiff.map(({ d, qs }) => (
          <div key={d}>
            <div className="flex items-center gap-2 mb-3">
              <DifficultyMark difficulty={d} />
              <span className="text-sm font-medium text-text-primary">{DIFF_LABEL[d]}</span>
            </div>
            <div className="border border-border-default rounded-md overflow-hidden bg-bg-base">
              {qs.map((q, i) => (
                <div key={q.id} className={`flex items-center justify-between py-2.5 px-3 hover:bg-bg-overlay ${i !== 0 ? 'border-t border-border-faint' : ''}`}>
                  <span className="text-sm text-text-secondary">{q.title}</span>
                  <div className="flex items-center gap-4">
                    <StatusMark state={attempts.some((a) => a.questionId === q.id && a.grade >= 2) ? 'mastered' : attempts.some((a) => a.questionId === q.id) ? 'attempted' : 'new'} />
                    <Link href={`/q/${q.id}`}>
                      <Button variant="primary" size="sm">Practice</Button>
                    </Link>
                    <Link href={`/answers/${q.id}`} className="text-xs text-text-secondary hover:text-text-primary">
                      Answer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {relatedVideos.length > 0 && (
          <div>
            <SectionHeading>Related Videos</SectionHeading>
            <div className="border border-border-default rounded-md overflow-hidden bg-bg-base mt-3">
              {relatedVideos.map((v, i) => (
                <Link key={v.id} href={`/videos/${v.id}`} className={`flex items-center justify-between py-2.5 px-3 hover:bg-bg-overlay ${i !== 0 ? 'border-t border-border-faint' : ''}`}>
                  <span className="text-sm text-text-secondary">{v.title}</span>
                  <StatusMark state={videoProgress[v.id] === 'completed' ? 'completed' : videoProgress[v.id] === 'partial' ? 'partial' : 'not_started'} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedTerms.length > 0 && (
          <div>
            <SectionHeading>Glossary Terms</SectionHeading>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {relatedTerms.map((t, i) => (
                <span key={t.id}>
                  <Link href={`/glossary#${t.id}`} className="text-accent hover:underline font-mono text-xs">{t.term}</Link>
                  {i < relatedTerms.length - 1 && <span className="text-text-dim ml-2">·</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {relatedChapters.length > 0 && (
          <div>
            <SectionHeading>Chapters</SectionHeading>
            <div className="border border-border-default rounded-md overflow-hidden bg-bg-base mt-3">
              {relatedChapters.map((ch, i) => (
                <Link
                  key={ch.slug}
                  href={`/chapters/${ch.slug}`}
                  className={`flex items-center justify-between py-2.5 px-3 hover:bg-bg-overlay ${i !== 0 ? 'border-t border-border-faint' : ''}`}
                >
                  <span className="text-sm text-text-secondary">{ch.title}</span>
                  <span className="text-xs font-mono text-text-dim">Ch {String(ch.number).padStart(2, '0')} · Vol {ch.volume}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
