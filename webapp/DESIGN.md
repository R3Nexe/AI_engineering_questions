# Design

<!-- impeccable:design-schema 1 -->

## Visual World

**Engineer's Terminal / IDE** — the visual language of the tool the user already has open next to AIPrep: a dark editor with syntax-highlighted text, ruled separators, monospace metadata, and zero decorative chrome. Dense, deliberate, keyboard-first. The interface recedes so the question can take over.

Anti-reference: the current violet-on-zinc pill-soup (uniform rounded cards, badge overload, neon violet on every element, undersized tag text). That look signals "AI-generated demo". This system signals "built for engineers, by engineers".

Style prompt adapted from: **`terminal`** (Superdesign library slug). Adapted away from retro CRT/phosphor gimmicks toward a production IDE aesthetic.

---

## Color Strategy

**Restrained.** Near-black ground with layered neutral surfaces. One warm-orange accent for interactive affordances only — chosen because signal orange reads as "active cursor" in terminal and IDE contexts without triggering cyan-on-dark or violet-gradient AI-UI tells. Semantic palette for status. No decorative color.

### Surfaces (darkest → lightest)

| Token | Hex | Role |
|---|---|---|
| `--bg-deep` | `#0b0d0f` | Page canvas — outermost body background |
| `--bg-base` | `#111318` | Primary content surface — main area, answer pane |
| `--bg-raised` | `#1a1d23` | Secondary surface — sidebar, panels, toolbar |
| `--bg-overlay` | `#22262e` | Tertiary surface — dropdowns, modals, hover fill |
| `--accent-subtle` | `#231508` | Active row / selection background (warm orange tint) |

### Borders

| Token | Hex | Role |
|---|---|---|
| `--border-faint` | `#1e2228` | Hairline dividers between sibling panels |
| `--border-default` | `#2a2f38` | Standard pane edges, table row rules |
| `--border-strong` | `#404854` | Focus rings, active pane outlines |

### Text

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#e4e8ef` | Body text, headings, question prompts |
| `--text-secondary` | `#8892a4` | Metadata, labels, muted copy, timestamps |
| `--text-dim` | `#6b7585` | Disabled states, placeholders (AA-exempt) |
| `--text-inverse` | `#0b0d0f` | Text on accent fill (primary button label) |

### Accent (ONE functional color — used sparingly)

| Token | Hex | Role |
|---|---|---|
| `--accent` | `#e8813c` | Active nav item, text links, focus ring, primary button bg, active tab indicator background |

### Semantic Status

| Token | Hex | Role |
|---|---|---|
| `--status-new` | `#8892a4` | New / not started (same as text-secondary — intentionally low-key) |
| `--status-partial` | `#facc15` | Attempted / in progress |
| `--status-done` | `#22c55e` | Mastered / completed |

### Difficulty

| Token | Hex | Role |
|---|---|---|
| `--diff-easy` | `#22c55e` | Easy |
| `--diff-medium` | `#facc15` | Medium |
| `--diff-hard` | `#ef4444` | Hard |

### WCAG AA Contrast Ratios (all primary text/bg pairs)

| Foreground | Hex | Background | Hex | Ratio | WCAG AA |
|---|---|---|---|---|---|
| text-primary | `#e4e8ef` | bg-deep | `#0b0d0f` | 15.84:1 | ✓ |
| text-primary | `#e4e8ef` | bg-base | `#111318` | 15.12:1 | ✓ |
| text-primary | `#e4e8ef` | bg-raised | `#1a1d23` | 13.74:1 | ✓ |
| text-primary | `#e4e8ef` | bg-overlay | `#22262e` | 12.34:1 | ✓ |
| text-secondary | `#8892a4` | bg-deep | `#0b0d0f` | 6.21:1 | ✓ |
| text-secondary | `#8892a4` | bg-base | `#111318` | 5.92:1 | ✓ |
| text-secondary | `#8892a4` | bg-raised | `#1a1d23` | 5.38:1 | ✓ |
| text-dim | `#6b7585` | bg-deep | `#0b0d0f` | 4.18:1 | ~ (disabled, AA-exempt) |
| accent | `#e8813c` | bg-deep | `#0b0d0f` | **7.08:1** | ✓ |
| accent | `#e8813c` | bg-base | `#111318` | **6.76:1** | ✓ |
| accent | `#e8813c` | bg-raised | `#1a1d23` | **6.14:1** | ✓ |
| text-primary | `#e4e8ef` | accent-subtle | `#231508` | **14.45:1** | ✓ |
| accent | `#e8813c` | accent-subtle | `#231508` | **6.46:1** | ✓ |
| status-done | `#22c55e` | bg-base | `#111318` | 8.15:1 | ✓ |
| status-partial | `#facc15` | bg-base | `#111318` | **12.13:1** | ✓ |
| diff-hard | `#ef4444` | bg-base | `#111318` | 4.94:1 | ✓ |

