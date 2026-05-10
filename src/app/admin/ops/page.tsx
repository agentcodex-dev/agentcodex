'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type OpsMetrics = {
  runs: number
  articlesScraped: number
  extracted: number
  saved: number
  extractionPassRate: number
  dedupeSkipRatio: number
  statusCounts: Record<string, number>
}

export default function AdminOpsPage() {
  const router = useRouter()
  const [days, setDays] = useState(30)
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null)
  const [password] = useState(() => (
    typeof window === 'undefined' ? '' : (sessionStorage.getItem('admin_password') || '')
  ))

  useEffect(() => {
    if (!password) {
      router.push('/admin')
    }
  }, [password, router])

  useEffect(() => {
    if (!password) return
    const fetchMetrics = async () => {
      const res = await fetch(`/api/admin/ops?password=${encodeURIComponent(password)}&days=${days}`)
      if (res.status === 401) {
        sessionStorage.removeItem('admin_password')
        router.push('/admin')
        return
      }
      const data = await res.json()
      setMetrics(data.metrics || null)
    }
    fetchMetrics()
  }, [days, password, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900">Agent<span className="text-blue-600">Codex</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:text-blue-700">Draft review</Link>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Ops Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">Pipeline health and ingestion outcomes.</p>

        <div className="mt-4 flex gap-2">
          {[7, 30, 90].map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`px-3 py-2 rounded-lg text-sm ${days === w ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
            >
              {w} days
            </button>
          ))}
        </div>

        {metrics && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Runs</p><p className="text-2xl font-bold">{metrics.runs}</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Articles</p><p className="text-2xl font-bold">{metrics.articlesScraped}</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Saved drafts</p><p className="text-2xl font-bold">{metrics.saved}</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Extraction pass rate</p><p className="text-2xl font-bold">{Math.round(metrics.extractionPassRate * 100)}%</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Dedupe skip ratio</p><p className="text-2xl font-bold">{Math.round(metrics.dedupeSkipRatio * 100)}%</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Version statuses</p>
              <p className="text-sm text-gray-700 mt-2">
                Draft {metrics.statusCounts.draft || 0} · Published {metrics.statusCounts.published || 0} · Rejected {metrics.statusCounts.rejected || 0}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
