'use client'

import { useEffect, useMemo, useState } from 'react'
import { LatestRelease } from '@/lib/radar'
import LatestReleaseFeed from '@/components/LatestReleaseFeed'
import { deriveChangeType } from '@/lib/intelligence'

const STORAGE_KEY = 'agentcodex_watchlist'
const LAST_VISIT_KEY = 'agentcodex_watchlist_last_visit'

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
  const [lastVisit] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(LAST_VISIT_KEY)
  })

  useEffect(() => {
    const onStorage = () => setWatchlist(readWatchlist())
    window.addEventListener('storage', onStorage)
    window.addEventListener('agentcodex-watchlist-changed', onStorage)
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
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

  const sinceLastVisit = useMemo(() => {
    if (!lastVisit) return []
    const threshold = new Date(lastVisit).getTime()
    return releases.filter((release) => {
      if (!watchlist.includes(release.agent.slug)) return false
      const releaseDate = new Date(`${release.release_date}T00:00:00`).getTime()
      return releaseDate >= threshold
    })
  }, [lastVisit, releases, watchlist])

  const changeBuckets = useMemo(() => {
    return sinceLastVisit.reduce((acc, release) => {
      const type = release.change_type || deriveChangeType(0, release.what_changed || '')
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [sinceLastVisit])

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

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
        <span className="font-semibold text-gray-900">Since your last visit:</span>{' '}
        {changeBuckets.major || 0} major, {changeBuckets.minor || 0} minor, {changeBuckets.patch || 0} patches
      </div>
      <LatestReleaseFeed releases={filtered} limit={6} />
    </div>
  )
}
