import Link from 'next/link'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { getCompareTarget, LatestRelease } from '@/lib/radar'
import { deriveQualitySignal } from '@/lib/intelligence'
import { deriveChangeType, deriveImportanceScore } from '@/lib/intelligence'
import ImpactBreakdown from '@/components/ImpactBreakdown'

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
        const summary = typeof release.impact_factors?.summary === 'string'
          ? release.impact_factors.summary
          : `${changeType} update with ${quality.confidenceLabel.toLowerCase()} confidence`
        const impactScore = typeof release.impact_factors?.finalImpact === 'number'
          ? release.impact_factors.finalImpact
          : null

        return (
          <article
            key={release.id}
            className="acx-panel p-5 hover:border-[var(--acx-border-strong)] hover:shadow-sm transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/agents/${release.agent.slug}`}
                    className="font-semibold text-[var(--acx-text)] hover:text-[var(--acx-accent)] transition-colors"
                  >
                    {release.agent.name}
                  </Link>
                  <span className="acx-badge acx-badge-trust">
                    {release.version_number}
                  </span>
                  <span className="text-xs acx-muted">
                    {formatDate(release.release_date)}
                  </span>
                </div>
                <p className="text-sm acx-muted mt-1">
                  {release.agent.provider}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`acx-badge ${quality.sourceOfficial ? 'acx-badge-official' : 'acx-badge-warn'}`}>
                    {quality.sourceOfficial ? 'Official source' : 'Source not verified'}
                  </span>
                  <span className="acx-badge acx-badge-trust capitalize">
                    {changeType}
                  </span>
                  <span className="acx-badge acx-badge-neutral">
                    Importance {importance}/10
                  </span>
                  <span className="acx-badge acx-badge-neutral">
                    Confidence {Math.round(quality.extractionConfidence * 100)}%
                  </span>
                </div>
                <p className="text-sm acx-body leading-relaxed mt-3 line-clamp-3">
                  {release.what_changed}
                </p>
                <ImpactBreakdown summary={summary} score={impactScore} />
                {release.quality_flags && release.quality_flags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {release.quality_flags.slice(0, 3).map((flag) => (
                  <span key={flag} className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                        {flag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                <Link
                  href={`/agents/${release.agent.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
                >
                  View agent
                  <ArrowUpRight size={14} />
                </Link>
                <Link
                  href={`/compare/${release.agent.slug}-vs-${compareTarget}`}
                  className="inline-flex items-center gap-1 text-xs font-medium acx-link-subtle"
                >
                  Compare
                  <ArrowUpRight size={14} />
                </Link>
                {release.source_url && (
                  <a
                    href={release.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium acx-link-subtle"
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
