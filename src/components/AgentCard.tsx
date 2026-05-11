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
      <div className="acx-panel p-6 hover:shadow-md hover:border-[var(--acx-border-strong)] transition-all cursor-pointer group">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-lg bg-[var(--acx-accent-soft)] flex items-center justify-center">
              <span className="text-[var(--acx-accent)] font-bold text-sm">
                {agent.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--acx-text)] group-hover:text-[var(--acx-accent)] transition-colors">
                {agent.name}
              </h3>
              <p className="text-sm acx-muted">{agent.provider}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {latestVersion && isRecent(latestVersion.release_date) && (
              <span className="acx-badge acx-badge-trust font-medium">
                Updated recently
              </span>
            )}
            {agent.is_verified && (
              <span className="acx-badge acx-badge-official font-medium">
                Verified
              </span>
            )}
            <WatchlistButton slug={agent.slug} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm acx-body mb-4 line-clamp-2">
          {agent.description}
        </p>

        {latestVersion && (
          <div className="mb-4 text-xs acx-muted bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            Latest: <span className="font-medium text-[var(--acx-text-soft)]">{latestVersion.version_number}</span>
            <span className="mx-1">·</span>
            {formatDate(latestVersion.release_date)}
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {agent.category.map((cat) => (
            <span
              key={cat}
              className="text-xs bg-gray-100 text-[var(--acx-text-soft)] px-2 py-1 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>

      </div>
    </Link>
  )
}
