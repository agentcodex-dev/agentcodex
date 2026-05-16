import Link from 'next/link'

type Props = {
  title?: string
  body: string
  compact?: boolean
}

export default function MethodologyCallout({
  title = 'How this is scored',
  body,
  compact = false,
}: Props) {
  return (
    <div className={`acx-panel ${compact ? 'p-4' : 'p-5'} acx-reveal`}>
      <h3 className="font-semibold text-[var(--acx-text)]">{title}</h3>
      <p className="text-sm acx-body mt-2 leading-relaxed">{body}</p>
      <Link
        href="/methodology"
        className="inline-flex mt-3 items-center gap-1 text-sm font-medium text-[var(--acx-accent)] hover:text-[var(--acx-accent-hover)] transition-colors"
      >
        Read full methodology
      </Link>
    </div>
  )
}