---

## Typography

### Typefaces

| Role | Family | Source | Weights |
|---|---|---|---|
| UI / body / headings | **Inter Variable** (Linear OpenType stack) | `next/font/google` — `Inter` | 400, 500, 550, 600 |
| Code / data / metadata / kbd | **JetBrains Mono** | `next/font/google` — `JetBrains_Mono` | 400, 500 |

Inter Variable is configured with Linear's exact OpenType feature settings: `cv01` (one-legged 1), `cv02` (open 4), `cv03` (round 6), `cv04` (round 9), `cv11` (disambiguated I), `ss01` (flat-spur G), `ss03` (open curved r), and `case` (case-sensitive punctuation). JetBrains Mono is used for code blocks, inline code, timer digits, question IDs, keyboard hints, stat numbers, and tabular data.

### Type Scale (Linear-proportioned scale)

| Step | Size | rem | Use |
|---|---|---|---|
| xs | 12px | 0.75rem | Chip labels, badge text, keyboard hints — minimum for any visible text |
| sm | 13px | 0.8125rem | Secondary body, captions, table metadata |
| base | 15px | 0.9375rem | Primary body, question prompt |
| md | 18px | 1.125rem | Section headings, pane titles |
| lg | 22px | 1.375rem | Page titles |
| xl | 28px | 1.75rem | Hero numbers (streak count, mastery %) |
| 2xl | 36px | 2.25rem | Timer display only |

Step ratios are 1.08–1.25 — tight and appropriate for a dense product UI.

### Line Height & Tracking (Linear proportional tracking scale)

- Body (Inter): `line-height: 1.5`; tracking `-0.011em`
- Headings h1 (Inter): `line-height: 1.2`; tracking `-0.028em`; weight `550`
- Headings h2 (Inter): `line-height: 1.25`; tracking `-0.022em`; weight `550`
- Headings h3 (Inter): `line-height: 1.3`; tracking `-0.018em`; weight `550`
- Monospace (JetBrains Mono): `line-height: 1.5`; tracking `-0.01em` with `zero` 1
- Tabular numbers: `font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1, 'zero' 1`
- Uppercase labels: `letter-spacing: 0.05em` (used only for section overlines — sparingly)
- Body measure: 65–75ch; prose content max-width enforced at `72ch`

---

## Spacing

4px base unit. All spacing is a multiple of 4.

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Between inline elements, tight icon padding |
| `--space-2` | 8px | Component internal padding (button, chip) |
| `--space-3` | 12px | Row cell padding, form field internal |
| `--space-4` | 16px | Section internal padding, list item height |
| `--space-6` | 24px | Between sections within a panel |
| `--space-8` | 32px | Between major surface regions |
| `--space-12` | 48px | Page-level outer padding |

---

## Radii

Terminal-tight. No pill shapes on non-interactive elements.

| Token | Value | Use |
|---|---|---|
| `--radius-0` | 0px | Pane borders, table borders, dividers |
| `--radius-sm` | 2px | Tags/chips only |
| `--radius-md` | 4px | Buttons, inputs, kbd hints |
| `--radius-lg` | 6px | Dropdown menus, modal containers |

Cards (in the video grid) use `--radius-md` (4px). The library/glossary/answers rows use `--radius-0`.

---

## Borders & Dividers

- Single 1px borders throughout. Never 2px decorative borders.
- No colored `border-left` on callouts or list items (detect-report finding). Use background tint instead.
- Pane separators: `border-right: 1px solid var(--border-default)` on sidebar.
- Table row dividers: `border-bottom: 1px solid var(--border-faint)`.
- Active tab indicator: background fill (`var(--bg-overlay)`) — not a `border-bottom` stripe.
- Focus ring: `outline: 2px solid var(--accent)` with `outline-offset: 2px`.

---

## Shadows

