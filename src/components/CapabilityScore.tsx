type Props = {
  label: string
  score: number
}

export default function CapabilityScore({ label, score }: Props) {
  const percentage = (score / 10) * 100

  const getColor = (value: number) => {
    if (value >= 8) return 'var(--acx-minor)'
    if (value >= 6) return 'var(--acx-accent)'
    if (value >= 4) return 'var(--acx-warn)'
    return 'var(--acx-danger)'
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm acx-body w-24 shrink-0">{label}</span>
      <div className="acx-meter flex-1">
        <div
          className="h-2 rounded-full transition-all"
          style={{ backgroundColor: getColor(score), width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-[var(--acx-text)] w-8 text-right">
        {score}/10
      </span>
    </div>
  )
}
