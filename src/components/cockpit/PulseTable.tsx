'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ExternalLink, Search, Shield, SlidersHorizontal, Star } from 'lucide-react'
import { RadarPulseRelease } from '@/lib/radar'
import MiniSparkline from '@/components/cockpit/MiniSparkline'

type Props = {
  releases: RadarPulseRelease[]
  searchValue: string
  sortDirection: 'desc' | 'asc'
  onSearchChange: (value: string) => void
  onToggleSort: () => void
  selectedId?: string
  onSelect: (release: RadarPulseRelease) => void
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function SignalDot({ tone }: { tone: RadarPulseRelease['capabilityTone'] }) {
  return <span className={`h-2.5 w-2.5 rounded-full acx-signal-dot acx-dot-${tone}`} />
}

export default function PulseTable({
  releases,
  searchValue,
  sortDirection,
  onSearchChange,
  onToggleSort,
  selectedId,
  onSelect,
}: Props) {
  const SortIcon = sortDirection === 'desc' ? ArrowDown : ArrowUp

  if (releases.length === 0) {
    return (
      <section className="acx-cockpit-panel overflow-hidden">
        <PulseControls
          searchValue={searchValue}
          sortDirection={sortDirection}
          onSearchChange={onSearchChange}
          onToggleSort={onToggleSort}
        />
        <div className="p-8 text-center">
          <h2 className="font-semibold text-slate-100">No live signals for this filter</h2>
          <p className="mt-2 text-sm text-slate-400">
            Try a different agent, provider, version, or change type.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="acx-cockpit-panel overflow-hidden">
      <PulseControls
        searchValue={searchValue}
        sortDirection={sortDirection}
        onSearchChange={onSearchChange}
        onToggleSort={onToggleSort}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/35 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
              <th className="w-10 px-4 py-3" />
              <th className="px-3 py-3">Agent</th>
              <th className="hidden px-3 py-3 min-[1500px]:table-cell">Provider</th>
              <th className="px-3 py-3">Latest Version</th>
              <th className="px-3 py-3">Change Type</th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={onToggleSort}
                  className="inline-flex items-center gap-1 transition-colors hover:text-sky-300"
                  aria-label={`Sort importance ${sortDirection === 'desc' ? 'ascending' : 'descending'}`}
                >
                  Importance
                  <SortIcon size={12} />
                </button>
              </th>
              <th className="px-3 py-3">Confidence</th>
              <th className="px-3 py-3">Capability Delta</th>
              <th className="px-3 py-3">Release Age</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => {
              const selected = selectedId === release.id
              const importanceWidth = Math.max(8, Math.min(100, release.importanceScore * 10))

              return (
                <motion.tr
                  layout
                  key={release.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={() => onSelect(release)}
                  className={`group cursor-pointer border-b border-slate-800/75 transition-colors hover:bg-sky-400/5 ${
                    selected ? 'bg-sky-400/10 outline outline-1 -outline-offset-1 outline-sky-400/70' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-slate-500 transition-colors group-hover:text-sky-300"
                      aria-label={`Watch ${release.agent.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Star size={16} />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <SignalDot tone={release.capabilityTone} />
                      <div className="min-w-0">
                        <Link
                          href={`/agents/${release.agent.slug}`}
                          onClick={(event) => event.stopPropagation()}
                          className="block truncate text-sm font-semibold text-slate-100 transition-colors hover:text-sky-300"
                        >
                          {release.agent.name}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {release.agent.category[0] || 'Agent'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-sm font-medium text-slate-300 min-[1500px]:table-cell">
                    {release.agent.provider}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-slate-100">{release.version_number}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-500">{formatDate(release.release_date)}</span>
                      <span className={`acx-cockpit-pill acx-tone-${release.sourceTone}`}>
                        <Shield size={10} />
                        {release.sourceLabel}
                      </span>
                      {release.source_url && (
                        <a
                          href={release.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="text-slate-500 transition-colors hover:text-sky-300"
                          aria-label={`Open source for ${release.agent.name}`}
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`acx-cockpit-pill acx-tone-${release.changeTone}`}>
                      {release.changeLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-sm font-semibold tabular-nums text-slate-100">
                        {release.importanceScore}
                      </span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                        <span
                          className="block h-full rounded-full bg-sky-400"
                          style={{ width: `${importanceWidth}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <SignalDot tone={release.confidenceTone} />
                      <span className="text-sm tabular-nums text-slate-300">
                        {release.confidencePercent}%
                      </span>
                      {release.confidenceKind === 'estimated' && (
                        <span className="rounded border border-amber-300/35 bg-amber-300/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-amber-200">
                          est
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <MiniSparkline
                        values={release.sparkline}
                        tone={release.capabilityTone}
                        className="h-7 w-[92px]"
                      />
                      <span className={`text-sm font-semibold tabular-nums acx-cockpit-${release.capabilityTone}`}>
                        {release.capabilityDeltaLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm tabular-nums text-slate-400">
                    {release.ageLabel}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        <span>1-{Math.min(12, releases.length)} of {releases.length.toLocaleString()}</span>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1"><SignalDot tone="positive" />Increase</span>
          <span className="inline-flex items-center gap-1"><SignalDot tone="warning" />Watch</span>
          <span className="inline-flex items-center gap-1"><SignalDot tone="danger" />Regression</span>
        </div>
      </div>
    </section>
  )
}

function PulseControls({
  searchValue,
  sortDirection,
  onSearchChange,
  onToggleSort,
}: {
  searchValue: string
  sortDirection: 'desc' | 'asc'
  onSearchChange: (value: string) => void
  onToggleSort: () => void
}) {
  const SortIcon = sortDirection === 'desc' ? ArrowDown : ArrowUp

  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-50">Agent Ecosystem Pulse</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                live
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Auto-refresh ready / newest approved signals first</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_auto]">
          <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-500 transition-colors focus-within:border-sky-500/70">
            <Search size={14} />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Filter agents..."
              className="min-w-0 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
            />
          </label>
          <button
            type="button"
            onClick={onToggleSort}
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-sky-500 hover:text-sky-200"
          >
            <SortIcon size={14} />
            Importance {sortDirection === 'desc' ? 'High-Low' : 'Low-High'}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-slate-300 transition-colors hover:border-sky-500 hover:text-sky-200"
            aria-label="Signal filters"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>
  )
}
