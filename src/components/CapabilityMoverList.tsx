import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react'
import { CapabilityMover } from '@/lib/radar'
import { getCompareTarget } from '@/lib/radar'

type Props = {
  movers: CapabilityMover[]
  limit?: number
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export default function CapabilityMoverList({ movers, limit }: Props) {
  const visibleMovers = limit ? movers.slice(0, limit) : movers

  if (visibleMovers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h3 className="font-semibold text-gray-900">No capability movers yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Agents need at least two scored versions before movement can be measured.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleMovers.map((mover) => (
        <div
          key={`${mover.agent.id}-${mover.latest.id}`}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href={`/agents/${mover.agent.slug}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {mover.agent.name}
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                {mover.previous.version_number} to {mover.latest.version_number} · {formatDate(mover.latest.release_date)}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                  {mover.changeType} change
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  Importance {mover.importanceScore}/10
                </span>
              </div>
            </div>
            <Link
              href={`/agents/${mover.agent.slug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
            >
              View
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {mover.changes.slice(0, 4).map((change) => {
              const isPositive = change.delta > 0
              const Icon = isPositive ? ArrowUp : ArrowDown

              return (
                <span
                  key={change.key}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    isPositive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <Icon size={12} />
                  {change.label} {change.previous} to {change.current}
                </span>
              )
            })}
            <Link
              href={`/compare/${mover.agent.slug}-vs-${getCompareTarget(mover.agent)}`}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Compare
              <ArrowUpRight size={12} />
            </Link>
            {mover.latest.source_url && (
              <a
                href={mover.latest.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Source
                <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
