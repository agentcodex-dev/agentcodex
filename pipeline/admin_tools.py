import argparse
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

TEST_TAG = '[TEST-DRAFT]'


def get_agent(slug: str):
    result = supabase.table('agents')\
        .select('id, name, slug')\
        .eq('slug', slug)\
        .single()\
        .execute()
    return result.data


def create_test_draft(agent_slug: str):
    agent = get_agent(agent_slug)
    if not agent:
        raise RuntimeError(f'Agent not found: {agent_slug}')

    now = datetime.now(timezone.utc)
    version_number = f"TEST-DRAFT:{now.strftime('%Y%m%d-%H%M%S')}"
    release_date = now.date().isoformat()

    payload = {
        'agent_id': agent['id'],
        'version_number': version_number,
        'release_date': release_date,
        'what_changed': (
            f"{TEST_TAG} Admin workflow validation draft. "
            "Used to verify inline editing, save, single approve, and batch approve behavior."
        ),
        'capabilities': {
            'coding': 8,
            'reasoning': 7,
            'multimodal': 6,
            'tool_use': 8,
            'memory': 6,
            'speed': 7,
        },
        'context_window': 200000,
        'pricing_info': 'Test draft only',
        'source_url': 'https://example.com/test-draft',
        'is_auto_generated': True,
        'status': 'draft',
        'pipeline_source': 'admin-tools:test-draft',
        'pipeline_run_date': now.isoformat(),
    }

    result = supabase.table('agent_versions').insert(payload).execute()
    if not result.data:
        raise RuntimeError('Insert failed')

    row = result.data[0]
    print(f"Created test draft {row['id']} for {agent['name']} ({agent['slug']})")


def delete_test_drafts():
    existing = supabase.table('agent_versions')\
        .select('id, version_number, what_changed, status')\
        .eq('status', 'draft')\
        .execute()

    rows = [
        row for row in (existing.data or [])
        if str(row.get('version_number', '')).startswith('TEST-DRAFT:')
        or TEST_TAG in str(row.get('what_changed', ''))
    ]
    if not rows:
        print('No test drafts found')
        return

    ids = [row['id'] for row in rows]
    supabase.table('agent_versions')\
        .delete()\
        .in_('id', ids)\
        .execute()
    print(f'Deleted {len(ids)} test draft(s)')


def fetch_versions_for_agent_slug(slug: str):
    agent = get_agent(slug)
    if not agent:
        raise RuntimeError(f'Agent not found: {slug}')

    versions = supabase.table('agent_versions')\
        .select('id, version_number, what_changed, source_url, status, release_date')\
        .eq('agent_id', agent['id'])\
        .order('release_date', desc=True)\
        .execute()

    return agent, versions.data or []


def detect_misclassified_versions():
    checks = [
        {
            'from_slug': 'claude',
            'to_slug': 'claude-code',
            'keywords': ['claude code', 'code cli', 'code app', 'code.claude.com'],
        },
        {
            'from_slug': 'chatgpt',
            'to_slug': 'codex',
            'keywords': ['codex', 'gpt-5-codex', 'codex cli', 'codex app'],
        },
    ]

    findings = []
    for check in checks:
        _, versions = fetch_versions_for_agent_slug(check['from_slug'])
        for version in versions:
            haystack = ' '.join([
                str(version.get('version_number', '')).lower(),
                str(version.get('what_changed', '')).lower(),
                str(version.get('source_url', '')).lower(),
            ])
            if any(keyword in haystack for keyword in check['keywords']):
                findings.append({
                    **version,
                    'from_slug': check['from_slug'],
                    'to_slug': check['to_slug'],
                })

    if not findings:
        print('No likely misclassified versions found')
        return findings

    print(f'Found {len(findings)} likely misclassified version(s):')
    for row in findings:
        print(
            f"- {row['id']} | {row['from_slug']} -> {row['to_slug']} | "
            f"{row['version_number']} | {row['status']} | {row['release_date']}"
        )
    return findings


def reassign_misclassified_versions():
    findings = detect_misclassified_versions()
    if not findings:
        return

    target_agent_cache = {}
    for row in findings:
        to_slug = row['to_slug']
        if to_slug not in target_agent_cache:
            target_agent_cache[to_slug] = get_agent(to_slug)
        target = target_agent_cache[to_slug]

        if not target:
            print(f"Skip {row['id']}: target agent missing ({to_slug})")
            continue

        supabase.table('agent_versions')\
            .update({'agent_id': target['id']})\
            .eq('id', row['id'])\
            .execute()
        print(f"Moved {row['id']} to {to_slug}")


def main():
    parser = argparse.ArgumentParser(description='Admin utilities for pipeline and drafts')
    parser.add_argument(
        'command',
        choices=[
            'create-test-draft',
            'delete-test-drafts',
            'detect-misclassified',
            'reassign-misclassified',
        ],
    )
    parser.add_argument('--agent-slug', default='claude')
    args = parser.parse_args()

    if args.command == 'create-test-draft':
        create_test_draft(args.agent_slug)
    elif args.command == 'delete-test-drafts':
        delete_test_drafts()
    elif args.command == 'detect-misclassified':
        detect_misclassified_versions()
    elif args.command == 'reassign-misclassified':
        reassign_misclassified_versions()


if __name__ == '__main__':
    main()
