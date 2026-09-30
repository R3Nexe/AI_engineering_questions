# AIPrep Design System

> Style prompt slug: **`terminal`** (Superdesign library). Adapted from the Terminal CLI direction — retaining the dense, monospace-accented, dark IDE character while discarding retro CRT gimmicks (no neon-green foreground, no scanlines, no blinking cursors, no ALL-CAPS body). The result is a serious developer tool aesthetic, not a Halloween costume.

---

## 1. Product Context

**AIPrep** is a self-study tool for AI engineering and system design interview preparation. It provides:

- **Library** (`/`): searchable question bank, filterable by category, difficulty, mastery
- **Practice** (`/q/[id]`): timer-driven session with answer textarea, dictation, self-grade 1–5, Excalidraw whiteboard, fullscreen mode
- **Concepts** (`/concepts`, `/concepts/[id]`): topic mastery tree, concept detail with related questions and videos
- **Progress** (`/progress`): streak, activity heatmap, category mastery, "needs attention" list
- **Videos** (`/videos`, `/videos/[id]`): curated YouTube library with status + 40% notes/whiteboard sidebar
- **Glossary** (`/glossary`): 102 terms in 8 AI/ML engineering categories, A–Z nav
- **Answers** (`/answers`, `/answers/[id]`): markdown reference answers with evaluation rubrics

**Visitor mode:**
- `/q/[id]`, `/concepts/[id]`, `/videos/[id]`, progress, library → **Operate** (user is completing a task)
- `/glossary`, `/answers/[id]`, `/concepts/[id]` reading → **Read** (user is referencing material)

**JTBD:**
1. *Practice without friction* — start a timed question session in one keypress, submit/reveal without clicking through dialogs.
2. *Know what to study next* — mastery state visible at a glance; "needs attention" surfaced on the dashboard.
3. *Reference a term or answer fast* — glossary and answers consulted mid-session; must load and filter in under 500ms.
4. *Track real progress* — streak and mastery % are the only two numbers that matter; all other metrics are secondary.

**User:** SWE with 2–8 YOE, studying in 30–90 min desktop sessions, keyboard-native, skeptical of glossy tools.

---

## 2. Color System

### Strategy: Restrained

Near-black ground, one warm signal-orange accent (hue 24°, desaturated), semantic palette for status. No decorative color. Cyan-on-dark and violet are explicitly excluded.

### 2.1 Surface Tokens

| Token | Hex | L (relative luminance) | Role |
|---|---|---|---|
| `--bg-deep` | `#0b0d0f` | 0.0021 | Page canvas — outermost body background |
| `--bg-base` | `#111318` | 0.0049 | Primary content surface |
| `--bg-raised` | `#1a1d23` | 0.0122 | Sidebar, panels, toolbar |
| `--bg-overlay` | `#22262e` | 0.0205 | Dropdowns, modals, hover fill, code blocks |
| `--accent-subtle` | `#231508` | 0.0088 | Active row / selected item background (warm orange tint) |

### 2.2 Border Tokens

| Token | Hex | Role |
|---|---|---|
| `--border-faint` | `#1e2228` | Hairline dividers within panels |
| `--border-default` | `#2a2f38` | Standard pane edges, table row rules |
| `--border-strong` | `#404854` | Focus indicators, active pane borders |

### 2.3 Text Tokens

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#e4e8ef` | Body text, headings, question prompts |
| `--text-secondary` | `#8892a4` | Metadata, labels, muted copy |
| `--text-dim` | `#6b7585` | Disabled states, placeholders only |
| `--text-inverse` | `#0b0d0f` | Text on accent-filled buttons |

### 2.4 Accent Token (ONE — used sparingly)

| Token | Hex | Role |
|---|---|---|
| `--accent` | `#e8813c` | Active nav, text links, focus ring, primary button background |

`--accent` is used for:
- The active nav item's background (`accent-subtle`) and text color
- Text links in prose (`answers/[id]`, `concepts/[id]`)
- The focus ring (`outline: 2px solid var(--accent)`)
- The primary action button background (e.g. "Submit", "Practice")
- Active tab background fill
- `<code>` inline text color

