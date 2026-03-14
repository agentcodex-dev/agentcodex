import { supabase } from '@/lib/supabase'
import { Agent } from '@/lib/types'
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
    query = query.or(
      `name.ilike.%${search}%,provider.ilike.%${search}%,description.ilike.%${search}%`
    )
  }

  if (category) {
    query = query.contains('category', [category])
  }

  const { data, error } = await query
  if (error) return []
  return data as Agent[]
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
  const agents = await getAgents(search, category)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            All AI Agents
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            {agents.length} agents documented and growing daily
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Mobile - Filters on top */}
        {/* Desktop - Sidebar left, grid right */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Filters */}
          <div className="w-full lg:w-56 lg:shrink-0 space-y-4 lg:space-y-6">

            {/* Search */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Search
              </h3>
              <form method="GET">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search agents..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                {category && (
                  <input type="hidden" name="category" value={category} />
                )}
                <button
                  type="submit"
                  className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Categories - horizontal scroll on mobile */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Category
              </h3>

              {/* Mobile - horizontal scroll */}
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
                <Link
                  href="/agents"
                  className={`shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'bg-white border border-gray-200 text-gray-600'
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
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'bg-white border border-gray-200 text-gray-600'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>

              {/* Desktop - vertical list */}
              <div className="hidden lg:flex flex-col space-y-1">
                <Link
                  href="/agents"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
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
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* Agents Grid */}
          <div className="flex-1">
            {agents.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  No agents found
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Try a different search term
                </p>
                <Link
                  href="/agents"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear search
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  )
}