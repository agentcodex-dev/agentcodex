import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type DraftPatch = {
  id?: string
  password?: string
  version_number?: string
  release_date?: string
  what_changed?: string
  capabilities?: Record<string, number>
  context_window?: number | null
  pricing_info?: string | null
  source_url?: string | null
}

function buildUpdate(payload: DraftPatch) {
  return {
    version_number: payload.version_number?.trim(),
    release_date: payload.release_date,
    what_changed: payload.what_changed?.trim(),
    capabilities: payload.capabilities || {},
    context_window: payload.context_window,
    pricing_info: payload.pricing_info?.trim() || null,
    source_url: payload.source_url?.trim() || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as DraftPatch

    if (payload.password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!payload.id) {
      return NextResponse.json(
        { error: 'Missing draft id' },
        { status: 400 }
      )
    }

    const update = buildUpdate(payload)

    if (!update.version_number || !update.release_date || !update.what_changed) {
      return NextResponse.json(
        { error: 'Version, release date and change summary are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('agent_versions')
      .update(update)
      .eq('id', payload.id)
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
