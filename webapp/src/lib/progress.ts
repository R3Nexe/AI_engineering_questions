import type { ConceptNode, Question, AttemptRecord, Video, VideoStatus } from '@/types'

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface ConceptStats {
  total: number
  attempted: number
  mastered: number
  pct: number // mastered / total * 100 (0 when total === 0)
  videosTotal: number
  videosCompleted: number
}

export interface OverallStats extends ConceptStats {
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  streak: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns all concept IDs in the subtree rooted at conceptId (inclusive). */
function subtreeIds(conceptId: string, concepts: ConceptNode[]): Set<string> {
  const result = new Set<string>([conceptId])
  for (const c of concepts) {
    if (c.parentId === conceptId) {
      for (const id of subtreeIds(c.id, concepts)) {
        result.add(id)
      }
    }
  }
  return result
}

/** Returns a map of questionId → most recent AttemptRecord. */
function buildLatestMap(attempts: AttemptRecord[]): Map<string, AttemptRecord> {
  const map = new Map<string, AttemptRecord>()
  // store prepends newest, so first occurrence = latest
  for (const a of attempts) {
    if (!map.has(a.questionId)) {
      map.set(a.questionId, a)
    }
  }
  return map
}

/** Converts an ISO datetime string to a local YYYY-MM-DD date string. */
function toLocalDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA') // 'en-CA' produces YYYY-MM-DD
}

// ── Exports ────────────────────────────────────────────────────────────────

/**
 * Compute mastery stats for a single concept, including all its descendants.
 * Pass `videos` and `videoProgress` to include video completion stats.
 */
export function conceptStats(
  conceptId: string,
  concepts: ConceptNode[],
  questions: Question[],
  attempts: AttemptRecord[],
  videos?: Video[],
  videoProgress?: Record<string, VideoStatus>,
): ConceptStats {
  const ids = subtreeIds(conceptId, concepts)
  const relevant = questions.filter((q) => q.concepts.some((c) => ids.has(c)))
  const total = relevant.length
  const latest = buildLatestMap(attempts)

  let attempted = 0
  let mastered = 0
  for (const q of relevant) {
    const a = latest.get(q.id)
    if (a) {
      attempted++
      if (a.grade >= 2) mastered++
    }
  }

  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0

  let videosTotal = 0
  let videosCompleted = 0
  if (videos) {
    const relVids = videos.filter((v) => v.concepts.some((c) => ids.has(c)))
    videosTotal = relVids.length
    if (videoProgress) {
      videosCompleted = relVids.filter((v) => videoProgress[v.id] === 'completed').length
    }
  }

  return { total, attempted, mastered, pct, videosTotal, videosCompleted }
}

/** Compute aggregate stats across all questions and videos. */
export function overallStats(
  concepts: ConceptNode[],
  questions: Question[],
  attempts: AttemptRecord[],
  videos?: Video[],
  videoProgress?: Record<string, VideoStatus>,
): OverallStats {
  const total = questions.length
  const latest = buildLatestMap(attempts)

  let attempted = 0
  let mastered = 0
  for (const q of questions) {
    const a = latest.get(q.id)
    if (a) {
      attempted++
      if (a.grade >= 2) mastered++
    }
  }

  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const level: OverallStats['level'] =
    pct < 25 ? 'Beginner' : pct < 60 ? 'Intermediate' : 'Advanced'

  let videosTotal = 0
  let videosCompleted = 0
  if (videos) {
    videosTotal = videos.length
    if (videoProgress) {
      videosCompleted = videos.filter((v) => videoProgress[v.id] === 'completed').length
    }
  }

  return {
    total,
    attempted,
    mastered,
    pct,
    videosTotal,
    videosCompleted,
    level,
    streak: streakDays(attempts),
  }
}

/**
 * Count consecutive local calendar days that have at least one attempt.
 * The streak must end on today or yesterday.
 */
export function streakDays(attempts: AttemptRecord[]): number {
  if (attempts.length === 0) return 0

  const daySet = new Set(attempts.map((a) => toLocalDate(a.date)))

  const today = new Date()
  const todayStr = toLocalDate(today.toISOString())

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toLocalDate(yesterday.toISOString())

  if (!daySet.has(todayStr) && !daySet.has(yesterdayStr)) return 0

  const cursor = daySet.has(todayStr) ? new Date(today) : new Date(yesterday)
  let streak = 0

  while (true) {
    const dateStr = toLocalDate(cursor.toISOString())
    if (!daySet.has(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/** Return the n most-recent attempts (store is already newest-first). */
export function recentAttempts(attempts: AttemptRecord[], n: number): AttemptRecord[] {
  return attempts.slice(0, n)
}
