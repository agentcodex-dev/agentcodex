import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import AgentCard from '@/components/AgentCard'
import Footer from '@/components/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

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

async function getLatestVersions() {
  const { data } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('status', 'published')
    .order('release_date', { ascending: false })

  const latestByAgent = new Map<string, AgentVersion>()
  const versions = (data as AgentVersion[]) || []

  versions.forEach((version) => {
    if (!latestByAgent.has(version.agent_id)) {
      latestByAgent.set(version.agent_id, version)
    }
  })

  return latestByAgent
}

const ALL_CATEGORIES = [
  'Coding',
  'Research',
  'General',
  'Multimodal',
]

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const { search, category } = await searchParams
  const [agents, latestVersions] = await Promise.all([
    getAgents(search, category),
    getLatestVersions(),
  ])

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <p className="acx-eyebrow text-sm">Directory</p>
          <h1 className="text-3xl sm:text-4xl font-semibold acx-page-title mt-2">
            All AI Agents
          </h1>
          <p className="acx-body mt-3 text-base sm:text-lg max-w-3xl">
            Scan verified profiles, latest versions and category fit across the live agent ecosystem.
          </p>
          <p className="acx-muted mt-3 text-sm sm:text-base">
            {agents.length} agents documented and growing daily
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="w-full lg:w-64 lg:shrink-0 space-y-4 lg:space-y-6 acx-reveal">
            <div className="acx-panel p-4">
              <h3 className="font-semibold text-[var(--acx-text)] mb-3">
                Search
              </h3>
              <form method="GET">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search agents..."
                  className="w-full px-3 py-2 text-sm acx-input"
                />
                {category && (
                  <input type="hidden" name="category" value={category} />
                )}
                <button
                  type="submit"
                  className="w-full mt-2 acx-btn-primary py-2 text-sm"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="acx-panel p-4">
              <h3 className="font-semibold text-[var(--acx-text)] mb-3">
                Category
              </h3>

              <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
                <Link
                  href="/agents"
                  className={`shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category
                      ? 'acx-btn-primary'
                      : 'acx-btn-secondary'
                  }`}
                >
                  All
                </Link>
                {ALL_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/agents?category=${cat}${search ? `&search=${search}` : ''}`}
                    className={`shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat
                        ? 'acx-btn-primary'
                        : 'acx-btn-secondary'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>

              <div className="hidden lg:flex flex-col space-y-1">
                <Link
                  href="/agents"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category
                      ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] font-medium'
                      : 'acx-link-subtle hover:bg-[var(--acx-elevated-soft)]'
                  }`}
                >
                  All Categories
                </Link>
                {ALL_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/agents?category=${cat}${search ? `&search=${search}` : ''}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat
                        ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] font-medium'
                        : 'acx-link-subtle hover:bg-[var(--acx-elevated-soft)]'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 acx-reveal acx-reveal-delay-1">
            {agents.length === 0 ? (
              <div className="acx-panel text-center py-16 px-6">
                <h3 className="font-semibold text-[var(--acx-text)] mb-2">
                  No agents found
                </h3>
                <p className="acx-muted text-sm mb-4">
                  Try a different search term
                </p>
                <Link
                  href="/agents"
                  className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] text-sm font-medium"
                >
                  Clear search
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    latestVersion={latestVersions.get(agent.id) || null}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
