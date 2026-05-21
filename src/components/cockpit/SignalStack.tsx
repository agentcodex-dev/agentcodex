import Link from 'next/link'
import { Info } from 'lucide-react'
import { CapabilityMover, RadarBottleneckSignal, RadarData, ReleaseVelocity } from '@/lib/radar'
import MiniSparkline from '@/components/cockpit/MiniSparkline'
import CockpitWatchlistDigest from '@/components/cockpit/CockpitWatchlistDigest'
import type { ReactNode } from 'react'

type Props = {
  radar: RadarData
}

function HeatCell({ value, tone }: { value: number; tone: RadarBottleneckSignal['tone'] }) {
  const opacity = Math.max(0.45, Math.min(1, value / 9))
  return (
    <span
      className={`inline-flex h-8 min-w-10 items-center justify-center rounded-sm border text-xs font-semibold tabular-nums acx-heat-${tone}`}
      style={{ opacity }}
    >
      {value}
    </span>
  )
}

function SignalPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="acx-cockpit-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
          )}
        </div>
        <Info size={14} className="text-slate-500" />
      </div>
      {children}
    </section>
  )
}

function Movers({ movers }: { movers: CapabilityMover[] }) {
  const visible = movers.slice(0, 7)
  const max = Math.max(...visible.map((mover) => mover.totalDelta), 1)

  return (
    <div className="space-y-2 p-4">
      {visible.map((mover, index) => {
        const signedDelta = mover.changes.reduce((sum, change) => sum + change.delta, 0)
        const tone = signedDelta < 0 ? 'danger' : 'positive'
        const width = Math.max(12, (mover.totalDelta / max) * 100)

        return (
          <Link
            key={mover.latest.id}
            href={`/agents/${mover.agent.slug}`}
            className="grid grid-cols-[1.5rem_1fr_5rem_2.5rem] items-center gap-2 rounded-md px-1 py-1.5 text-xs transition-colors hover:bg-slate-800/70"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 text-[11px] text-slate-500">
              {index + 1}
            </span>
            <span className="truncate font-medium text-slate-300">{mover.agent.name}</span>
            <span className="h-2 overflow-hidden rounded-full bg-slate-800">
              <span
                className={`block h-full rounded-full ${tone === 'danger' ? 'bg-red-400' : 'bg-emerald-400'}`}
                style={{ width: `${width}%` }}
              />
            </span>
            <span className={`text-right font-semibold tabular-nums acx-cockpit-${tone}`}>
              {signedDelta > 0 ? '+' : ''}{signedDelta}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function Velocity({ velocities }: { velocities: ReleaseVelocity[] }) {
  const visible = velocities.slice(0, 6)

  return (
    <div className="space-y-3 p-4">
      {visible.map((velocity) => (
        <div key={velocity.agent.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <Link
              href={`/agents/${velocity.agent.slug}`}
              className="block truncate text-xs font-medium text-slate-300 transition-colors hover:text-sky-300"
            >
              {velocity.agent.name}
            </Link>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {velocity.releases30} in 30d / {velocity.releases90} in 90d
            </p>
          </div>
          <MiniSparkline
            values={[velocity.releases30, velocity.weightedScore, velocity.releases90, velocity.totalVersions, velocity.weightedScore + 1]}
            tone={velocity.releases30 > 0 ? 'info' : 'neutral'}
            className="h-7 w-[82px]"
          />
        </div>
      ))}
    </div>
  )
}

function Distribution({ radar }: { radar: RadarData }) {
  const items = [
    { label: 'Major Inc.', value: radar.cockpit.distribution.majorIncrease, tone: 'positive' },
    { label: 'Increase', value: radar.cockpit.distribution.increase, tone: 'info' },
    { label: 'No Change', value: radar.cockpit.distribution.noChange, tone: 'neutral' },
    { label: 'Decrease', value: radar.cockpit.distribution.decrease, tone: 'warning' },
    { label: 'Major Dec.', value: radar.cockpit.distribution.majorDecrease, tone: 'danger' },
  ] as const
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0))

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-center">
        <div className="grid h-28 w-28 place-items-center rounded-full border border-slate-700 bg-[conic-gradient(#4ade80_0_42%,#38bdf8_42%_65%,#94a3b8_65%_78%,#fbbf24_78%_90%,#ff5d5d_90%_100%)] p-3">
          <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center">
            <div>
              <p className="text-xl font-semibold text-slate-100">{total}</p>
              <p className="text-[10px] text-slate-500">signals</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
            <span className={`inline-flex items-center gap-2 acx-cockpit-${item.tone}`}>
              <span className={`h-2 w-2 rounded-full acx-dot-${item.tone}`} />
              {item.label}
            </span>
            <span className="font-medium text-slate-300">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SignalStack({ radar }: Props) {
  return (
    <aside className="space-y-3">
      <SignalPanel title="Bottleneck Signals">
        <div className="p-4">
          <div className="grid grid-cols-[1fr_2.5rem_2.5rem_2.5rem] gap-2 text-[11px] text-slate-500">
            <span />
            <span className="text-center">7d</span>
            <span className="text-center">30d</span>
            <span className="text-center">90d</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {radar.cockpit.bottleneckSignals.map((signal) => (
              <div
                key={signal.label}
                className="grid grid-cols-[1fr_2.5rem_2.5rem_2.5rem] items-center gap-2 text-xs"
              >
                <span className="truncate text-slate-300">{signal.label}</span>
                <HeatCell value={signal.values.days7} tone={signal.tone} />
                <HeatCell value={signal.values.days30} tone={signal.tone} />
                <HeatCell value={signal.values.days90} tone={signal.tone} />
              </div>
            ))}
          </div>
        </div>
      </SignalPanel>

      <SignalPanel
        title="Capability Delta"
        subtitle="Latest scored release vs previous scored release"
      >
        <Movers movers={radar.capabilityMovers} />
      </SignalPanel>

      <SignalPanel title="Release Velocity">
        <Velocity velocities={radar.releaseVelocity} />
      </SignalPanel>

      <SignalPanel title="Signal Distribution">
        <Distribution radar={radar} />
      </SignalPanel>

      <CockpitWatchlistDigest releases={radar.cockpit.pulse} />
    </aside>
  )
}
