'use client'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface Props {
  /** First letters (uppercase) that have at least one visible term */
  available: Set<string>
}

export default function AZBar({ available }: Props) {
  const scrollToLetter = (letter: string) => {
    document.getElementById(`az-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ALPHABET.map((l) =>
        available.has(l) ? (
          <button
            key={l}
            onClick={() => scrollToLetter(l)}
            className="w-6 h-6 rounded text-xs font-mono font-semibold bg-bg-overlay text-text-secondary hover:bg-accent-subtle hover:text-accent transition-colors"
          >
            {l}
          </button>
        ) : (
          <span key={l} className="w-6 h-6 flex items-center justify-center text-xs font-mono text-text-dim">
            {l}
          </span>
        ),
      )}
    </div>
  )
}
