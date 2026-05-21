import type { ReactNode } from 'react'

type Tone = 'positive' | 'neutral' | 'warning' | 'danger' | 'info'

export function CockpitShell({ children }: { children: ReactNode }) {
  return (
    <main className="acx-cockpit mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 lg:px-5">
      {children}
    </main>
  )
}

export function CockpitHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">{subtitle}</p>
      </div>
      {actions}
    </div>
  )
}

export function CockpitPanel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`acx-cockpit-panel overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-slate-800 px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-slate-50">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

export function SignalBadge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span className={`acx-cockpit-pill acx-tone-${tone}`}>
      {children}
    </span>
  )
}

export function MetricTile({
  label,
  value,
  detail,
  tone = 'info',
}: {
  label: string
  value: string | number
  detail?: string
  tone?: Tone
}) {
  return (
    <div className="acx-cockpit-panel p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
        {value}
      </p>
      {detail && (
        <p className={`mt-1 text-xs acx-cockpit-${tone}`}>{detail}</p>
      )}
    </div>
  )
}

export function MetadataRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800 py-2.5 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[13rem] text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

export function EmptyState({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/35 p-6 text-center">
      <h3 className="font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  )
}
