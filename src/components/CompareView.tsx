'use client'

import { Agent, AgentVersion } from '@/lib/types'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getAvoidIf, getBestFor } from '@/lib/intelligence'

type Props = {
  agentA: Agent
  agentB: Agent
  versionsA: AgentVersion[]
  versionsB: AgentVersion[]
}

const CAPABILITY_LABELS: Record<string, string> = {
  coding: 'Coding',
  reasoning: 'Reasoning',
  multimodal: 'Multimodal',
  tool_use: 'Tool Use',
  memory: 'Memory',
  speed: 'Speed',
}

function formatCapabilityLabel(key: string) {
  return CAPABILITY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function CapabilityBar({
  label,
  scoreA,
  scoreB,
}: {
  label: string
  scoreA: number
  scoreB: number
}) {
  const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'tie'

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center gap-3">
        <span className="text-sm font-medium text-[var(--acx-text-soft)]">{label}</span>
        <span className="text-xs acx-muted">
          {winner === 'tie' ? 'Tied' : `${winner === 'A' ? 'Left' : 'Right'} leads`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="acx-meter flex-1">
            <span
              className={winner === 'A' ? 'bg-[var(--acx-accent)]' : winner === 'tie' ? 'bg-[var(--acx-text-muted)]' : 'bg-[var(--acx-bar-3)]'}
              style={{ width: `${(scoreA / 10) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-medium w-8 text-right ${winner === 'A' ? 'text-[var(--acx-accent)]' : 'acx-muted'}`}>
            {scoreA}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="acx-meter flex-1">
            <span
              className={winner === 'B' ? 'bg-[var(--acx-accent)]' : winner === 'tie' ? 'bg-[var(--acx-text-muted)]' : 'bg-[var(--acx-bar-3)]'}
              style={{ width: `${(scoreB / 10) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-medium w-8 text-right ${winner === 'B' ? 'text-[var(--acx-accent)]' : 'acx-muted'}`}>
            {scoreB}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function CompareView({
  agentA,
  agentB,
  versionsA,
  versionsB,
}: Props) {
  const latestA = versionsA[0]
  const latestB = versionsB[0]

  const capabilitiesA = latestA?.capabilities ? Object.keys(latestA.capabilities) : []
  const capabilitiesB = latestB?.capabilities ? Object.keys(latestB.capabilities) : []
  const allCapabilities = Array.from(new Set([...capabilitiesA, ...capabilitiesB])).sort()

  let winsA = 0
  let winsB = 0
  allCapabilities.forEach((key) => {
    const scoreA = latestA?.capabilities?.[key] ?? 0
    const scoreB = latestB?.capabilities?.[key] ?? 0
    if (scoreA > scoreB) winsA += 1
    else if (scoreB > scoreA) winsB += 1
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {[{ agent: agentA, tone: 'left' }, { agent: agentB, tone: 'right' }].map(({ agent, tone }) => (
          <div key={agent.id} className="acx-panel p-5 sm:p-6 acx-reveal">
            <p className="acx-code-badge acx-muted mb-3">Candidate</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] flex items-center justify-center shrink-0">
                <span className="font-semibold text-lg">{agent.name.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--acx-text)]">{agent.name}</h2>
                <p className="text-sm acx-muted">by {agent.provider}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {agent.category.map((cat) => (
                <span key={cat} className="acx-chip">{cat}</span>
              ))}
            </div>
            <Link
              href={`/agents/${agent.slug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)]"
            >
              View full profile
              <ArrowUpRight size={14} />
            </Link>
            <div className={`mt-4 p-3 rounded-xl border ${tone === 'left' ? 'bg-[var(--acx-minor-soft)] border-[var(--acx-minor)]' : 'bg-[var(--acx-major-soft)] border-[var(--acx-major)]'}`}>
              <p className={`text-sm font-semibold ${tone === 'left' ? 'text-[var(--acx-minor)]' : 'text-[var(--acx-major)]'}`}>Best For</p>
              <p className="text-sm acx-body mt-1">{getBestFor(agent)}</p>
              <p className="text-xs acx-muted mt-2">Avoid if: {getAvoidIf(agent)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="acx-panel p-5 text-center acx-reveal acx-reveal-delay-1">
        <p className="acx-code-badge acx-muted mb-2">Fit Signal</p>
        {winsA === winsB ? (
          <p className="text-lg font-semibold text-[var(--acx-text)]">Tied {winsA} - {winsB}</p>
        ) : winsA > winsB ? (
          <p className="text-lg font-semibold text-[var(--acx-accent)]">{agentA.name} leads {winsA} - {winsB}</p>
        ) : (
          <p className="text-lg font-semibold text-[var(--acx-accent)]">{agentB.name} leads {winsB} - {winsA}</p>
        )}
        <p className="text-sm acx-muted mt-1">Based on {allCapabilities.length} capability dimensions</p>
      </div>

      <div className="acx-panel overflow-hidden acx-reveal acx-reveal-delay-2">
        <div className="px-5 py-4 border-b acx-divider bg-[var(--acx-surface)]">
          <p className="acx-code-badge acx-muted mb-2">Snapshot</p>
          <h3 className="font-semibold text-[var(--acx-text)]">Decision Snapshot</h3>
        </div>
        <div className="divide-y acx-divider">
          <div className="grid grid-cols-3 px-5 py-4">
            <span className="text-sm acx-muted">Latest Version</span>
            <span className="text-sm text-center font-medium text-[var(--acx-text)]">{latestA?.version_number ?? 'N/A'}</span>
            <span className="text-sm text-center font-medium text-[var(--acx-text)]">{latestB?.version_number ?? 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 px-5 py-4">
            <span className="text-sm acx-muted">Context Window</span>
            <span className={`text-sm text-center font-medium ${(latestA?.context_window ?? 0) >= (latestB?.context_window ?? 0) ? 'text-[var(--acx-accent)]' : 'text-[var(--acx-text)]'}`}>
              {latestA?.context_window ? `${latestA.context_window.toLocaleString()} tokens` : 'N/A'}
            </span>
            <span className={`text-sm text-center font-medium ${(latestB?.context_window ?? 0) > (latestA?.context_window ?? 0) ? 'text-[var(--acx-accent)]' : 'text-[var(--acx-text)]'}`}>
              {latestB?.context_window ? `${latestB.context_window.toLocaleString()} tokens` : 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-3 px-5 py-4">
            <span className="text-sm acx-muted">Pricing</span>
            <span className="text-sm text-center font-medium text-[var(--acx-text)]">{latestA?.pricing_info ?? 'N/A'}</span>
            <span className="text-sm text-center font-medium text-[var(--acx-text)]">{latestB?.pricing_info ?? 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 px-5 py-4">
            <span className="text-sm acx-muted">Versions Tracked</span>
            <span className="text-sm text-center font-medium text-[var(--acx-text)]">{versionsA.length}</span>
            <span className="text-sm text-center font-medium text-[var(--acx-text)]">{versionsB.length}</span>
          </div>
        </div>
      </div>

      {allCapabilities.length > 0 && (
        <div className="acx-panel overflow-hidden acx-reveal acx-reveal-delay-3">
          <div className="px-5 py-4 border-b acx-divider bg-[var(--acx-surface)]">
            <p className="acx-code-badge acx-muted mb-2">Capability Grid</p>
            <div className="grid grid-cols-3 items-center gap-3">
              <h3 className="font-semibold text-[var(--acx-text)]">Capability Fit</h3>
              <span className="text-xs sm:text-sm text-center font-medium text-[var(--acx-text-soft)] truncate">{agentA.name}</span>
              <span className="text-xs sm:text-sm text-center font-medium text-[var(--acx-text-soft)] truncate">{agentB.name}</span>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {allCapabilities.map((key) => (
              <CapabilityBar
                key={key}
                label={formatCapabilityLabel(key)}
                scoreA={latestA?.capabilities?.[key] ?? 0}
                scoreB={latestB?.capabilities?.[key] ?? 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