`--accent` is **NOT** used for:
- Decorative badges or category chips
- Progress bars (those use `--status-done`)
- Headings or section labels
- Hover fills (those use `--bg-overlay`)

### 2.5 Semantic Status Tokens

| Token | Hex | Mastery state | Difficulty |
| `--status-new` | `#8892a4` | New / not started | — |
| `--status-partial` | `#facc15` | Attempted / in-progress | Medium |
| `--status-done` | `#22c55e` | Mastered / completed | Easy |
| `--diff-hard` | `#ef4444` | — | Hard |

Status is shown as a 6×6px SVG circle + inline text label. Never as a colored pill with rounded chrome.

### 2.6 WCAG AA Contrast Table

All primary reading and interactive pairs verified. Ratio threshold: 4.5:1 for text, 3:1 for large text and UI components.

| Foreground | Hex | Background | Hex | Ratio | Pass |
|---|---|---|---|---|---|
| text-primary | `#e4e8ef` | bg-deep | `#0b0d0f` | **15.84:1** | ✓ AA/AAA |
| text-primary | `#e4e8ef` | bg-base | `#111318` | **15.12:1** | ✓ AA/AAA |
| text-primary | `#e4e8ef` | bg-raised | `#1a1d23` | **13.74:1** | ✓ AA/AAA |
| text-primary | `#e4e8ef` | bg-overlay | `#22262e` | **12.34:1** | ✓ AA/AAA |
| text-secondary | `#8892a4` | bg-deep | `#0b0d0f` | **6.21:1** | ✓ AA |
| text-secondary | `#8892a4` | bg-base | `#111318` | **5.92:1** | ✓ AA |
| text-secondary | `#8892a4` | bg-raised | `#1a1d23` | **5.38:1** | ✓ AA |
| text-dim | `#6b7585` | bg-deep | `#0b0d0f` | 4.18:1 | ~ (disabled, AA-exempt per WCAG 1.4.3) |
| accent | `#e8813c` | bg-deep | `#0b0d0f` | **7.08:1** | ✓ AA |
| accent | `#e8813c` | bg-base | `#111318` | **6.76:1** | ✓ AA |
| accent | `#e8813c` | bg-raised | `#1a1d23` | **6.14:1** | ✓ AA |
| text-primary | `#e4e8ef` | accent-subtle | `#231508` | **14.45:1** | ✓ AA/AAA |
| accent | `#e8813c` | accent-subtle | `#231508` | **6.46:1** | ✓ AA |
| status-done | `#22c55e` | bg-base | `#111318` | **8.15:1** | ✓ AA |
| status-partial | `#facc15` | bg-base | `#111318` | **12.13:1** | ✓ AA/AAA |
| diff-hard | `#ef4444` | bg-base | `#111318` | **4.94:1** | ✓ AA |

---

## 3. Typography

### 3.1 Typefaces

| Role | Import | Weights used |
|---|---|---|
| UI / body / headings | **IBM Plex Sans** — `import { IBM_Plex_Sans } from 'next/font/google'` | 400, 500, 600 |
| Code / data / kbd / timer | **JetBrains Mono** — `import { JetBrains_Mono } from 'next/font/google'` | 400, 500 |

IBM Plex Sans is the prose voice: headings, body copy, button labels, nav items. JetBrains Mono is the data voice: question IDs, timer countdown, `<code>` spans, `<pre>` blocks, `<kbd>` hints, stat numbers, A–Z bar. Monospace carries function, not decoration.

### 3.2 Type Scale

| Step | px | rem | `font-family` | `font-weight` | Primary use |
|---|---|---|---|---|---|
| xs | 12 | 0.75rem | IBM Plex Sans | 400 | Chip labels, badge text, overline — minimum visible text |
| sm | 13 | 0.8125rem | IBM Plex Sans | 400 | Secondary body, captions, table metadata |
| base | 15 | 0.9375rem | IBM Plex Sans | 400 | Primary body copy, question prompt text |
| md | 18 | 1.125rem | IBM Plex Sans | 600 | Section headings, pane titles |
| lg | 22 | 1.375rem | IBM Plex Sans | 600 | Page title (one per page) |
| xl | 28 | 1.75rem | JetBrains Mono | 500 | Hero metrics (streak, mastery %) |
| 2xl | 36 | 2.25rem | JetBrains Mono | 400 | Timer display only |

