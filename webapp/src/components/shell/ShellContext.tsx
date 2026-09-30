'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export interface KeyHint {
  key: string
  label: string
}

interface ShellContextValue {
  statusHints: KeyHint[]
  setStatusHints: (hints: KeyHint[]) => void
  helpOpen: boolean
  setHelpOpen: (open: boolean) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [statusHints, setStatusHintsState] = useState<KeyHint[]>([])
  const [helpOpen, setHelpOpen] = useState(false)

  const setStatusHints = useCallback((hints: KeyHint[]) => {
    setStatusHintsState(hints)
  }, [])

  return (
    <ShellContext.Provider value={{ statusHints, setStatusHints, helpOpen, setHelpOpen }}>
      {children}
    </ShellContext.Provider>
  )
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used inside ShellProvider')
  return ctx
}
