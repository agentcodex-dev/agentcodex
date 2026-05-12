import Link from 'next/link'
import Navigation from '@/components/Navigation'
import AgentCard from '@/components/AgentCard'
import SearchBar from '@/components/SearchBar'
import Footer from '@/components/Footer'
import RadarStatCards from '@/components/RadarStatCards'
import LatestReleaseFeed from '@/components/LatestReleaseFeed'
import CapabilityMoverList from '@/components/CapabilityMoverList'
import ReleaseVelocityList from '@/components/ReleaseVelocityList'
import WatchlistFeed from '@/components/WatchlistFeed'
import { getRadarData } from '@/lib/radar'

export default async function Home() {
  const radar = await getRadarData()
  const agents = radar.agents.slice(0, 6)
  const latestVersionByAgent = new Map(
    radar.releaseVelocity.map((velocity) => [
      velocity.agent.id,
      velocity.latestRelease,
    ])
  )

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
            <div>
              <div className="inline-flex items-center bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] px-4 py-2 rounded-full text-sm font-medium mb-6">
                Agent Change Radar
              </div>

              <h1 className="acx-title text-3xl sm:text-4xl font-bold mb-6 max-w-3xl">
                See what changed across AI agents this week
              </h1>

              <p className="text-lg sm:text-xl acx-body mb-8 max-w-2xl leading-relaxed">
                Track releases, capability movement and the agents shipping fastest. AgentCodex is becoming the live reference layer for AI agent evolution.
              </p>

              <div className="max-w-2xl">
                <SearchBar />
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/radar"
                  className="acx-btn-primary px-5 py-3 text-sm"
                >
                  Open Radar
                </Link>
                <Link
                  href="/agents"
                  className="acx-btn-secondary px-5 py-3 text-sm"
                >
                  Browse agents
                </Link>
              </div>

              <div className="mt-10">
                <RadarStatCards stats={radar.stats} />
              </div>
            </div>

            <div className="acx-panel-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--acx-text)]">
                  Latest Signal
                </h2>
                <Link
                  href="/radar"
                  className="text-sm font-medium text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
                >
                  View all
                </Link>
              </div>
              <div className="lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
                <LatestReleaseFeed releases={radar.latestReleases} limit={6} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-[var(--acx-text)]">
                  Biggest Capability Movers
                </h2>
                <p className="text-sm acx-muted mt-1">
                  Latest version compared with the previous scored release
                </p>
              </div>
              <Link
                href="/radar"
                className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] font-medium text-sm shrink-0"
              >
                Full radar →
              </Link>
            </div>
            <CapabilityMoverList movers={radar.capabilityMovers} limit={5} />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--acx-text)] mb-5">
              Release Velocity
            </h2>
            <ReleaseVelocityList velocities={radar.releaseVelocity} limit={6} />
          </section>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--acx-text)]">
              Agent Directory
            </h2>
            <p className="text-sm acx-muted mt-1">
              Profiles, categories and version history for tracked agents
            </p>
          </div>
          <Link
            href="/agents"
            className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] font-medium text-sm"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              latestVersion={latestVersionByAgent.get(agent.id) || null}
            />
          ))}
        </div>

      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-[var(--acx-text)]">
              Weekly Watchlist Digest
            </h2>
            <p className="text-sm acx-muted mt-1">
              Personal release feed based on your watched agents
            </p>
          </div>
          <Link
            href="/radar"
            className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] font-medium text-sm"
          >
            Open radar →
          </Link>
        </div>
        <WatchlistFeed releases={radar.latestReleases} />
      </section>

      <Footer />

    </div>
  )
}
