import { Activity, Layers, Radio, RefreshCw } from 'lucide-react'
import { RadarStats } from '@/lib/radar'

type Props = {
  stats: RadarStats
}

const statItems = [
  {
    key: 'totalAgents',
    label: 'Agents tracked',
    icon: Layers,
  },
  {
    key: 'releasesThisMonth',
    label: 'Releases this month',
    icon: RefreshCw,
  },
  {
    key: 'recentlyUpdatedAgents',
    label: 'Updated recently',
    icon: Radio,
  },
  {
    key: 'activeCategories',
    label: 'Active categories',
    icon: Activity,
  },
] as const

export default function RadarStatCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="acx-panel p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[var(--acx-text)]">
                {stats[key]}
              </div>
              <div className="text-xs sm:text-sm acx-muted mt-1">
                {label}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--acx-accent-soft)] text-[var(--acx-accent)] flex items-center justify-center shrink-0">
              <Icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
