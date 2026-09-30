'use client'

import { useState, useEffect } from 'react'
import type { ConceptNode, GlossaryCategory, GlossaryTerm, Video, ChapterIndex } from '@/types'

// Module-level caches — each resource is fetched at most once per browser session
let conceptsCache: ConceptNode[] | null = null
let glossaryCache: { categories: GlossaryCategory[]; terms: GlossaryTerm[] } | null = null
let videosCache: Video[] | null = null

export function useConcepts(): ConceptNode[] | null {
  const [data, setData] = useState<ConceptNode[] | null>(() => conceptsCache)

  useEffect(() => {
    if (conceptsCache) return
    fetch('/concepts.json')
      .then((r) => r.json() as Promise<{ concepts: ConceptNode[] }>)
      .then((json) => {
        conceptsCache = json.concepts
        setData(json.concepts)
      })
  }, [])

  return data
}

export function useGlossary(): { categories: GlossaryCategory[]; terms: GlossaryTerm[] } | null {
  const [data, setData] = useState<{
    categories: GlossaryCategory[]
    terms: GlossaryTerm[]
  } | null>(() => glossaryCache)

  useEffect(() => {
    if (glossaryCache) return
    fetch('/glossary.json')
      .then((r) => r.json() as Promise<{ categories: GlossaryCategory[]; terms: GlossaryTerm[] }>)
      .then((json) => {
        glossaryCache = json
        setData(json)
      })
  }, [])

  return data
}

export function useVideos(): Video[] | null {
  const [data, setData] = useState<Video[] | null>(() => videosCache)

  useEffect(() => {
    if (videosCache) return
    fetch('/videos.json')
      .then((r) => r.json() as Promise<{ videos: Video[] }>)
      .then((json) => {
        videosCache = json.videos
        setData(json.videos)
      })
  }, [])

  return data
}

// Module-level caches for chapters
let chaptersCache: ChapterIndex | null = null
const markdownCache: Map<string, string | 'notfound'> = new Map()

export function useChapters(): ChapterIndex | null {
  const [data, setData] = useState<ChapterIndex | null>(() => chaptersCache)

  useEffect(() => {
    if (chaptersCache) return
    fetch('/chapters/index.json')
      .then((r) => r.json() as Promise<ChapterIndex>)
      .then((json) => {
        chaptersCache = json
        setData(json)
      })
      .catch(() => {/* not yet generated */})
  }, [])

  return data
}

export function useChapterMarkdown(slug: string): { content: string | null; notFound: boolean } {
  const [content, setContent] = useState<string | null>(() => {
    const cached = markdownCache.get(slug)
    return cached && cached !== 'notfound' ? cached : null
  })
  const [notFound, setNotFound] = useState(() => markdownCache.get(slug) === 'notfound')

  useEffect(() => {
    const cached = markdownCache.get(slug)
    if (cached !== undefined) return
    fetch(`/chapters/${slug}/index.md`)
      .then((r) => {
        if (r.status === 404) {
          markdownCache.set(slug, 'notfound')
          setNotFound(true)
          return null
        }
        return r.text()
      })
      .then((text) => {
        if (text === null) return
        markdownCache.set(slug, text)
        setContent(text)
      })
      .catch(() => {
        markdownCache.set(slug, 'notfound')
        setNotFound(true)
      })
  }, [slug])

  return { content, notFound }
}
