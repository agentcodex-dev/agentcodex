import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CompareView from '@/components/CompareView'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PlatformHeader, PlatformPanel, PlatformShell } from '@/components/platform/PlatformUI'

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
    { pair: 'claude-vs-mistral' },
    { pair: 'midjourney-vs-stable-diffusion' },
    { pair: 'cursor-vs-replit-agent' },
    { pair: 'cursor-vs-cline' },
    { pair: 'grok-vs-chatgpt' },
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
    <div className="min-h-screen acx-shell">
      <Navigation />

      <PlatformShell>
        <div className="mb-3 flex items-center gap-2 text-sm acx-muted">
          <Link href="/" className="hover:text-[var(--acx-text)]">Home</Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-[var(--acx-text)]">Compare</Link>
          <span>/</span>
          <span className="text-[var(--acx-text)]">{agentA.name} vs {agentB.name}</span>
        </div>
        <PlatformHeader
          title={`${agentA.name} vs ${agentB.name}`}
          subtitle="Side-by-side decision workspace for capabilities, pricing, context, and latest version state."
        />

        <CompareView
          agentA={agentA}
          agentB={agentB}
          versionsA={versionsA}
          versionsB={versionsB}
        />

        <PlatformPanel title="Other Comparisons" className="mt-6">
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
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
                  className="rounded-xl border acx-divider bg-[var(--acx-elevated)] p-4 text-center transition-colors hover:border-[var(--acx-border-strong)]"
                >
                  <span className="text-sm font-medium text-[var(--acx-text)]">
                    {pair.label}
                  </span>
                  <div className="mt-1 text-xs font-semibold text-[var(--acx-accent)]">
                    Compare →
                  </div>
                </Link>
              ))}
          </div>
        </PlatformPanel>
      </PlatformShell>
      <Footer />
    </div>
  )
}
