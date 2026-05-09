# AgentCodex

AgentCodex is a public reference site for AI agents. It tracks agent profiles, version history, capability scores, source links, pricing/context details, and side-by-side comparisons.

The current v2 direction is **Agent Change Radar**: a homepage and `/radar` experience that highlights recent releases, capability movement, and the agents shipping fastest.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase
- Vercel Analytics
- Python ingestion pipeline with Anthropic extraction

## Main Features

- AI agent directory with search and category filters
- Agent profile pages with version history and current capabilities
- Side-by-side agent comparison pages
- Change Radar for latest releases, capability movers, and release velocity
- Password-gated admin dashboard for approving/rejecting pipeline drafts
- Daily GitHub Actions pipeline that scrapes sources and writes draft releases

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful routes:

- `/` - Radar-led homepage
- `/radar` - full Agent Change Radar
- `/agents` - all tracked agents
- `/agents/[slug]` - agent profile and version history
- `/compare` - dropdown comparison flow
- `/compare/[agent-a]-vs-[agent-b]` - SEO comparison page
- `/admin` - admin login
- `/admin/dashboard` - draft review dashboard

## Environment Variables

Create `.env.local` for the web app:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
ADMIN_PASSWORD=
```

Pipeline runs also need:

```bash
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

## Supabase

Database migrations live in `supabase/migrations`.

Core tables:

- `agents`
- `agent_versions`
- `news_sources`
- `pipeline_seen_articles`
- `pipeline_runs`
- `pipeline_article_events`

Public pages only show `agent_versions` where `status = 'published'`. The pipeline writes new extracted updates as `draft`; the admin dashboard moves them to `published` or `rejected`.

## Pipeline

The Python pipeline lives in `pipeline/`.

Install pipeline dependencies:

```bash
cd pipeline
pip install -r requirements.txt
```

Run locally:

```bash
python3 main.py
```

The production pipeline runs daily through `.github/workflows/pipeline.yml`.

Pipeline flow:

1. Scrape RSS/Jina sources from `pipeline/sources.py`
2. Skip already-seen normalized URLs before expensive article fetches
3. Deduplicate fetched content by content hash
4. Filter likely release/version updates
5. Use Anthropic extraction to produce structured version data
6. Validate extracted agent slug, date, version, summary, scores, and context window
7. Save new findings as Supabase drafts
8. Record run counters and article-level events for debugging

Pipeline tuning variables:

```bash
PIPELINE_JINA_INTERVAL_SECONDS=0.5
PIPELINE_HAIKU_INTERVAL_SECONDS=0.5
PIPELINE_SONNET_INTERVAL_SECONDS=6
PIPELINE_MAX_ARTICLES_PER_DAY=100
PIPELINE_MAX_SONNET_CALLS_PER_DAY=50
```

## Verification

Before pushing:

```bash
npm run lint
npm run build
```

Current note: `dev` and `build` explicitly use webpack because this workspace can fall back to unsupported WASM bindings when Next.js tries Turbopack without the native SWC optional package.

## Deployment

The app is designed for Vercel deployment with Supabase as the backing database. Ensure Vercel has the web app environment variables configured, and GitHub Actions has the pipeline secrets configured.
