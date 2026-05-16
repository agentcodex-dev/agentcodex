import Link from 'next/link'
import { Agent, AgentVersion } from '@/lib/types'
import WatchlistButton from '@/components/WatchlistButton'
import { ArrowUpRight } from 'lucide-react'

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
    <article className="acx-panel p-5 sm:p-6 hover:border-[var(--acx-border-strong)] transition-colors acx-reveal">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] flex items-center justify-center shrink-0">
            <span className="font-bold text-sm">
              {agent.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <Link
              href={`/agents/${agent.slug}`}
              className="font-semibold text-[var(--acx-text)] hover:text-[var(--acx-accent)] transition-colors block truncate"
            >
              {agent.name}
            </Link>
            <p className="text-sm acx-muted truncate">{agent.provider}</p>
          </div>
        </div>

        <WatchlistButton slug={agent.slug} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {latestVersion && isRecent(latestVersion.release_date) && (
          <span className="acx-badge acx-badge-trust font-medium acx-release-pulse">
            Updated recently
          </span>
        )}
        {agent.is_verified && (
          <span className="acx-badge acx-badge-official font-medium">
            Verified
          </span>
        )}
      </div>

      <p className="text-sm acx-body mb-4 line-clamp-2">
        {agent.description}
      </p>

      {latestVersion && (
        <div className="mb-4 text-xs acx-muted bg-[var(--acx-elevated-soft)] border acx-divider rounded-lg px-3 py-2">
          Latest: <span className="font-medium text-[var(--acx-text-soft)]">{latestVersion.version_number}</span>
          <span className="mx-1">·</span>
          {formatDate(latestVersion.release_date)}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {agent.category.map((cat) => (
          <span
            key={cat}
            className="acx-chip"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/agents/${agent.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
        >
          View profile
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  )
}
