'use client'

import { Agent } from '@/lib/types'
import { useRouter } from 'next/navigation'

type Props = {
  agents: Agent[]
  selectedA: string
  selectedB: string
}

export default function AgentSelector({
  agents,
  selectedA,
  selectedB,
}: Props) {
  const router = useRouter()

  const handleChange = (side: 'a' | 'b', value: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set(side, value)
    router.push(url.pathname + url.search)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agent A
        </label>
        <select
          value={selectedA}
          onChange={(e) => handleChange('a', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Select an agent</option>
          {agents.map(agent => (
            <option
              key={agent.id}
              value={agent.slug}
              disabled={agent.slug === selectedB}
            >
              {agent.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agent B
        </label>
        <select
          value={selectedB}
          onChange={(e) => handleChange('b', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Select an agent</option>
          {agents.map(agent => (
            <option
              key={agent.id}
              value={agent.slug}
              disabled={agent.slug === selectedA}
            >
              {agent.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}