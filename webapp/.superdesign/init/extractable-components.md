# Extractable Components

Components that appear on multiple pages or define shared UI patterns — candidates for Superdesign `DraftComponent` extraction.

---

## Layout Components (appear on most/all pages)

### Sidebar
- Source: `src/components/Sidebar.tsx`
- Category: layout
- Description: Left navigation panel with app branding, nav links, question search, practice filter, and topics list
- Extractable props: `activeHref` (string, current pathname), `sidebarItem` (string, active filter id), `search` (string)
- Hardcoded: nav items (Library/Concepts/Progress/Videos/Glossary/Answers), section labels ("Practice", "Topics"), "AI Prep" title, all Tailwind classes

### AppShell / Providers
- Source: `src/components/Providers.tsx`
- Category: layout
- Description: Root layout shell — `h-screen flex` with fixed `w-64` sidebar + `flex-1` main area
- Extractable props: none (structural only)
- Hardcoded: sidebar width (`w-64`), border color (`border-zinc-800`), flex layout, body background

### ResizableSplit
- Source: `src/components/ResizableSplit.tsx`
- Category: layout
- Description: Horizontal two-panel split with draggable divider; used in `/q/[id]` and `/videos/[id]`
- Extractable props: `initialRightPct` (number, default 40), `minPct` (number, default 20), `storageKey` (string)
- Hardcoded: divider width (`w-1`), violet active color, drag cursor class

---

## Basic Components (used across pages)

### MasteryBar
- Source: `src/components/concepts/MasteryBar.tsx`
- Category: basic
- Description: Thin horizontal progress bar showing mastered/total with numeric label; used in /concepts, /concepts/[id], /progress
- Extractable props: `mastered` (number), `total` (number), `className` (string, optional)
- Hardcoded: bar height (`h-1.5`), fill color (`violet-500`), label style (`text-xs text-zinc-500`)

### ActivityHeatmap
- Source: `src/components/concepts/ActivityHeatmap.tsx`
- Category: basic
- Description: 12-week GitHub-style activity calendar; used in /progress
- Extractable props: `attempts` (AttemptRecord[])
- Hardcoded: 12-week window, Mon-aligned grid, violet heatmap color scale, cell size (14×14px), day/month labels

### TermCard
- Source: `src/components/glossary/TermCard.tsx`
- Category: basic
- Description: Glossary term card with definition, example blockquote, concept links, related chips; used in /glossary
- Extractable props: `highlighted` (boolean), `onRelatedClick` (fn)
- Hardcoded: card border color, blockquote left border (`border-violet-500`), chip styles, concept link style

### AZBar
- Source: `src/components/glossary/AZBar.tsx`
- Category: basic
- Description: 26-letter jump bar for scrolling to glossary sections; used in /glossary
- Extractable props: `available` (Set\<string\>)
- Hardcoded: full alphabet, button/span sizing (`w-6 h-6`), hover violet, inactive zinc-700

### CategoryChips
- Source: `src/components/glossary/CategoryChips.tsx`
- Category: basic
- Description: Pill-style category filter strip with "All" + per-category chips and counts; used in /glossary
- Extractable props: `active` (string | null), `onSelect` (fn)
- Hardcoded: chip sizes, violet active/zinc inactive colors, count display

### SearchBox
- Source: `src/components/glossary/SearchBox.tsx`
- Category: basic
- Description: Search input with magnifier SVG icon at left; used in /glossary
- Extractable props: `value` (string), `onChange` (fn)
- Hardcoded: placeholder text, icon, border/focus colors, padding

### VideoCard
- Source: `src/components/videos/VideoCard.tsx`
- Category: basic
- Description: Video grid card with YouTube thumbnail (16:9), level badge, title, channel, concept chips, status control; used in /videos
- Extractable props: `video` (Video), `status` (VideoStatus), `onStatusChange` (fn)
- Hardcoded: thumbnail URL pattern (`i.ytimg.com`), level badge colors (emerald/amber/red), card border/hover style, rounded-xl

### StatusControl
- Source: `src/components/videos/StatusControl.tsx`
- Category: basic
- Description: Segmented 3-button toggle for video status (Not started / Partial / Completed); used in /videos and /videos/[id]
- Extractable props: `status` (VideoStatus), `onChange` (fn), `size` ('sm' | 'md', default 'sm')
- Hardcoded: option labels and values, colors (zinc / amber / emerald), border-radius, font size

### LibraryView (question list)
- Source: `src/components/LibraryView.tsx`
- Category: basic
- Description: Scrollable question list with difficulty filter pills and question rows; primary content for `/`
- Extractable props: driven entirely by Zustand store (no direct props)
- Hardcoded: difficulty filter options, row layout (dot + title + badge + time), card hover colors

### WhiteboardPanel
- Source: `src/components/WhiteboardPanel.tsx`
- Category: basic
- Description: Excalidraw-based whiteboard with localStorage persistence, export PNG, and Document PiP support; used in /q/[id] and /videos/[id]
- Extractable props: `storageKey` (string)
- Hardcoded: debounce interval (800ms), toolbar button styles, fullscreen transition, loading skeleton

### VideoSidebar
- Source: `src/components/videos/VideoSidebar.tsx`
- Category: basic
- Description: Notes/Whiteboard tab panel shown in video detail split; used in /videos/[id]
- Extractable props: `videoId` (string), `iframeRef` (RefObject)
- Hardcoded: tab labels, tab indicator style (border-b-2 border-violet-500), both panels kept mounted

### Markdown
- Source: `src/components/answers/Markdown.tsx`
- Category: basic
- Description: Custom markdown renderer for answer content; used in /answers/[id]
- Extractable props: `content` (string), `className` (string, optional)
- Hardcoded: all element styles (heading sizes, code block bg, inline code violet-300, blockquote, lists)
