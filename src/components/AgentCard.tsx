import Link from 'next/link'
import { Agent } from '@/lib/types'

type Props = {
  agent: Agent
}

export default function AgentCard({ agent }: Props) {
  return (
    <Link href={`/agents/${agent.slug}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {agent.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-500">{agent.provider}</p>
            </div>
          </div>
          {agent.is_verified && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Verified
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {agent.category.map((cat) => (
            <span
              key={cat}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>

      </div>
    </Link>
  )
}