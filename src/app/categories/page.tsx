import Navigation from '@/components/Navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

const CATEGORIES = [
  {
    name: 'Coding',
    description: 'AI agents that help write, review and debug code',
    emoji: '💻',
    examples: ['GitHub Copilot', 'Cursor', 'Windsurf']
  },
  {
    name: 'Research',
    description: 'AI agents that help find and synthesize information',
    emoji: '🔬',
    examples: ['Perplexity', 'Claude', 'Gemini']
  },
  {
    name: 'General',
    description: 'Versatile AI agents for a wide range of tasks',
    emoji: '🤖',
    examples: ['ChatGPT', 'Claude', 'Gemini']
  },
  {
    name: 'Multimodal',
    description: 'AI agents that work with text, images, audio and video',
    emoji: '🎨',
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

export default function CategoriesPage() {
  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <p className="acx-eyebrow text-sm">Explorer</p>
          <h1 className="text-4xl sm:text-5xl font-semibold acx-page-title mt-2">
            Categories
          </h1>
          <p className="acx-body mt-3 text-base sm:text-lg">
            Browse AI agents by category
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/agents?category=${cat.name}`}
            >
              <div className="acx-panel p-8 hover:border-[var(--acx-border-strong)] transition-colors cursor-pointer group acx-reveal">
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{cat.emoji}</span>
                  <h2 className="text-3xl font-semibold acx-page-title group-hover:text-[var(--acx-accent)] transition-colors">
                    {cat.name}
                  </h2>
                </div>

                <p className="acx-body mb-4">
                  {cat.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {cat.examples.map((example) => (
                    <span
                      key={example}
                      className="acx-chip"
                    >
                      {example}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-[var(--acx-accent)] text-sm font-medium group-hover:text-[var(--acx-accent-hover)]">
                  Browse {cat.name} agents →
                </div>

              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
