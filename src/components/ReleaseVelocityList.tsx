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

function getMomentumLabel(velocity: ReleaseVelocity) {
  const expectedMonthly = velocity.releases90 / 3
  if (velocity.releases30 >= expectedMonthly + 1) return { label: 'Accelerating', tone: 'up' as const }
  if (velocity.releases30 <= Math.max(0, expectedMonthly - 1)) return { label: 'Cooling', tone: 'down' as const }
  return { label: 'Steady', tone: 'flat' as const }
}

export default function ReleaseVelocityList({ velocities, limit }: Props) {
  const visibleVelocities = limit ? velocities.slice(0, limit) : velocities
  const maxSignal = Math.max(...visibleVelocities.map((item) => item.weightedScore), 1)
  const max30 = Math.max(...visibleVelocities.map((item) => item.releases30), 1)
  const max90 = Math.max(...visibleVelocities.map((item) => item.releases90), 1)

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
      {visibleVelocities.map((velocity, index) => {
        const momentum = getMomentumLabel(velocity)
        const signalWidth = Math.max(6, Math.round((velocity.weightedScore / maxSignal) * 100))
        const releases30Width = Math.max(6, Math.round((velocity.releases30 / max30) * 100))
        const releases90Width = Math.max(6, Math.round((velocity.releases90 / max90) * 100))

        return (
          <div
            key={velocity.agent.id}
            className={`p-4 sm:p-5 ${index > 0 ? 'border-t acx-divider' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
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

              <div className="flex items-center gap-3 shrink-0">
                <span className={`acx-badge ${
                  momentum.tone === 'up'
                    ? 'acx-badge-official'
                    : momentum.tone === 'down'
                      ? 'acx-badge-warn'
                      : 'acx-badge-neutral'
                }`}>
                  {momentum.label}
                </span>
                <Link
                  href={`/agents/${velocity.agent.slug}`}
                  className="text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
                  aria-label={`View ${velocity.agent.name}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] acx-muted">Velocity score</span>
                  <span className="text-sm font-semibold text-[var(--acx-text)]">
                    {velocity.weightedScore.toFixed(1)}
                  </span>
                </div>
                <div className="acx-meter mt-1">
                  <span className="bg-[var(--acx-bar-1)]" style={{ width: `${signalWidth}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] acx-muted">30d releases</span>
                  <span className="text-sm font-semibold text-[var(--acx-text)]">
                    {velocity.releases30}
                  </span>
                </div>
                <div className="acx-meter mt-1">
                  <span className="bg-[var(--acx-bar-2)]" style={{ width: `${releases30Width}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] acx-muted">Quarter releases</span>
                  <span className="text-sm font-semibold text-[var(--acx-text)]">
                    {velocity.releases90}
                  </span>
                </div>
                <div className="acx-meter mt-1">
                  <span className="bg-[var(--acx-bar-3)]" style={{ width: `${releases90Width}%` }} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
