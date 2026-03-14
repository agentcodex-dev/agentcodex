'use client'

import { Agent, AgentVersion } from '@/lib/types'
import Link from 'next/link'

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
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {winner === 'tie' ? 'Tied' : `${winner === 'A' ? 'Left' : 'Right'} wins`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Agent A bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                winner === 'A'
                  ? 'bg-blue-500'
                  : winner === 'tie'
                  ? 'bg-gray-400'
                  : 'bg-gray-300'
              }`}
              style={{ width: `${(scoreA / 10) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-medium w-8 text-right ${
            winner === 'A' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {scoreA}/10
          </span>
        </div>
        {/* Agent B bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                winner === 'B'
                  ? 'bg-purple-500'
                  : winner === 'tie'
                  ? 'bg-gray-400'
                  : 'bg-gray-300'
              }`}
              style={{ width: `${(scoreB / 10) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-medium w-8 text-right ${
            winner === 'B' ? 'text-purple-600' : 'text-gray-500'
          }`}>
            {scoreB}/10
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

  const allCapabilities = latestA?.capabilities
    ? Object.keys(latestA.capabilities)
    : []

  // Calculate overall winner
  let winsA = 0
  let winsB = 0
  allCapabilities.forEach(key => {
    const scoreA = latestA?.capabilities?.[key] ?? 0
    const scoreB = latestB?.capabilities?.[key] ?? 0
    if (scoreA > scoreB) winsA++
    else if (scoreB > scoreA) winsB++
  })

  return (
    <div className="space-y-8">

      {/* Agent Headers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Agent A */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold text-xl">
                {agentA.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {agentA.name}
              </h2>
              <p className="text-sm text-gray-500">
                by {agentA.provider}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {agentA.category.map(cat => (
              <span
                key={cat}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
          <Link
            href={`/agents/${agentA.slug}`}
            className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View full profile →
          </Link>
        </div>

        {/* Agent B */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <span className="text-purple-600 font-bold text-xl">
                {agentB.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {agentB.name}
              </h2>
              <p className="text-sm text-gray-500">
                by {agentB.provider}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {agentB.category.map(cat => (
              <span
                key={cat}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
          <Link
            href={`/agents/${agentB.slug}`}
            className="inline-block mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View full profile →
          </Link>
        </div>
      </div>

      {/* Overall Winner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Overall Score
        </h3>
        {winsA === winsB ? (
          <div className="text-xl font-bold text-gray-700">
            🤝 Tied {winsA} - {winsB}
          </div>
        ) : winsA > winsB ? (
          <div className="text-xl font-bold text-blue-600">
            🏆 {agentA.name} leads {winsA} - {winsB}
          </div>
        ) : (
          <div className="text-xl font-bold text-purple-600">
            🏆 {agentB.name} leads {winsB} - {winsA}
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Based on {allCapabilities.length} capability dimensions
        </p>
      </div>

      {/* Quick Facts Comparison */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Quick Facts</h3>
        </div>
        <div className="divide-y divide-gray-100">

          {/* Latest Version */}
          <div className="grid grid-cols-3 px-4 sm:px-6 py-3 sm:py-4">
            <span className="text-sm text-gray-500 self-center">
              Latest Version
            </span>
            <span className="text-sm font-medium text-gray-900 text-center">
              {latestA?.version_number ?? 'N/A'}
            </span>
            <span className="text-sm font-medium text-gray-900 text-center">
              {latestB?.version_number ?? 'N/A'}
            </span>
          </div>

          {/* Context Window */}
          <div className="grid grid-cols-3 px-4 sm:px-6 py-3 sm:py-4">
            <span className="text-sm text-gray-500 self-center">
              Context Window
            </span>
            <span className={`text-sm font-medium text-center ${
              (latestA?.context_window ?? 0) >= (latestB?.context_window ?? 0)
                ? 'text-blue-600'
                : 'text-gray-900'
            }`}>
              {latestA?.context_window
                ? `${latestA.context_window.toLocaleString()} tokens`
                : 'N/A'}
            </span>
            <span className={`text-sm font-medium text-center ${
              (latestB?.context_window ?? 0) > (latestA?.context_window ?? 0)
                ? 'text-purple-600'
                : 'text-gray-900'
            }`}>
              {latestB?.context_window
                ? `${latestB.context_window.toLocaleString()} tokens`
                : 'N/A'}
            </span>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 px-4 sm:px-6 py-3 sm:py-4">
            <span className="text-sm text-gray-500 self-center">
              Pricing
            </span>
            <span className="text-sm font-medium text-gray-900 text-center">
              {latestA?.pricing_info ?? 'N/A'}
            </span>
            <span className="text-sm font-medium text-gray-900 text-center">
              {latestB?.pricing_info ?? 'N/A'}
            </span>
          </div>

          {/* Versions Documented */}
          <div className="grid grid-cols-3 px-4 sm:px-6 py-3 sm:py-4">
            <span className="text-sm text-gray-500 self-center">
              Versions Documented
            </span>
            <span className="text-sm font-medium text-gray-900 text-center">
              {versionsA.length}
            </span>
            <span className="text-sm font-medium text-gray-900 text-center">
              {versionsB.length}
            </span>
          </div>

        </div>
      </div>

      {/* Capabilities Comparison */}
      {allCapabilities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Capabilities
              </h3>
              <span className="text-xs sm:text-sm font-medium text-blue-600 text-center truncate px-1">
                {agentA.name}
              </span>
              <span className="text-xs sm:text-sm font-medium text-purple-600 text-center truncate px-1">
                {agentB.name}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {allCapabilities.map(key => (
              <CapabilityBar
                key={key}
                label={CAPABILITY_LABELS[key] ?? key}
                scoreA={latestA?.capabilities?.[key] ?? 0}
                scoreB={latestB?.capabilities?.[key] ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Version History Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Agent A History */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <h3 className="font-semibold text-gray-900">
              {agentA.name} History
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {versionsA.length} versions
            </p>
          </div>
          <div className="p-4 space-y-3">
            {versionsA.slice(0, 5).map(version => (
              <div
                key={version.id}
                className="flex items-start gap-3 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">
                    {version.version_number}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {new Date(version.release_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                    {version.what_changed}
                  </p>
                </div>
              </div>
            ))}
            {versionsA.length > 5 && (
              <Link
                href={`/agents/${agentA.slug}`}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                View all {versionsA.length} versions →
              </Link>
            )}
          </div>
        </div>

        {/* Agent B History */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
            <h3 className="font-semibold text-gray-900">
              {agentB.name} History
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {versionsB.length} versions
            </p>
          </div>
          <div className="p-4 space-y-3">
            {versionsB.slice(0, 5).map(version => (
              <div
                key={version.id}
                className="flex items-start gap-3 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">
                    {version.version_number}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {new Date(version.release_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                    {version.what_changed}
                  </p>
                </div>
              </div>
            ))}
            {versionsB.length > 5 && (
              <Link
                href={`/agents/${agentB.slug}`}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                View all {versionsB.length} versions →
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}