import { supabase } from '@/lib/supabase'
import { Agent } from '@/lib/types'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
  const { data: agents } = await supabase
    .from('agents')
    .select('slug, created_at')

  const agentUrls = (agents as Agent[] || []).map((agent) => ({
    url: `https://agentcodex.dev/agents/${agent.slug}`,
    lastModified: new Date(agent.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const comparePairs = [
    'claude-vs-chatgpt',
    'cursor-vs-windsurf',
    'cursor-vs-github-copilot',
    'claude-vs-gemini',
    'chatgpt-vs-gemini',
    'devin-vs-cursor',
    'perplexity-vs-chatgpt',
    'llama-vs-claude',
    'bolt-new-vs-cursor',
    'github-copilot-vs-windsurf',
  ].map(pair => ({
    url: `https://agentcodex.dev/compare/${pair}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: 'https://agentcodex.dev',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://agentcodex.dev/agents',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://agentcodex.dev/categories',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://agentcodex.dev/compare',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...agentUrls,
    ...comparePairs,
  ]
}