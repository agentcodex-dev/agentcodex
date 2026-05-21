import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'
import { PlatformHeader, PlatformShell } from '@/components/platform/PlatformUI'
import AgentDirectoryWorkspace from '@/components/cockpit/AgentDirectoryWorkspace'

export const metadata: Metadata = {
  title: 'All AI Agents - Directory & Comparison',
  description: 'Browse all AI agents including Claude, ChatGPT, GitHub Copilot, Cursor, Gemini and more. Filter by category and compare capabilities.',
  alternates: {
    canonical: 'https://agentcodex.dev/agents',
  }
}

async function getAgents(search?: string, category?: string) {
  let query = supabase
    .from('agents')
    .select('*')
    .order('name', { ascending: true })

  if (search) {
    const sanitized = search
      .trim()
      .replace(/[,%()]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 80)

    if (sanitized.length > 0) {
      const ilike = `%${sanitized}%`
      query = query.or(
        `name.ilike.${ilike},provider.ilike.${ilike},description.ilike.${ilike}`
      )
    }
  }

  if (category) {
    query = query.contains('category', [category])
  }

  const { data, error } = await query
  if (error) return []
  return data as Agent[]
}

async function getPublishedVersions() {
  const { data } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('status', 'published')
    .order('release_date', { ascending: false })
  return ((data as AgentVersion[]) || [])
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const { search, category } = await searchParams
  const [agents, versions] = await Promise.all([
    getAgents(search, category),
    getPublishedVersions(),
  ])

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />
      <PlatformShell>
        <PlatformHeader
          title="All AI Agents"
          subtitle="Scan verified profiles, release state, source confidence, and category fit across the agent ecosystem."
        />
        <AgentDirectoryWorkspace
          agents={agents}
          versions={versions}
          selectedCategory={category}
          search={search}
        />
      </PlatformShell>
      <Footer />
    </div>
  )
}
