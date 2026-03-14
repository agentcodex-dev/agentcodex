export type Agent = {
  id: string
  name: string
  provider: string
  category: string[]
  description: string
  website_url: string
  logo_url: string
  is_verified: boolean
  created_at: string
  slug: string
}

export type AgentVersion = {
  id: string
  agent_id: string
  version_number: string
  release_date: string
  what_changed: string
  capabilities: Capability
  context_window: number | null
  pricing_info: string | null
  source_url: string | null
  is_auto_generated: boolean
  created_at: string
}

export type Capability = {
  coding: number
  reasoning: number
  multimodal: number
  tool_use: number
  memory: number
  speed: number
  [key: string]: number
}

export type NewsSource = {
  id: string
  source_name: string
  url: string
  type: 'blog' | 'rss' | 'twitter'
  last_crawled_at: string
  is_active: boolean
}