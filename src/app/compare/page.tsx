import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CompareView from '@/components/CompareView'
import Link from 'next/link'
import type { Metadata } from 'next'
import AgentSelector from '@/components/AgentSelector'

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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Compare AI Agents
          </h1>
          <p className="text-gray-500 mt-2">
            Side by side capability and version comparison
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Agent Selector */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            Select Agents to Compare
          </h2>
          <AgentSelector
            agents={agents}
            selectedA={a ?? ''}
            selectedB={b ?? ''}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            Compare Presets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(PRESETS).map(([key, value]) => (
              <Link
                key={key}
                href={`/compare?preset=${key}`}
                className={`border rounded-xl p-4 transition-colors ${
                  selectedPreset === key
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-200'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{value.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Weighted shortlist for this workflow
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-5">
            <h3 className="font-medium text-gray-900 text-sm">
              Top shortlist: {PRESETS[selectedPreset].label}
            </h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortlist.map((entry, index) => (
                <div key={entry.agent.id} className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/agents/${entry.agent.slug}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
                      {index + 1}. {entry.agent.name}
                    </Link>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-900 text-white">
                      {entry.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Latest {entry.latest.version_number}
                  </div>
                  {shortlist[0] && shortlist[0].agent.slug !== entry.agent.slug && (
                    <Link
                      href={`/compare/${shortlist[0].agent.slug}-vs-${entry.agent.slug}`}
                      className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Compare with #{1} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Comparisons */}
        {!a && !b && (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">
              Popular Comparisons
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POPULAR_PAIRS.map(pair => (
                <Link
                  key={`${pair.a}-${pair.b}`}
                  href={`/compare/${pair.a}-vs-${pair.b}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all text-center"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {pair.label}
                  </span>
                  <div className="text-xs text-blue-600 mt-1">
                    Compare →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Compare Results */}
        {agentA && agentB ? (
          <CompareView
            agentA={agentA}
            agentB={agentB}
            versionsA={versionsA}
            versionsB={versionsB}
          />
        ) : a && b ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Agent not found
            </h3>
            <p className="text-gray-500 text-sm">
              One or both agents could not be found
            </p>
          </div>
        ) : null}

      </div>
      <Footer />
    </div>
  )
}