Step ratios average 1.15–1.25. No body text below 13px. No chip/badge text below 12px.

### 3.3 Line Height & Tracking

| Context | `line-height` | `letter-spacing` |
|---|---|---|
| Body (IBM Plex Sans base) | 1.6 | 0 |
| Headings (md, lg) | 1.2 | −0.02em |
| Overline / section label | 1.0 | +0.08em |
| Monospace (JetBrains Mono) | 1.5 | 0 |

- Prose max-width: `65ch` — enforced on all running text (answers, concept descriptions, glossary definitions).
- Tracking floor: `−0.02em` — never go below `−0.04em`.
- No ALL-CAPS headings. Uppercase is limited to section overlines (e.g. `CATEGORY`, `DIFFICULTY`) at xs size, with +0.08em tracking, in `text-secondary`.

---

## 4. Spacing Scale

4px grid. All spacing values are multiples of 4.

| Token | px | CSS var | Tailwind approx. | Primary use |
|---|---|---|---|---|
| 1 | 4px | `--space-1` | `p-1` | Icon padding, tight inline gaps |
| 2 | 8px | `--space-2` | `p-2` | Button/chip internal padding |
| 3 | 12px | `--space-3` | `p-3` | Row cell padding, input internal |
| 4 | 16px | `--space-4` | `p-4` | Panel internal padding |
| 6 | 24px | `--space-6` | `p-6` | Between sections within a panel |
| 8 | 32px | `--space-8` | `p-8` | Between major layout regions |
| 12 | 48px | `--space-12` | `p-12` | Page-level outer padding (desktop) |

---

## 5. Border Radii

| Token | Value | Use |
|---|---|---|
| `--radius-0` | 0px | Pane borders, separators, table cell edges |
| `--radius-sm` | 2px | Status chips, tags |
| `--radius-md` | 4px | Buttons, inputs, kbd hints, code blocks |
| `--radius-lg` | 6px | Dropdown menus, modal containers |

No pill radii (`border-radius: 9999px`) on any element except toggled switches.

---

## 6. Borders & Dividers

- All borders are `1px solid`. No `2px` decorative borders on list items or callout boxes.
- Pane edge: `border-right: 1px solid var(--border-default)` — sidebar to main.
- Table row divider: `border-bottom: 1px solid var(--border-faint)`.
- Table header: `border-bottom: 1px solid var(--border-default)`.
- Blockquote exception: `border-left: 2px solid var(--accent)` with `padding-left: 12px` — used only for authored editorial callouts in reference answers, not for list items.
- Active tab: background fill (`bg-overlay`) — never a `border-bottom` stripe.
- Focus ring: `outline: 2px solid var(--accent); outline-offset: 2px` — no `ring-*` utility replacements.

---

## 7. Shadows

None. Depth communicated through background layering only. Zero `box-shadow` on any element.

---

## 8. Density Rules

Target: high-density, comparable to VS Code or GitHub's Issues list.

- Default list row height: **44px** (WCAG 2.5.5 target size minimum for desktop).
- Table cell padding: `12px 16px` (sm × base = `--space-3` × `--space-4`).
- No "breathing room" whitespace added purely for aesthetics.
- Sidebar minimum width: 220px; no collapse affordance on desktop (collapse only below 768px breakpoint).
- Content area minimum width: 480px before horizontal scroll.

---

## 9. Component Inventory

### 9.1 List rows (not cards)

Used in: Library (`/`), Answers (`/answers`), Answers index columns.

- Rendered as `<table>` or semantic `<ul>` with `role="list"`.
- Each row: `border-bottom: 1px solid var(--border-faint)`.
- Hover: `background: var(--bg-overlay)` — no scale, no shadow, no color change on text.
- Selected / active: `background: var(--accent-subtle)`.
- No `border`, no `border-radius`, no per-row background on default state.
- Columns: title (auto, text-primary), category (fixed 120px, text-secondary text-sm), difficulty (fixed 72px, status dot + label), mastery (fixed 80px, status dot + fraction), action (fixed 48px, icon button).

