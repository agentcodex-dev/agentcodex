import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import { COPILOT_PRESETS, scoreForPreset } from '@/lib/copilot'
import { PlatformBadge, PlatformHeader, PlatformMetric, PlatformPanel, PlatformShell } from '@/components/platform/PlatformUI'
import { formatConfidence, formatShortDate } from '@/lib/display'

export const metadata: Metadata = {
  title: 'Agent Copilot - Pick The Right Agent Fast',
  description: 'Use workflow presets to shortlist AI agents with rationale and quick compare links.',
}

async function getAgentsAndVersions() {
  const [{ data: agentsData }, { data: versionsData }] = await Promise.all([
    supabase.from('agents').select('*').order('name', { ascending: true }),
    supabase.from('agent_versions').select('*').eq('status', 'published').order('release_date', { ascending: false }),
  ])

  const agents = (agentsData as Agent[]) || []
  const versions = (versionsData as AgentVersion[]) || []
  const latestByAgent = new Map<string, AgentVersion>()
  versions.forEach((v) => {
    if (!latestByAgent.has(v.agent_id)) latestByAgent.set(v.agent_id, v)
  })
  return { agents, latestByAgent }
}

export default async function CopilotPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>
}) {
  const { preset } = await searchParams
  const selected = preset && COPILOT_PRESETS[preset] ? preset : 'solo-dev'
  const { agents, latestByAgent } = await getAgentsAndVersions()

  const ranked = agents
    .map((agent) => {
      const latest = latestByAgent.get(agent.id)
      if (!latest?.capabilities) return null
      return { agent, latest, score: scoreForPreset(agent, latest, selected) }
    })
    .filter((x): x is { agent: Agent; latest: AgentVersion; score: number } => Boolean(x))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)

  const leader = ranked[0]

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <PlatformShell>
        <PlatformHeader
          title="Use-Case Copilot"
          subtitle="Pick a workflow and get a decision-ready shortlist with rationale, current version context, and fast compare links."
        />

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformMetric label="Preset" value={COPILOT_PRESETS[selected].label} detail="active workflow lens" tone="blue" />
          <PlatformMetric label="Candidates" value={ranked.length} detail="ranked by latest version" tone="green" />
          <PlatformMetric label="Leader" value={leader?.agent.name || 'N/A'} detail={leader ? leader.latest.version_number : 'no scored agents'} tone="amber" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(COPILOT_PRESETS).map(([key, p]) => (
            <Link
              key={key}
              href={`/copilot?preset=${key}`}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                key === selected
                  ? 'border-[var(--acx-accent)] bg-[var(--acx-accent-soft)] text-[var(--acx-accent)]'
                  : 'acx-divider bg-[var(--acx-elevated)] text-[var(--acx-text-soft)] hover:border-[var(--acx-border-strong)]'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <PlatformPanel title={`Top picks for ${COPILOT_PRESETS[selected].label}`} subtitle="Weighted fit, freshness, and verification boosts" className="mt-5">
          <div className="space-y-3 p-4">
            {ranked.map((row, index) => (
              <div key={row.agent.id} className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--acx-text)]">{index + 1}. {row.agent.name}</p>
                      {index === 0 && <PlatformBadge tone="green">Leader</PlatformBadge>}
                    </div>
                    <p className="mt-1 text-xs acx-muted">
                      Latest {row.latest.version_number} / {formatShortDate(row.latest.release_date)} / Confidence {formatConfidence(row.agent, row.latest).label}{formatConfidence(row.agent, row.latest).estimated ? ' EST' : ''}
                    </p>
                    <p className="mt-2 text-sm acx-body">
                      Strongest fit under the {COPILOT_PRESETS[selected].label.toLowerCase()} weighting based on current capability scores.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge tone="blue">{row.score.toFixed(2)}</PlatformBadge>
                    <Link href={`/agents/${row.agent.slug}`} className="rounded-lg border acx-divider px-3 py-2 text-xs font-semibold text-[var(--acx-text-soft)] hover:border-[var(--acx-accent)]">View agent</Link>
                    {leader && leader.agent.slug !== row.agent.slug && (
                      <Link href={`/compare/${leader.agent.slug}-vs-${row.agent.slug}`} className="rounded-lg border acx-divider px-3 py-2 text-xs font-semibold text-[var(--acx-text-soft)] hover:border-[var(--acx-accent)]">
                        Compare with #{1}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlatformPanel>
      </PlatformShell>
      <Footer />
    </div>
  )
}
