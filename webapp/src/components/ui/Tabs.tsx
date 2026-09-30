'use client'

import type { ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  /** Optional: show a dirty/modified dot */
  dirty?: boolean
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  children?: ReactNode
  className?: string
}

/**
 * Editor-style file tab bar. Active tab: `bg-bg-overlay text-text-primary font-medium`.
 * Inactive: `text-text-secondary`. No border-bottom stripe — active state is background fill.
 *
 * ```tsx
 * <Tabs
 *   tabs={[{ id: 'prompt', label: 'prompt.md' }, { id: 'answer', label: 'answer.md', dirty: true }]}
 *   activeTab={tab}
 *   onTabChange={setTab}
 * />
 * ```
 *
 * Container: `h-10 bg-bg-raised border-b border-border-default flex items-end overflow-x-auto`
 */
export default function Tabs({ tabs, activeTab, onTabChange, children, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="File tabs"
      className={`h-10 shrink-0 bg-bg-raised border-b border-border-default flex items-center px-2 gap-1 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={[
              'px-3 py-1 text-sm rounded-md flex items-center gap-1.5 shrink-0',
              'transition-colors duration-[100ms]',
              active
                ? 'bg-bg-overlay text-text-primary font-medium shadow-sm'
                : 'text-text-secondary hover:bg-bg-overlay/50 hover:text-text-primary',
            ].join(' ')}
          >
            {tab.label}
            {tab.dirty && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-text-dim shrink-0"
                aria-label="unsaved changes"
              />
            )}
          </button>
        )
      })}
      {children && (
        <div className="flex-1 flex items-center justify-end px-2">
          {children}
        </div>
      )}
    </div>
  )
}
