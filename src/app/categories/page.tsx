import Navigation from '@/components/Navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="text-gray-500 mt-2">
            Browse AI agents by category
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/agents?category=${cat.name}`}
            >
              <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{cat.emoji}</span>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h2>
                </div>

                <p className="text-gray-600 mb-4">
                  {cat.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {cat.examples.map((example) => (
                    <span
                      key={example}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {example}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Browse {cat.name} agents →
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}