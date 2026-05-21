'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { RadarPulseRelease } from '@/lib/radar'

const STORAGE_KEY = 'agentcodex_watchlist'

type Props = {
  releases: RadarPulseRelease[]
}

function readWatchlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as string[] : []
  } catch {
    return []
  }
}

export default function CockpitWatchlistDigest({ releases }: Props) {
  const [watchlist, setWatchlist] = useState<string[]>(() => readWatchlist())

  useEffect(() => {
    const sync = () => setWatchlist(readWatchlist())
    window.addEventListener('storage', sync)
    window.addEventListener('agentcodex-watchlist-changed', sync)
    sync()
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('agentcodex-watchlist-changed', sync)
    }
  }, [])

  const watchedReleases = useMemo(() => {
    const watched = new Set(watchlist)
    const latestBySlug = new Map<string, RadarPulseRelease>()

    for (const release of releases) {
      if (!watched.has(release.agent.slug)) continue
      if (!latestBySlug.has(release.agent.slug)) {
        latestBySlug.set(release.agent.slug, release)
      }
    }

    return Array.from(latestBySlug.values()).slice(0, 4)
  }, [releases, watchlist])

  return (
    <section className="acx-cockpit-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-50">Watchlist Digest</h2>
        <Link
          href="/agents"
          className="text-slate-500 transition-colors hover:text-sky-300"
          aria-label="Browse agents to manage watchlist"
        >
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {watchlist.length === 0 && (
        <div className="rounded-md border border-slate-800 bg-slate-950/35 p-3 text-xs leading-relaxed text-slate-500">
          Star agents from the directory or profile pages to build a personal release digest here.
        </div>
      )}

      {watchlist.length > 0 && watchedReleases.length === 0 && (
        <div className="rounded-md border border-slate-800 bg-slate-950/35 p-3 text-xs leading-relaxed text-slate-500">
          No published releases yet for your watched agents.
        </div>
      )}

      {watchedReleases.length > 0 && (
        <div className="space-y-3">
          {watchedReleases.map((release) => (
            <Link
              key={release.id}
              href={`/agents/${release.agent.slug}`}
              className="block rounded-md border border-slate-800 bg-slate-950/35 p-3 transition-colors hover:border-sky-500/60"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold text-slate-200">{release.agent.name}</p>
                <span className={`acx-cockpit-pill acx-tone-${release.changeTone}`}>
                  {release.changeType}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {release.what_changed}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
