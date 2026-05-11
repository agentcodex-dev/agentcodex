import Link from 'next/link'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import RadarStatCards from '@/components/RadarStatCards'
import LatestReleaseFeed from '@/components/LatestReleaseFeed'
import CapabilityMoverList from '@/components/CapabilityMoverList'
import ReleaseVelocityList from '@/components/ReleaseVelocityList'
import WatchlistFeed from '@/components/WatchlistFeed'
import { getRadarData } from '@/lib/radar'

export const metadata: Metadata = {
  title: 'Agent Change Radar - Latest AI Agent Updates',
  description: 'Track the latest AI agent releases, capability changes and fastest-moving agents across AgentCodex.',
  alternates: {
    canonical: 'https://agentcodex.dev/radar',
  },
}

const CATEGORIES = ['Coding', 'Research', 'General', 'Multimodal']

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const selectedCategory = CATEGORIES.includes(category || '') ? category : undefined
  const radar = await getRadarData()

  const agentMatchesCategory = (categories: string[]) => (
    !selectedCategory || categories.includes(selectedCategory)
  )

  const latestReleases = radar.latestReleases.filter((release) => (
    agentMatchesCategory(release.agent.category)
  ))
  const capabilityMovers = radar.capabilityMovers.filter((mover) => (
    agentMatchesCategory(mover.agent.category)
  ))
  const releaseVelocity = radar.releaseVelocity.filter((velocity) => (
    agentMatchesCategory(velocity.agent.category)
  ))

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[var(--acx-accent)]">
              Agent Change Radar
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--acx-text)] mt-3 leading-tight">
              Track what changed across AI agents
            </h1>
            <p className="text-base sm:text-lg acx-body mt-4 leading-relaxed">
              Recent releases, capability movement and release velocity across the agents AgentCodex tracks.
            </p>
          </div>

          <div className="mt-8">
            <RadarStatCards stats={radar.stats} />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/radar"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'acx-btn-primary'
                : 'acx-btn-secondary'
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/radar?category=${cat}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'acx-btn-primary'
                  : 'acx-btn-secondary'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--acx-text)]">
                  Latest Releases
                </h2>
                <p className="text-sm acx-muted mt-1">
                  Published updates, newest first
                </p>
              </div>
            </div>
            <LatestReleaseFeed releases={latestReleases} limit={12} />
          </section>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-[var(--acx-text)] mb-4">
                Biggest Movers
              </h2>
              <CapabilityMoverList movers={capabilityMovers} limit={6} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--acx-text)] mb-4">
                Release Velocity
              </h2>
              <ReleaseVelocityList velocities={releaseVelocity} limit={8} />
            </section>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[var(--acx-text)] mb-4">
            Watchlist Digest
          </h2>
          <WatchlistFeed releases={radar.latestReleases} />
        </section>
      </main>

      <Footer />
    </div>
  )
}
