-- Add pipeline tracking columns to agent_versions
alter table agent_versions
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'rejected')),
  add column if not exists pipeline_run_date timestamp with time zone,
  add column if not exists pipeline_source text;

-- Index so admin dashboard draft queries stay fast
create index if not exists agent_versions_status_idx on agent_versions(status);

-- ─────────────────────────────────────
-- Pipeline deduplication table
-- ─────────────────────────────────────

create table if not exists pipeline_seen_articles (
  id             uuid default gen_random_uuid() primary key,
  content_hash   text not null unique,
  source_name    text not null,
  article_url    text,
  article_title  text,
  run_count      integer not null default 1,
  first_seen_at  timestamp with time zone not null
                   default timezone('utc'::text, now())
);

-- No public access — only the service role (pipeline) reads/writes this table
alter table pipeline_seen_articles enable row level security;

-- Index for the daily cost-guard query (gte first_seen_at = today)
create index if not exists pipeline_seen_articles_first_seen_idx
  on pipeline_seen_articles(first_seen_at desc);

-- ─────────────────────────────────────
-- Cleanup stored procedure
-- Called weekly via deduplicator.cleanup_old_entries()
-- ─────────────────────────────────────

create or replace function cleanup_pipeline_seen(days_old integer)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from pipeline_seen_articles
  where first_seen_at < now() - (days_old || ' days')::interval;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
