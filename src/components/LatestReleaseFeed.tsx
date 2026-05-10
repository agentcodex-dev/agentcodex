import Link from 'next/link'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { getCompareTarget, LatestRelease } from '@/lib/radar'
import { deriveQualitySignal } from '@/lib/intelligence'
import { deriveChangeType, deriveImportanceScore } from '@/lib/intelligence'

type Props = {
  releases: LatestRelease[]
  limit?: number
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LatestReleaseFeed({ releases, limit }: Props) {
  const visibleReleases = limit ? releases.slice(0, limit) : releases

  if (visibleReleases.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h3 className="font-semibold text-gray-900">No releases yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Published agent updates will appear here as the pipeline approves them.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleReleases.map((release) => {
        const compareTarget = getCompareTarget(release.agent)
        const quality = deriveQualitySignal(release.agent, release)
        const changeType = release.change_type || deriveChangeType(0, release.what_changed || '')
        const importance = release.importance_score || deriveImportanceScore(0, release.what_changed || '')

        return (
          <article
            key={release.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/agents/${release.agent.slug}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {release.agent.name}
                  </Link>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {release.version_number}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(release.release_date)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {release.agent.provider}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    quality.sourceOfficial
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {quality.sourceOfficial ? 'Official source' : 'Source not verified'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                    {changeType}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    Importance {importance}/10
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    Confidence {Math.round(quality.extractionConfidence * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-3 line-clamp-3">
                  {release.what_changed}
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                <Link
                  href={`/agents/${release.agent.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View agent
                  <ArrowUpRight size={14} />
                </Link>
                <Link
                  href={`/compare/${release.agent.slug}-vs-${compareTarget}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Compare
                  <ArrowUpRight size={14} />
                </Link>
                {release.source_url && (
                  <a
                    href={release.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    Source
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
