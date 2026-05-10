type Props = {
  summary: string
  score?: number | null
}

export default function ImpactBreakdown({ summary, score }: Props) {
  return (
    <div className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
      <span className="font-medium text-gray-700">Why moved:</span> {summary}
      {typeof score === 'number' && (
        <span className="ml-2 text-gray-500">Impact {score.toFixed(1)}</span>
      )}
    </div>
  )
}
