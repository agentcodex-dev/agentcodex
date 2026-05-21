import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CompareView from '@/components/CompareView'
import Link from 'next/link'
import type { Metadata } from 'next'
import AgentSelector from '@/components/AgentSelector'
import MethodologyCallout from '@/components/MethodologyCallout'
import { PlatformBadge, PlatformHeader, PlatformMetric, PlatformPanel, PlatformShell } from '@/components/platform/PlatformUI'

export const metadata: Metadata = {
  title: 'Compare AI Agents - Side by Side Comparison',
  description: 'Compare AI agents side by side. Capabilities, pricing, context window and version history.',
}

async function getAgents() {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .order('name', { ascending: true })
  return (data as Agent[]) || []
}

async function getAgentBySlug(slug: string) {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as Agent | null
}

async function getVersions(agentId: string) {
  const { data } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'published')
    .order('release_date', { ascending: false })
  return (data as AgentVersion[]) || []
}

async function getAllPublishedVersions() {
  const { data } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('status', 'published')
    .order('release_date', { ascending: false })
  return (data as AgentVersion[]) || []
}

// Popular comparison pairs for quick access
const POPULAR_PAIRS = [
  { a: 'claude', b: 'chatgpt', label: 'Claude vs ChatGPT' },
  { a: 'cursor', b: 'windsurf', label: 'Cursor vs Windsurf' },
  { a: 'cursor', b: 'github-copilot', label: 'Cursor vs Copilot' },
  { a: 'claude', b: 'gemini', label: 'Claude vs Gemini' },
  { a: 'chatgpt', b: 'gemini', label: 'ChatGPT vs Gemini' },
  { a: 'devin', b: 'cursor', label: 'Devin vs Cursor' },
  { a: 'claude', b: 'mistral', label: 'Claude vs Mistral' },
  { a: 'midjourney', b: 'stable-diffusion', label: 'Midjourney vs Stable Diffusion' },
  { a: 'cursor', b: 'replit-agent', label: 'Cursor vs Replit Agent' },
  { a: 'cursor', b: 'cline', label: 'Cursor vs Cline' },
]

const PRESETS: Record<string, { label: string; weights: Record<string, number>; categories: string[] }> = {
  'solo-dev': {
    label: 'Solo Dev Build Speed',
    weights: { coding: 0.4, speed: 0.25, tool_use: 0.2, reasoning: 0.15 },
    categories: ['Coding'],
  },
  enterprise: {
    label: 'Enterprise Reliability',
    weights: { reasoning: 0.3, tool_use: 0.25, memory: 0.2, coding: 0.15, speed: 0.1 },
    categories: ['Coding', 'General', 'Research'],
  },
  research: {
    label: 'Research And Synthesis',
    weights: { reasoning: 0.45, memory: 0.25, tool_use: 0.15, multimodal: 0.15 },
    categories: ['Research', 'General'],
  },
  multimodal: {
    label: 'Multimodal Creation',
    weights: { multimodal: 0.5, speed: 0.2, reasoning: 0.15, tool_use: 0.15 },
    categories: ['Multimodal', 'General'],
  },
}

