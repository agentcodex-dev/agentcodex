-- Pipeline run and article-level observability

alter table pipeline_seen_articles
  add column if not exists normalized_url text,
  add column if not exists last_seen_at timestamp with time zone;

create unique index if not exists pipeline_seen_articles_normalized_url_idx
  on pipeline_seen_articles(normalized_url)
  where normalized_url is not null;

create table if not exists pipeline_runs (
  id uuid default gen_random_uuid() primary key,
  started_at timestamp with time zone not null
    default timezone('utc'::text, now()),
  finished_at timestamp with time zone,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'skipped')),
  articles_scraped integer not null default 0,
  keyword_matched integer not null default 0,
  url_duplicates integer not null default 0,
  content_duplicates integer not null default 0,
  haiku_checked integer not null default 0,
  haiku_rejected integer not null default 0,
  sonnet_checked integer not null default 0,
  extracted integer not null default 0,
  saved integer not null default 0,
  skipped integer not null default 0,
  failed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'
);

alter table pipeline_runs enable row level security;

create index if not exists pipeline_runs_started_at_idx
  on pipeline_runs(started_at desc);

create table if not exists pipeline_article_events (
  id uuid default gen_random_uuid() primary key,
  run_id uuid references pipeline_runs(id) on delete cascade,
  source_name text not null,
  article_url text,
  normalized_url text,
  article_title text,
  stage text not null,
  event text not null,
  details jsonb not null default '{}',
  created_at timestamp with time zone not null
    default timezone('utc'::text, now())
);

alter table pipeline_article_events enable row level security;

create index if not exists pipeline_article_events_run_id_idx
  on pipeline_article_events(run_id);

create index if not exists pipeline_article_events_created_at_idx
  on pipeline_article_events(created_at desc);
