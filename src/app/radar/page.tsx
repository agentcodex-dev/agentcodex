import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import RadarCockpit from '@/components/cockpit/RadarCockpit'
import { getRadarData } from '@/lib/radar'

export const metadata: Metadata = {
  title: 'Agent Change Radar - Latest AI Agent Updates',
  description: 'Track the latest AI agent releases, capability changes and fastest-moving agents across AgentCodex.',
  alternates: {
    canonical: 'https://agentcodex.dev/radar',
  },
}

const CATEGORIES = ['Coding', 'Research', 'General', 'Multimodal']

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const selectedCategory = CATEGORIES.includes(category || '') ? category : undefined
  const radar = await getRadarData()

  return (
    <div className="min-h-screen acx-cockpit-page">
      <Navigation />
      <RadarCockpit radar={radar} selectedCategory={selectedCategory} categories={CATEGORIES} />
      <Footer />
    </div>
  )
}
