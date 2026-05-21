'use client'

import { MouseEvent, useEffect, useState } from 'react'
import { Star } from 'lucide-react'

const STORAGE_KEY = 'agentcodex_watchlist'

function readWatchlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as string[] : []
  } catch {
    return []
  }
}

function writeWatchlist(slugs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(slugs))))
  window.dispatchEvent(new CustomEvent('agentcodex-watchlist-changed'))
}

type Props = {
  slug: string
}

export default function WatchlistButton({ slug }: Props) {
  // Keep the first render deterministic across server/client to avoid hydration mismatches.
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const sync = () => setSaved(readWatchlist().includes(slug))
    window.addEventListener('storage', sync)
    window.addEventListener('agentcodex-watchlist-changed', sync)
    sync()
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('agentcodex-watchlist-changed', sync)
    }
  }, [slug])

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const current = readWatchlist()
    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]
    writeWatchlist(next)
    setSaved(next.includes(slug))
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
        saved
          ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] border-[var(--acx-accent)]'
          : 'bg-[var(--acx-elevated)] text-[var(--acx-text-soft)] border-[var(--acx-border)] hover:border-[var(--acx-border-strong)]'
      }`}
      aria-label="Toggle watchlist"
      title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Star size={14} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Watching' : 'Watch'}
    </button>
  )
}
