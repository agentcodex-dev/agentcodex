import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  }
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
          version_number: draft.version_number?.trim(),
          release_date: draft.release_date,
          what_changed: draft.what_changed?.trim(),
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

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
