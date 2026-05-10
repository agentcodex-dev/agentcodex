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

ONBOARDING_AGENTS = [
    {
        'name': 'Claude Code',
        'slug': 'claude-code',
        'provider': 'Anthropic',
        'category': ['Coding'],
        'description': (
            'Anthropic Claude Code is an AI coding agent focused on '
            'terminal-native and repository-aware software tasks.'
        ),
        'website_url': 'https://code.claude.com',
        'is_verified': True,
    },
    {
        'name': 'OpenAI Codex',
        'slug': 'codex',
        'provider': 'OpenAI',
        'category': ['Coding'],
        'description': (
            'OpenAI Codex is an AI coding agent for code generation, '
            'editing, and development workflows across repositories.'
        ),
        'website_url': 'https://openai.com/codex',
        'is_verified': True,
    },
    {
        'name': 'Aider',
        'slug': 'aider',
        'provider': 'Aider-AI',
        'category': ['Coding'],
        'description': (
            'Aider is an open-source terminal coding assistant designed for '
            'Git-based workflows and multi-file code edits.'
        ),
        'website_url': 'https://aider.chat',
        'is_verified': True,
    },
    {
        'name': 'Roo Code',
        'slug': 'roo-code',
        'provider': 'Roo Code',
        'category': ['Coding'],
        'description': (
            'Roo Code is a VS Code-focused autonomous coding agent with '
            'open ecosystem model support.'
        ),
        'website_url': 'https://github.com/RooVetGit/Roo-Code',
        'is_verified': True,
    },
    {
        'name': 'Continue',
        'slug': 'continue',
        'provider': 'Continue',
        'category': ['Coding'],
        'description': (
            'Continue is an open-source AI coding assistant platform '
            'for IDE-native and private model development workflows.'
        ),
        'website_url': 'https://www.continue.dev',
        'is_verified': True,
    },
]


def get_agent(slug: str):
    result = supabase.table('agents')\
        .select('id, name, slug')\
        .eq('slug', slug)\
        .execute()
    rows = result.data or []
    return rows[0] if rows else None


def list_agent_slugs(limit: int = 100):
    result = supabase.table('agents')\
        .select('slug')\
        .order('slug', desc=False)\
        .limit(limit)\
        .execute()
    return [row['slug'] for row in (result.data or [])]


def seed_onboarding_agents():
    created = 0
    existing = 0

    for agent in ONBOARDING_AGENTS:
        found = get_agent(agent['slug'])
        if found:
            existing += 1
            print(f"Exists: {agent['slug']}")
            continue

        result = supabase.table('agents').insert(agent).execute()
        if result.data:
            created += 1
            print(f"Created: {agent['slug']}")
        else:
            print(f"Failed: {agent['slug']}")

    print(f"Done. Created {created}, already existed {existing}.")


def create_test_draft(agent_slug: str):
    agent = get_agent(agent_slug)
    if not agent:
        available = list_agent_slugs()
        preview = ', '.join(available[:20]) if available else '(none found)'
        raise RuntimeError(
            f"Agent not found: {agent_slug}. "
            f"Available slugs include: {preview}"
        )

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
        'importance_score': 5,
        'change_type': 'minor',
        'extraction_confidence': 0.75,
        'editor_note': 'Synthetic draft for admin QA',
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
        available = list_agent_slugs()
        preview = ', '.join(available[:20]) if available else '(none found)'
        raise RuntimeError(
            f"Agent not found: {slug}. "
            f"Available slugs include: {preview}"
        )

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
            'seed-onboarding-agents',
            'create-test-draft',
            'delete-test-drafts',
            'detect-misclassified',
            'reassign-misclassified',
        ],
    )
    parser.add_argument('--agent-slug', default='claude')
    args = parser.parse_args()

    if args.command == 'seed-onboarding-agents':
        seed_onboarding_agents()
    elif args.command == 'create-test-draft':
        create_test_draft(args.agent_slug)
    elif args.command == 'delete-test-drafts':
        delete_test_drafts()
    elif args.command == 'detect-misclassified':
        detect_misclassified_versions()
    elif args.command == 'reassign-misclassified':
        reassign_misclassified_versions()


if __name__ == '__main__':
    main()
