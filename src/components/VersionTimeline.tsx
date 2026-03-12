import { AgentVersion } from '@/lib/types'

type Props = {
  versions: AgentVersion[]
}

export default function VersionTimeline({ versions }: Props) {
  const sorted = [...versions].sort(
    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  )

  return (
    <div className="space-y-0">
      {sorted.map((version, index) => (
        <div key={version.id} className="flex gap-4">
          
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            {index < sorted.length - 1 && (
              <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="pb-8 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {version.version_number}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(version.release_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {version.source_url && (
                <a
                  href={version.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 shrink-0"
                >
                  Source →
                </a>
              )}
            </div>

            {/* What changed */}
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
              {version.what_changed}
            </p>

            {/* Capabilities */}
            {version.capabilities && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(version.capabilities).map(([key, value]) => (
                  <span
                    key={key}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                  >
                    {key}: {value}/10
                  </span>
                ))}
              </div>
            )}

            {/* Pricing */}
            {version.pricing_info && (
              <div className="mt-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  💰 {version.pricing_info}
                </span>
              </div>
            )}

            {/* Context window */}
            {version.context_window && (
              <div className="mt-2">
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                  🪟 {version.context_window.toLocaleString()} token context
                </span>
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  )
}