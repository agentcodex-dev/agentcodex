'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Draft = {
  id: string
  version_number: string
  release_date: string
  what_changed: string
  capabilities: Record<string, number>
  context_window: number | null
  pricing_info: string | null
  source_url: string | null
  pipeline_run_date: string
  pipeline_source: string
  agent: {
    name: string
    slug: string
  }
}

export default function AdminDashboard() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [stats, setStats] = useState({
    draft: 0,
    published: 0,
    rejected: 0
  })
  const router = useRouter()

  useEffect(() => {
    const storedPassword = sessionStorage.getItem('admin_password')
    if (!storedPassword) {
      router.push('/admin')
      return
    }
    setPassword(storedPassword)
    fetchDrafts(storedPassword)
    fetchStats(storedPassword)
  }, [])

  const fetchDrafts = async (pwd: string) => {
    try {
      const response = await fetch(
        `/api/admin/drafts?password=${encodeURIComponent(pwd)}`
      )
      if (response.status === 401) {
        sessionStorage.removeItem('admin_password')
        router.push('/admin')
        return
      }
      const data = await response.json()
      setDrafts(data.drafts || [])
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (pwd: string) => {
    try {
      const response = await fetch(
        `/api/admin/stats?password=${encodeURIComponent(pwd)}`
      )
      const data = await response.json()
      setStats(data.stats || { draft: 0, published: 0, rejected: 0 })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      })
      if (response.ok) {
        setDrafts(drafts.filter(d => d.id !== id))
        setStats(prev => ({
          ...prev,
          draft: prev.draft - 1,
          published: prev.published + 1
        }))
      }
    } catch (error) {
      console.error('Approve failed:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      })
      if (response.ok) {
        setDrafts(drafts.filter(d => d.id !== id))
        setStats(prev => ({
          ...prev,
          draft: prev.draft - 1,
          rejected: prev.rejected + 1
        }))
      }
    } catch (error) {
      console.error('Reject failed:', error)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading drafts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-gray-900">
              Agent<span className="text-blue-600">Codex</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">Admin</span>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_password')
              router.push('/admin')
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {stats.draft}
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              Pending Review
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.published}
            </div>
            <div className="text-sm text-green-700 mt-1">
              Published
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-sm text-red-700 mt-1">
              Rejected
            </div>
          </div>
        </div>

        {/* Drafts Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Pending Review
            <span className="ml-2 text-sm font-normal text-gray-500">
              {drafts.length} drafts waiting
            </span>
          </h2>
          {drafts.length > 1 && (
            <button
              onClick={async () => {
                if (confirm(`Approve all ${drafts.length} drafts?`)) {
                  for (const draft of drafts) {
                    await handleApprove(draft.id)
                  }
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Approve All ({drafts.length})
            </button>
          )}
        </div>

        {/* Empty State */}
        {drafts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500 text-sm">
              No drafts waiting for review.
              Pipeline runs daily at 6am UTC.
            </p>
          </div>
        )}

        {/* Draft Cards */}
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              {/* Draft Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                      Draft
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      🤖 Auto Generated
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">
                    {draft.agent?.name} - {draft.version_number}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Release date: {new Date(draft.release_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(draft.id)}
                    disabled={processing === draft.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {processing === draft.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(draft.id)}
                    disabled={processing === draft.id}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {processing === draft.id ? '...' : '✕ Reject'}
                  </button>
                </div>
              </div>

              {/* What Changed */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {draft.what_changed}
                </p>
              </div>

              {/* Meta Info */}
              <div className="mt-4 flex flex-wrap gap-3">
                {draft.context_window && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                    🪟 {draft.context_window.toLocaleString()} tokens
                  </span>
                )}
                {draft.pricing_info && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    💰 {draft.pricing_info}
                  </span>
                )}
                {draft.source_url && (
                  <a
                    href={draft.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                  >
                    🔗 Source →
                  </a>
                )}
                {draft.pipeline_run_date && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    🕐 Found {new Date(draft.pipeline_run_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Capabilities */}
              {draft.capabilities && Object.keys(draft.capabilities).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Capabilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(draft.capabilities).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                      >
                        {key}: {value}/10
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* View on site link */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/agents/${draft.agent?.slug}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View agent page →
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}