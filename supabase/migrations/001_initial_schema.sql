-- Agents table
create table agents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  provider text not null,
  category text[] not null default '{}',
  description text,
  website_url text,
  logo_url text,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Agent versions table
create table agent_versions (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade,
  version_number text not null,
  release_date date not null,
  what_changed text,
  capabilities jsonb default '{}',
  context_window integer,
  pricing_info text,
  source_url text,
  is_auto_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- News sources table
create table news_sources (
  id uuid default gen_random_uuid() primary key,
  source_name text not null,
  url text not null,
  type text check (type in ('blog', 'rss', 'twitter')),
  last_crawled_at timestamp with time zone,
  is_active boolean default true
);

-- Enable Row Level Security
alter table agents enable row level security;
alter table agent_versions enable row level security;
alter table news_sources enable row level security;

-- Allow public read access
create policy "Public can read agents"
  on agents for select
  using (true);

create policy "Public can read agent_versions"
  on agent_versions for select
  using (true);

-- Indexes for performance
create index agents_slug_idx on agents(slug);
create index agent_versions_agent_id_idx on agent_versions(agent_id);
create index agent_versions_release_date_idx on agent_versions(release_date desc);
