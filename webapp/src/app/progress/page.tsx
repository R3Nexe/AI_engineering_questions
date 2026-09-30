'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useConcepts, useVideos } from '@/lib/data'
import { useStore } from '@/store'
import { overallStats, conceptStats, recentAttempts } from '@/lib/progress'
import {
  PageHeader,
  SectionHeading,
  ProgressBar,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui'
import ActivityHeatmap from '@/components/concepts/ActivityHeatmap'
import { GRADE_LABELS } from '@/types'
import type { ConceptNode } from '@/types'

export default function ProgressPage() {
  const concepts = useConcepts()
  const videos = useVideos()
  const { pack, attempts, videoProgress } = useStore()
  const questions = useMemo(() => pack?.questions ?? [], [pack])

  const stats = useMemo(
    () => overallStats(concepts ?? [], questions, attempts, videos ?? undefined, videoProgress),
    [concepts, questions, attempts, videos, videoProgress],
  )

  const roots = useMemo(
    () => (concepts ?? []).filter((c) => c.parentId === null).sort((a, b) => a.order - b.order),
    [concepts],
  )

  const weakConcepts = useMemo<ConceptNode[]>(() => {
    const leaves = (concepts ?? []).filter((c) => !(concepts ?? []).some((x) => x.parentId === c.id))
    return leaves
      .map((c) => ({ c, stats: conceptStats(c.id, concepts ?? [], questions, attempts) }))
      .filter(({ stats: s }) => s.total > 0 && s.pct < 100)
      .sort((a, b) => a.stats.pct - b.stats.pct)
      .slice(0, 5)
      .map(({ c }) => c)
  }, [concepts, questions, attempts])

  const recent = useMemo(() => recentAttempts(attempts, 10), [attempts])

  return (
    <div className="h-full bg-bg-deep p-6 overflow-y-auto">
      <PageHeader title="Progress" meta="Your learning stats, mastery, and activity log" />

      {/* Horizontal stats strip */}
      <Card className="flex flex-row items-center py-4 my-6 bg-bg-base border-border-default rounded-md p-0 divide-x divide-border-faint shadow-none">
        <div className="flex-1 text-center py-1">
          <div className="text-xs text-text-secondary uppercase font-mono tracking-wider">Level</div>
          <div className="font-semibold text-text-primary text-base mt-0.5">{stats.level}</div>
        </div>
        <div className="flex-1 text-center py-1">
          <div className="text-xs text-text-secondary uppercase font-mono tracking-wider">Mastery</div>
          <div className="font-semibold text-text-primary font-mono text-base mt-0.5">{stats.pct}%</div>
        </div>
        <div className="flex-1 text-center py-1">
          <div className="text-xs text-text-secondary uppercase font-mono tracking-wider">Streak</div>
          <div className="font-semibold text-accent font-mono text-base mt-0.5">{stats.streak}d</div>
        </div>
        <div className="flex-1 text-center py-1">
          <div className="text-xs text-text-secondary uppercase font-mono tracking-wider">Videos</div>
          <div className="font-semibold text-text-primary font-mono text-base mt-0.5">
            {stats.videosCompleted}/{stats.videosTotal}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-bg-base border-border-default p-4 shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle>
              <SectionHeading>Category Mastery</SectionHeading>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {roots.map((root) => {
              const cStats = conceptStats(root.id, concepts ?? [], questions, attempts)
              return (
                <div key={root.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <Link href={`/concepts/${root.id}`} className="text-text-secondary hover:text-text-primary">
                      {root.name}
                    </Link>
                    <span className="font-mono text-text-primary text-xs">
                      {cStats.mastered}/{cStats.total} ({cStats.pct}%)
                    </span>
                  </div>
                  <ProgressBar value={cStats.total > 0 ? cStats.mastered / cStats.total : 0} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="bg-bg-base border-border-default p-4 shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle>
              <SectionHeading>Needs Attention</SectionHeading>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 border border-border-faint rounded-md divide-y divide-border-faint overflow-hidden">
            {weakConcepts.length === 0 ? (
              <div className="p-4 text-xs font-mono text-text-secondary text-center">
                all concepts mastered or in progress
              </div>
            ) : (
              weakConcepts.map((concept) => {
                const cStats = conceptStats(concept.id, concepts ?? [], questions, attempts)
                const firstUnmastered = questions.find(
                  (q) => q.concepts.includes(concept.id) && !attempts.some((a) => a.questionId === q.id && a.grade >= 2),
                )
                return (
                  <div key={concept.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <Link
                        href={`/concepts/${concept.id}`}
                        className="text-text-secondary hover:text-text-primary font-medium"
                      >
                        {concept.name}
                      </Link>
                      <div className="text-xs font-mono text-text-secondary mt-0.5">
                        {cStats.mastered}/{cStats.total} mastered
                      </div>
                    </div>
                    {firstUnmastered && (
                      <Link href={`/q/${firstUnmastered.id}`}>
                        <Button variant="primary" size="sm">
                          Practice
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-bg-base border-border-default p-4 shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle>
              <SectionHeading>Recent Attempts</SectionHeading>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 border border-border-faint rounded-md divide-y divide-border-faint overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-4 text-xs font-mono text-text-secondary text-center">
                no attempts recorded yet
              </div>
            ) : (
              recent.map((a) => {
                const q = questions.find((x) => x.id === a.questionId)
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 px-3 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        a.grade >= 2 ? 'bg-status-done' : 'bg-status-partial'
                      }`}
                    />
                    <Link href={`/q/${a.questionId}`} className="text-text-primary flex-1 truncate hover:text-accent">
                      {q?.title ?? a.questionId}
                    </Link>
                    <span className="text-xs font-mono text-text-secondary">{GRADE_LABELS[a.grade]}</span>
                    <span className="text-xs font-mono text-text-secondary">{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="bg-bg-base border-border-default p-4 shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle>
              <SectionHeading>Activity (12 weeks)</SectionHeading>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityHeatmap attempts={attempts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
