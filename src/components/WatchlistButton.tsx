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
}

type Props = {
  slug: string
}

export default function WatchlistButton({ slug }: Props) {
  const [saved, setSaved] = useState(() => readWatchlist().includes(slug))

  useEffect(() => {
    const sync = () => setSaved(readWatchlist().includes(slug))
    window.addEventListener('storage', sync)
    sync()
    return () => window.removeEventListener('storage', sync)
  }, [slug])

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
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
          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
      }`}
      aria-label="Toggle watchlist"
      title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Star size={14} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Watching' : 'Watch'}
    </button>
  )
}
