'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  key: string
  icon: React.ReactNode
}

// Lucide-style SVG icons — 20px, stroke-1.5
function IconLibrary() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
    </svg>
  )
}
function IconConcepts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
      <path d="M12 8v3M8.5 17l-1.5-3M15.5 17l1.5-3" />
    </svg>
  )
}
function IconChapters() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
function IconProgress() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}
function IconVideos() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconGlossary() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}
function IconAnswers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',          label: 'Library',   key: 'l', icon: <IconLibrary /> },
  { href: '/concepts',  label: 'Concepts',  key: 'c', icon: <IconConcepts /> },
  { href: '/chapters',  label: 'Chapters',  key: 'h', icon: <IconChapters /> },
  { href: '/progress',  label: 'Progress',  key: 'p', icon: <IconProgress /> },
  { href: '/videos',    label: 'Videos',    key: 'v', icon: <IconVideos /> },
  { href: '/glossary',  label: 'Glossary',  key: 'g', icon: <IconGlossary /> },
  { href: '/answers',   label: 'Answers',   key: 'a', icon: <IconAnswers /> },
]

function TerminalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4,17 10,11 4,5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}

export default function ActivityBar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-border-faint bg-bg-deep z-50"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center mb-2 text-accent" aria-hidden="true">
        <TerminalIcon />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5" role="navigation" aria-label="Section navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={`${item.label} (g then ${item.key})`}
            title={item.label}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-[80ms]',
              isActive(item.href)
                ? 'bg-accent-subtle text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-overlay',
            ].join(' ')}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
