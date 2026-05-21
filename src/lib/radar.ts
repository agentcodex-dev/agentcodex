import { supabase } from '@/lib/supabase'
import { Agent, AgentVersion, Capability } from '@/lib/types'
import {
  deriveChangeType,
  deriveImpactBreakdown,
  deriveImportanceScore,
  deriveQualitySignal,
  type ChangeType,
  type QualitySignal,
} from '@/lib/intelligence'

const DAY_MS = 24 * 60 * 60 * 1000

export type LatestRelease = AgentVersion & {
  agent: Agent
}

export type CapabilityChange = {
  key: string
  label: string
  previous: number
  current: number
  delta: number
}

export type CapabilityMover = {
  agent: Agent
  latest: AgentVersion
  previous: AgentVersion
  changes: CapabilityChange[]
  totalDelta: number
  changeType: ChangeType
  importanceScore: number
  quality: QualitySignal
  impactBreakdown: ReturnType<typeof deriveImpactBreakdown>
  whyMoved: string
}

export type ReleaseVelocity = {
  agent: Agent
  latestRelease: AgentVersion | null
  releases30: number
  releases90: number
  weightedScore: number
  totalVersions: number
}

export type RadarStats = {
  totalAgents: number
  releasesThisMonth: number
  activeCategories: number
  recentlyUpdatedAgents: number
}

export type RadarTone = 'positive' | 'neutral' | 'warning' | 'danger' | 'info'

export type RadarPulseRelease = LatestRelease & {
  ageLabel: string
  ageMinutes: number
  changeType: ChangeType
  changeTone: RadarTone
  importanceScore: number
  confidencePercent: number
  confidenceKind: 'extracted' | 'estimated'
  confidenceTone: RadarTone
  sourceTone: RadarTone
  sourceLabel: string
  capabilityDelta: number
  capabilityDeltaLabel: string
  capabilityTone: RadarTone
  sparkline: number[]
}

export type RadarBottleneckSignal = {
  label: string
  values: {
    days7: number
    days30: number
    days90: number
  }
  tone: RadarTone
}

export type RadarSignalDistribution = {
  increase: number
  noChange: number
  decrease: number
  majorIncrease: number
  majorDecrease: number
}

export type RadarCockpit = {
  pulse: RadarPulseRelease[]
  sourceConfidence: number
  majorChanges30: number
  bottleneckSignals: RadarBottleneckSignal[]
  distribution: RadarSignalDistribution
}

export type RadarData = {
  agents: Agent[]
  versions: AgentVersion[]
  latestReleases: LatestRelease[]
  capabilityMovers: CapabilityMover[]
  releaseVelocity: ReleaseVelocity[]
  stats: RadarStats
  cockpit: RadarCockpit
}

function asDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function isWithinDays(value: string, days: number) {
  return Date.now() - asDate(value).getTime() <= days * DAY_MS
}

function formatCapabilityLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getCapabilityChanges(
  latest: Capability,
  previous: Capability
): CapabilityChange[] {
  return Object.entries(latest)
    .map(([key, current]) => {
      const previousValue = previous[key]

      if (!isNumber(current) || !isNumber(previousValue)) {
        return null
      }

      const delta = current - previousValue

      if (delta === 0) {
        return null
      }

      return {
        key,
        label: formatCapabilityLabel(key),
        previous: previousValue,
        current,
        delta,
      }
    })
    .filter((change): change is CapabilityChange => change !== null)
}

function groupVersionsByAgent(versions: AgentVersion[]) {
  return versions.reduce<Record<string, AgentVersion[]>>((groups, version) => {
    if (!groups[version.agent_id]) {
      groups[version.agent_id] = []
    }

    groups[version.agent_id].push(version)
    return groups
  }, {})
}

function getAgeMinutes(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - asDate(value).getTime()) / (60 * 1000)))
  return minutes
}