### 9.2 Status markers

- Rendered as: `<span class="status-dot" />` (6×6px SVG circle) + `<span class="status-label">` text inline.
- One status marker per item max.
- Never three pills side by side.
- Mastery states: `status-new` (gray dot, "new"), `status-partial` (yellow dot, "attempted"), `status-done` (green dot, "mastered").
- Difficulty states: `diff-easy` (green dot, "easy"), `diff-medium` (yellow dot, "medium"), `diff-hard` (red dot, "hard").

### 9.3 `kbd` hints

```html
<kbd>j</kbd>
```

CSS:
```css
kbd {
  font-family: var(--font-mono);
  font-size: 12px;               /* xs */
  background: var(--bg-overlay);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);  /* 4px */
  padding: 2px 6px;
  color: var(--text-secondary);
  line-height: 1.4;
}
```

Used in: sidebar footer (top 5 shortcuts), `?` overlay only. Never inline in prose.

### 9.4 Tables (data tables)

```
header row: bg-raised, text-xs text-secondary uppercase tracking-[0.08em]
data rows:  text-sm text-primary, border-bottom border-faint
hover:      bg-overlay
selected:   accent-subtle
```

- `border-collapse: collapse`.
- No outer table border — pane provides containment.
- Sortable header cells: chevron icon suffix (12px, stroke-1.5), `cursor: pointer`, hover `text-primary`.
- Sticky header on scroll within panel.

### 9.5 Tab bar

```
container:  bg-raised, border-bottom: 1px solid var(--border-default), height: 40px
tab item:   px-4, text-sm, text-secondary, cursor-pointer
tab active: bg-overlay, text-primary, font-medium
```

No `border-bottom` stripe. Active state is background fill only.

### 9.6 Command bar / search

```
container:  full-width, height: 36px, bg-overlay, border: 1px solid var(--border-default), border-radius: var(--radius-md)
icon:       magnifier SVG, 14px, stroke-1.5, text-secondary, left: 12px
input:      text-sm text-primary, placeholder text-dim, no inner border
```

- Activated globally by `/` key.
- Live filter — no "Search" button.
- Placeholder text: `filter questions…` / `search glossary…` (lowercase, no trailing slash).
- Clear button (×) appears on right when value is non-empty.

### 9.7 Timer

```
container:  bg-raised, border: 1px solid var(--border-default), px-6 py-4, inline-flex items-center gap-4
display:    font-mono, text-2xl (36px), text-primary
running:    text-primary, normal weight
paused:     text-secondary
expired:    color: var(--diff-hard), animation: pulse 1s linear infinite (opacity 1→0.6)
controls:   text-sm text-secondary kbd hints: [Space] start/pause  [r] reset
```

### 9.8 Progress representation

**Activity heatmap:** Cells 10×10px, `border-radius: 2px`, gap 2px. Color: `bg-overlay` (0 sessions), `#1e4620` (1 session), `status-done` (2+). Tooltip on hover shows date + count.

**Mastery bar (concept detail only):**
```css
height: 4px;
background: var(--bg-overlay); /* track */
border-radius: 2px;
/* fill */ background: var(--status-done);
```

**Index fraction:** Plain text `(n/N mastered)` in `text-sm text-secondary` — no bar on list rows.

**Streak:** JetBrains Mono, `text-xl` (28px), `font-semibold text-primary`. Label: `text-xs text-secondary` below.

**Category donut / bar on progress page:** 4px height horizontal bar, `border-radius: 2px`, in `status-done` fill on `bg-overlay` track. Width = mastery %. No pie charts.

### 9.9 Buttons

**Primary (CTA — submit, practice, start):**
```css
background: var(--accent);
color: var(--text-inverse);
border-radius: var(--radius-md); /* 4px */
padding: 8px 16px;
font-size: 13px;
font-weight: 500;
border: none;
```
Hover: `opacity: 0.9`. Active: `opacity: 0.8`. Disabled: `background: var(--bg-overlay); color: var(--text-dim)`.

