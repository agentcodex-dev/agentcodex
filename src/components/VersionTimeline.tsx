import { AgentVersion } from '@/lib/types'
import { isOfficialSource } from '@/lib/intelligence'
import ImpactBreakdown from '@/components/ImpactBreakdown'

type Props = {
  versions: AgentVersion[]
  agentSlug?: string
}

export default function VersionTimeline({ versions, agentSlug }: Props) {
  const sorted = [...versions].sort(
    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  )

  return (
    <div className="space-y-0">
      {sorted.map((version, index) => (
        <div key={version.id} className="flex gap-4">
          
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[var(--acx-accent)] mt-1.5 shrink-0" />
            {index < sorted.length - 1 && (
              <div className="w-0.5 bg-[var(--acx-border)] flex-1 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="pb-8 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[var(--acx-text)]">
                  {version.version_number}
                </h3>
                <p className="text-sm acx-muted mt-0.5">
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
                  className="text-xs text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] shrink-0"
                >
                  Source →
                </a>
              )}
            </div>

            {/* What changed */}
            <p className="mt-2 acx-body text-sm leading-relaxed">
              {version.what_changed}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {version.change_type && (
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  version.change_type === 'major'
                    ? 'acx-badge-major'
                    : version.change_type === 'minor'
                      ? 'acx-badge-minor'
                      : version.change_type === 'patch'
                        ? 'acx-badge-patch'
                        : 'acx-badge-trust'
                }`}>
                  {version.change_type}
                </span>
              )}
              {typeof version.importance_score === 'number' && (
                <span className="text-xs acx-badge-neutral px-2 py-1">
                  Importance {version.importance_score}/10
                </span>
              )}
              {typeof version.extraction_confidence === 'number' && (
                <span className="text-xs acx-badge-neutral px-2 py-1">
                  Confidence {Math.round(version.extraction_confidence * 100)}%
                </span>
              )}
              {agentSlug && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isOfficialSource(agentSlug, version.source_url)
                    ? 'acx-badge-official'
                    : 'acx-badge-warn'
                }`}>
                  {isOfficialSource(agentSlug, version.source_url) ? 'Official source' : 'Needs source review'}
                </span>
              )}
            </div>
            {typeof version.impact_factors?.summary === 'string' && (
              <ImpactBreakdown
                summary={version.impact_factors.summary}
                score={typeof version.impact_factors?.finalImpact === 'number'
                  ? version.impact_factors.finalImpact
                  : null}
              />
            )}
            {version.quality_flags && version.quality_flags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {version.quality_flags.map((flag) => (
                  <span key={flag} className="text-[11px] px-2 py-1 rounded-full acx-badge-warn">
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Capabilities */}
            {version.capabilities && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(version.capabilities).map(([key, value]) => (
                  <span
                    key={key}
                    className="text-xs acx-chip px-2 py-1"
                  >
                    {key}: {value}/10
                  </span>
                ))}
              </div>
            )}

            {/* Pricing */}
            {version.pricing_info && (
              <div className="mt-2">
                <span className="text-xs acx-badge-trust px-2 py-1 rounded-full">
                  Pricing: {version.pricing_info}
                </span>
              </div>
            )}

            {/* Context window */}
            {version.context_window && (
              <div className="mt-2">
                <span className="text-xs acx-badge-neutral px-2 py-1 rounded-full">
                  Context: {version.context_window.toLocaleString()} tokens
                </span>
              </div>
            )}
            {version.editor_note && (
              <div className="mt-2">
                <span className="text-xs acx-badge-warn px-2 py-1 rounded-full">
                  Editor note: {version.editor_note}
                </span>
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  )
}
