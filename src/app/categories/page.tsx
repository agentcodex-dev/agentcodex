import Navigation from '@/components/Navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { getRadarData } from '@/lib/radar'
import { PlatformBadge, PlatformHeader, PlatformMetric, PlatformPanel, PlatformShell } from '@/components/platform/PlatformUI'

const CATEGORIES = [
  {
    name: 'Coding',
    icon: '</>',
    description: 'AI agents that help write, review and debug code',
    examples: ['GitHub Copilot', 'Cursor', 'Windsurf']
  },
  {
    name: 'Research',
    icon: 'R',
    description: 'AI agents that help find and synthesize information',
    examples: ['Perplexity', 'Claude', 'Gemini']
  },
  {
    name: 'General',
    icon: 'AI',
    description: 'Versatile AI agents for a wide range of tasks',
    examples: ['ChatGPT', 'Claude', 'Gemini']
  },
  {
    name: 'Multimodal',
    icon: 'MM',
    description: 'AI agents that work with text, images, audio and video',
    examples: ['GPT-4o', 'Gemini', 'Claude 3']
  },
]

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agent Categories - Coding, Research, General',
  description: 'Browse AI agents by category. Find coding agents like Cursor and Copilot, research agents like Perplexity, and general purpose agents like Claude and ChatGPT.',
  alternates: {
    canonical: 'https://agentcodex.dev/categories',
  }
}

export default async function CategoriesPage() {
  const radar = await getRadarData()

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <PlatformShell>
        <PlatformHeader
          title="Categories"
          subtitle="Explore the agent ecosystem by workflow category, release activity, and latest signal movement."
        />
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformMetric label="Categories" value={CATEGORIES.length} detail="tracked workflow groups" tone="blue" />
          <PlatformMetric label="Agents" value={radar.stats.totalAgents} detail="across all categories" tone="green" />
          <PlatformMetric label="Updated 30d" value={radar.stats.recentlyUpdatedAgents} detail="active ecosystem signal" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/agents?category=${cat.name}`}
            >
              <CategoryPanel icon={cat.icon} name={cat.name} description={cat.description} examples={cat.examples} radar={radar} />
            </Link>
          ))}
        </div>
      </PlatformShell>
      <Footer />
    </div>
  )
}

function CategoryPanel({
  icon,
  name,
  description,
  examples,
  radar,
}: {
  icon: string
  name: string
  description: string
  examples: string[]
  radar: Awaited<ReturnType<typeof getRadarData>>
}) {
  const agents = radar.agents.filter((agent) => agent.category.includes(name))
  const releases = radar.latestReleases.filter((release) => release.agent.category.includes(name))
  const movers = radar.capabilityMovers.filter((mover) => mover.agent.category.includes(name))
  const recent = new Set(radar.cockpit.pulse.filter((release) => (
    release.agent.category.includes(name) && release.ageMinutes <= 30 * 24 * 60
  )).map((release) => release.agent_id)).size
  const latest = releases[0]
  const topMover = movers[0]

  return (
    <PlatformPanel className="h-full transition-colors hover:border-[var(--acx-border-strong)]">
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--acx-accent-soft)] text-sm font-bold text-[var(--acx-accent)]">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[var(--acx-text)]">{name}</h2>
              <p className="mt-1 text-sm leading-relaxed acx-body">{description}</p>
            </div>
          </div>
          <PlatformBadge tone="blue">{agents.length} agents</PlatformBadge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] acx-muted">Updated</p>
            <p className="mt-1 text-lg font-semibold text-[var(--acx-text)]">{recent}</p>
          </div>
          <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] acx-muted">Signals</p>
            <p className="mt-1 text-lg font-semibold text-[var(--acx-text)]">{releases.length}</p>
          </div>
          <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] acx-muted">Delta</p>
            <p className={`mt-1 text-lg font-semibold ${topMover ? 'text-[var(--acx-success)]' : 'acx-muted'}`}>
              {topMover ? topMover.totalDelta : 0}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border acx-divider bg-[var(--acx-surface)] p-3">
          <p className="text-xs font-semibold text-[var(--acx-text)]">Latest category signal</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed acx-muted">
            {latest ? `${latest.agent.name}: ${latest.what_changed}` : 'No published releases yet.'}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((example) => (
            <PlatformBadge key={example} tone="neutral">{example}</PlatformBadge>
          ))}
        </div>

        <div className="mt-4 text-sm font-semibold text-[var(--acx-accent)]">
          Browse {name} agents →
        </div>
      </div>
    </PlatformPanel>
  )
}
