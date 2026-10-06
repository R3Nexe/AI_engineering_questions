import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loadResource, subscribeResource } from '@/lib/cache'
import { questionPackResource } from '@/lib/content'
import type { Draft, AttemptRecord, QuestionPack, SidebarItem, VideoStatus } from '@/types'

let packSubscribed = false

interface StoreState {
  // Data
  pack: QuestionPack | null
  loadPack: () => Promise<void>

  // Navigation
  sidebarItem: SidebarItem
  setSidebarItem: (item: SidebarItem) => void

  // Search
  search: string
  setSearch: (s: string) => void

  // Drafts
  drafts: Record<string, Draft>
  saveDraft: (draft: Draft) => void
  clearDraft: (questionId: string) => void

  // Attempts
  attempts: AttemptRecord[]
  recordAttempt: (a: AttemptRecord) => void

  // Video progress
  videoProgress: Record<string, VideoStatus>
  setVideoProgress: (id: string, s: VideoStatus) => void
  videoNotes: Record<string, string>
  setVideoNotes: (id: string, notes: string) => void
}

type PersistedShape = {
  selectedQuestionId?: unknown
  drafts?: Record<string, Draft>
  attempts?: AttemptRecord[]
  sidebarItem?: SidebarItem
  videoProgress?: Record<string, VideoStatus>
  videoNotes?: Record<string, string>
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ── Data ──────────────────────────────────────────────────────
      pack: null,

      loadPack: async () => {
        if (get().pack) return
        const pack = await loadResource(questionPackResource)
        set({ pack })
        // Pick up the background refresh when the cached pack was stale.
        if (!packSubscribed) {
          packSubscribed = true
          subscribeResource(questionPackResource, (fresh) => set({ pack: fresh }))
        }
      },

      // ── Navigation ────────────────────────────────────────────────
      sidebarItem: 'all',
      setSidebarItem: (item) => set({ sidebarItem: item }),

      // ── Search ────────────────────────────────────────────────────
      search: '',
      setSearch: (s) => set({ search: s }),

      // ── Drafts ───────────────────────────────────────────────────
      drafts: {},
      saveDraft: (draft) =>
        set((s) => ({ drafts: { ...s.drafts, [draft.questionId]: draft } })),
      clearDraft: (questionId) =>
        set((s) => {
          const drafts = { ...s.drafts }
          delete drafts[questionId]
          return { drafts }
        }),

      // ── Attempts ─────────────────────────────────────────────────
      attempts: [],
      recordAttempt: (a) =>
        set((s) => ({ attempts: [a, ...s.attempts] })),

      // ── Video progress ────────────────────────────────────────────
      videoProgress: {},
      setVideoProgress: (id, s) =>
        set((state) => ({ videoProgress: { ...state.videoProgress, [id]: s } })),
      videoNotes: {},
      setVideoNotes: (id, notes) =>
        set((state) => ({ videoNotes: { ...state.videoNotes, [id]: notes } })),
    }),
    {
      name: 'aiprep-store',
      version: 2,
      migrate: (raw): PersistedShape => {
        // v1 persisted selectedQuestionId; drop it so it doesn't pollute the store
        const rest = { ...(raw as PersistedShape) }
        delete rest.selectedQuestionId
        return rest
      },
      partialize: (s) => ({
        drafts: s.drafts,
        attempts: s.attempts,
        sidebarItem: s.sidebarItem,
        videoProgress: s.videoProgress,
        videoNotes: s.videoNotes,
      }),
    }
  )
)
