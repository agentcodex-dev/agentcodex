import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase'
import { Agent } from '@/lib/types'
import Link from 'next/link'
import Footer from '@/components/Footer'

async function getAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name', { ascending: true })
  if (error) return []
  return data as Agent[]
}

export default async function ComparePage() {
  const agents = await getAgents()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Compare Agents
          </h1>
          <p className="text-gray-500 mt-2">
            Side by side capability comparison
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Coming Soon State */}
        {agents.length < 2 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              More Agents Coming Soon
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We need at least 2 agents to compare.
              We are adding more agents daily.
            </p>
            <Link
              href="/agents"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Current Agents
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Select two agents to compare
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Agent A */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent A
                </label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.slug}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Agent B */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent B
                </label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.slug}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Full comparison feature coming soon as we add more agents
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}