'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  importance_score: number | null
  change_type: 'major' | 'minor' | 'patch' | 'noise' | null
  extraction_confidence: number | null
  editor_note: string | null
  impact_factors: Record<string, unknown> | null
  quality_flags: string[] | null
  pipeline_run_date: string
  pipeline_source: string
  agent: {
    name: string
    slug: string
  }
}

type ScoreAdjustment = {
  capability: string
  from: number | null
  to: number
  reason: string
}

type DraftForm = {
  version_number: string
  release_date: string
  what_changed: string
  capabilities: Record<string, number>
  context_window: string
  pricing_info: string
  source_url: string
  importance_score: string
  change_type: 'major' | 'minor' | 'patch' | 'noise'
  extraction_confidence: string
  editor_note: string
}

const CAPABILITY_FIELDS = [
  'coding',
  'reasoning',
  'multimodal',
  'tool_use',
  'memory',
  'speed',
]

function toForm(draft: Draft): DraftForm {
  return {
    version_number: draft.version_number || '',
    release_date: draft.release_date || '',
    what_changed: draft.what_changed || '',
    capabilities: draft.capabilities || {},
    context_window: draft.context_window ? String(draft.context_window) : '',
    pricing_info: draft.pricing_info || '',
    source_url: draft.source_url || draft.pipeline_source || '',
    importance_score: draft.importance_score ? String(draft.importance_score) : '',
    change_type: draft.change_type || 'minor',
    extraction_confidence: typeof draft.extraction_confidence === 'number'
      ? String(draft.extraction_confidence)
      : '',
    editor_note: draft.editor_note || '',
  }
}

