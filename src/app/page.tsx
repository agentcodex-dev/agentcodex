import Link from 'next/link'
import { ArrowUpRight, Compass, Crosshair, GitCompare, Layers2 } from 'lucide-react'
import Navigation from '@/components/Navigation'
import SearchBar from '@/components/SearchBar'
import Footer from '@/components/Footer'
import RadarStatCards from '@/components/RadarStatCards'
import LatestReleaseFeed from '@/components/LatestReleaseFeed'
import { getRadarData } from '@/lib/radar'

export default async function Home() {
  const radar = await getRadarData()
  const trackedProviders = new Set(radar.agents.map((agent) => agent.provider)).size
  const major30 = radar.latestReleases.filter((release) => {
    const type = String(release.change_type || '').toLowerCase()
    return type === 'major'
  }).length
  const searchOptions = radar.agents.map((agent) => ({
    slug: agent.slug,
    name: agent.name,
    provider: agent.provider,
  }))

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="acx-reveal max-w-3xl">
              <p className="acx-eyebrow text-xs mb-4">Agent Intelligence Console</p>
              <h1 className="acx-display text-5xl sm:text-6xl font-semibold mb-5">
                The enterprise reference layer for AI agent change
              </h1>
              <p className="text-lg acx-body mb-7 leading-relaxed max-w-2xl">
                Track validated releases, capability movement, and source confidence across the fastest-moving agent ecosystem.
              </p>
              <div className="max-w-2xl acx-panel p-3 bg-[var(--acx-elevated)]">
                <SearchBar options={searchOptions} />
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link href="/radar" className="acx-btn-primary px-5 py-3 text-sm inline-flex items-center gap-2">
                  Open Radar
                  <ArrowUpRight size={15} />
                </Link>
                <Link href="/agents" className="acx-btn-secondary px-5 py-3 text-sm">
                  Browse agents
                </Link>
              </div>
            </div>

            <div className="acx-panel p-5 acx-reveal acx-reveal-delay-1">
              <p className="text-xs acx-eyebrow mb-3">Proof</p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm acx-muted">Tracked providers</p>
                  <p className="text-3xl font-semibold acx-page-title">{trackedProviders}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border acx-divider rounded-[10px] p-3 bg-[var(--acx-elevated-soft)]">
                    <p className="text-xs acx-muted">Major signals</p>
                    <p className="text-xl font-semibold">{major30}</p>
                    <p className="mt-1 acx-code-badge acx-platform-blue">30D</p>
                  </div>
                  <div className="border acx-divider rounded-[10px] p-3 bg-[var(--acx-elevated-soft)]">
                    <p className="text-xs acx-muted">Recently updated</p>
                    <p className="text-xl font-semibold">{radar.stats.recentlyUpdatedAgents}</p>
                    <p className="mt-1 acx-code-badge acx-platform-green">Verified</p>
                  </div>
                </div>
                <p className="text-sm acx-body">
                  Built for engineering teams that need signal quality, source traceability, and decision speed.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 acx-reveal acx-reveal-delay-2">
            <RadarStatCards stats={radar.stats} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <p className="acx-eyebrow text-xs mb-2">Live Preview</p>
            <h2 className="text-3xl font-semibold acx-page-title">Latest ecosystem pulse</h2>
          </div>
          <Link href="/radar" className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] font-medium text-sm shrink-0">
            Open full radar →
          </Link>
        </div>
        <div className="acx-reveal">
          <LatestReleaseFeed releases={radar.latestReleases} limit={4} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="acx-eyebrow text-xs mb-2">Decision Paths</p>
            <h2 className="text-3xl font-semibold acx-page-title">Choose your workflow</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 acx-reveal">
          <Link href="/agents" className="acx-panel p-4 hover:border-[var(--acx-border-strong)] transition-colors">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-md border acx-divider mb-3">
              <Compass size={16} className="acx-platform-blue" />
            </div>
            <h3 className="font-semibold">Agent Directory</h3>
            <p className="text-sm acx-muted mt-2">Discover profiles, source trust, and latest versions.</p>
          </Link>
          <Link href="/compare" className="acx-panel p-4 hover:border-[var(--acx-border-strong)] transition-colors">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-md border acx-divider mb-3">
              <GitCompare size={16} className="acx-platform-green" />
            </div>
            <h3 className="font-semibold">Compare</h3>
            <p className="text-sm acx-muted mt-2">Side-by-side decisions for workflow fit and tradeoffs.</p>
          </Link>
          <Link href="/categories" className="acx-panel p-4 hover:border-[var(--acx-border-strong)] transition-colors">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-md border acx-divider mb-3">
              <Layers2 size={16} className="acx-platform-amber" />
            </div>
            <h3 className="font-semibold">Categories</h3>
            <p className="text-sm acx-muted mt-2">Map ecosystem movement by category and update cadence.</p>
          </Link>
          <Link href="/copilot" className="acx-panel p-4 hover:border-[var(--acx-border-strong)] transition-colors">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-md border acx-divider mb-3">
              <Crosshair size={16} className="acx-platform-red" />
            </div>
            <h3 className="font-semibold">Copilot</h3>
            <p className="text-sm acx-muted mt-2">Preset shortlists for faster team-level stack selection.</p>
          </Link>
        </div>
      </section>

      <Footer />

    </div>
  )
}
