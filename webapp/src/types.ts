export type QuestionFormat = 'short' | 'concept' | 'design'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SelfGrade = 0 | 1 | 2 | 3 // again | hard | good | easy

export interface QuestionCategory {
  id: string
  name: string
  symbol: string
  summary: string
}

export interface Question {
  id: string
  category: string
  title: string
  prompt: string
  format: QuestionFormat
  difficulty: Difficulty
  tags: string[]
  expectedAnswer: string
  keyPoints: string[]
  followUps: string[]
  sources: string[]
  timeLimitMinutes: number
  concepts: string[]
}

export interface QuestionPack {
  version: number
  updated: string
  categories: QuestionCategory[]
  questions: Question[]
}

export interface Draft {
  questionId: string
  answer: string
  scratchpad: string
  notes: string
  elapsedSeconds: number
  submitted: boolean
  keyPointsHit: string[]
}

export interface AttemptRecord {
  id: string
  questionId: string
  date: string
  grade: SelfGrade
  durationSeconds: number
}

export type SidebarItem = 'daily' | 'all' | string // string = category id

export interface ConceptNode {
  id: string
  name: string
  parentId: string | null
  summary: string
  order: number
}

export interface GlossaryCategory {
  id: string
  name: string
}

export interface GlossaryTerm {
  id: string
  term: string
  aliases?: string[]
  category: string
  definition: string
  example: string
  related: string[]
  concepts: string[]
  /** Chapter slugs (public/chapters/index.json) where this term is explained. */
  chapters?: string[]
}

export interface Video {
  id: string
  youtubeId: string
  title: string
  channel: string
  level: 'beginner' | 'intermediate' | 'advanced'
  concepts: string[]
  summary: string
}

export type VideoStatus = 'not_started' | 'partial' | 'completed'

export interface ChapterHeading {
  depth: number
  text: string
}

export interface ChapterFigure {
  src: string
  alt: string
  section: string
}

export interface Chapter {
  slug: string
  number: number
  volume: 1 | 2
  title: string
  summary: string
  concepts: string[]
  headings: ChapterHeading[]
  figures: ChapterFigure[]
  unreferencedImages: string[]
  wordCount: number
  readingMinutes: number
}

export interface ChapterIndex {
  source: { repo: string; book: string; importedAt: string }
  chapters: Chapter[]
}

export const GRADE_LABELS: Record<SelfGrade, string> = {
  0: 'Missed it',
  1: 'Shaky',
  2: 'Solid',
  3: 'Nailed it',
}

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: 'bg-emerald-500',
  medium: 'bg-amber-400',
  hard: 'bg-red-500',
}

export const FORMAT_LABEL: Record<QuestionFormat, string> = {
  short: 'Quick answer',
  concept: 'Concept deep-dive',
  design: 'System design',
}
