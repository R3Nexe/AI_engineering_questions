'use client'

import type { GlossaryCategory, GlossaryTerm } from '@/types'

interface Props {
  categories: GlossaryCategory[]
  terms: GlossaryTerm[]
  active: string | null
  onSelect: (id: string | null) => void
}

export default function CategoryChips({ categories, terms, active, onSelect }: Props) {
  const countFor = (id: string) => terms.filter((t) => t.category === id).length

  const chipClass = (selected: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      selected
        ? 'bg-accent-subtle text-accent border border-accent/40'
        : 'bg-bg-overlay text-text-secondary hover:text-text-primary'
    }`

  return (
    <div className="flex flex-wrap gap-2">
      <button className={chipClass(active === null)} onClick={() => onSelect(null)}>
        All{' '}
        <span className={active === null ? 'opacity-70' : 'opacity-60'}>({terms.length})</span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          className={chipClass(active === cat.id)}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}{' '}
          <span className={active === cat.id ? 'opacity-70' : 'opacity-60'}>
            ({countFor(cat.id)})
          </span>
        </button>
      ))}
    </div>
  )
}
