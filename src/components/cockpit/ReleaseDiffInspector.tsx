'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, ExternalLink, ShieldCheck, X } from 'lucide-react'
import { AgentVersion, Capability } from '@/lib/types'
import { getCompareTarget, RadarPulseRelease } from '@/lib/radar'

type Props = {
  release: RadarPulseRelease | null
  previousRelease: AgentVersion | null
  agentVersions: AgentVersion[]
  onClose: () => void
}

type DiffLine = {
  label: string
  before: string
  after: string
  tone?: 'positive' | 'danger' | 'neutral'
  note?: string
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatContext(value?: number | null) {
  if (!value) return 'not captured'
  return `${value.toLocaleString()} tokens`
}

function findLastKnownContext(versions: AgentVersion[], currentId: string) {
  return versions.find((version) => version.id !== currentId && version.context_window !== null)?.context_window ?? null
}

function findLastKnownPricing(versions: AgentVersion[], currentId: string) {
  return versions.find((version) => version.id !== currentId && version.pricing_info)?.pricing_info ?? null
}

function formatPricing(value?: string | null) {
  return value || 'not captured'
}

function buildMetadataLine({
  label,
  current,
  previous,
  lastKnown,
  format,
}: {
  label: string
  current: string | number | null | undefined
  previous: string | number | null | undefined
  lastKnown: string | number | null | undefined
  format: (value?: string | number | null) => string
}): DiffLine {
  if (current) {
    const before = format(previous)
    const after = format(current)
    return {
      label,
      before,
      after,
      tone: before === after ? 'neutral' : 'positive',
    }
  }

  if (lastKnown) {
    const value = format(lastKnown)
    return {
      label,
      before: value,
      after: value,
      tone: 'neutral',
      note: 'not captured in this release; showing last known value',
    }
  }

  return {
    label,
    before: format(previous),
    after: 'not captured',
    tone: 'neutral',
  }
}

function getCapabilityDiffs(current?: Capability | null, previous?: Capability | null): DiffLine[] {
  if (!current) return []

  return Object.entries(current)
    .filter(([, value]) => Number.isFinite(value))
    .map(([key, value]) => {
      const before = previous?.[key]
      const delta = typeof before === 'number' ? value - before : value
      return {
        label: key.replace(/_/g, ' '),
        before: typeof before === 'number' ? String(before) : 'n/a',
        after: String(value),
        tone: delta > 0 ? 'positive' : delta < 0 ? 'danger' : 'neutral',
      } satisfies DiffLine
    })
    .sort((a, b) => Number(b.after) - Number(a.after))
}

function DiffBlock({ title, lines }: { title: string; lines: DiffLine[] }) {
  return (
    <div className="rounded-md border border-slate-700/70 bg-slate-950/55">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
          diff
        </span>
      </div>
      <div className="divide-y divide-slate-800/80 font-mono text-xs">
        {lines.map((line) => (
          <div key={line.label} className="px-3 py-2.5">
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <span className="capitalize text-slate-400">{line.label}</span>
              {line.note && (
                <span className="max-w-[9rem] text-right font-sans text-[10px] leading-snug tracking-normal text-slate-500">
                  {line.note}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span
                className={`min-w-0 rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5 break-words ${
                  line.tone === 'neutral' ? 'text-slate-500' : 'text-red-300'
                }`}
              >
                {line.tone === 'neutral' ? '= ' : '- '}{line.before}
              </span>
              <span
                className={`min-w-0 rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5 break-words ${
                  line.tone === 'neutral'
                    ? 'text-slate-300'
                    : line.tone === 'danger'
                      ? 'text-red-300'
                      : 'text-emerald-300'
                }`}
              >
                {line.tone === 'neutral' ? '= ' : '+ '}{line.after}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReleaseDiffInspector({
  release,
  previousRelease,
  agentVersions,
  onClose,
}: Props) {
  const capabilityDiffs = release
    ? getCapabilityDiffs(release.capabilities, previousRelease?.capabilities)
    : []
  const lastKnownContext = release ? findLastKnownContext(agentVersions, release.id) : null
  const lastKnownPricing = release ? findLastKnownPricing(agentVersions, release.id) : null

  return (
    <AnimatePresence mode="wait">
      {release && (
        <motion.aside
          key={release.id}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="acx-cockpit-panel h-full overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-50">Release Diff</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  live
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Selected ecosystem signal</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-700 p-1.5 text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-100"
              aria-label="Close release inspector"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-sm font-bold text-slate-100">
                {release.agent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-50">{release.agent.name}</h3>
                  <span className={`acx-cockpit-pill acx-tone-${release.changeTone}`}>
                    {release.changeType}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {release.agent.provider} / {release.version_number}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(release.release_date)} / {release.ageLabel}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Importance</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{release.importanceScore}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Confidence</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{release.confidencePercent}%</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Delta</p>
                <p className={`mt-1 text-lg font-semibold acx-cockpit-${release.capabilityTone}`}>
                  {release.capabilityDeltaLabel}
                </p>
              </div>
            </div>

            <DiffBlock
              title="Core Fields"
              lines={[
                {
                  label: 'version',
                  before: previousRelease?.version_number || 'n/a',
                  after: release.version_number,
                },
                buildMetadataLine({
                  label: 'context window',
                  current: release.context_window,
                  previous: previousRelease?.context_window,
                  lastKnown: lastKnownContext,
                  format: (value) => formatContext(typeof value === 'number' ? value : null),
                }),
                buildMetadataLine({
                  label: 'pricing',
                  current: release.pricing_info,
                  previous: previousRelease?.pricing_info,
                  lastKnown: lastKnownPricing,
                  format: (value) => formatPricing(typeof value === 'string' ? value : null),
                }),
              ]}
            />

            {capabilityDiffs.length > 0 && (
              <DiffBlock title="Capability Scores" lines={capabilityDiffs.slice(0, 8)} />
            )}

            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-sky-300" />
                <p className="text-xs font-semibold text-slate-200">Summary</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                {release.what_changed || 'No summary was captured for this release.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/agents/${release.agent.slug}`}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:text-sky-200"
              >
                Agent profile
                <ArrowUpRight size={13} />
              </Link>
              <Link
                href={`/compare/${release.agent.slug}-vs-${getCompareTarget(release.agent)}`}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:text-sky-200"
              >
                Compare
                <ArrowUpRight size={13} />
              </Link>
              {release.source_url && (
                <a
                  href={release.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:text-sky-200"
                >
                  Source
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
