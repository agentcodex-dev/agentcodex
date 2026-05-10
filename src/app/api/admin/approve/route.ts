import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deriveChangeType, deriveImportanceScore } from '@/lib/intelligence'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type ApprovePayload = {
  id?: string
  ids?: string[]
  password?: string
  draft?: {
    version_number?: string
    release_date?: string
    what_changed?: string
    capabilities?: Record<string, number>
    context_window?: number | null
    pricing_info?: string | null
    source_url?: string | null
    importance_score?: number | null
    change_type?: 'major' | 'minor' | 'patch' | 'noise' | null
    extraction_confidence?: number | null
    editor_note?: string | null
  }
}

function clampConfidence(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return Math.max(0, Math.min(1, Number(value.toFixed(3))))
}

export async function POST(request: NextRequest) {
  try {
    const { id, ids, password, draft } = await request.json() as ApprovePayload

    // Check password
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (ids?.length) {
      const { error } = await supabase
        .from('agent_versions')
        .update({ status: 'published' })
        .in('id', ids)
        .eq('status', 'draft')

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, approved: ids.length })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing draft id' },
        { status: 400 }
      )
    }

    const update = draft
      ? {
          what_changed: draft.what_changed?.trim(),
          change_type: draft.change_type ?? deriveChangeType(0, draft.what_changed?.trim() || ''),
          importance_score: draft.importance_score ?? deriveImportanceScore(0, draft.what_changed?.trim() || ''),
          extraction_confidence: clampConfidence(draft.extraction_confidence),
          editor_note: draft.editor_note?.trim() || null,
          version_number: draft.version_number?.trim(),
          release_date: draft.release_date,
          capabilities: draft.capabilities || {},
          context_window: draft.context_window,
          pricing_info: draft.pricing_info?.trim() || null,
          source_url: draft.source_url?.trim() || null,
          status: 'published',
        }
      : { status: 'published' }

    // Approve the version
    const { error } = await supabase
      .from('agent_versions')
      .update(update)
      .eq('id', id)
      .eq('status', 'draft')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (draft) {
      await supabase
        .from('version_editor_audits')
        .insert({
          version_id: id,
          action: 'approve_with_edits',
          edited_by: 'admin',
          changes: update,
        })
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
