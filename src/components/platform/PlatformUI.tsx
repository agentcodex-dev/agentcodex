import type { ReactNode } from 'react'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral'

const badgeTone: Record<Tone, string> = {
  blue: 'bg-[var(--acx-accent-soft)] text-[var(--acx-accent)]',
  green: 'bg-[var(--acx-success-soft)] text-[var(--acx-success)]',
  amber: 'bg-[var(--acx-warn-soft)] text-[var(--acx-warn)]',
  red: 'bg-[var(--acx-danger-soft)] text-[var(--acx-danger)]',
  neutral: 'bg-[var(--acx-elevated-soft)] text-[var(--acx-text-soft)] border border-[var(--acx-border)]',
}

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </main>
  )
}

export function PlatformHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="acx-page-title text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed acx-body">
          {subtitle}
        </p>
      </div>
      {actions}
    </div>
  )
}

export function PlatformPanel({
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
    <section className={`acx-panel overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="border-b acx-divider px-5 py-4">
          {title && <h2 className="text-lg font-semibold text-[var(--acx-text)]">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm acx-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

export function PlatformMetric({
  label,
  value,
  detail,
  tone = 'blue',
}: {
  label: string
  value: string | number
  detail?: string
  tone?: Tone
}) {
  return (
    <div className="acx-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] acx-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-[var(--acx-text)]">{value}</p>
      {detail && <p className={`mt-1 text-sm ${tone === 'neutral' ? 'acx-muted' : `acx-platform-${tone}`}`}>{detail}</p>}
    </div>
  )
}

export function PlatformBadge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTone[tone]}`}>
      {children}
    </span>
  )
}

export function PlatformMetaRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b acx-divider py-3 text-sm last:border-b-0">
      <span className="acx-muted">{label}</span>
      <span className="max-w-[16rem] text-right font-medium text-[var(--acx-text)]">{value}</span>
    </div>
  )
}

export function PlatformEmpty({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-8 text-center">
      <h3 className="font-semibold text-[var(--acx-text)]">{title}</h3>
      <p className="mt-2 text-sm acx-muted">{body}</p>
    </div>
  )
}