**Secondary (reveal, filter, cancel):**
```css
background: transparent;
color: var(--text-secondary);
border: 1px solid var(--border-default);
border-radius: var(--radius-md);
padding: 8px 16px;
font-size: 13px;
```
Hover: `background: var(--bg-overlay); color: var(--text-primary)`.

**Ghost (icon-only, row actions):**
```css
background: transparent;
color: var(--text-secondary);
border: none;
padding: 4px;
border-radius: var(--radius-md);
```
Hover: `background: var(--bg-overlay); color: var(--text-primary)`.

### 9.10 Inputs & Textareas

```css
background: var(--bg-overlay);
border: 1px solid var(--border-default);
border-radius: var(--radius-md);
color: var(--text-primary);
font-size: 15px;
padding: 8px 12px;
```
Focus: `border-color: var(--accent); outline: 2px solid var(--accent); outline-offset: 0`.
Placeholder: `color: var(--text-dim)`.

Answer textarea: `font-family: var(--font-mono); font-size: 13px; line-height: 1.5; min-height: 200px`.

### 9.11 Self-grade picker (1–5)

Five ghost buttons labeled `1`–`5` in a row. Keyboard shortcut `1`–`5` to select. Selected state: `bg: var(--accent-subtle); border-color: var(--accent); color: var(--accent)`. Labels below: `1=poor`, `3=ok`, `5=mastered` in `text-xs text-secondary`.

### 9.12 A–Z navigation bar (glossary)

Monospaced single-letter links in a flex row. Each: `font-mono text-sm text-secondary`, hover `text-primary`. Active letter: `text-primary font-medium`. Inactive letter with no terms: `text-dim cursor-not-allowed`. Background: `bg-raised border-b border-default`. Height: 40px.

### 9.13 Excalidraw whiteboard panel

- Panel `bg: var(--bg-deep)` — deepest surface, matching Excalidraw's dark theme.
- Resize handle: 4px wide, `bg: var(--border-default)`, hover `bg: var(--accent)`.
- Toolbar overlap from Excalidraw itself; do not override its internal UI.
- Panel header bar (40px): `bg-raised border-b border-default`, shows `[e] whiteboard` label (`text-sm text-secondary`) and a fullscreen icon.

### 9.14 Video card (grid — only place cards are used)

```
container:  bg-raised, border: 1px solid var(--border-default), border-radius: var(--radius-md), overflow: hidden
thumbnail:  aspect-ratio: 16/9, width: 100%, object-fit: cover
body:       padding: 12px
title:      text-base font-semibold text-primary
channel:    text-xs text-secondary
status:     status-dot + text-sm text-secondary, no pill chrome
duration:   text-xs text-secondary font-mono, right-aligned
tags:       text-xs text-secondary, comma-separated inline text — no chip chrome
```

Hover: `border-color: var(--border-strong)`. No thumbnail scale transform.

### 9.15 Sidebar

```
width:      220px (fixed)
background: var(--bg-raised)
border:     border-right: 1px solid var(--border-default)
```

Nav item default: `px-3 py-2 text-sm text-secondary rounded-0`.
Nav item hover: `bg-overlay text-primary`.
Nav item active: `bg-accent-subtle text-primary font-medium` + left-side `2px solid var(--accent)` inset — THIS is the one place a narrow left-accent line is used, at 2px, inset inside the item, indicating active location.

Logo / title area: `text-base font-semibold text-primary`, `JetBrains_Mono`, `padding: 16px 12px`.

Footer: keyboard hint block — top 5 shortcuts in `kbd` elements, `text-xs text-secondary`.

### 9.16 `?` Keyboard shortcut overlay

A `<dialog>` element, `bg-raised border border-strong rounded-lg`, `max-width: 480px`. Content: a two-column `<table>` — `<kbd>` on left (fixed 100px), description on right (`text-sm text-primary`). Section headers: `text-xs text-secondary uppercase tracking-[0.08em]`. Closed by `Escape` or clicking outside.

