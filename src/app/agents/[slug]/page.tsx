import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion } from '@/lib/types'
import Navigation from '@/components/Navigation'
import CapabilityScore from '@/components/CapabilityScore'
import VersionTimeline from '@/components/VersionTimeline'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

async function getAgent(slug: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Agent
}

async function getAgentVersions(agentId: string) {
  const { data, error } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('agent_id', agentId)
    .order('release_date', { ascending: false })

  if (error || !data) return []
  return data as AgentVersion[]
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const agent = await getAgent(slug)

  if (!agent) {
    return {
      title: 'Agent Not Found | AgentCodex',
    }
  }

  return {
    title: `${agent.name} - Version History & Capabilities | AgentCodex`,
    description: `Track ${agent.name} by ${agent.provider}. Full version history, capability scores and changelog. ${agent.description}`,
    keywords: [
      agent.name,
      agent.provider,
      'AI agent',
      'version history',
      'capabilities',
      ...agent.category
    ],
    openGraph: {
      title: `${agent.name} | AgentCodex`,
      description: `${agent.description}`,
      url: `https://agentcodex.dev/agents/${agent.slug}`,
      siteName: 'AgentCodex',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${agent.name} - AI Agent History | AgentCodex`,
      description: `${agent.description}`,
    },
    alternates: {
      canonical: `https://agentcodex.dev/agents/${agent.slug}`,
    }
  }
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = await getAgent(slug)
  if (!agent) notFound()

  const versions = await getAgentVersions(agent.id)
  const latestVersion = versions[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>→</span>
          <Link href="/agents" className="hover:text-gray-700">Agents</Link>
          <span>→</span>
          <span className="text-gray-900">{agent.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Agent Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 font-bold text-2xl">
                    {agent.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {agent.name}
                    </h1>
                    {agent.is_verified && (
                      <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-1">by {agent.provider}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {agent.category.map((cat) => (
                      <span
                        key={cat}
                        className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={agent.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
                >
                  Visit Site →
                </a>
              </div>
              <p className="mt-6 text-gray-600 leading-relaxed">
                {agent.description}
              </p>
            </div>

            {/* Latest Capabilities */}
            {latestVersion?.capabilities && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Current Capabilities
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({latestVersion.version_number})
                  </span>
                </h2>
                <div className="space-y-4">
                  {Object.entries(latestVersion.capabilities).map(([key, value]) => (
                    <CapabilityScore
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      score={value as number}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Version History */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-8">
                Version History
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {versions.length} releases documented
                </span>
              </h2>
              <VersionTimeline versions={versions} />
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Quick Facts */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Facts</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium text-gray-900">
                    {agent.provider}
                  </span>
                </div>
                <div className="border-t border-gray-100" />
                {latestVersion && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Latest Version</span>
                      <span className="font-medium text-gray-900">
                        {latestVersion.version_number}
                      </span>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="font-medium text-gray-900">
                        {new Date(latestVersion.release_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="border-t border-gray-100" />
                    {latestVersion.context_window && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Context Window</span>
                          <span className="font-medium text-gray-900">
                            {latestVersion.context_window.toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-gray-100" />
                      </>
                    )}
                    {latestVersion.pricing_info && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pricing</span>
                        <span className="font-medium text-gray-900 text-right max-w-32">
                          {latestVersion.pricing_info}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Total Versions */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {versions.length}
                </div>
                <div className="text-sm text-blue-700 mt-1 font-medium">
                  Versions Documented
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  Since {versions.length > 0 && new Date(
                    versions[versions.length - 1].release_date
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Links</h3>
              <div className="space-y-2">
                <a
                  href={agent.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-700 py-2"
                >
                  <span>Official Website</span>
                  <span>→</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}