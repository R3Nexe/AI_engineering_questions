# `src/components/ui` — AIPrep UI Primitives

Design-system–bound components. All tokens are defined in `src/app/globals.css`
via Tailwind v4 `@theme`. No raw hex values in components.

---

## Token class reference

### Colors

| Tailwind class         | CSS var                    | Hex       | Role |
|------------------------|----------------------------|-----------|------|
| `bg-bg-deep`           | `--color-bg-deep`          | `#0b0d0f` | Page canvas |
| `bg-bg-base`           | `--color-bg-base`          | `#111318` | Primary content surface |
| `bg-bg-raised`         | `--color-bg-raised`        | `#1a1d23` | Sidebar, panels, toolbar |
| `bg-bg-overlay`        | `--color-bg-overlay`       | `#22262e` | Dropdowns, hover fill |
| `bg-accent`            | `--color-accent`           | `#e8813c` | Primary button bg |
| `bg-accent-subtle`     | `--color-accent-subtle`    | `#231508` | Active row / selection |
| `text-text-primary`    | `--color-text-primary`     | `#e4e8ef` | Body text, headings |
| `text-text-secondary`  | `--color-text-secondary`   | `#8892a4` | Metadata, labels |
| `text-text-dim`        | `--color-text-dim`         | `#6b7585` | Disabled, placeholders |
| `text-text-inverse`    | `--color-text-inverse`     | `#0b0d0f` | On accent fill |
| `text-accent`          | `--color-accent`           | `#e8813c` | Links, active icons |
| `border-border-faint`  | `--color-border-faint`     | `#1e2228` | Hairline dividers |
| `border-border-default`| `--color-border-default`   | `#2a2f38` | Pane edges, row rules |
| `border-border-strong` | `--color-border-strong`    | `#404854` | Focus rings |
| `bg-status-new`        | `--color-status-new`       | `#8892a4` | New / not started |
| `bg-status-partial`    | `--color-status-partial`   | `#facc15` | Attempted |
| `bg-status-done`       | `--color-status-done`      | `#22c55e` | Mastered |
| `bg-diff-easy`         | `--color-diff-easy`        | `#22c55e` | Easy difficulty |
| `bg-diff-medium`       | `--color-diff-medium`      | `#facc15` | Medium difficulty |
| `bg-diff-hard`         | `--color-diff-hard`        | `#ef4444` | Hard difficulty |

### Typography

| Tailwind class | Size  | Use |
|----------------|-------|-----|
| `text-xs`      | 12px  | Chip labels, kbd hints — minimum |
| `text-sm`      | 13px  | Secondary body, captions, metadata |
| `text-base`    | 15px  | Primary body copy |
| `text-md`      | 18px  | Section headings |
| `text-lg`      | 22px  | Page title (one per page) |
| `text-xl`      | 28px  | Hero metrics (streak, mastery %) |
| `text-2xl`     | 36px  | Timer display only |
| `font-sans`    | —     | Inter Variable (Linear OpenType stack) |
| `font-mono`    | —     | JetBrains Mono (code / data / kbd) |

### Radii

| Tailwind class | Value | Use |
|----------------|-------|-----|
| `rounded-none` | 0px   | Pane borders, list rows |
| `rounded-sm`   | 2px   | Status chips, tags |
| `rounded-md`   | 4px   | Buttons, inputs, kbd |
| `rounded-lg`   | 6px   | Dropdowns, modals |

### Motion

| CSS var              | Value  | Use |
|----------------------|--------|-----|
| `--duration-fast`    | 80ms   | Row hover, focus ring |
| `--duration-normal`  | 100ms  | Tab switch |
| `--duration-slow`    | 120ms  | Dropdown open |
| `--duration-pulse`   | 1s     | Timer expired pulse |

---

## Components

### `Kbd`

Keyboard hint chip. Font-mono, 12px, bg-overlay border, rounded-md.

```tsx
import { Kbd } from '@/components/ui'

<Kbd>j</Kbd>
<Kbd>/</Kbd>
<Kbd>Space</Kbd>
```

Props: `children: ReactNode`, `className?: string`

---

### `StatusMark`

One status indicator per item. 6×6px SVG dot + optional text label.

```tsx
import { StatusMark } from '@/components/ui'

<StatusMark state="mastered" />
<StatusMark state="attempted" />
<StatusMark state="new" showLabel={false} />
// Video states:
<StatusMark state="completed" />
<StatusMark state="partial" />
<StatusMark state="not_started" />
```

Props: `state: StatusState`, `showLabel?: boolean` (default `true`), `className?: string`