### 9.17 Empty states

No illustrations. No centered large icons.

Pattern:
```
text-sm text-secondary, centered in panel:
"no questions match — clear filter"
[clear filter] (ghost button or underlined text link)
```

Command bar stays visible and focused. Error states name the problem and the recovery action in `text-sm`.

---

## 10. Motion

Minimal. Fast. State-change only.

| Event | Duration | Easing | Property |
|---|---|---|---|
| Row hover fill | 80ms | ease-out | background-color |
| Tab switch fill | 100ms | ease-out | background-color |
| Dropdown open | 120ms | ease-out | opacity + translateY(−4px) |
| Focus ring | 80ms | ease-out | outline-color |
| Timer pulse (expired) | 1s | linear | opacity 1→0.6 |

- No page-load orchestrated entrances.
- No stagger on list items.
- No hover transforms on images or cards.
- No scroll-triggered animations.
- `prefers-reduced-motion: reduce` → all transitions set to `0ms`; timer pulse removed.

---

## 11. Keyboard-First Design

These affordances are DESIGN commitments — visible in the UI chrome, implemented in JS behavior.

| Key | Scope | Action |
|---|---|---|
| `/` | Global | Focus search/command bar |
| `j` | List views | Move selection down |
| `k` | List views | Move selection up |
| `Enter` | List views | Open selected item |
| `Escape` | Global | Close overlay / blur search / deselect row |
| `?` | Global | Toggle keyboard shortcut overlay |
| `Space` | Practice view | Start / pause timer |
| `r` | Practice view | Reset timer |
| `f` | Practice view | Toggle fullscreen |
| `e` | Practice view | Focus Excalidraw whiteboard |
| `Tab` / `Shift-Tab` | Split views | Move focus between panes |
| `1`–`5` | Practice (after reveal) | Self-grade |
| `n` | Practice view | Next question |
| `p` | Practice view | Previous question |

Sidebar footer shows top 5 active shortcuts as `<kbd>` hints. The `?` overlay shows the full table.

All interactive elements: keyboard-focusable, visible focus ring at `2px solid var(--accent)`.

---

## 12. BANS (Hard — No Brief Earns These Back)

Derived from the detect report (916 findings) and the terminal/IDE visual direction. These apply to every file in this project.

1. **No violet or purple on any element.** Not for active state, not for badges, not for links, not for borders, not for progress bars, not for focus rings.
2. **No pill soup.** `border-radius: 9999px` is banned on badges, chips, and category labels. Maximum one status indicator per list item.
3. **No text below 12px.** Chip labels, tag text, badge text — minimum `text-xs` (12px). `text-[10px]` is banned globally.
4. **No uniform bordered rounded cards for list content.** Cards (4px radius, border, background) are for the video grid only.
5. **No gray-on-color.** Text on any colored background must use `--text-primary` or `--text-inverse`. Never `text-zinc-*` / `text-gray-*` on a tinted surface.
6. **No `border-l-2` or `border-r-2` as decoration on list items or callout cards.**
7. **No `border-bottom` stripe as an active tab indicator.**
8. **No hover hue-shift on headings.** Heading-links: underline on hover only.
9. **No emoji in UI chrome.** SVG icons only, consistent stroke weight.
10. **No flat type hierarchy.** Every screen must use at least 3 distinct type sizes, each step ≥ 1.2×.
11. **No `zinc-500` (#71717b) on dark backgrounds.** Fails AA. Use `--text-secondary` (#8892a4) instead.
12. **No `overflow-hidden` on non-scroll containers.** Tooltips, dropdowns, and popovers escape via `position: fixed` or `<dialog>`.
13. **No progress bars below 4px height.**
14. **No gradient text.** Emphasis = weight or size.
15. **No scattered hover effects.** Hover state = background fill or text underline only, never scale, translate, or color change on decorative elements.
16. **No decorative `border-left` callout cards.** The only `border-left` exception is the 2px active nav item indicator in the sidebar and the 2px blockquote accent in reference answers.
17. **No box shadows.** Depth from background layering only.
