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

export type RadarData = {
  agents: Agent[]
  versions: AgentVersion[]
  latestReleases: LatestRelease[]
  capabilityMovers: CapabilityMover[]
  releaseVelocity: ReleaseVelocity[]
  stats: RadarStats
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
  }
}
