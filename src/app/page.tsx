import { supabase } from '@/lib/supabase'
import { Agent } from '@/lib/types'
import Navigation from '@/components/Navigation'
import AgentCard from '@/components/AgentCard'
import SearchBar from '@/components/SearchBar'
import Footer from '@/components/Footer'

async function getAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agents:', error)
    return []
  }

  return data as Agent[]
}

export default async function Home() {
  const agents = await getAgents()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            🤖 The Wikipedia for AI Agents
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Find the Right
            <span className="text-blue-600"> AI Agent </span>
            for Your Needs
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Track agent history, compare capabilities and follow 
            version updates. Every AI agent, documented.
          </p>

          <SearchBar />

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {agents.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Agents Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">15+</div>
              <div className="text-sm text-gray-500 mt-1">Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">Daily</div>
              <div className="text-sm text-gray-500 mt-1">Updates</div>
            </div>
          </div>

        </div>
      </section>

      {/* Agents Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Agents
          </h2>
          <a 
            href="/agents"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View all →
          </a>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No agents found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

      </section>

      {/* Footer */}
      <Footer />

    </div>
  )
}