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
import { PlatformBadge, PlatformHeader, PlatformMetaRow, PlatformMetric, PlatformPanel, PlatformShell } from '@/components/platform/PlatformUI'
import { formatConfidence, formatContext, formatMonthDate, formatPricing, formatShortDate } from '@/lib/display'

const CAPABILITY_LABELS: Record<string, string> = {
  coding: 'Coding',
  reasoning: 'Reasoning',
  multimodal: 'Multimodal',
  tool_use: 'Tool Use',
  memory: 'Memory',
  speed: 'Speed',
}

function capabilityLabel(key: string) {
  return CAPABILITY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function getLastKnown<T>(versions: AgentVersion[], field: keyof AgentVersion): T | null {
  const match = versions.find((version) => version[field])
  return (match?.[field] as T | undefined) ?? null
}

function metadataNote(currentValue?: string | number | null) {
  return currentValue ? 'Captured in this release' : 'Not captured in this release; showing last known value when available'
}

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
  const confidence = latestVersion ? formatConfidence(agent, latestVersion) : null
  const previousVersion = versions[1]
  const lastKnownContext = latestVersion?.context_window ?? getLastKnown<number>(versions, 'context_window')
  const lastKnownPricing = latestVersion?.pricing_info ?? getLastKnown<string>(versions, 'pricing_info')
  const capabilityDeltas = latestVersion?.capabilities
    ? Object.entries(latestVersion.capabilities).map(([key, value]) => {
      const previous = previousVersion?.capabilities?.[key]
      return {
        key,
        label: capabilityLabel(key),
        value: value as number,
        previous: typeof previous === 'number' ? previous : null,
        delta: typeof previous === 'number' ? (value as number) - previous : null,
      }
    })
    : []

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <PlatformShell>
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-[var(--acx-text)]">Home</Link>
          <span>/</span>
          <Link href="/agents" className="hover:text-[var(--acx-text)]">Agents</Link>
          <span>/</span>
          <span className="text-[var(--acx-text)]">{agent.name}</span>
        </div>
        <PlatformHeader
          title={agent.name}
          subtitle={`${agent.provider} profile, latest version intelligence, capability movement, and source-aware release history.`}
        />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <PlatformPanel>
              <div className="p-5">
              <p className="acx-code-badge acx-muted mb-3">Profile</p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[var(--acx-accent-soft)]">
                  <span className="font-bold text-2xl text-[var(--acx-accent)]">{agent.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-semibold text-[var(--acx-text)]">{agent.name}</h1>
                    {agent.is_verified && (
                      <PlatformBadge tone="green">Verified</PlatformBadge>
                    )}
                  </div>
                  <p className="acx-muted mt-1">by {agent.provider}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {agent.category.map((cat) => (
                      <PlatformBadge key={cat} tone="blue">{cat}</PlatformBadge>
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
              <p className="mt-6 text-sm leading-relaxed acx-body">
                {agent.description}
              </p>
              </div>
            </PlatformPanel>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <PlatformMetric label="Latest Version" value={latestVersion?.version_number || 'N/A'} detail={formatMonthDate(latestVersion?.release_date)} tone="blue" />
              <PlatformMetric label="Confidence" value={confidence?.label || 'N/A'} detail={confidence?.estimated ? 'estimated' : 'extracted'} tone={confidence?.estimated ? 'amber' : 'green'} />
              <PlatformMetric label="Context" value={lastKnownContext ? lastKnownContext.toLocaleString() : 'N/A'} detail={latestVersion?.context_window ? 'tokens' : 'last known / not captured'} tone="neutral" />
              <PlatformMetric label="Versions" value={versions.length} detail="documented releases" tone="green" />
            </div>

            <PlatformPanel title="Current Release Intelligence" subtitle="Latest published version and metadata capture state">
              <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                  <p className="acx-code-badge acx-muted mb-2">Release</p>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--acx-text)]">{latestVersion?.version_number || 'No release'}</h3>
                    {latestVersion?.change_type && <PlatformBadge tone={latestVersion.change_type === 'major' ? 'green' : latestVersion.change_type === 'minor' ? 'blue' : 'neutral'}>{latestVersion.change_type}</PlatformBadge>}
                    {confidence?.estimated && <PlatformBadge tone="amber">EST confidence</PlatformBadge>}
                  </div>
                  <p className="text-sm leading-relaxed acx-body">
                    {latestVersion?.what_changed || 'No release summary captured yet.'}
                  </p>
                </div>
                <div>
                  <PlatformMetaRow label="Previous version" value={previousVersion?.version_number || 'N/A'} />
                  <PlatformMetaRow label="Release date" value={formatShortDate(latestVersion?.release_date)} />
                  <PlatformMetaRow label="Context window" value={formatContext(lastKnownContext)} />
                  <PlatformMetaRow label="Pricing" value={formatPricing(lastKnownPricing)} />
                  <PlatformMetaRow label="Source trust" value={quality?.sourceOfficial ? 'Official' : 'Needs review'} />
                  <PlatformMetaRow label="Source" value={latestVersion?.source_url ? <a className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]" href={latestVersion.source_url} target="_blank" rel="noopener noreferrer">Open source</a> : 'Not captured'} />
                </div>
              </div>
            </PlatformPanel>

            <PlatformPanel title="Decision Fit">
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--acx-success)] bg-[var(--acx-success-soft)] p-4">
                  <p className="font-semibold text-[var(--acx-success)]">Best For</p>
                  <p className="mt-1 text-sm text-[var(--acx-text)]">{getBestFor(agent)}</p>
                </div>
                <div className="rounded-xl border border-[var(--acx-warn)] bg-[var(--acx-warn-soft)] p-4">
                  <p className="font-semibold text-[var(--acx-warn)]">Avoid If</p>
                  <p className="mt-1 text-sm text-[var(--acx-text)]">{getAvoidIf(agent)}</p>
                </div>
              </div>
            </PlatformPanel>

            <PlatformPanel title="Release Diff" subtitle="Core fields and capture notes for this release">
              <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
                <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                  <p className="acx-code-badge acx-muted">Version</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border acx-divider bg-[var(--acx-elevated)] p-3 text-[var(--acx-danger)]">
                      - {previousVersion?.version_number || 'N/A'}
                    </div>
                    <div className="rounded-lg border acx-divider bg-[var(--acx-elevated)] p-3 text-[var(--acx-success)]">
                      + {latestVersion?.version_number || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                  <p className="acx-code-badge acx-muted">Context Window</p>
                  <p className="mt-2 text-xs acx-muted">{metadataNote(latestVersion?.context_window)}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--acx-text)]">{formatContext(lastKnownContext)}</p>
                </div>
                <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4 lg:col-span-2">
                  <p className="acx-code-badge acx-muted">Pricing</p>
                  <p className="mt-2 text-xs acx-muted">{metadataNote(latestVersion?.pricing_info)}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--acx-text)]">{formatPricing(lastKnownPricing)}</p>
                </div>
              </div>
            </PlatformPanel>

            {latestVersion?.capabilities && (
              <PlatformPanel title="Current Capabilities" subtitle={`${latestVersion.version_number} with previous-release movement`}>
                <div className="space-y-4 p-4">
                  {capabilityDeltas.map((item) => (
                    <div key={item.key} className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="font-semibold text-[var(--acx-text)]">{item.label}</span>
                        <span className={`text-sm font-semibold tabular-nums ${item.delta === null ? 'acx-muted' : item.delta >= 0 ? 'text-[var(--acx-success)]' : 'text-[var(--acx-danger)]'}`}>
                          {item.delta === null ? 'new' : `${item.delta >= 0 ? '+' : ''}${item.delta}`}
                        </span>
                      </div>
                      <CapabilityScore label={item.label} score={item.value} />
                      {item.previous !== null && (
                        <p className="mt-2 text-xs acx-muted">Previous score: {item.previous}</p>
                      )}
                    </div>
                  ))}
                </div>
              </PlatformPanel>
            )}

            <PlatformPanel title="Version History" subtitle={`${versions.length} releases documented`}>
              <div className="p-4">
                <VersionTimeline versions={versions} agentSlug={agent.slug} />
              </div>
            </PlatformPanel>

          </div>

          <div className="space-y-3">
            <PlatformPanel title="Quick Facts">
              <div className="p-4">
                <PlatformMetaRow label="Provider" value={agent.provider} />
                <PlatformMetaRow label="Latest Version" value={latestVersion?.version_number || 'N/A'} />
                <PlatformMetaRow label="Last Updated" value={formatMonthDate(latestVersion?.release_date)} />
                <PlatformMetaRow label="Context Window" value={formatContext(lastKnownContext)} />
                <PlatformMetaRow label="Pricing" value={formatPricing(lastKnownPricing)} />
                <PlatformMetaRow label="Source Trust" value={quality?.sourceOfficial ? 'Official' : 'Needs review'} />
                <PlatformMetaRow label="Confidence" value={confidence ? `${confidence.label}${confidence.estimated ? ' EST' : ''}` : 'N/A'} />
              </div>
            </PlatformPanel>

            <PlatformPanel title="Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <a href={agent.website_url} target="_blank" rel="noopener noreferrer" className="m-4 rounded-lg border acx-divider px-3 py-2 text-sm font-semibold text-[var(--acx-text-soft)] hover:border-[var(--acx-accent)]">
                  Official Website →
                </a>
                <Link href={`/compare/${agent.slug}-vs-cursor`} className="m-4 rounded-lg border acx-divider px-3 py-2 text-sm font-semibold text-[var(--acx-text-soft)] hover:border-[var(--acx-accent)]">
                  Compare →
                </Link>
              </div>
            </PlatformPanel>

          </div>
        </div>
      </PlatformShell>
      <Footer />
    </div>
  )
}