None. Depth is communicated through surface layering (`bg-deep` → `bg-base` → `bg-raised` → `bg-overlay`). A flat hierarchy with no box-shadows is correct here — shadows belong to the physical world, not a terminal.

---

## Layout

### Shell

```
┌─ Sidebar (220px, bg-raised) ──┬─ Main content (flex 1, bg-base) ─┐
│  Logo · Nav items             │  Route content                    │
│  ─────────────────            │                                    │
│  Progress summary             │                                    │
└───────────────────────────────┴────────────────────────────────────┘
```

- Sidebar is fixed-width (220px), `bg-raised`, `border-right: 1px solid var(--border-default)`.
- Main area is `bg-base`, full remaining width.
- No nested sidebars. The `/q/[id]` practice view splits main into question pane + whiteboard pane (resizable, default 60/40).
- The `/videos/[id]` view splits into a 60% player + 40% sidebar (notes / whiteboard tabs).

### Page regions

- Page title: `text-lg font-semibold text-primary` at top of main, followed by a `border-bottom: 1px solid var(--border-faint)` separator.
- Command / search bar: fixed at top of main area (not a floating modal by default). Focused by `/` key.
- Content: scrolls within main area; sidebar is fixed.

---

## Density

**High.** The target user is comfortable with VS Code, `htop`, and terminal multiplexers. Default row height for list items: 44px (matching desktop click targets per WCAG 2.5.5). Compact mode (36px rows) available via toggle for power users. No whitespace added for "breathing room" unless it aids scan.

Table rows in list views (library, answers, glossary) show 4–6 columns of data at base (15px) or sm (13px) size. No empty-state padding paragraphs.

---

## Components

### List rows (not cards)

Question index, answer index, and glossary use a plain ruled `<table>` or `<ul>` with `border-bottom` dividers. No `border`, no `rounded-*`, no `bg-raised` applied per-row. Hover state: `bg-overlay` fill. Active/selected state: `accent-subtle` fill.

### Status markers

One status indicator per item maximum. Format: a 6px×6px filled circle (SVG `<circle>`) in the semantic color, followed by the status label inline as `text-sm text-secondary`. Never three pills side by side for the same datum.

### `kbd` hints

```
<kbd>j</kbd>
```

Styled as: `font-mono text-xs bg-overlay border border-default rounded-md px-1.5 py-0.5 text-secondary`. Displayed in the sidebar footer and the `?` overlay. Never in prose.

### Tables

`<table>` with `border-collapse: collapse`. Header row: `text-xs uppercase tracking-[0.08em] text-secondary bg-raised`. Data rows: `text-sm text-primary`, `border-bottom: 1px solid var(--border-faint)`. Sortable columns get an icon suffix (chevron, 12px). No outer border on the table itself — pane edges provide containment.

### Tab bar

Background fill for active tab: active tab gets `bg-overlay` + `text-primary font-medium`; inactive tabs get `text-secondary`. No `border-bottom` stripe anywhere. Tabs sit within a `bg-raised` bar, separated by `border-bottom: 1px solid var(--border-default)`.

### Command bar / search

A full-width input at the top of list views. `bg-overlay border border-default rounded-md` with a magnifier icon (14px stroke-1.5). Focused by `/` key globally. Placeholder: `type to filter…` in `text-dim`. Results filter live, no modal.

### Timer

Timer display uses JetBrains Mono `text-2xl` (36px) `text-primary`. Running state: normal. Paused state: `text-secondary`. Expired: `text-diff-hard` + subtle 200ms pulse animation (opacity 1→0.6, once per second). Start/pause: Space bar. Reset: `r`. Timer panel is `bg-raised border border-default`.

### Progress representation

Mastery bar (concept detail page only): 4px height, `bg-overlay` track, `status-done` fill, `border-radius: 2px`. On the index, show only the fraction `(n/total)` in `text-secondary text-sm` — no bar. Activity heatmap: 10×10px cells, 4px radius, using `bg-overlay` (empty), `status-partial` (1–3 sessions), `status-done` (4+). Streak: hero number in `text-xl font-semibold text-primary` with `JetBrains Mono`.

### Code / markdown rendering

Prose content (reference answers, concept descriptions): Geist 15px, max-width 65ch, `color: var(--text-primary)`, line-height 1.6.

