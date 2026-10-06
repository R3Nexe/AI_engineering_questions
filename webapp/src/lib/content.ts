import { supabase } from './supabase'
import type { Resource } from './cache'
import type {
  Chapter,
  ChapterIndex,
  ConceptNode,
  GlossaryCategory,
  GlossaryTerm,
  QuestionCategory,
  QuestionPack,
  Question,
  Video,
} from '@/types'

/**
 * Server content. Every resource is loaded with one set-based query (two parallel
 * queries when a list needs its categories), never a query per row. The tables
 * hold tens to low hundreds of rows and the UI filters and searches client-side
 * over the whole list, so these reads are bounded instead of paginated.
 */

const CONTENT_TTL_MS = 10 * 60 * 1000
const CHAPTER_BODY_TTL_MS = 24 * 60 * 60 * 1000

// Public URL of the `chapters` bucket, without a trailing slash.
const BUCKET_URL = supabase.storage.from('chapters').getPublicUrl('_').data.publicUrl.slice(0, -2)

/** Maps a site path like `/chapters/ch01/images/a.png` to its URL in the bucket. */
function chapterAssetUrl(path: string): string {
  return path.startsWith('/chapters/') ? BUCKET_URL + path.slice('/chapters'.length) : path
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error || res.data === null) throw new Error(`Failed to load ${what}: ${res.error?.message ?? 'no data'}`)
  return res.data
}

// ── Concepts ────────────────────────────────────────────────────────────────

export const conceptsResource: Resource<ConceptNode[]> = {
  key: 'concepts',
  ttlMs: CONTENT_TTL_MS,
  fetch: async () => {
    const rows = must(
      await supabase.from('concepts').select('id, name, parent_id, summary, sort_order').order('sort_order'),
      'concepts',
    )
    return rows.map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id, summary: r.summary, order: r.sort_order }))
  },
}

// ── Glossary ────────────────────────────────────────────────────────────────

export interface GlossaryData {
  categories: GlossaryCategory[]
  terms: GlossaryTerm[]
}

export const glossaryResource: Resource<GlossaryData> = {
  key: 'glossary',
  ttlMs: CONTENT_TTL_MS,
  fetch: async () => {
    const [cats, terms] = await Promise.all([
      supabase.from('glossary_categories').select('id, name').order('sort_order'),
      supabase
        .from('glossary_terms')
        .select(
          'id, term, aliases, category_id, definition, example, how_it_works, tradeoffs, failure_modes, code_snippet, related, concepts, chapters',
        )
        .order('sort_order'),
    ])
    return {
      categories: must(cats, 'glossary categories'),
      terms: must(terms, 'glossary terms').map((r) => ({
        id: r.id,
        term: r.term,
        aliases: r.aliases,
        category: r.category_id,
        definition: r.definition,
        example: r.example,
        howItWorks: r.how_it_works ?? undefined,
        tradeoffs: r.tradeoffs ?? undefined,
        failureModes: r.failure_modes ?? undefined,
        codeSnippet: r.code_snippet ?? undefined,
        related: r.related,
        concepts: r.concepts,
        chapters: r.chapters,
      })),
    }
  },
}

// ── Videos ──────────────────────────────────────────────────────────────────

export const videosResource: Resource<Video[]> = {
  key: 'videos',
  ttlMs: CONTENT_TTL_MS,
  fetch: async () => {
    const rows = must(
      await supabase.from('videos').select('id, youtube_id, title, channel, level, summary, concepts').order('sort_order'),
      'videos',
    )
    return rows.map((r) => ({
      id: r.id,
      youtubeId: r.youtube_id,
      title: r.title,
      channel: r.channel,
      level: r.level,
      concepts: r.concepts,
      summary: r.summary,
    }))
  },
}

// ── Questions ───────────────────────────────────────────────────────────────

export const questionPackResource: Resource<QuestionPack> = {
  key: 'question-pack',
  ttlMs: CONTENT_TTL_MS,
  fetch: async () => {
    const [cats, qs] = await Promise.all([
      supabase.from('question_categories').select('id, name, symbol, summary').order('sort_order'),
      supabase
        .from('questions')
        .select(
          'id, category_id, title, prompt, format, difficulty, expected_answer, time_limit_minutes, tags, key_points, follow_ups, sources, concepts',
        )
        .order('sort_order'),
    ])
    const categories: QuestionCategory[] = must(cats, 'question categories')
    const questions: Question[] = must(qs, 'questions').map((r) => ({
      id: r.id,
      category: r.category_id,
      title: r.title,
      prompt: r.prompt,
      format: r.format,
      difficulty: r.difficulty,
      tags: r.tags,
      expectedAnswer: r.expected_answer,
      keyPoints: r.key_points,
      followUps: r.follow_ups,
      sources: r.sources,
      timeLimitMinutes: r.time_limit_minutes,
      concepts: r.concepts,
    }))
    return { categories, questions }
  },
}

// ── Chapters ────────────────────────────────────────────────────────────────

export const chapterIndexResource: Resource<ChapterIndex> = {
  key: 'chapter-index',
  ttlMs: CONTENT_TTL_MS,
  fetch: async () => {
    const rows = must(
      await supabase
        .from('chapters')
        .select('slug, number, volume, title, summary, concepts, headings, figures, unreferenced_images, word_count, reading_minutes')
        .order('number'),
      'chapters',
    )
    const chapters: Chapter[] = rows.map((r) => ({
      slug: r.slug,
      number: r.number,
      volume: r.volume,
      title: r.title,
      summary: r.summary,
      concepts: r.concepts,
      headings: r.headings,
      figures: (r.figures as Chapter['figures']).map((f) => ({ ...f, src: chapterAssetUrl(f.src) })),
      unreferencedImages: r.unreferenced_images.map(chapterAssetUrl),
      wordCount: r.word_count,
      readingMinutes: r.reading_minutes,
    }))
    return { chapters }
  },
}

export interface ChapterBody {
  content: string | null
  notFound: boolean
}

const chapterBodyResources = new Map<string, Resource<ChapterBody>>()

/** One stable resource per chapter, so hooks keyed on it don't refetch each render. */
export function chapterBodyResource(slug: string): Resource<ChapterBody> {
  let res = chapterBodyResources.get(slug)
  if (!res) {
    res = {
      key: `chapter-body:${slug}`,
      ttlMs: CHAPTER_BODY_TTL_MS,
      fetch: async () => {
        const r = await fetch(`${BUCKET_URL}/${encodeURIComponent(slug)}/index.md`)
        if (r.status === 404 || r.status === 400) return { content: null, notFound: true }
        if (!r.ok) throw new Error(`Failed to load chapter ${slug}: HTTP ${r.status}`)
        const md = await r.text()
        // Image links in the stored markdown are site paths; point them at the bucket.
        return { content: md.replace(/(!\[[^\]]*\]\()\/chapters\//g, `$1${BUCKET_URL}/`), notFound: false }
      },
    }
    chapterBodyResources.set(slug, res)
  }
  return res
}
