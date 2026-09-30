# Pages

Dependency trees for all 10 routes. Line counts shown in parens.
Path alias `@/` = `src/`. All pages are `'use client'` unless noted.
Shared root layout wrapping every route: `src/app/layout.tsx` (15) → `src/components/Providers.tsx` (24) → `src/components/Sidebar.tsx` (111).

---

## / (Home — Library)

Entry: `src/app/page.tsx` (5)
Dependencies:
- `src/components/LibraryView.tsx` (108)
  - `src/store.ts` (106) [Zustand store — pack, sidebarItem, search, attempts]
  - `src/types.ts` (108) [DIFFICULTY_COLOR, FORMAT_LABEL, Difficulty type]

**Total unique files:** 4 (excl. layout shell)
**What it renders:** Question list with sidebar-driven filter, difficulty pill filter, question rows (dot + title + format badge + time).

---

## /q/[id] (Question / Interview)

Entry: `src/app/q/[id]/page.tsx` (67)
Dependencies:
- `src/store.ts` (106)
- `src/components/InterviewView.tsx` (310)
  - `src/store.ts` (106) [saveDraft, clearDraft, recordAttempt, drafts]
  - `src/types.ts` (108) [Question, SelfGrade, GRADE_LABELS, DIFFICULTY_COLOR]
- `src/components/ResizableSplit.tsx` (110)
- `src/components/WhiteboardPanel.tsx` (191) [dynamic, ssr: false]
  - `@excalidraw/excalidraw` [external — Excalidraw canvas]

**Total unique files:** 5 (excl. layout shell, excl. node_modules)
**What it renders:** Resizable two-panel split — left: interview Q&A with timer, answer textarea, scratchpad tabs, post-submit grading; right: Excalidraw whiteboard.

---

## /concepts (Concepts Tree)

Entry: `src/app/concepts/page.tsx` (268)
Dependencies:
- `src/lib/data.ts` (60) [useConcepts, useVideos hooks — fetch /concepts.json, /videos.json]
- `src/store.ts` (106) [useStore — pack, attempts, videoProgress]
- `src/lib/progress.ts` (175) [conceptStats utility]
- `src/components/concepts/MasteryBar.tsx` (26)
- `src/types.ts` (108) [ConceptNode, Question, AttemptRecord, Video, VideoStatus]

**Total unique files:** 6 (excl. layout shell)
**What it renders:** Collapsible root concept groups, leaf rows with mastery bar + question count + video count, links to `/concepts/[id]`.

---

## /concepts/[id] (Concept Detail)

Entry: `src/app/concepts/[id]/page.tsx` (178)
Dependencies:
- `src/lib/data.ts` (60) [useConcepts, useGlossary, useVideos]
- `src/store.ts` (106) [useStore — pack, attempts, videoProgress]
- `src/lib/progress.ts` (175) [conceptStats]
- `src/components/concepts/MasteryBar.tsx` (26)
- `src/types.ts` (108) [ConceptNode, Question, AttemptRecord, Video, GlossaryTerm, Difficulty, GRADE_LABELS, DIFFICULTY_COLOR]

**Total unique files:** 6 (excl. layout shell)
**What it renders:** Breadcrumb, mastery bar, child concept cards, question list by difficulty (QRow), related video list (VideoRow), glossary terms. All sub-components (Breadcrumb, QRow, VideoRow, ChildCard) are local to the file.

---

## /progress (Progress Dashboard)

Entry: `src/app/progress/page.tsx` (179)
Dependencies:
- `src/lib/data.ts` (60) [useConcepts, useVideos]
- `src/store.ts` (106) [useStore — pack, attempts, videoProgress]
- `src/lib/progress.ts` (175) [overallStats, conceptStats, recentAttempts]
- `src/components/concepts/MasteryBar.tsx` (26)
- `src/components/concepts/ActivityHeatmap.tsx` (119)
  - `src/types.ts` (108) [AttemptRecord]
- `src/types.ts` (108) [ConceptNode, Question, AttemptRecord, GRADE_LABELS]