Type `StatusState = 'new' | 'attempted' | 'mastered' | 'not_started' | 'partial' | 'completed'`

---

### `DifficultyMark`

6×6px SVG dot + optional text. Semantic difficulty colors.

```tsx
import { DifficultyMark } from '@/components/ui'

<DifficultyMark difficulty="hard" />
<DifficultyMark difficulty="medium" showLabel={false} />
```

Props: `difficulty: 'easy' | 'medium' | 'hard'`, `showLabel?: boolean`, `className?: string`

---

### `SegmentedFilter`

Text segment buttons. Active: bg-overlay fill. No accent stripe.

```tsx
import { SegmentedFilter } from '@/components/ui'

<SegmentedFilter
  segments={[
    { value: 'all', label: 'All' },
    { value: 'easy', label: 'Easy' },
    { value: 'hard', label: 'Hard' },
  ]}
  value={filter}
  onChange={setFilter}
/>
```

Props: `segments: FilterSegment<T>[]`, `value: T`, `onChange: (value: T) => void`, `className?: string`

---

### `SearchInput`

Full-width search with magnifier + "/" shortcut hint.

```tsx
import { SearchInput } from '@/components/ui'

<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="filter questions…"
  globalSlash  // binds window "/" key to focus this input
/>
```

Props: `value`, `onChange`, `placeholder?`, `label?`, `globalSlash?: boolean`, `className?`

---

### `PageHeader`

h1 + optional meta + optional actions. 56px height, bottom separator.

```tsx
import { PageHeader } from '@/components/ui'

<PageHeader
  title="All Questions"
  meta="48 / 142 mastered"
  actions={<Button variant="primary">Practice</Button>}
/>
```

Props: `title: string`, `meta?: ReactNode`, `actions?: ReactNode`, `className?`

---

### `SectionHeading`

h2 section heading.

```tsx
import { SectionHeading } from '@/components/ui'

<SectionHeading>Topics</SectionHeading>
<SectionHeading meta="18 terms">Glossary</SectionHeading>
```

Props: `children: ReactNode`, `meta?: ReactNode`, `className?`

---

### `Button`

Four variants: `primary` (accent fill), `secondary` (raised), `ghost` (bordered),
`text` (no border, link-style).

```tsx
import { Button } from '@/components/ui'

<Button variant="primary">Submit</Button>
<Button variant="secondary">Export</Button>
<Button variant="ghost" size="sm">Reset</Button>
<Button variant="text">Clear filters</Button>
```

Props: all `<button>` attrs + `variant?: ButtonVariant`, `size?: 'sm' | 'md'`

---

### `ProgressBar`

2px height bar. Track `bg-bg-overlay`, fill `bg-status-done`.

```tsx
import { ProgressBar } from '@/components/ui'

<ProgressBar value={0.65} label="Mastery progress" />
```

Props: `value: number` (0–1), `label?: string`, `className?`

---

### `Tabs`

Editor-style file tab bar. Active: bg-overlay fill (no border-bottom stripe).

```tsx
import { Tabs } from '@/components/ui'

const [tab, setTab] = useState('prompt')

<Tabs
  tabs={[
    { id: 'prompt', label: 'prompt.md' },
    { id: 'answer', label: 'answer.md', dirty: true },
    { id: 'scratch', label: 'scratch.md' },
  ]}
  activeTab={tab}
  onTabChange={setTab}
>
  {/* optional trailing actions */}
  <Button size="sm" variant="ghost">Export</Button>
</Tabs>
```

Props: `tabs: Tab[]`, `activeTab: string`, `onTabChange`, `children?: ReactNode`, `className?`

---

### `EmptyState`

Monospace message for empty list states. No illustration, no icon.

```tsx
import { EmptyState } from '@/components/ui'

<EmptyState
  message="no results — try a different filter"
  onClear={() => setFilter('all')}
/>
```

Props: `message?: string`, `onClear?: () => void`, `clearLabel?: string`, `className?`

---

## Shell status bar hints API

Pages can push key hints to the StatusBar via the `useShell` hook:

```tsx
'use client'
import { useShell } from '@/components/shell'
import { useEffect } from 'react'

export default function MyPageComponent() {
  const { setStatusHints } = useShell()

  useEffect(() => {
    setStatusHints([
      { key: 'Space', label: 'start/pause' },
      { key: 'r',     label: 'reset' },
    ])
    return () => setStatusHints([])
  }, [setStatusHints])
  // ...
}
```

The hints appear between the streak stat and the global nav hints in the status bar.
