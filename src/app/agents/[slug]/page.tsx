import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import CapabilityScore from '@/components/CapabilityScore'
import VersionTimeline from '@/components/VersionTimeline'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import WatchlistButton from '@/components/WatchlistButton'
import { deriveQualitySignal, getAvoidIf, getBestFor } from '@/lib/intelligence'

async function getAgent(slug: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Agent
}

async function getAgentVersions(agentId: string) {
  const { data, error } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'published')
    .order('release_date', { ascending: false })

  if (error || !data) return []
  return data as AgentVersion[]
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const agent = await getAgent(slug)

  if (!agent) {
    return {
      title: 'Agent Not Found | AgentCodex',
    }
  }

  return {
    title: `${agent.name} - Version History & Capabilities | AgentCodex`,
    description: `Track ${agent.name} by ${agent.provider}. Full version history, capability scores and changelog. ${agent.description}`,
    keywords: [
      agent.name,
      agent.provider,
      'AI agent',
      'version history',
      'capabilities',
      ...agent.category
    ],
    openGraph: {
      title: `${agent.name} | AgentCodex`,
      description: `${agent.description}`,
      url: `https://agentcodex.dev/agents/${agent.slug}`,
      siteName: 'AgentCodex',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${agent.name} - AI Agent History | AgentCodex`,
      description: `${agent.description}`,
    },
    alternates: {
      canonical: `https://agentcodex.dev/agents/${agent.slug}`,
    }
  }
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = await getAgent(slug)
  if (!agent) notFound()

  const versions = await getAgentVersions(agent.id)
  const latestVersion = versions[0]
  const quality = latestVersion ? deriveQualitySignal(agent, latestVersion) : null

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm acx-muted">
          <Link href="/" className="hover:text-[var(--acx-text-soft)]">Home</Link>
          <span>→</span>
          <Link href="/agents" className="hover:text-[var(--acx-text-soft)]">Agents</Link>
          <span>→</span>
          <span className="text-[var(--acx-text)]">{agent.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          <div className="lg:col-span-2 space-y-8">
            <div className="acx-panel p-8 acx-reveal">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--acx-accent-soft)] flex items-center justify-center shrink-0">
                  <span className="text-[var(--acx-accent)] font-bold text-2xl">
                    {agent.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl font-semibold acx-page-title">
                      {agent.name}
                    </h1>
                    {agent.is_verified && (
                      <span className="acx-badge acx-badge-official text-sm px-3 py-1 font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="acx-muted mt-1">by {agent.provider}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {agent.category.map((cat) => (
                      <span
                        key={cat}
                        className="acx-chip text-sm px-3 py-1"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={agent.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acx-btn-primary px-4 py-2 text-sm sm:shrink-0 w-full sm:w-auto text-center"
                >
                  Visit Site →
                </a>
                <div className="sm:shrink-0 w-full sm:w-auto">
                  <WatchlistButton slug={agent.slug} />
                </div>
              </div>
              <p className="mt-6 acx-body leading-relaxed">
                {agent.description}
              </p>
            </div>

            <div className="acx-panel p-8 acx-reveal acx-reveal-delay-1">
              <h2 className="text-3xl font-semibold acx-page-title mb-4">
                Decision Fit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-[var(--acx-success)] bg-[var(--acx-success-soft)] p-4">
                  <p className="font-semibold text-[var(--acx-success)]">Best For</p>
                  <p className="text-[var(--acx-success)] mt-1">{getBestFor(agent)}</p>
                </div>
                <div className="rounded-lg border border-[var(--acx-warn)] bg-[var(--acx-warn-soft)] p-4">
                  <p className="font-semibold text-[var(--acx-warn)]">Avoid If</p>
                  <p className="text-[var(--acx-warn)] mt-1">{getAvoidIf(agent)}</p>
                </div>
              </div>
            </div>

            {latestVersion?.capabilities && (
              <div className="acx-panel p-8 acx-reveal acx-reveal-delay-2">
                <h2 className="text-3xl font-semibold acx-page-title mb-6">
                  Current Capabilities
                  <span className="ml-2 text-sm font-normal acx-muted">
                    ({latestVersion.version_number})
                  </span>
                </h2>
                <div className="space-y-4">
                  {Object.entries(latestVersion.capabilities).map(([key, value]) => (
                    <CapabilityScore
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      score={value as number}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="acx-panel p-8 acx-reveal acx-reveal-delay-3">
              <h2 className="text-3xl font-semibold acx-page-title mb-8">
                Version History
                <span className="ml-2 text-sm font-normal acx-muted">
                  {versions.length} releases documented
                </span>
              </h2>
              <VersionTimeline versions={versions} agentSlug={agent.slug} />
            </div>

          </div>

          <div className="space-y-6">
            <div className="acx-panel p-6 acx-reveal">
              <h3 className="font-semibold text-[var(--acx-text)] mb-4">Quick Facts</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="acx-muted">Provider</span>
                  <span className="font-medium text-[var(--acx-text)]">
                    {agent.provider}
                  </span>
                </div>
                <div className="border-t acx-divider" />
                {latestVersion && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="acx-muted">Latest Version</span>
                      <span className="font-medium text-[var(--acx-text)]">
                        {latestVersion.version_number}
                      </span>
                    </div>
                    <div className="border-t acx-divider" />
                    <div className="flex justify-between text-sm">
                      <span className="acx-muted">Last Updated</span>
                      <span className="font-medium text-[var(--acx-text)]">
                        {new Date(latestVersion.release_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="border-t acx-divider" />
                    {latestVersion.context_window && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="acx-muted">Context Window</span>
                          <span className="font-medium text-[var(--acx-text)]">
                            {latestVersion.context_window.toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t acx-divider" />
                      </>
                    )}
                    {latestVersion.pricing_info && (
                      <div className="flex justify-between text-sm">
                        <span className="acx-muted">Pricing</span>
                        <span className="font-medium text-[var(--acx-text)] text-right max-w-32">
                          {latestVersion.pricing_info}
                        </span>
                      </div>
                    )}
                    <div className="border-t acx-divider" />
                    <div className="flex justify-between text-sm">
                      <span className="acx-muted">Source Trust</span>
                      <span className={`font-medium ${quality?.sourceOfficial ? 'text-[var(--acx-success)]' : 'text-[var(--acx-warn)]'}`}>
                        {quality?.sourceOfficial ? 'Official' : 'Needs review'}
                      </span>
                    </div>
                    <div className="border-t acx-divider" />
                    <div className="flex justify-between text-sm">
                      <span className="acx-muted">Extraction Confidence</span>
                      <span className="font-medium text-[var(--acx-text)]">
                        {quality ? `${Math.round(quality.extractionConfidence * 100)}%` : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="acx-panel p-6 bg-[var(--acx-accent-soft)] border-[var(--acx-accent)] acx-reveal acx-reveal-delay-1">
              <div className="text-center">
                <div className="text-4xl font-semibold text-[var(--acx-accent)]">
                  {versions.length}
                </div>
                <div className="text-sm text-[var(--acx-accent)] mt-1 font-medium">
                  Versions Documented
                </div>
                <div className="text-xs text-[var(--acx-accent)] mt-2">
                  Since {versions.length > 0 && new Date(
                    versions[versions.length - 1].release_date
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="acx-panel p-6 acx-reveal acx-reveal-delay-2">
              <h3 className="font-semibold text-[var(--acx-text)] mb-4">Links</h3>
              <div className="space-y-2">
                <a
                  href={agent.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] py-2"
                >
                  <span>Official Website</span>
                  <span>→</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
