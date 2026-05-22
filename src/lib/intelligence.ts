import { Agent, AgentVersion } from '@/lib/types'

export type ChangeType = 'major' | 'minor' | 'patch' | 'noise'

export type QualitySignal = {
  sourceOfficial: boolean
  sourceTier: 'official' | 'partner' | 'secondary' | 'unknown'
  extractionConfidence: number
  confidenceLabel: 'High' | 'Medium' | 'Low'
}

export type ImpactBreakdown = {
  capabilityDeltaImpact: number
  releaseTypeImpact: number
  trustImpact: number
  confidenceImpact: number
  finalImpact: number
  summary: string
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
  antigravity: ['antigravity.google', 'google.com', 'developers.googleblog.com', 'blog.google'],
  openhands: ['github.com', 'openhands.dev'],
  deepseek: ['deepseek.com', 'api-docs.deepseek.com'],
  qwen: ['qwen.ai', 'qwenlm.github.io', 'qwenlm.ai', 'github.com', 'alibabacloud.com'],
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
  const measuredConfidence = typeof version.extraction_confidence === 'number'
    ? version.extraction_confidence
    : 0.56
  const boundedMeasured = Math.max(0, Math.min(1, measuredConfidence))
  const hasSummary = Boolean(version.what_changed && version.what_changed.trim().length >= 30)
  const hasCapabilities = Boolean(version.capabilities && Object.keys(version.capabilities).length >= 4)
  const hasSourceUrl = Boolean(version.source_url)
  const hasImpactFields = typeof version.importance_score === 'number' && Boolean(version.change_type)
  const completenessScore = [hasSummary, hasCapabilities, hasSourceUrl, hasImpactFields].filter(Boolean).length / 4

  // Blend measured confidence with source/completeness so scores don't collapse to one bucket.
  const sourceFactor = official ? 0.12 : hasSourceUrl ? -0.06 : -0.12
  const completenessFactor = (completenessScore - 0.5) * 0.26
  let confidence = boundedMeasured + sourceFactor + completenessFactor
  if (!hasSummary) confidence -= 0.08

  const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'
  return {
    sourceOfficial: official,
    sourceTier: official ? 'official' : version.source_url ? 'secondary' : 'unknown',
    extractionConfidence: Number(Math.max(0.2, Math.min(0.98, confidence)).toFixed(2)),
    confidenceLabel,
  }
}

function releaseTypeWeight(changeType: ChangeType) {
  if (changeType === 'major') return 3.2
  if (changeType === 'minor') return 2.1
  if (changeType === 'patch') return 1.2
  return 0.4
}

export function deriveImpactBreakdown(
  totalDelta: number,
  changeType: ChangeType,
  quality: QualitySignal
): ImpactBreakdown {
  const capabilityDeltaImpact = Number((Math.max(0, totalDelta) * 1.25).toFixed(2))
  const releaseTypeImpact = Number(releaseTypeWeight(changeType).toFixed(2))
  const trustImpact = quality.sourceOfficial ? 1.1 : 0.85
  const confidenceImpact = Number((0.8 + quality.extractionConfidence * 0.6).toFixed(2))
  const finalImpact = Number((
    (capabilityDeltaImpact + releaseTypeImpact) * trustImpact * confidenceImpact
  ).toFixed(2))
  const summary = `${changeType} update with ${quality.confidenceLabel.toLowerCase()} confidence from ${
    quality.sourceOfficial ? 'official' : 'non-official'
  } source`
  return {
    capabilityDeltaImpact,
    releaseTypeImpact,
    trustImpact: Number(trustImpact.toFixed(2)),
    confidenceImpact,
    finalImpact,
    summary,
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
