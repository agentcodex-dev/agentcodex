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
    window.addEventListener('agentcodex-watchlist-changed', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('agentcodex-watchlist-changed', onStorage)
    }
  }, [])

  const filtered = useMemo(() => {
    const watchSet = new Set(watchlist)
    const latestBySlug = new Map<string, LatestRelease>()

    for (const release of releases) {
      const slug = release.agent.slug
      if (!watchSet.has(slug)) continue
      if (!latestBySlug.has(slug)) {
        latestBySlug.set(slug, release)
      }
    }

    return Array.from(latestBySlug.values())
  }, [releases, watchlist])

  if (watchlist.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
        Add agents to your watchlist to get a personal change feed here.
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
        No published releases yet for your watched agents.
      </div>
    )
  }

  return <LatestReleaseFeed releases={filtered} limit={6} />
}
