'use client'

import { useEffect, useMemo, useState } from 'react'
import { LatestRelease } from '@/lib/radar'
import LatestReleaseFeed from '@/components/LatestReleaseFeed'

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

type Props = {
  releases: LatestRelease[]
}

export default function WatchlistFeed({ releases }: Props) {
  const [watchlist, setWatchlist] = useState<string[]>(() => readWatchlist())

  useEffect(() => {
    const onStorage = () => setWatchlist(readWatchlist())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const filtered = useMemo(() => (
    releases.filter((release) => watchlist.includes(release.agent.slug))
  ), [releases, watchlist])

  if (watchlist.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
        Add agents to your watchlist to get a personal change feed here.
      </div>
    )
  }

  return <LatestReleaseFeed releases={filtered} limit={6} />
}
