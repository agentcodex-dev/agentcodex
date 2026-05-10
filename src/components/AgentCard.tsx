import Link from 'next/link'
import { Agent, AgentVersion } from '@/lib/types'
import WatchlistButton from '@/components/WatchlistButton'

type Props = {
  agent: Agent
  latestVersion?: AgentVersion | null
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function isRecent(value: string) {
  const releaseDate = new Date(`${value}T00:00:00`).getTime()
  const daysSinceRelease = (Date.now() - releaseDate) / (24 * 60 * 60 * 1000)
  return daysSinceRelease <= 30
}

export default function AgentCard({ agent, latestVersion }: Props) {
  return (
    <Link href={`/agents/${agent.slug}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {agent.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-500">{agent.provider}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {latestVersion && isRecent(latestVersion.release_date) && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                Updated recently
              </span>
            )}
            {agent.is_verified && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                Verified
              </span>
            )}
            <WatchlistButton slug={agent.slug} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {agent.description}
        </p>

        {latestVersion && (
          <div className="mb-4 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            Latest: <span className="font-medium text-gray-700">{latestVersion.version_number}</span>
            <span className="mx-1">·</span>
            {formatDate(latestVersion.release_date)}
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {agent.category.map((cat) => (
            <span
              key={cat}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>

      </div>
    </Link>
  )
}