**Total unique files:** 7 (excl. layout shell)
**What it renders:** Stats grid (questions attempted/mastered, videos in-progress), 12-week activity heatmap, weak concepts list (5 rows with MasteryBar), recent attempts (10 rows with grade color + duration). Local sub-components: AttemptRow, WeakConceptRow.

---

## /videos (Video Library)

Entry: `src/app/videos/page.tsx` (163)
Dependencies:
- `src/lib/data.ts` (60) [useVideos]
- `src/store.ts` (106) [useStore — videoProgress, setVideoProgress]
- `src/components/videos/VideoCard.tsx` (78)
  - `src/components/videos/StatusControl.tsx` (40)
  - `src/types.ts` (108) [Video, VideoStatus]
- `src/types.ts` (108) [Video, VideoStatus]

**Total unique files:** 6 (excl. layout shell)
**What it renders:** Three filter bars (topic chips, level pills, status pills), responsive grid of VideoCard components. Local sub-component: FilterBar (generic pill group).

---

## /videos/[id] (Video Detail)

Entry: `src/app/videos/[id]/page.tsx` (97)
Dependencies:
- `src/lib/data.ts` (60) [useVideos]
- `src/store.ts` (106) [useStore — videoProgress, setVideoProgress]
- `src/components/ResizableSplit.tsx` (110)
- `src/components/videos/VideoPlayer.tsx` (139)
  - `src/components/videos/StatusControl.tsx` (40)
  - `src/types.ts` (108) [Video, VideoStatus]
- `src/components/videos/VideoSidebar.tsx` (52)
  - `src/components/videos/VideoNotes.tsx` (117)
    - `src/store.ts` (106) [videoNotes, setVideoNotes]
  - `src/components/WhiteboardPanel.tsx` (191) [dynamic, ssr: false]

**Total unique files:** 9 (excl. layout shell, excl. node_modules)
**What it renders:** Back nav bar, resizable split — left: YouTube embed (privacy-enhanced) with status control + PiP button; right: tabbed Notes (textarea + timestamp insert) / Whiteboard.

---

## /glossary (Glossary)

Entry: `src/app/glossary/page.tsx` (149)
Dependencies:
- `src/lib/data.ts` (60) [useGlossary — fetches /glossary.json]
- `src/components/glossary/SearchBox.tsx` (34)
- `src/components/glossary/CategoryChips.tsx` (43)
  - `src/types.ts` (108) [GlossaryCategory, GlossaryTerm]
- `src/components/glossary/AZBar.tsx` (34)
- `src/components/glossary/TermCard.tsx` (75)
  - `src/types.ts` (108) [GlossaryTerm]
- `src/components/glossary/glossaryUtils.ts` (16) [flashAndScroll]
- `src/types.ts` (108) [GlossaryTerm]

**Total unique files:** 8 (excl. layout shell)
**What it renders:** Sticky toolbar (search + category chips + A–Z bar), scrollable list of term cards grouped by category with letter anchors.

---

## /answers (Answer Browser)

Entry: `src/app/answers/page.tsx` (138)
Dependencies:
- `src/store.ts` (106) [useStore — pack, attempts]
- `src/types.ts` (108) [DIFFICULTY_COLOR, Difficulty, Question]

**Total unique files:** 3 (excl. layout shell)
**What it renders:** Search input, category dropdown, difficulty filter pills, question rows with attempt status badge (New / Attempted / Mastered), links to `/answers/[id]`.

---

## /answers/[id] (Answer Detail)

Entry: `src/app/answers/[id]/page.tsx` (233)
Dependencies:
- `src/store.ts` (106) [useStore — pack, attempts, drafts]
- `src/lib/data.ts` (60) [useConcepts]
- `src/components/answers/Markdown.tsx` (118)
- `src/types.ts` (108) [DIFFICULTY_COLOR, FORMAT_LABEL, GRADE_LABELS, SelfGrade]

**Total unique files:** 5 (excl. layout shell)
**What it renders:** Breadcrumb (← Answers | category | title), prompt, expected answer via Markdown, key points list, follow-ups, sources, concept links, attempt history table with GradeBadge, draft preview toggle. Local sub-components: GradeBadge, Section.