function scoreAgentForPreset(agent: Agent, latestVersion: AgentVersion, presetKey: string) {
  const preset = PRESETS[presetKey]
  if (!preset) return 0
  const weighted = Object.entries(preset.weights).reduce((sum, [key, weight]) => {
    const score = latestVersion.capabilities?.[key] ?? 0
    return sum + score * weight
  }, 0)
  const categoryBonus = agent.category.some((cat) => preset.categories.includes(cat)) ? 0.4 : 0
  return Number((weighted + categoryBonus).toFixed(2))
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; preset?: string }>
}) {
  const { a, b, preset } = await searchParams
  const agents = await getAgents()
  const selectedPreset = preset && PRESETS[preset] ? preset : 'solo-dev'

  let agentA = null
  let agentB = null
  let versionsA: AgentVersion[] = []
  let versionsB: AgentVersion[] = []
  const allVersions = await getAllPublishedVersions()
  const latestByAgentId = new Map<string, AgentVersion>()
  allVersions.forEach((version) => {
    if (!latestByAgentId.has(version.agent_id)) {
      latestByAgentId.set(version.agent_id, version)
    }
  })
  const shortlist = agents
    .map((agent) => {
      const latest = latestByAgentId.get(agent.id)
      if (!latest?.capabilities) return null
      return {
        agent,
        score: scoreAgentForPreset(agent, latest, selectedPreset),
        latest,
      }
    })
    .filter((item): item is { agent: Agent; score: number; latest: AgentVersion } => item !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)

  if (a && b) {
    agentA = await getAgentBySlug(a)
    agentB = await getAgentBySlug(b)
    if (agentA) versionsA = await getVersions(agentA.id)
    if (agentB) versionsB = await getVersions(agentB.id)
  }

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <PlatformShell>
        <PlatformHeader
          title="Compare AI Agents"
          subtitle="Evaluate fit, tradeoffs, source context, and latest version movement side by side for your workflow."
        />

        <PlatformPanel title="Comparison Control Bar" subtitle="Pick two agents or use a preset shortlist">
          <div className="p-4">
            <AgentSelector
              agents={agents}
              selectedA={a ?? ''}
              selectedB={b ?? ''}
            />
          </div>
        </PlatformPanel>

        <div className="my-3">
          <MethodologyCallout
            body="Compare uses each agent's latest published version and applies workflow-specific weights across capabilities. Scores indicate fit for that workflow, not absolute product quality."
          />
        </div>

        <PlatformPanel title="Compare Presets" subtitle="Workflow-weighted recommendations from latest published versions" className="mb-5">
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(PRESETS).map(([key, value]) => (
              <Link
                key={key}
                href={`/compare?preset=${key}`}
                className={`rounded-xl border p-4 transition-colors ${
                  selectedPreset === key
                    ? 'border-[var(--acx-accent)] bg-[var(--acx-accent-soft)]'
                    : 'acx-divider bg-[var(--acx-elevated)] hover:border-[var(--acx-border-strong)]'
                }`}
              >
                <p className="text-sm font-semibold text-[var(--acx-text)]">{value.label}</p>
                <p className="mt-1 text-xs acx-muted">Weighted shortlist</p>
              </Link>
            ))}
          </div>
          <div className="border-t acx-divider p-4">
            <h3 className="text-sm font-semibold text-[var(--acx-text)]">
              Top shortlist: {PRESETS[selectedPreset].label}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {shortlist.map((entry, index) => (
                <div key={entry.agent.id} className="rounded-xl border acx-divider bg-[var(--acx-surface)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/agents/${entry.agent.slug}`} className="text-sm font-semibold text-[var(--acx-text)] hover:text-[var(--acx-accent)]">
                      {index + 1}. {entry.agent.name}
                    </Link>
                    <PlatformBadge tone="blue">{entry.score.toFixed(2)}</PlatformBadge>
                  </div>
                  <div className="mt-2 text-xs acx-muted">
                    Latest {entry.latest.version_number}
                  </div>
                  {shortlist[0] && shortlist[0].agent.slug !== entry.agent.slug && (
                    <Link
                      href={`/compare/${shortlist[0].agent.slug}-vs-${entry.agent.slug}`}
                      className="mt-2 inline-block text-xs font-semibold text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
                    >
                      Compare with #{1} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </PlatformPanel>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformMetric label="Agents" value={agents.length} detail="available to compare" tone="blue" />
          <PlatformMetric label="Preset" value={PRESETS[selectedPreset].label} detail="active scoring lens" tone="amber" />
          <PlatformMetric label="Shortlist" value={shortlist.length} detail="ranked candidates" tone="green" />
        </div>

        {!a && !b && (
          <PlatformPanel title="Popular Comparisons" className="mb-5">
            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
              {POPULAR_PAIRS.map(pair => (
                <Link key={`${pair.a}-${pair.b}`} href={`/compare/${pair.a}-vs-${pair.b}`} className="rounded-xl border acx-divider bg-[var(--acx-elevated)] p-4 text-center transition-colors hover:border-[var(--acx-border-strong)]">
                  <span className="text-sm font-medium text-[var(--acx-text)]">{pair.label}</span>
                  <div className="mt-1 text-xs font-semibold text-[var(--acx-accent)]">Compare →</div>
                </Link>
              ))}
            </div>
          </PlatformPanel>
        )}

        {agentA && agentB ? (
          <CompareView
            agentA={agentA}
            agentB={agentB}
            versionsA={versionsA}
            versionsB={versionsB}
          />
        ) : a && b ? (
          <div className="acx-panel p-12 text-center">
            <h3 className="font-semibold text-[var(--acx-text)] mb-2">
              Agent not found
            </h3>
            <p className="acx-muted text-sm">
              One or both agents could not be found
            </p>
          </div>
        ) : null}

      </PlatformShell>
      <Footer />
    </div>
  )
}
