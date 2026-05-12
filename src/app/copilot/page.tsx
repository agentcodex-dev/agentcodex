import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import { COPILOT_PRESETS, scoreForPreset } from '@/lib/copilot'

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

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h1 className="text-3xl font-bold text-[var(--acx-text)]">Use-Case Copilot</h1>
          <p className="acx-body mt-2">Pick a workflow and get shortlist recommendations with fast compare links.</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(COPILOT_PRESETS).map(([key, p]) => (
            <Link
              key={key}
              href={`/copilot?preset=${key}`}
              className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                key === selected ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] border-[var(--acx-accent)]' : 'bg-white text-[var(--acx-text-soft)] border-[var(--acx-border)]'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <section className="mt-8 acx-panel p-6">
          <h2 className="font-semibold text-gray-900">Top picks for {COPILOT_PRESETS[selected].label}</h2>
          <div className="mt-4 space-y-3">
            {ranked.map((row, index) => (
              <div key={row.agent.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{index + 1}. {row.agent.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Latest {row.latest.version_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-900 text-white">{row.score.toFixed(2)}</span>
                    <Link href={`/agents/${row.agent.slug}`} className="text-xs text-blue-600 hover:text-blue-700">View agent</Link>
                    {leader && leader.agent.slug !== row.agent.slug && (
                      <Link href={`/compare/${leader.agent.slug}-vs-${row.agent.slug}`} className="text-xs text-blue-600 hover:text-blue-700">
                        Compare with #{1}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
