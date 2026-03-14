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

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { a, b } = await searchParams
  const agents = await getAgents()

  let agentA = null
  let agentB = null
  let versionsA: AgentVersion[] = []
  let versionsB: AgentVersion[] = []

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