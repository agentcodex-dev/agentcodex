'use client'

import { useEffect, useMemo, useState } from 'react'
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

function useCountUp(target: number) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const duration = 500
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * progress))
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return value
}

export default function RadarStatCards({ stats }: Props) {
  const targets = useMemo(() => ({
    totalAgents: Number(stats.totalAgents ?? 0),
    releasesThisMonth: Number(stats.releasesThisMonth ?? 0),
    recentlyUpdatedAgents: Number(stats.recentlyUpdatedAgents ?? 0),
    activeCategories: Number(stats.activeCategories ?? 0),
  }), [stats])

  const totalAgents = useCountUp(targets.totalAgents)
  const releasesThisMonth = useCountUp(targets.releasesThisMonth)
  const recentlyUpdatedAgents = useCountUp(targets.recentlyUpdatedAgents)
  const activeCategories = useCountUp(targets.activeCategories)
  const animatedValues = {
    totalAgents,
    releasesThisMonth,
    recentlyUpdatedAgents,
    activeCategories,
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map(({ key, label, icon: Icon }, index) => (
        <div
          key={key}
          className="acx-panel p-4 sm:p-5 acx-kpi-enter"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-[var(--acx-text)]">
                {animatedValues[key]}
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
