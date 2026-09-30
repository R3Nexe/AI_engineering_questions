'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'
import { AppShell } from './shell'
import { ShellProvider } from './shell'

export default function Providers({ children }: { children: React.ReactNode }) {
  const loadPack = useStore((s) => s.loadPack)

  useEffect(() => {
    loadPack()
  }, [loadPack])

  return (
    <ShellProvider>
      <AppShell>{children}</AppShell>
    </ShellProvider>
  )
}