function formatAgeLabel(value: string) {
  const minutes = getAgeMinutes(value)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 90) return `${days}d ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

function getChangeTone(changeType: ChangeType): RadarTone {
  if (changeType === 'major') return 'positive'
  if (changeType === 'minor') return 'info'
  if (changeType === 'patch') return 'neutral'
  return 'warning'
}

function getConfidenceTone(confidence: number): RadarTone {
  if (confidence >= 82) return 'positive'
  if (confidence >= 65) return 'warning'
  return 'danger'
}

function getCapabilityTone(delta: number): RadarTone {
  if (delta >= 6) return 'positive'
  if (delta > 0) return 'info'
  if (delta < 0) return 'danger'
  return 'neutral'
}

function buildSparkline(version: AgentVersion, index: number) {
  const capabilityValues = version.capabilities
    ? Object.values(version.capabilities).filter(isNumber)
    : []
  const base = capabilityValues.length > 0
    ? capabilityValues
    : [3, 4, 5, 4, 6, 5]
  const seed = version.version_number.length + index

  return Array.from({ length: 14 }, (_, point) => {
    const value = base[point % base.length] || 1
    const wave = Math.sin((point + seed) * 0.9) * 0.8
    const slope = (point / 13) * Math.min(2, Math.max(-2, value - 5))
    return Number(Math.max(1, Math.min(10, value + wave + slope)).toFixed(2))
  })
}

function buildPulseRelease(
  release: LatestRelease,
  previous: AgentVersion | undefined,
  index: number
): RadarPulseRelease {
  const changes = previous && release.capabilities && previous.capabilities
    ? getCapabilityChanges(release.capabilities, previous.capabilities)
    : []
  const capabilityDelta = changes.reduce((sum, change) => sum + change.delta, 0)
  const absoluteDelta = changes.reduce((sum, change) => sum + Math.abs(change.delta), 0)
  const quality = deriveQualitySignal(release.agent, release)
  const changeType = release.change_type || deriveChangeType(absoluteDelta, release.what_changed || '')
  const importanceScore = release.importance_score || deriveImportanceScore(absoluteDelta, release.what_changed || '')
  const confidencePercent = Math.round(quality.extractionConfidence * 100)
  const confidenceKind = typeof release.extraction_confidence === 'number' ? 'extracted' : 'estimated'

  return {
    ...release,
    ageLabel: formatAgeLabel(release.release_date),
    ageMinutes: getAgeMinutes(release.release_date),
    changeType,
    changeTone: getChangeTone(changeType),
    importanceScore,
    confidencePercent,
    confidenceKind,
    confidenceTone: getConfidenceTone(confidencePercent),
    sourceTone: quality.sourceOfficial ? 'positive' : release.source_url ? 'info' : 'warning',
    sourceLabel: quality.sourceOfficial ? 'Official' : release.source_url ? 'Third-party' : 'Unknown',
    capabilityDelta,
    capabilityDeltaLabel: `${capabilityDelta > 0 ? '+' : ''}${capabilityDelta}`,
    capabilityTone: getCapabilityTone(capabilityDelta),
    sparkline: buildSparkline(release, index),
  }
}

function textMatches(version: AgentVersion, keywords: string[]) {
  const text = `${version.what_changed || ''} ${version.editor_note || ''} ${(version.quality_flags || []).join(' ')}`.toLowerCase()
  return keywords.some((keyword) => text.includes(keyword))
}

function countMatchingSignals(versions: AgentVersion[], days: number, matcher: (version: AgentVersion) => boolean) {
  return versions.filter((version) => isWithinDays(version.release_date, days) && matcher(version)).length
}

function buildBottleneckSignals(versions: AgentVersion[]): RadarBottleneckSignal[] {
  const definitions: Array<{
    label: string
    tone: RadarTone
    matcher: (version: AgentVersion) => boolean
  }> = [
    {
      label: 'Context Window Shifts',
      tone: 'positive',
      matcher: (version) => version.context_window !== null || textMatches(version, ['context', 'token', 'long context']),
    },
    {
      label: 'Pricing Changes',
      tone: 'warning',
      matcher: (version) => Boolean(version.pricing_info) || textMatches(version, ['pricing', 'price', 'cost', 'billing']),
    },
    {
      label: 'Tooling Flags',
      tone: 'info',
      matcher: (version) => textMatches(version, ['flag', 'cli', 'mcp', 'tool', 'config']),
    },
    {
      label: 'Breaking Changes',
      tone: 'danger',
      matcher: (version) => textMatches(version, ['breaking', 'deprecated', 'removed', 'migration']),
    },
    {
      label: 'Stability Warnings',
      tone: 'warning',
      matcher: (version) => textMatches(version, ['stability', 'bug', 'fix', 'regression', 'quality']),
    },
  ]

  return definitions.map((definition) => ({
    label: definition.label,
    tone: definition.tone,
    values: {
      days7: countMatchingSignals(versions, 7, definition.matcher),
      days30: countMatchingSignals(versions, 30, definition.matcher),
      days90: countMatchingSignals(versions, 90, definition.matcher),
    },
  }))
}

function buildDistribution(movers: CapabilityMover[]): RadarSignalDistribution {
  return movers.reduce<RadarSignalDistribution>(
    (distribution, mover) => {
      const signedDelta = mover.changes.reduce((sum, change) => sum + change.delta, 0)
      if (signedDelta >= 6) distribution.majorIncrease += 1
      else if (signedDelta > 0) distribution.increase += 1
      else if (signedDelta <= -6) distribution.majorDecrease += 1
      else if (signedDelta < 0) distribution.decrease += 1
      else distribution.noChange += 1
      return distribution
    },
    {
      increase: 0,
      noChange: 0,
      decrease: 0,
      majorIncrease: 0,
      majorDecrease: 0,
    }
  )
}

function buildCockpit(
  latestReleases: LatestRelease[],
  versions: AgentVersion[],
  versionsByAgent: Record<string, AgentVersion[]>,
  capabilityMovers: CapabilityMover[]
): RadarCockpit {
  const pulse = latestReleases.map((release, index) => {
    const agentVersions = versionsByAgent[release.agent_id] || []
    const previous = agentVersions.find((version) => version.id !== release.id)
    return buildPulseRelease(release, previous, index)
  })

  const confidenceValues = pulse.map((release) => release.confidencePercent)
  const sourceConfidence = confidenceValues.length > 0
    ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
    : 0
  const majorChanges30 = pulse.filter((release) => release.changeType === 'major' && isWithinDays(release.release_date, 30)).length

  return {
    pulse,
    sourceConfidence,
    majorChanges30,
    bottleneckSignals: buildBottleneckSignals(versions),
    distribution: buildDistribution(capabilityMovers),
  }
}

export function getCompareTarget(agent: Agent) {
  if (agent.slug === 'chatgpt') return 'claude'
  if (agent.slug === 'claude') return 'chatgpt'
  if (agent.slug === 'cursor') return 'github-copilot'
  if (agent.category.includes('Coding')) return 'cursor'
  if (agent.category.includes('Multimodal')) return 'chatgpt'
  return 'cursor'
}

export async function getRadarData(): Promise<RadarData> {
  const [{ data: agentsData }, { data: versionsData }] = await Promise.all([
    supabase
      .from('agents')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('agent_versions')
      .select('*')
      .eq('status', 'published')
      .order('release_date', { ascending: false }),
  ])

  const agents = (agentsData as Agent[]) || []
  const versions = ((versionsData as AgentVersion[]) || []).sort(
    (a, b) => asDate(b.release_date).getTime() - asDate(a.release_date).getTime()
  )

  const agentById = new Map(agents.map((agent) => [agent.id, agent]))
  const versionsByAgent = groupVersionsByAgent(versions)

  const latestReleases = versions
    .map((version) => {
      const agent = agentById.get(version.agent_id)
      if (!agent) return null
      return { ...version, agent }
    })
    .filter((version): version is LatestRelease => version !== null)

  const capabilityMovers = agents
    .map((agent) => {
      const agentVersions = versionsByAgent[agent.id] || []
      const [latest, previous] = agentVersions

      if (!latest || !previous || !latest.capabilities || !previous.capabilities) {
        return null
      }

      const changes = getCapabilityChanges(latest.capabilities, previous.capabilities)

      if (changes.length === 0) {
        return null
      }

      const totalDelta = changes.reduce((sum, change) => sum + Math.abs(change.delta), 0)
      const changeType = deriveChangeType(
        totalDelta,
        latest.what_changed || ''
      )
      const importanceScore = deriveImportanceScore(
        totalDelta,
        latest.what_changed || ''
      )
      const quality = deriveQualitySignal(agent, latest)
      const impactBreakdown = deriveImpactBreakdown(totalDelta, changeType, quality)

      return {
        agent,
        latest,
        previous,
        changes: changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
        totalDelta,
        changeType,
        importanceScore,
        quality,
        impactBreakdown,
        whyMoved: impactBreakdown.summary,
      }
    })
    .filter((mover): mover is CapabilityMover => mover !== null)
    .sort((a, b) => {
      if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore
      return b.totalDelta - a.totalDelta
    })

  const releaseVelocity = agents
    .map((agent) => {
      const agentVersions = versionsByAgent[agent.id] || []
      const weightedScore = agentVersions
        .filter((version) => isWithinDays(version.release_date, 90))
        .reduce((sum, version) => {
          if (version.change_type === 'major') return sum + 3
          if (version.change_type === 'minor') return sum + 2
          if (version.change_type === 'patch') return sum + 1
          if (typeof version.importance_score === 'number') return sum + Math.max(1, version.importance_score / 4)
          return sum + 1
        }, 0)

      return {
        agent,
        latestRelease: agentVersions[0] || null,
        releases30: agentVersions.filter((version) => isWithinDays(version.release_date, 30)).length,
        releases90: agentVersions.filter((version) => isWithinDays(version.release_date, 90)).length,
        weightedScore: Number(weightedScore.toFixed(2)),
        totalVersions: agentVersions.length,
      }
    })
    .filter((velocity) => velocity.totalVersions > 0)
    .sort((a, b) => {
      if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore
      if (b.releases90 !== a.releases90) return b.releases90 - a.releases90
      if (b.releases30 !== a.releases30) return b.releases30 - a.releases30
      return b.totalVersions - a.totalVersions
    })

  const now = new Date()
  const releasesThisMonth = versions.filter((version) => {
    const releaseDate = asDate(version.release_date)
    return (
      releaseDate.getUTCFullYear() === now.getUTCFullYear() &&
      releaseDate.getUTCMonth() === now.getUTCMonth()
    )
  }).length

  const categories = new Set(agents.flatMap((agent) => agent.category))
  const recentlyUpdatedAgents = new Set(
    versions
      .filter((version) => isWithinDays(version.release_date, 30))
      .map((version) => version.agent_id)
  ).size

  return {
    agents,
    versions,
    latestReleases,
    capabilityMovers,
    releaseVelocity,
    stats: {
      totalAgents: agents.length,
      releasesThisMonth,
      activeCategories: categories.size,
      recentlyUpdatedAgents,
    },
    cockpit: buildCockpit(latestReleases, versions, versionsByAgent, capabilityMovers),
  }
}