function toPayload(form: DraftForm) {
  return {
    version_number: form.version_number,
    release_date: form.release_date,
    what_changed: form.what_changed,
    capabilities: form.capabilities,
    context_window: form.context_window ? Number(form.context_window) : null,
    pricing_info: form.pricing_info || null,
    source_url: form.source_url || null,
    importance_score: form.importance_score ? Number(form.importance_score) : null,
    change_type: form.change_type,
    extraction_confidence: form.extraction_confidence
      ? Number(form.extraction_confidence)
      : null,
    editor_note: form.editor_note || null,
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AdminDashboard() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [forms, setForms] = useState<Record<string, DraftForm>>({})
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [stats, setStats] = useState({
    draft: 0,
    published: 0,
    rejected: 0
  })
  const router = useRouter()

  const fetchDrafts = useCallback(async (pwd: string) => {
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
      const nextDrafts = data.drafts || []
      setDrafts(nextDrafts)
      setForms(Object.fromEntries(
        nextDrafts.map((draft: Draft) => [draft.id, toForm(draft)])
      ))
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchStats = useCallback(async (pwd: string) => {
    try {
      const response = await fetch(
        `/api/admin/stats?password=${encodeURIComponent(pwd)}`
      )
      const data = await response.json()
      setStats(data.stats || { draft: 0, published: 0, rejected: 0 })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  useEffect(() => {
    const storedPassword = sessionStorage.getItem('admin_password')
    if (!storedPassword) {
      router.push('/admin')
      return
    }
    setPassword(storedPassword)
    fetchDrafts(storedPassword)
    fetchStats(storedPassword)
  }, [fetchDrafts, fetchStats, router])

  const updateForm = (
    id: string,
    patch: Partial<DraftForm>
  ) => {
    setForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      }
    }))
  }

  const updateCapability = (id: string, key: string, value: string) => {
    const score = Number(value)
    setForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        capabilities: {
          ...prev[id].capabilities,
          [key]: Number.isFinite(score) ? score : 0,
        }
      }
    }))
  }

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
    setForms(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleSave = async (id: string) => {
    const form = forms[id]
    if (!form) return

    setProcessing(id)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/update-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password, ...toPayload(form) })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Save failed')
      }

      setMessage('Draft saved')
      await fetchDrafts(password)
    } catch (error) {
      console.error('Save failed:', error)
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleApprove = async (id: string) => {
    const form = forms[id]
    setProcessing(id)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          password,
          draft: form ? toPayload(form) : undefined,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Approve failed')
      }

      removeDraft(id)
      setStats(prev => ({
        ...prev,
        draft: Math.max(prev.draft - 1, 0),
        published: prev.published + 1
      }))
    } catch (error) {
      console.error('Approve failed:', error)
      setMessage(error instanceof Error ? error.message : 'Approve failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleApproveAll = async () => {
    if (!confirm(`Approve all ${drafts.length} drafts?`)) return

    setProcessing('all')
    setMessage(null)
    try {
      const ids = drafts.map(draft => draft.id)
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Approve all failed')
      }

      setDrafts([])
      setForms({})
      setStats(prev => ({
        ...prev,
        draft: 0,
        published: prev.published + ids.length
      }))
      setMessage(`Approved ${ids.length} drafts`)
    } catch (error) {
      console.error('Approve all failed:', error)
      setMessage(error instanceof Error ? error.message : 'Approve all failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      })
      if (response.ok) {
        removeDraft(id)
        setStats(prev => ({
          ...prev,
          draft: Math.max(prev.draft - 1, 0),
          rejected: prev.rejected + 1
        }))
      }
    } catch (error) {
      console.error('Reject failed:', error)
      setMessage('Reject failed')
    } finally {
      setProcessing(null)
    }
  }

  const hasDrafts = drafts.length > 0
  const capabilityKeysByDraft = useMemo(() => (
    Object.fromEntries(drafts.map(draft => [
      draft.id,
      Array.from(new Set([
        ...CAPABILITY_FIELDS,
        ...Object.keys(forms[draft.id]?.capabilities || {}),
      ]))
    ]))
  ), [drafts, forms])

  const getCalibratedScoreInfo = (draft: Draft, key: string) => {
    const impact = draft.impact_factors as
      | { llmSuggestedScores?: Record<string, number>; calibratedScores?: Record<string, number>; scoreAdjustments?: ScoreAdjustment[] }
      | null
      | undefined

    if (!impact) return null
    const legacy = impact.llmSuggestedScores?.[key]
    const calibrated = impact.calibratedScores?.[key]
    const adjustment = impact.scoreAdjustments?.find((item) => item.capability === key)
    if (typeof legacy !== 'number' || typeof calibrated !== 'number' || legacy === calibrated) return null
    return { legacy, calibrated, adjustment }
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

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-gray-900">
              Agent<span className="text-blue-600">Codex</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">Admin</span>
            <Link href="/admin/ops" className="text-sm text-blue-600 hover:text-blue-700">
              Ops
            </Link>
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

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {drafts.length}
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

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Pending Review
              <span className="ml-2 text-sm font-normal text-gray-500">
                {drafts.length} drafts waiting
              </span>
            </h2>
            {message && (
              <p className="text-sm text-gray-500 mt-1">
                {message}
              </p>
            )}
          </div>
          {drafts.length > 1 && (
            <button
              onClick={handleApproveAll}
              disabled={processing === 'all'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing === 'all' ? 'Approving...' : `Approve All (${drafts.length})`}
            </button>
          )}
        </div>

        {!hasDrafts && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">Done</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              All caught up
            </h3>
            <p className="text-gray-500 text-sm">
              No drafts waiting for review. Pipeline runs daily at 6am UTC.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {drafts.map((draft) => {
            const form = forms[draft.id]
            if (!form) return null

            return (
              <div
                key={draft.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                        Draft
                      </span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        Auto Generated
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">
                      {draft.agent?.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Found {draft.pipeline_run_date ? formatDate(draft.pipeline_run_date) : 'by pipeline'}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleSave(draft.id)}
                      disabled={processing === draft.id}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleApprove(draft.id)}
                      disabled={processing === draft.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {processing === draft.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(draft.id)}
                      disabled={processing === draft.id}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Version
                    </span>
                    <input
                      value={form.version_number}
                      onChange={(e) => updateForm(draft.id, { version_number: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Release Date
                    </span>
                    <input
                      type="date"
                      value={form.release_date}
                      onChange={(e) => updateForm(draft.id, { release_date: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <label className="block mt-4">
                  <span className="text-xs font-medium text-gray-500">
                    What Changed
                  </span>
                  <textarea
                    value={form.what_changed}
                    onChange={(e) => updateForm(draft.id, { what_changed: e.target.value })}
                    rows={4}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </label>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Context Window
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.context_window}
                      onChange={(e) => updateForm(draft.id, { context_window: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Pricing
                    </span>
                    <input
                      value={form.pricing_info}
                      onChange={(e) => updateForm(draft.id, { pricing_info: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Source URL
                    </span>
                    <input
                      value={form.source_url}
                      onChange={(e) => updateForm(draft.id, { source_url: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Change Type
                    </span>
                    <select
                      value={form.change_type}
                      onChange={(e) => updateForm(draft.id, {
                        change_type: e.target.value as DraftForm['change_type']
                      })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="major">major</option>
                      <option value="minor">minor</option>
                      <option value="patch">patch</option>
                      <option value="noise">noise</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Importance (1-10)
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form.importance_score}
                      onChange={(e) => updateForm(draft.id, { importance_score: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      Confidence (0-1)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={form.extraction_confidence}
                      onChange={(e) => updateForm(draft.id, { extraction_confidence: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <label className="block mt-4">
                  <span className="text-xs font-medium text-gray-500">
                    Editor Note
                  </span>
                  <textarea
                    value={form.editor_note}
                    onChange={(e) => updateForm(draft.id, { editor_note: e.target.value })}
                    rows={2}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </label>

                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Capabilities
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {capabilityKeysByDraft[draft.id].map((key) => (
                      <label key={key} className="block">
                        <span className="text-xs text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={form.capabilities[key] ?? ''}
                          onChange={(e) => updateCapability(draft.id, key, e.target.value)}
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                        {(() => {
                          const info = getCalibratedScoreInfo(draft, key)
                          if (!info) return null
                          return (
                            <p className="mt-1 text-[11px] text-indigo-700">
                              Legacy {info.legacy} → Calibrated {info.calibrated}
                              {info.adjustment?.reason ? ` (${info.adjustment.reason.replace(/_/g, ' ')})` : ''}
                            </p>
                          )
                        })()}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {draft.quality_flags && draft.quality_flags.map((flag) => (
                    <span key={flag} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                      {flag.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {form.source_url && (
                    <a
                      href={form.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                    >
                      Source →
                    </a>
                  )}
                  {draft.pipeline_source && draft.pipeline_source !== form.source_url && (
                    <a
                      href={draft.pipeline_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200"
                    >
                      Pipeline source →
                    </a>
                  )}
                  <Link
                    href={`/agents/${draft.agent?.slug}`}
                    target="_blank"
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100"
                  >
                    View agent page →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
