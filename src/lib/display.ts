import { Agent, AgentVersion } from '@/lib/types'
import { deriveQualitySignal } from '@/lib/intelligence'

export function formatShortDate(value?: string | null) {
  if (!value) return 'Not captured'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMonthDate(value?: string | null) {
  if (!value) return 'Not captured'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function formatContext(value?: number | null) {
  if (!value) return 'Not captured'
  return `${value.toLocaleString()} tokens`
}

export function formatPricing(value?: string | null) {
  return value || 'Not captured'
}

export function formatConfidence(agent: Agent, version?: AgentVersion | null) {
  if (!version) return { label: 'N/A', estimated: false, sourceOfficial: false }
  const quality = deriveQualitySignal(agent, version)
  return {
    label: `${Math.round(quality.extractionConfidence * 100)}%`,
    estimated: typeof version.extraction_confidence !== 'number',
    sourceOfficial: quality.sourceOfficial,
  }
}

export function latestByAgent(versions: AgentVersion[]) {
  const latest = new Map<string, AgentVersion>()
  versions.forEach((version) => {
    if (!latest.has(version.agent_id)) latest.set(version.agent_id, version)
  })
  return latest
}
