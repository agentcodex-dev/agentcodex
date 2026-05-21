import { Activity, Bell, Gauge, Layers3, RadioTower } from 'lucide-react'
import { RadarData } from '@/lib/radar'
import type { ReactNode } from 'react'

type Props = {
  radar: RadarData
}

function KpiTile({
  label,
  value,
  detail,
  tone = 'info',
  children,
}: {
  label: string
  value: string
  detail: string
  tone?: 'positive' | 'warning' | 'danger' | 'info'
  children: ReactNode
}) {
  return (
    <div className="acx-cockpit-panel acx-kpi-enter p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <div className={`acx-signal-icon acx-signal-${tone}`}>
          {children}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-slate-50">
            {value}
          </p>
          <p className={`mt-1 text-xs acx-cockpit-${tone}`}>
            {detail}
          </p>
        </div>
        <div className="flex h-7 items-end gap-1">
          {[34, 48, 28, 68, 54, 76].map((height, index) => (
            <span
              key={index}
              className={`w-1.5 rounded-t-sm bg-current acx-cockpit-${tone}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SignalKpiStrip({ radar }: Props) {
  const releases30 = radar.cockpit.pulse.filter((release) => (
    release.ageMinutes <= 30 * 24 * 60
  )).length
  const watchlistAlerts = radar.cockpit.pulse.filter((release) => (
    release.importanceScore >= 7 || release.changeType === 'major'
  )).length

  return (
    <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
      <KpiTile
        label="Total Agents"
        value={radar.stats.totalAgents.toLocaleString()}
        detail={`${radar.stats.recentlyUpdatedAgents} updated in 30d`}
        tone="positive"
      >
        <RadioTower size={16} />
      </KpiTile>
      <KpiTile
        label="Releases 30d"
        value={releases30.toLocaleString()}
        detail={`${radar.stats.releasesThisMonth} this month`}
        tone="info"
      >
        <Activity size={16} />
      </KpiTile>
      <KpiTile
        label="Major Changes"
        value={radar.cockpit.majorChanges30.toLocaleString()}
        detail="high-impact signal"
        tone="warning"
      >
        <Gauge size={16} />
      </KpiTile>
      <KpiTile
        label="Watchlist Alerts"
        value={watchlistAlerts.toLocaleString()}
        detail="importance >= 7"
        tone="danger"
      >
        <Bell size={16} />
      </KpiTile>
      <KpiTile
        label="Source Confidence"
        value={`${radar.cockpit.sourceConfidence}%`}
        detail={`${radar.stats.activeCategories} active categories`}
        tone="positive"
      >
        <Layers3 size={16} />
      </KpiTile>
    </section>
  )
}
