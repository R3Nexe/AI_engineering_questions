'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useShell } from './ShellContext'

const G_NAV: Record<string, string> = {
  l: '/',
  c: '/concepts',
  h: '/chapters',
  p: '/progress',
  v: '/videos',
  g: '/glossary',
  a: '/answers',
}

/**
 * Handles global keyboard shortcuts:
 * - `?`         → toggle help overlay
 * - `g` then key → navigate (l/c/p/v/g/a)
 *
 * Mounted once in AppShell; no DOM output.
 */
export default function GlobalKeys() {
  const router = useRouter()
  const { helpOpen, setHelpOpen } = useShell()
  const pendingG = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearPending = () => {
      pendingG.current = false
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if ((e.target as HTMLElement).isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (pendingG.current) {
        clearPending()
        const dest = G_NAV[e.key]
        if (dest) {
          e.preventDefault()
          router.push(dest)
        }
        return
      }

      if (e.key === 'g') {
        e.preventDefault()
        pendingG.current = true
        timer.current = setTimeout(clearPending, 1000)
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(!helpOpen)
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearPending()
    }
  }, [router, setHelpOpen, helpOpen])

  return null
}
