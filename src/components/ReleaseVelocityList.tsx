import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ReleaseVelocity } from '@/lib/radar'

type Props = {
  velocities: ReleaseVelocity[]
  limit?: number
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function ReleaseVelocityList({ velocities, limit }: Props) {
  const visibleVelocities = limit ? velocities.slice(0, limit) : velocities

  if (visibleVelocities.length === 0) {
    return (
      <div className="acx-panel p-8 text-center">
        <h3 className="font-semibold text-[var(--acx-text)]">No release velocity yet</h3>
        <p className="text-sm acx-muted mt-2">
          Published version history will power this ranking.
        </p>
      </div>
    )
  }

  return (
    <div className="acx-panel overflow-hidden">
      <div className="divide-y acx-divider">
        {visibleVelocities.map((velocity, index) => (
          <div
            key={velocity.agent.id}
            className="p-4 sm:p-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg acx-badge-neutral flex items-center justify-center text-sm font-semibold shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/agents/${velocity.agent.slug}`}
                  className="font-semibold text-[var(--acx-text)] hover:text-[var(--acx-accent)] transition-colors truncate block"
                >
                  {velocity.agent.name}
                </Link>
                <p className="text-xs acx-muted mt-1">
                  {velocity.latestRelease
                    ? `Latest ${formatDate(velocity.latestRelease.release_date)}`
                    : 'No published release date'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-[var(--acx-text)]">
                  {velocity.weightedScore.toFixed(1)}
                </div>
                <div className="text-xs acx-muted">signal</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[var(--acx-text)]">
                  {velocity.releases90}
                </div>
                <div className="text-xs acx-muted">90 days</div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-[var(--acx-text)]">
                  {velocity.releases30}
                </div>
                <div className="text-xs acx-muted">30 days</div>
              </div>
              <Link
                href={`/agents/${velocity.agent.slug}`}
                className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
                aria-label={`View ${velocity.agent.name}`}
              >
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
