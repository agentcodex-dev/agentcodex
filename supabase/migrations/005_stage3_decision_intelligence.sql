alter table agent_versions
  add column if not exists impact_factors jsonb not null default '{}',
  add column if not exists quality_flags text[] not null default '{}';

create index if not exists agent_versions_quality_flags_idx
  on agent_versions using gin(quality_flags);
