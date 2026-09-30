# Theme

## Part 1 — Compact Token Summary

### Framework
- Tailwind CSS v4 via `@tailwindcss/postcss` — no `tailwind.config.ts`; pure CSS import `@import "tailwindcss"` in `globals.css`.
- All tokens are Tailwind v4 defaults augmented by inline class usage patterns observed in the codebase.

### Color Palette (Tailwind default scale, used classes)

| Role | Token | Approx value |
|---|---|---|
| Page background | `zinc-950` | `#09090b` |
| Panel / sidebar bg | `zinc-900` | `#18181b` |
| Card / elevated bg | `zinc-900` | `#18181b` |
| Hover bg | `zinc-800` | `#27272a` |
| Deep hover bg | `zinc-700` | `#3f3f46` |
| Border default | `zinc-800` | `#27272a` |
| Border hover | `zinc-700` | `#3f3f46` |
| Text primary | `zinc-100` | `#f4f4f5` |
| Text secondary | `zinc-400` | `#a1a1aa` |
| Text muted | `zinc-500` | `#71717a` |
| Text disabled | `zinc-600` | `#52525b` |
| Accent primary | `violet-500` | `#8b5cf6` |
| Accent hover | `violet-600` | `#7c3aed` |
| Accent active text | `violet-300` | `#c4b5fd` |
| Accent bg tint | `violet-600/20` | `#7c3aed33` |
| Active border/underline | `violet-500` | `#8b5cf6` |
| Focus ring | `violet-500` | `#8b5cf6` |
| Success text | `emerald-400` | `#34d399` |
| Success bg | `emerald-600` | `#059669` |
| Success tint | `emerald-900/60` | `#064e3b99` |
| Warning text | `amber-400` | `#fbbf24` |
| Warning bg | `amber-600` | `#d97706` |
| Warning tint | `amber-900/60` | `#78350f99` |
| Danger text | `red-400` | `#f87171` |
| Danger bg | `red-500` / `red-600` | `#ef4444` / `#dc2626` |
| Danger tint | `red-900/60` | `#7f1d1d99` |
| Mastery bar fill | `violet-500` | `#8b5cf6` |
| Heatmap 0 | `zinc-800/40` | near transparent |
| Heatmap low | `violet-900/60` | `#4c1d9599` |
| Heatmap mid | `violet-700/80` | `#6d28d9cc` |
| Heatmap high | `violet-500` | `#8b5cf6` |

### Typography
- **Font family:** system default (no `@font-face`; `antialiased` applied on `body`)
- **Base text size:** `text-sm` (`0.875rem`) most UI; `text-xs` (`0.75rem`) badges/labels
- **Headings:** `text-2xl font-semibold` (page titles), `text-base font-semibold` (card headers), `text-sm font-semibold` (section headers)
- **Font weight:** `font-medium`, `font-semibold`, `font-bold` (app title)
- **Mono:** `font-mono tabular-nums` (timer, code spans)

### Spacing
- Layout padding: `p-3`, `p-4`, `p-6`
- Gap: `gap-2`, `gap-3`, `gap-4`
- Section margin: `mb-4`, `mt-4`
- Border radius: `rounded` (sm), `rounded-lg`, `rounded-xl` (cards), `rounded-full` (pills/dots)

### Shadows
- No custom box-shadow tokens — relies on background-contrast layering.

### Breakpoints
- Tailwind v4 defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px
- App is primarily desktop-targeted; uses `flex-wrap` for responsive hints.

### Layout Shell
- Full-height: `h-full` on `html`, `body`
- App shell: `h-screen flex overflow-hidden`
- Sidebar: fixed `w-64 shrink-0 border-r border-zinc-800`
- Main area: `flex-1 min-h-0 overflow-hidden`

---

## Part 2 — Raw Source Dumps

### `src/app/globals.css`

```css
@import "tailwindcss";

html, body {
  height: 100%;
}

* {
  box-sizing: border-box;
}
```

### `postcss.config.mjs`

```js
// @tailwindcss/postcss processes Tailwind v4 via PostCSS
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### Root layout body classes (effective theme application)

```tsx
// src/app/layout.tsx
<html lang="en" className="h-full">
  <body className="h-full bg-zinc-950 text-zinc-100 antialiased">
    <Providers>{children}</Providers>
  </body>
</html>
```

### Tailwind config
No `tailwind.config.ts` exists — this project uses Tailwind CSS v4's zero-config approach. All configuration is implicit via the `@import "tailwindcss"` directive in `globals.css`. There are no custom theme extensions.
