import { Agent, AgentVersion } from '@/lib/types'

export type ChangeType = 'major' | 'minor' | 'patch' | 'noise'

export type QualitySignal = {
  sourceOfficial: boolean
  extractionConfidence: number
  confidenceLabel: 'High' | 'Medium' | 'Low'
}

const OFFICIAL_DOMAINS: Record<string, string[]> = {
  chatgpt: ['openai.com', 'help.openai.com'],
  codex: ['openai.com', 'help.openai.com'],
  claude: ['anthropic.com'],
  'claude-code': ['claude.com', 'anthropic.com', 'code.claude.com'],
  gemini: ['google.com', 'deepmind.google'],
  llama: ['meta.com', 'fb.com', 'facebook.com'],
  'github-copilot': ['github.com', 'github.blog'],
  cursor: ['cursor.com'],
  perplexity: ['perplexity.ai'],
  devin: ['cognition.ai'],
  'bolt-new': ['stackblitz.com'],
  windsurf: ['codeium.com'],
  mistral: ['mistral.ai'],
  'amazon-q': ['amazon.com', 'aws.amazon.com'],
  grok: ['x.ai', 'grok.com'],
  v0: ['v0.dev', 'vercel.com'],
  'replit-agent': ['replit.com'],
  cline: ['github.com', 'cline.bot'],
  midjourney: ['midjourney.com'],
  'stable-diffusion': ['stability.ai'],
  suno: ['suno.com'],
  aider: ['github.com', 'aider.chat'],
  'roo-code': ['github.com'],
  continue: ['continue.dev', 'github.com'],
}

const MAJOR_KEYWORDS = [
  'launch', 'introduced', 'new model', 'new mode', 'agent', 'major',
  'breaking', 'ga', 'generally available', 'preview', 'enterprise',
]
const PATCH_KEYWORDS = ['bug fix', 'hotfix', 'patch', 'minor fix', 'stability']

function includesKeyword(text: string, words: string[]) {
  const lower = text.toLowerCase()
  return words.some((word) => lower.includes(word))
}

function sourceHost(url?: string | null) {
  if (!url) return ''
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

export function isOfficialSource(agentSlug: string, url?: string | null): boolean {
  const host = sourceHost(url)
  if (!host) return false
  const roots = OFFICIAL_DOMAINS[agentSlug] || []
  return roots.some((root) => host === root || host.endsWith(`.${root}`))
}

export function deriveChangeType(totalDelta: number, whatChanged: string): ChangeType {
  if (totalDelta >= 6 || includesKeyword(whatChanged, MAJOR_KEYWORDS)) return 'major'
  if (totalDelta >= 3) return 'minor'
  if (totalDelta > 0 || includesKeyword(whatChanged, PATCH_KEYWORDS)) return 'patch'
  return 'noise'
}

export function deriveImportanceScore(totalDelta: number, whatChanged: string): number {
  let score = Math.min(10, Math.max(1, Math.round(totalDelta * 1.5)))
  if (includesKeyword(whatChanged, MAJOR_KEYWORDS)) score = Math.min(10, score + 2)
  if (includesKeyword(whatChanged, PATCH_KEYWORDS)) score = Math.max(1, score - 1)
  return score
}

export function deriveQualitySignal(agent: Agent, version: AgentVersion): QualitySignal {
  const official = isOfficialSource(agent.slug, version.source_url)
  let confidence = typeof version.extraction_confidence === 'number'
    ? version.extraction_confidence
    : 0.6

  if (official) confidence = Math.min(1, confidence + 0.2)
  if (!version.what_changed) confidence = Math.max(0.3, confidence - 0.2)

  const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'
  return {
    sourceOfficial: official,
    extractionConfidence: Number(confidence.toFixed(2)),
    confidenceLabel,
  }
}

export function getBestFor(agent: Agent): string {
  if (agent.category.includes('Coding')) return 'Repository coding and rapid iteration'
  if (agent.category.includes('Research')) return 'Deep synthesis and research workflows'
  if (agent.category.includes('Multimodal')) return 'Image and multimodal creation tasks'
  return 'General assistant workflows'
}

export function getAvoidIf(agent: Agent): string {
  if (agent.category.includes('Coding')) return 'You need non-technical, no-setup workflows'
  if (agent.category.includes('Research')) return 'You primarily need deterministic coding automation'
  if (agent.category.includes('Multimodal')) return 'You only need text-first software development'
  return 'You need highly specialized domain automation'
}
