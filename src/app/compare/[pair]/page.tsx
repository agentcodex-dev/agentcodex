import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CompareView from '@/components/CompareView'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>
}): Promise<Metadata> {
  const { pair } = await params
  const [slugA, slugB] = pair.split('-vs-')

  const agentA = await getAgentBySlug(slugA)
  const agentB = await getAgentBySlug(slugB)

  if (!agentA || !agentB) {
    return { title: 'Compare Agents | AgentCodex' }
  }

  return {
    title: `${agentA.name} vs ${agentB.name} - Comparison | AgentCodex`,
    description: `Compare ${agentA.name} and ${agentB.name} side by side. Capabilities, pricing, context window and full version history. Which AI agent is right for you?`,
    alternates: {
      canonical: `https://agentcodex.dev/compare/${pair}`,
    },
    openGraph: {
      title: `${agentA.name} vs ${agentB.name} | AgentCodex`,
      description: `Compare ${agentA.name} and ${agentB.name} capabilities, pricing and version history.`,
      url: `https://agentcodex.dev/compare/${pair}`,
    }
  }
}

export async function generateStaticParams() {
  return [
    { pair: 'claude-vs-chatgpt' },
    { pair: 'cursor-vs-windsurf' },
    { pair: 'cursor-vs-github-copilot' },
    { pair: 'claude-vs-gemini' },
    { pair: 'chatgpt-vs-gemini' },
    { pair: 'devin-vs-cursor' },
    { pair: 'perplexity-vs-chatgpt' },
    { pair: 'llama-vs-claude' },
    { pair: 'bolt-new-vs-cursor' },
    { pair: 'github-copilot-vs-windsurf' },
  ]
}

export default async function CompareStaticPage({
  params,
}: {
  params: Promise<{ pair: string }>
}) {
  const { pair } = await params
  const parts = pair.split('-vs-')

  if (parts.length !== 2) notFound()

  const [slugA, slugB] = parts
  const agentA = await getAgentBySlug(slugA)
  const agentB = await getAgentBySlug(slugB)

  if (!agentA || !agentB) notFound()

  const versionsA = await getVersions(agentA.id)
  const versionsB = await getVersions(agentB.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span>→</span>
            <Link href="/compare" className="hover:text-gray-700">Compare</Link>
            <span>→</span>
            <span className="text-gray-900">
              {agentA.name} vs {agentB.name}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            {agentA.name} vs {agentB.name}
          </h1>
          <p className="text-gray-500 mt-2">
            Side by side comparison of capabilities, pricing and version history
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <CompareView
          agentA={agentA}
          agentB={agentB}
          versionsA={versionsA}
          versionsB={versionsB}
        />

        {/* Try Other Comparisons */}
        <div className="mt-12">
          <h2 className="font-semibold text-gray-900 mb-4">
            Other Comparisons
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { a: 'claude', b: 'chatgpt', label: 'Claude vs ChatGPT' },
              { a: 'cursor', b: 'windsurf', label: 'Cursor vs Windsurf' },
              { a: 'cursor', b: 'github-copilot', label: 'Cursor vs Copilot' },
              { a: 'claude', b: 'gemini', label: 'Claude vs Gemini' },
              { a: 'chatgpt', b: 'gemini', label: 'ChatGPT vs Gemini' },
              { a: 'devin', b: 'cursor', label: 'Devin vs Cursor' },
            ]
              .filter(p => !(p.a === slugA && p.b === slugB))
              .slice(0, 5)
              .map(pair => (
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

      </div>
      <Footer />
    </div>
  )
}