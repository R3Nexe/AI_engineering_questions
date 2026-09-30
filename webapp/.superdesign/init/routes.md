# Routes

## Framework
Next.js 16.3.6 (App Router, file-based routing under `src/app/`).

## Router Config
File-based only — no `router/index.ts` or separate route config file.

## Path Alias
`@/` maps to `src/` (via `tsconfig.json` `paths`).

## Root Layout
- **File:** `src/app/layout.tsx`
- **Applied to:** All routes
- **Wraps:** `Providers` → renders `Sidebar` (left `w-64`) + `<main>` (flex-1)
- **Body classes:** `h-full bg-zinc-950 text-zinc-100 antialiased`

---

## Route Table

| URL | File | Page Component | Layout |
|---|---|---|---|
| `/` | `src/app/page.tsx` | `LibraryView` | Providers (Sidebar + main) |
| `/q/[id]` | `src/app/q/[id]/page.tsx` | `QuestionPage` | Providers (Sidebar + main) |
| `/concepts` | `src/app/concepts/page.tsx` | `ConceptsPage` | Providers (Sidebar + main) |
| `/concepts/[id]` | `src/app/concepts/[id]/page.tsx` | `ConceptDetailPage` | Providers (Sidebar + main) |
| `/progress` | `src/app/progress/page.tsx` | `ProgressPage` | Providers (Sidebar + main) |
| `/videos` | `src/app/videos/page.tsx` | `VideosPage` | Providers (Sidebar + main) |
| `/videos/[id]` | `src/app/videos/[id]/page.tsx` | `VideoDetailPage` | Providers (Sidebar + main) |
| `/glossary` | `src/app/glossary/page.tsx` | `GlossaryPage` | Providers (Sidebar + main) |
| `/answers` | `src/app/answers/page.tsx` | `AnswersPage` | Providers (Sidebar + main) |
| `/answers/[id]` | `src/app/answers/[id]/page.tsx` | `AnswerDetailPage` | Providers (Sidebar + main) |

---

## Route Descriptions

### `/` — Library
Entry: `src/app/page.tsx` → `LibraryView`
- Renders a scrollable list of interview questions.
- Sidebar controls active filter (Daily Practice / All / by category) and search.
- Difficulty filter pills (All / Easy / Medium / Hard) in content area.
- Each question row shows: difficulty dot, title, attempted checkmark, format badge, time limit.
- Clicking a row navigates to `/q/[id]`.

### `/q/[id]` — Question / Interview
Entry: `src/app/q/[id]/page.tsx` → `QuestionPage`
- Two-panel resizable split (default 55% left / 45% right).
- **Left panel:** `InterviewView` — question prompt, answer textarea with voice dictation, scratchpad/notes tabs, timer, submit + self-grade flow.
- **Right panel:** `WhiteboardPanel` — Excalidraw whiteboard (dynamically loaded, `ssr: false`).
- Split ratio persisted to localStorage key `split_interview`.

### `/concepts` — Concepts Tree
Entry: `src/app/concepts/page.tsx` → `ConceptsPage`
- Hierarchical tree of AI concepts grouped by root category.
- Each root group is collapsible; leaf nodes show mastery bar + question count.
- Links to `/concepts/[id]` for each leaf.

### `/concepts/[id]` — Concept Detail
Entry: `src/app/concepts/[id]/page.tsx` → `ConceptDetailPage`
- Breadcrumb navigation (parent → current).
- Mastery bar for the concept.
- Child concept cards (if any), question list (grouped by difficulty), related videos, glossary terms.

### `/progress` — Progress Dashboard
Entry: `src/app/progress/page.tsx` → `ProgressPage`
- Overall stats: questions attempted, mastered, video progress.
- Activity heatmap (12-week calendar grid).
- Weak concepts list (5 weakest leaf nodes).
- Recent attempts (last 10) with grade + duration.

### `/videos` — Video Library
Entry: `src/app/videos/page.tsx` → `VideosPage`
- Grid of video cards with thumbnail, title, channel, concept chips, status control.
- Filter bars: topic (root concept), level (Beginner / Intermediate / Advanced), status (Not started / Partial / Completed).

### `/videos/[id]` — Video Detail
Entry: `src/app/videos/[id]/page.tsx` → `VideoDetailPage`
- Back nav breadcrumb (← Videos | title).
- Resizable split (default 60% left / 40% right), stored as `split_video`.
- **Left:** `VideoPlayer` — YouTube embed (privacy-enhanced), status control, PiP button.
- **Right:** `VideoSidebar` — tabbed Notes (textarea with timestamp insertion) / Whiteboard.

### `/glossary` — Glossary
Entry: `src/app/glossary/page.tsx` → `GlossaryPage`
- Search box, category chip filters, A–Z jump bar.
- Terms grouped by category, each as a `TermCard` (term, aliases, definition, example, related chips).
- URL hash `#termId` scrolls to term on load.

### `/answers` — Answer Browser
Entry: `src/app/answers/page.tsx` → `AnswersPage`
- Lists all questions with attempt status (New / Attempted / Mastered).
- Search + category dropdown + difficulty filter.
- Each row links to `/answers/[id]`.

### `/answers/[id]` — Answer Detail
Entry: `src/app/answers/[id]/page.tsx` → `AnswerDetailPage`
- Full question detail: prompt, expected answer (Markdown-rendered), key points, follow-ups, sources.
- Concept links to `/concepts/[id]`.
- Attempt history with grade badge + duration.
- In-progress draft preview toggle.
