-- Intelligence/editorial columns for AgentCodex v2.2
alter table agent_versions
  add column if not exists importance_score integer
    check (importance_score is null or (importance_score >= 1 and importance_score <= 10)),
  add column if not exists change_type text
    check (change_type is null or change_type in ('major', 'minor', 'patch', 'noise')),
  add column if not exists extraction_confidence numeric(4,3)
    check (extraction_confidence is null or (extraction_confidence >= 0 and extraction_confidence <= 1)),
  add column if not exists editor_note text;

create index if not exists agent_versions_change_type_idx on agent_versions(change_type);
create index if not exists agent_versions_importance_idx on agent_versions(importance_score desc);

-- Audit trail for manual editorial changes in admin workflow
create table if not exists version_editor_audits (
  id uuid default gen_random_uuid() primary key,
  version_id uuid references agent_versions(id) on delete cascade,
  action text not null check (action in ('save', 'approve_with_edits')),
  edited_by text not null default 'admin',
  changes jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table version_editor_audits enable row level security;

create index if not exists version_editor_audits_version_id_idx
  on version_editor_audits(version_id, created_at desc);