- `h1` inside markdown: 22px (lg) `font-semibold`
- `h2`: 18px (md) `font-semibold`
- `h3`: 15px (base) `font-semibold text-secondary`
- `p`: 15px base
- `code` (inline): JetBrains Mono 13px, `bg-overlay px-1 rounded-sm text-accent`
- ` ``` ` (block): JetBrains Mono 13px, `bg-raised border border-default rounded-md p-4`
- Blockquote: left `bg-raised` band (4px width `bg-accent` left padding tint via `padding-left: 12px; border-left: 2px solid var(--accent)`) — EXCEPTION: narrow, 2px border, only here, because it marks authored editorial text, not a list item.

### Empty states

Monospace label in `text-secondary text-sm`, e.g.: `no results — try a different filter`. No illustration, no large icon. The command bar stays visible and focused. One link to clear filters.

---

## Motion

Minimal and fast. Motion signals state change; it does not perform.

| Event | Duration | Easing | Property |
|---|---|---|---|
| List row hover fill | 80ms | ease-out | background-color |
| Tab switch | 100ms | ease-out | background-color |
| Panel resize | 0ms | — | (instant; no animation on drag) |
| Dropdown/menu open | 120ms | ease-out | opacity + translateY(−4px) |
| Timer pulse (expired) | 1s | linear | opacity |
| Focus ring appear | 80ms | ease-out | outline-color |

No page-load orchestration. No staggered entrance animations. No hover transforms on list images.

---

## Keyboard-First Affordances

These are design commitments — visible in the UI, implemented in behavior.

| Key | Action |
|---|---|
| `/` | Focus the command/search bar from anywhere |
| `j` / `k` | Move selection down / up in a list |
| `Enter` | Open selected item |
| `Escape` | Close overlay / blur search / deselect |
| `?` | Toggle keyboard shortcut overlay |
| `Space` | Start / pause timer (in practice view) |
| `r` | Reset timer (in practice view) |
| `f` | Toggle fullscreen (in practice view) |
| `e` | Focus Excalidraw whiteboard (in practice view) |
| `Tab` / `Shift-Tab` | Move between panes in split views |
| `1`–`5` | Self-grade (after answer revealed) |
| `n` | Next question (from practice view) |

The `?` overlay is a `<dialog>` listing all active shortcuts, styled as a monospace table in `bg-raised border border-strong`.

The sidebar shows the top 5 shortcuts in a `kbd` hint block in its footer. Every interactive element has a visible focus ring.

---

## BANS (derived from detect report, enforced globally)

These are hard bans for the entirety of this project.

1. **No violet or purple.** Not for nav, not for badges, not for links, not for progress bars. Use `--accent` (cyan) for interactive affordances.
2. **No pill soup.** Maximum one status badge per list item. Category labels are plain text, not `rounded-full` chips. Filter controls are underlined text links or a `<select>` — never a row of colored pills.
3. **No `text-[10px]`.** Minimum 12px for any visible text, including chips, tags, and badge labels.
4. **No uniform bordered rounded cards for list content.** The library, glossary, answers, and concept index use ruled rows. Cards are reserved for the video grid only.
5. **No gray-on-color.** Text on a colored background must come from `--text-primary` (`#e4e8ef`) or `--text-inverse` (`#0b0d0f`). Never `text-zinc-*` on a colored `bg-*`.
6. **No side-tab border as decoration.** No `border-l-2` or `border-r-2` on list items, callout boxes, or tab indicators.
7. **No `border-bottom` stripe as active tab indicator.** Use background fill.
8. **No hover color change on headings.** Headings that are links use underline on hover, not a hue shift.
9. **No emoji in UI chrome.** SVG icons only, from a consistent library at one stroke weight.
10. **No flat type hierarchy.** Each page must use at least 3 distinct type sizes from the scale, with a minimum 1.2× step between adjacent levels used in a visual pair.
11. **No `zinc-500` on dark backgrounds.** That is `#71717b`, which fails at 3.7:1 on the old base. All muted text uses `--text-secondary` (`#8892a4`, 5.9:1 minimum on all surfaces).
12. **No `overflow-hidden` on non-scroll containers.** Tooltips and dropdowns must escape via `position: fixed` or `<dialog>` / Popover API.
13. **No decorative progress bars at 1px height.** Minimum 4px for any bar that conveys data.
14. **No gradient text.** Emphasis is weight or size.
15. **No scattered hover effects.** Hover states are background fill or underline only.
