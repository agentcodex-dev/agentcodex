import { Agent, AgentVersion } from '@/lib/types'

export const COPILOT_PRESETS: Record<string, { label: string; weights: Record<string, number> }> = {
  'solo-dev': { label: 'Solo Dev', weights: { coding: 0.38, speed: 0.24, tool_use: 0.2, reasoning: 0.18 } },
  enterprise: { label: 'Enterprise', weights: { reasoning: 0.3, tool_use: 0.25, memory: 0.2, coding: 0.15, speed: 0.1 } },
  research: { label: 'Research', weights: { reasoning: 0.44, memory: 0.24, tool_use: 0.18, multimodal: 0.14 } },
  multimodal: { label: 'Multimodal', weights: { multimodal: 0.5, speed: 0.2, reasoning: 0.16, tool_use: 0.14 } },
}

export function scoreForPreset(agent: Agent, version: AgentVersion, preset: string) {
  const p = COPILOT_PRESETS[preset] || COPILOT_PRESETS['solo-dev']
  const weighted = Object.entries(p.weights).reduce((sum, [key, weight]) => {
    const score = Number(version.capabilities?.[key] || 0)
    return sum + score * weight
  }, 0)
  const freshnessBoost = version.release_date ? 0.25 : 0
  const verifiedBoost = agent.is_verified ? 0.2 : 0
  return Number((weighted + freshnessBoost + verifiedBoost).toFixed(2))
}
