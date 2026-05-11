type Props = {
  summary: string
  score?: number | null
}

export default function ImpactBreakdown({ summary, score }: Props) {
  return (
    <div className="mt-2 text-xs acx-body bg-[var(--acx-surface)] border acx-divider rounded-lg px-2 py-1">
      <span className="font-medium text-[var(--acx-text-soft)]">Why moved:</span> {summary}
      {typeof score === 'number' && (
        <span className="ml-2 acx-muted">Impact {score.toFixed(1)}</span>
      )}
    </div>
  )
}
