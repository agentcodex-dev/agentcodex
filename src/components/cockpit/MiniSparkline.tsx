type Props = {
  values: number[]
  tone?: 'positive' | 'neutral' | 'warning' | 'danger' | 'info'
  className?: string
}

const TONE_STROKE = {
  positive: '#4ade80',
  neutral: '#94a3b8',
  warning: '#fbbf24',
  danger: '#ff5d5d',
  info: '#38bdf8',
}

export default function MiniSparkline({
  values,
  tone = 'positive',
  className = '',
}: Props) {
  const width = 92
  const height = 28
  const safeValues = values.length > 1 ? values : [4, 5, 4.5, 6]
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const range = max - min || 1
  const points = safeValues
    .map((value, index) => {
      const x = (index / (safeValues.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Recent movement sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
