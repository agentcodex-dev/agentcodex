import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const password = request.nextUrl.searchParams.get('password')
    const days = Number(request.nextUrl.searchParams.get('days') || '30')

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: runs }, { data: drafts }] = await Promise.all([
      supabase
        .from('pipeline_runs')
        .select('*')
        .gte('started_at', since)
        .order('started_at', { ascending: false }),
      supabase
        .from('agent_versions')
        .select('status, created_at, pipeline_run_date')
        .gte('created_at', since),
    ])

    const safeRuns = runs || []
    const totals = safeRuns.reduce((acc, run) => {
      acc.articles += Number(run.articles_scraped || 0)
      acc.extracted += Number(run.extracted || 0)
      acc.saved += Number(run.saved || 0)
      acc.urlDup += Number(run.url_duplicates || 0)
      acc.contentDup += Number(run.content_duplicates || 0)
      return acc
    }, { articles: 0, extracted: 0, saved: 0, urlDup: 0, contentDup: 0 })

    const draftsData = drafts || []
    const statusCounts = draftsData.reduce((acc, row) => {
      const status = String(row.status || 'unknown')
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      metrics: {
        runs: safeRuns.length,
        articlesScraped: totals.articles,
        extracted: totals.extracted,
        saved: totals.saved,
        extractionPassRate: totals.articles ? Number((totals.extracted / totals.articles).toFixed(3)) : 0,
        dedupeSkipRatio: totals.articles ? Number(((totals.urlDup + totals.contentDup) / totals.articles).toFixed(3)) : 0,
        statusCounts,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
