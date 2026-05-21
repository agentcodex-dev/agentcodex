'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ExternalLink, Search, X } from 'lucide-react'
import { Agent, AgentVersion } from '@/lib/types'
import WatchlistButton from '@/components/WatchlistButton'
import { PlatformBadge, PlatformEmpty, PlatformMetric, PlatformPanel } from '@/components/platform/PlatformUI'
import { formatConfidence, formatContext, formatPricing, formatShortDate } from '@/lib/display'

type Props = {
  agents: Agent[]
  versions: AgentVersion[]
  selectedCategory?: string
  search?: string
}

const CATEGORIES = ['Coding', 'Research', 'General', 'Multimodal']

function daysSince(value?: string | null) {
  if (!value) return Infinity
  return (Date.now() - new Date(`${value}T00:00:00`).getTime()) / (24 * 60 * 60 * 1000)
}

function getLastKnown<T>(versions: AgentVersion[], agentId: string, field: keyof AgentVersion): T | null {
  const match = versions.find((version) => version.agent_id === agentId && version[field])
  return (match?.[field] as T | undefined) ?? null
}

function capabilityLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

export default function AgentDirectoryWorkspace({
  agents,
  versions,
  selectedCategory,
  search,
}: Props) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'verified' | 'active'>('all')
  const latestById = useMemo(() => {
    const map = new Map<string, AgentVersion>()
    versions.forEach((version) => {
      if (!map.has(version.agent_id)) map.set(version.agent_id, version)
    })
    return map
  }, [versions])

  const rows = useMemo(() => {
    return agents.filter((agent) => {
      const latest = latestById.get(agent.id)
      if (sourceFilter === 'verified' && !agent.is_verified) return false
      if (sourceFilter === 'active' && daysSince(latest?.release_date) > 30) return false
      return true
    })
  }, [agents, latestById, sourceFilter])

  const recentCount = agents.filter((agent) => daysSince(latestById.get(agent.id)?.release_date) <= 30).length
  const verifiedCount = agents.filter((agent) => agent.is_verified).length

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlatformMetric label="Agents" value={agents.length} detail="matching current query" tone="blue" />
        <PlatformMetric label="Recently Updated" value={recentCount} detail="last 30 days" tone="green" />
        <PlatformMetric label="Verified" value={verifiedCount} detail={selectedCategory || search ? 'within current scope' : 'source-reviewed profiles'} tone="amber" />
      </div>

      <PlatformPanel title="All AI Agents" subtitle="Browse verified profiles, release state, and category fit. Use profiles for deeper technical detail.">
        <div className="border-b acx-divider p-5">
          <form method="GET" className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_auto_auto]">
            <label className="acx-input flex items-center gap-2 px-3 py-2">
              <Search size={16} className="acx-muted" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search agents, providers, descriptions..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--acx-text-muted)]"
              />
            </label>
            {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
            <button className="acx-btn-secondary px-4 py-2 text-sm">
              Search
            </button>
            <Link href="/agents" className="acx-btn-ghost border acx-divider px-4 py-2 text-center text-sm">
              Clear
            </Link>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/agents" className={`acx-chip ${!selectedCategory ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)]' : ''}`}>All</Link>
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/agents?category=${encodeURIComponent(category)}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={`acx-chip ${selectedCategory === category ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)]' : ''}`}
              >
                {category}
              </Link>
            ))}
            {(['all', 'verified', 'active'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSourceFilter(filter)}
                className={`acx-chip capitalize ${sourceFilter === filter ? 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)]' : ''}`}
              >
                {filter === 'all' ? 'All Status' : filter}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <PlatformEmpty title="No agents found" body="Try clearing a filter or searching a broader provider or category." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((agent) => {
              const latest = latestById.get(agent.id)
              const confidence = latest ? formatConfidence(agent, latest) : null
              const isFresh = daysSince(latest?.release_date) <= 30

              return (
                <article
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="acx-panel flex min-h-[300px] cursor-pointer flex-col p-5 transition-colors hover:border-[var(--acx-border-strong)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--acx-accent-soft)] text-sm font-bold text-[var(--acx-accent)]">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedAgent(agent)}
                          className="block max-w-full truncate text-left font-semibold text-[var(--acx-text)] hover:text-[var(--acx-accent)]"
                        >
                          {agent.name}
                        </button>
                        <p className="truncate text-sm acx-muted">{agent.provider}</p>
                      </div>
                    </div>
                    <WatchlistButton slug={agent.slug} />
                  </div>

                  <div className="mt-4 flex min-h-[1.875rem] flex-wrap gap-2">
                    {isFresh && <PlatformBadge tone="blue">Updated recently</PlatformBadge>}
                    {agent.is_verified && <PlatformBadge tone="green">Verified</PlatformBadge>}
                    {confidence?.estimated && <PlatformBadge tone="amber">EST</PlatformBadge>}
                  </div>

                  <p className="mt-4 min-h-[2.75rem] text-sm leading-relaxed acx-body line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="mt-4 rounded-xl border acx-divider bg-[var(--acx-elevated-soft)] px-3 py-2 text-xs acx-muted">
                    Latest:{' '}
                    <span className="font-semibold text-[var(--acx-text-soft)]">
                      {latest?.version_number || 'No release'}
                    </span>
                    {latest?.release_date && (
                      <>
                        <span className="mx-1">·</span>
                        {formatShortDate(latest.release_date)}
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {agent.category.slice(0, 3).map((cat) => (
                      <span key={cat} className="acx-chip">{cat}</span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                    <span className="text-xs acx-muted">
                      Confidence {confidence ? `${confidence.label}${confidence.estimated ? ' EST' : ''}` : 'N/A'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAgent(agent)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
                    >
                      View profile <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </PlatformPanel>

      <AgentPreviewSheet
        agent={selectedAgent}
        versions={versions}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  )
}

function AgentPreviewSheet({
  agent,
  versions,
  onClose,
}: {
  agent: Agent | null
  versions: AgentVersion[]
  onClose: () => void
}) {
  const agentVersions = useMemo(() => {
    if (!agent) return []
    return versions.filter((version) => version.agent_id === agent.id)
  }, [agent, versions])
  const latest = agentVersions[0] || null
  const confidence = agent && latest ? formatConfidence(agent, latest) : null
  const lastKnownContext = agent && latest
    ? latest.context_window ?? getLastKnown<number>(versions, agent.id, 'context_window')
    : null
  const lastKnownPricing = agent && latest
    ? latest.pricing_info ?? getLastKnown<string>(versions, agent.id, 'pricing_info')
    : null

  useEffect(() => {
    if (!agent) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [agent, onClose])

  return (
    <AnimatePresence>
      {agent && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Close agent preview"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-preview-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-x-3 bottom-3 mx-auto max-h-[86vh] max-w-4xl overflow-y-auto rounded-2xl border acx-divider bg-[var(--acx-elevated)] shadow-2xl sm:inset-x-6 sm:bottom-6"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b acx-divider bg-[var(--acx-elevated)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--acx-accent-soft)] text-sm font-bold text-[var(--acx-accent)]">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 id="agent-preview-title" className="truncate text-xl font-semibold text-[var(--acx-text)]">
                    {agent.name}
                  </h2>
                  <p className="text-sm acx-muted">{agent.provider}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border acx-divider p-2 text-[var(--acx-text-soft)] transition-colors hover:border-[var(--acx-border-strong)] hover:text-[var(--acx-text)]"
                aria-label="Close agent preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {daysSince(latest?.release_date) <= 30 && <PlatformBadge tone="blue">Updated recently</PlatformBadge>}
                    {agent.is_verified && <PlatformBadge tone="green">Verified</PlatformBadge>}
                    {confidence?.estimated && <PlatformBadge tone="amber">EST confidence</PlatformBadge>}
                    {agent.category.map((category) => (
                      <PlatformBadge key={category} tone="neutral">{category}</PlatformBadge>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed acx-body">{agent.description}</p>
                </div>

                <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] acx-muted">Latest release</p>
                      <h3 className="mt-1 text-lg font-semibold text-[var(--acx-text)]">
                        {latest?.version_number || 'No release'}
                      </h3>
                    </div>
                    <span className="text-sm acx-muted">{formatShortDate(latest?.release_date)}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed acx-body">
                    {latest?.what_changed || 'No release summary captured yet.'}
                  </p>
                </div>

                {latest?.capabilities && (
                  <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] acx-muted">Capability snapshot</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Object.entries(latest.capabilities).slice(0, 6).map(([key, value]) => (
                        <div key={key}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-[var(--acx-text-soft)]">{capabilityLabel(key)}</span>
                            <span className="font-semibold tabular-nums text-[var(--acx-text)]">{value as number}/10</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--acx-elevated-soft)]">
                            <span
                              className="block h-full rounded-full bg-[var(--acx-accent)]"
                              style={{ width: `${Math.max(0, Math.min(100, (Number(value) / 10) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="order-first space-y-4 lg:order-none">
                <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] acx-muted">Snapshot</p>
                  <div className="mt-3 space-y-3 text-sm">
                    <PreviewMeta label="Confidence" value={confidence ? `${confidence.label}${confidence.estimated ? ' EST' : ''}` : 'N/A'} />
                    <PreviewMeta label="Context" value={formatContext(lastKnownContext)} />
                    <PreviewMeta label="Pricing" value={formatPricing(lastKnownPricing)} />
                    <PreviewMeta label="Source" value={agent.is_verified ? 'Verified' : 'Review'} />
                  </div>
                  {(!latest?.context_window || !latest?.pricing_info) && (
                    <p className="mt-3 text-xs leading-relaxed acx-muted">
                      Context and pricing may use last-known metadata when not captured in the current release.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Link href={`/agents/${agent.slug}`} className="acx-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
                    View full profile <ArrowUpRight size={14} />
                  </Link>
                  <Link href={`/compare/${agent.slug}-vs-cursor`} className="acx-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
                    Compare <ArrowUpRight size={14} />
                  </Link>
                  <a href={agent.website_url} target="_blank" rel="noopener noreferrer" className="acx-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
                    Official site <ExternalLink size={14} />
                  </a>
                  <WatchlistButton slug={agent.slug} />
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b acx-divider pb-2 last:border-b-0 last:pb-0">
      <span className="acx-muted">{label}</span>
      <span className="max-w-[10rem] text-right font-semibold text-[var(--acx-text)]">{value}</span>
    </div>
  )
}
