'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  PageHeader,
  SearchInput,
  SegmentedFilter,
  StatusMark,
  DifficultyMark,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui'
import { useStore } from '@/store'
import type { Difficulty } from '@/types'
import Link from 'next/link'

type DiffFilter = Difficulty | 'all'
type ViewMode = 'grid' | 'list'

const DIFF_SEGMENTS: { value: DiffFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

function formatId(id: string): string {
  const m = id.match(/(\D+)(\d+)$/)
  if (!m) return id
  return `${m[1]}-${m[2].padStart(3, '0')}`
}

export default function AnswersPage() {
  const { pack, attempts } = useStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    useStore.getState().loadPack()
  }, [])

  const getStatus = (qId: string) => {
    const qsAttempts = attempts.filter((a) => a.questionId === qId)
    if (qsAttempts.some((a) => a.grade >= 2)) return 'mastered'
    if (qsAttempts.length > 0) return 'attempted'
    return 'new'
  }

  const categories = useMemo(() => pack?.categories ?? [], [pack])

  const filtered = useMemo(() => {
    if (!pack) return []
    return pack.questions.filter((q) => {
      const match = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchCat = category === 'all' || q.category === category
      const matchDiff = diff === 'all' || q.difficulty === diff
      return match && matchCat && matchDiff
    })
  }, [pack, search, category, diff])

  return (
    <div className="flex flex-col h-full bg-bg-base">
      <PageHeader title="Answers" meta={`${filtered.length} reference answers`} />

      {/* Toolbar */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-faint">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Search answers..." />
          </div>
          <Select value={category} onValueChange={(val) => setCategory(val ?? 'all')}>
            <SelectTrigger size="sm" className="w-48 bg-bg-raised border-border-default text-xs font-mono text-text-primary">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-bg-raised border-border-default text-text-primary">
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <SegmentedFilter segments={DIFF_SEGMENTS} value={diff} onChange={setDiff} />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-bg-raised p-1 rounded-md border border-border-default" role="group" aria-label="View mode">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-bg-overlay text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-bg-overlay text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-text-secondary">
            no reference answers match the filter
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View using shadcn Card */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
            {filtered.map((q) => {
              const categoryName = categories.find((c) => c.id === q.category)?.name ?? q.category
              const cleanExcerpt = q.prompt.replace(/[*_#`\n]/g, ' ').replace(/\s+/g, ' ').trim()

              return (
                <Link
                  key={q.id}
                  href={`/answers/${q.id}`}
                  className="group block focus-visible:outline-none"
                >
                  <Card className="h-full justify-between bg-bg-raised border-border-default group-hover:border-accent group-hover:bg-bg-overlay transition-all">
                    <CardHeader className="p-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-text-secondary group-hover:text-accent transition-colors font-medium">
                          {formatId(q.id)}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusMark state={getStatus(q.id)} showLabel={false} />
                          <DifficultyMark difficulty={q.difficulty} />
                        </div>
                      </div>

                      <CardTitle className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        {q.title}
                      </CardTitle>

                      <CardDescription className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {cleanExcerpt}
                      </CardDescription>
                    </CardHeader>

                    <CardFooter className="p-0 pt-3 border-t border-border-faint flex items-center justify-between text-xs text-text-secondary font-mono">
                      <span className="truncate max-w-[180px]">{categoryName}</span>
                      <span>{q.timeLimitMinutes}m</span>
                    </CardFooter>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="divide-y divide-border-faint">
            {filtered.map((q) => (
              <Link key={q.id} href={`/answers/${q.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-bg-raised transition-colors">
                <span className="font-mono text-text-secondary text-xs w-20 shrink-0">{formatId(q.id)}</span>
                <span className="flex-1 text-sm text-text-primary truncate">{q.title}</span>
                <StatusMark state={getStatus(q.id)} />
                <DifficultyMark difficulty={q.difficulty} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
