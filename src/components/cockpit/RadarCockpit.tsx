'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { RadarData, RadarPulseRelease } from '@/lib/radar'
import SignalKpiStrip from '@/components/cockpit/SignalKpiStrip'
import PulseTable from '@/components/cockpit/PulseTable'
import SignalStack from '@/components/cockpit/SignalStack'
import ReleaseDiffInspector from '@/components/cockpit/ReleaseDiffInspector'

type Props = {
  radar: RadarData
  selectedCategory?: string
  categories: string[]
}

function categoryMatches(release: RadarPulseRelease, selectedCategory?: string) {
  return !selectedCategory || release.agent.category.includes(selectedCategory)
}

export default function RadarCockpit({
  radar,
  selectedCategory,
  categories,
}: Props) {
  const pulse = useMemo(
    () => radar.cockpit.pulse
      .filter((release) => categoryMatches(release, selectedCategory))
      .sort((a, b) => a.ageMinutes - b.ageMinutes),
    [radar.cockpit.pulse, selectedCategory]
  )
  const [selectedId, setSelectedId] = useState<string | null>(pulse[0]?.id || null)
  const [agentQuery, setAgentQuery] = useState('')
  const [sortMode, setSortMode] = useState<'newest' | 'importance'>('newest')
  const visiblePulse = useMemo(() => {
    const query = agentQuery.trim().toLowerCase()
    return pulse
      .filter((release) => {
        if (!query) return true
        return [
          release.agent.name,
          release.agent.provider,
          release.version_number,
          release.changeType,
          release.sourceLabel,
        ].some((value) => value?.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        if (sortMode === 'importance' && b.importanceScore !== a.importanceScore) {
          return b.importanceScore - a.importanceScore
        }
        return a.ageMinutes - b.ageMinutes
      })
  }, [agentQuery, pulse, sortMode])
  const selectedRelease = selectedId
    ? visiblePulse.find((release) => release.id === selectedId) || visiblePulse[0] || null
    : null
  const agentVersions = selectedRelease
    ? radar.versions
      .filter((version) => version.agent_id === selectedRelease.agent_id)
      .sort((a, b) => new Date(`${b.release_date}T00:00:00`).getTime() - new Date(`${a.release_date}T00:00:00`).getTime())
    : []
  const previousRelease = selectedRelease
    ? agentVersions.find((version) => version.id !== selectedRelease.id) || null
    : null

  return (
    <main className="acx-cockpit mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-4 lg:px-5">
      <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Agent Change Radar
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Live signal across AI coding, research, and multimodal agents.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/radar"
            className={`acx-cockpit-filter ${!selectedCategory ? 'acx-cockpit-filter-active' : ''}`}
          >
            All Categories
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/radar?category=${encodeURIComponent(category)}`}
              className={`acx-cockpit-filter ${selectedCategory === category ? 'acx-cockpit-filter-active' : ''}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      <SignalKpiStrip radar={radar} />

      <div className="acx-cockpit-grid mt-3">
        <div className="min-w-0">
          <PulseTable
            releases={visiblePulse}
            searchValue={agentQuery}
            sortMode={sortMode}
            onSearchChange={setAgentQuery}
            onToggleSort={() => setSortMode((current) => current === 'newest' ? 'importance' : 'newest')}
            selectedId={selectedRelease?.id}
            onSelect={(release) => setSelectedId(release.id)}
          />
        </div>
        <SignalStack radar={radar} />
        <div className="acx-cockpit-inspector-cell">
          <ReleaseDiffInspector
            release={selectedRelease}
            previousRelease={previousRelease}
            agentVersions={agentVersions}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
    </main>
  )
}
