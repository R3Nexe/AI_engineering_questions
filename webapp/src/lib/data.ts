'use client'

import { useResource } from './cache'
import {
  chapterBodyResource,
  chapterIndexResource,
  conceptsResource,
  glossaryResource,
  videosResource,
  type ChapterBody,
  type GlossaryData,
} from './content'
import type { ChapterIndex, ConceptNode, Video } from '@/types'

// All content comes from Supabase through the persistent client cache in ./cache.
// Each hook returns null until the first value is available (cache hit or network).

export function useConcepts(): ConceptNode[] | null {
  return useResource(conceptsResource)
}

export function useGlossary(): GlossaryData | null {
  return useResource(glossaryResource)
}

export function useVideos(): Video[] | null {
  return useResource(videosResource)
}

export function useChapters(): ChapterIndex | null {
  return useResource(chapterIndexResource)
}

export function useChapterMarkdown(slug: string): ChapterBody {
  return useResource(chapterBodyResource(slug)) ?? { content: null, notFound: false }
}
