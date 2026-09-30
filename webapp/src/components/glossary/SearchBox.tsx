'use client'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBox({ value, onChange }: Props) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
      <input
        type="search"
        placeholder="Search terms, aliases, definitions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border-default bg-bg-base py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:border-border-strong focus:outline-none transition-colors"
      />
    </div>
  )
}
