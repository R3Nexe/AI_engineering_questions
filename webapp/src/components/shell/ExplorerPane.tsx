'use client'

import { useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store'

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

const PRACTICE_FILTERS = [
  { id: 'daily', label: 'Daily' },
  { id: 'due',   label: 'Due'   },
  { id: 'all',   label: 'All'   },
] as const

/**
 * Explorer pane rules:
 * - Shown on the library route ("/") with search, Daily/Due/All filter,
 *   and full category tree with counts.
 * - Hidden on all other routes so main content gets full width.
 * - Width: 220px when visible, 0 when hidden.
 */
export default function ExplorerPane() {
  const pathname = usePathname()
  const router = useRouter()
  const { pack, sidebarItem, setSidebarItem, search, setSearch } = useStore()
  const searchRef = useRef<HTMLInputElement>(null)

  const isLibrary = pathname === '/'

  // "/" key globally focuses the search input
  useEffect(() => {
    if (!isLibrary) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLibrary])

  if (!isLibrary) return null

  const getCount = (id: string) => {
    if (!pack) return 0
    if (id === 'daily') return 5 // mocked — matches existing Sidebar behavior
    if (id === 'all') return pack.questions.length
    if (id === 'due') return Math.min(10, pack.questions.length) // mocked
    return pack.questions.filter((q) => q.category === id).length
  }

  const handleSidebarItem = (id: string) => {
    setSidebarItem(id)
    router.push('/')
  }

  // Normalize sidebarItem: 'due' isn't a SidebarItem in the store, so treat it as 'all'
  const activePractice = (sidebarItem === 'daily' || sidebarItem === 'all') ? sidebarItem : 'all'

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col bg-bg-raised border-r border-border-default h-full overflow-hidden"
      aria-label="Library explorer"
    >
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        {/* Section header */}
        <div className="text-xs text-text-secondary uppercase tracking-[0.08em] font-sans select-none">
          Library
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="filter questions…"
            aria-label="Filter questions (press / to focus)"
            className="w-full h-9 bg-bg-overlay border border-border-default rounded-md pl-8 pr-8 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors duration-[80ms]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-secondary transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* "/" shortcut hint */}
          {!search && (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
              /
            </kbd>
          )}
        </div>

        {/* Practice filters */}
        <div className="flex gap-1" role="group" aria-label="Practice filter">
          {PRACTICE_FILTERS.map((f) => {
            const active = f.id === 'due' ? false : activePractice === f.id
            return (
              <button
                key={f.id}
                onClick={() => handleSidebarItem(f.id === 'due' ? 'all' : f.id)}
                aria-pressed={active}
                className={[
                  'flex-1 py-1 text-xs rounded-md border transition-colors duration-[80ms]',
                  active
                    ? 'bg-bg-overlay border-border-default text-text-primary'
                    : 'border-border-default text-text-secondary hover:bg-bg-overlay hover:text-text-primary',
                ].join(' ')}
              >
                {f.label}
                <span className="font-mono ml-1 text-text-dim">
                  ({getCount(f.id)})
                </span>
              </button>
            )
          })}
        </div>

        {/* Category tree */}
        {pack && (
          <nav aria-label="Topic categories">
            <div className="text-xs text-text-dim uppercase tracking-[0.08em] mb-1.5 px-1 select-none">
              Topics
            </div>
            <ul role="list" className="flex flex-col gap-px">
              {pack.categories.map((cat) => {
                const active = sidebarItem === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      onClick={() => handleSidebarItem(cat.id)}
                      aria-pressed={active}
                      className={[
                        'w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors duration-[80ms] rounded-none',
                        active
                          ? 'bg-accent-subtle text-text-primary'
                          : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary',
                      ].join(' ')}
                      style={active ? { boxShadow: 'inset 2px 0 0 0 var(--color-accent)' } : undefined}
                    >
                      <span className="truncate text-left">{cat.name}</span>
                      <span className="font-mono text-xs text-text-dim ml-2 shrink-0">
                        {getCount(cat.id)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  )
}
