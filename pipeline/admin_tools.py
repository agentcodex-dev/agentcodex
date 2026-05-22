import argparse
import os
import subprocess
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
from scoring import apply_scoring_mode

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

TEST_TAG = '[TEST-DRAFT]'
REQUIRED_CAPABILITIES = ('coding', 'reasoning', 'multimodal', 'tool_use', 'memory', 'speed')

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
    {
        'name': 'Google Antigravity',
        'slug': 'antigravity',
        'provider': 'Google',
        'category': ['Coding'],
        'description': (
            'Google Antigravity is an agent-first development platform for '
            'building, orchestrating, and running autonomous software agents.'
        ),
        'website_url': 'https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/',
        'is_verified': True,
    },
    {
        'name': 'OpenHands',
        'slug': 'openhands',
        'provider': 'OpenHands',
        'category': ['Coding', 'Open Source'],
        'description': (
            'OpenHands is an open-source AI-driven software development agent '
            'with active release cadence and self-hosted deployment support.'
        ),
        'website_url': 'https://openhands.dev',
        'is_verified': True,
    },
    {
        'name': 'DeepSeek',
        'slug': 'deepseek',
        'provider': 'DeepSeek',
        'category': ['Coding', 'Research'],
        'description': (
            'DeepSeek provides frontier reasoning and coding models with '
            'public release updates and developer-facing API changelogs.'
        ),
        'website_url': 'https://api-docs.deepseek.com/updates/',
        'is_verified': True,
    },
    {
        'name': 'Qwen',
        'slug': 'qwen',
        'provider': 'Alibaba Cloud',
        'category': ['Coding', 'Research', 'Open Source'],
        'description': (
            'Qwen is Alibaba Cloud’s open and commercial model ecosystem, '
            'including coding- and agent-oriented releases across the Qwen stack.'
        ),
        'website_url': 'https://qwenlm.github.io/blog/',
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


def seed_onboarding_agents(
    run_backfill: bool = True,
    backfill_days: int = 90,
    max_links: int = 8,
    max_versions_per_article: int = 12,
):
    created = 0
    existing = 0
    created_slugs = []

    for agent in ONBOARDING_AGENTS:
        found = get_agent(agent['slug'])
        if found:
            existing += 1
            print(f"Exists: {agent['slug']}")
            continue

        result = supabase.table('agents').insert(agent).execute()
        if result.data:
            created += 1
            created_slugs.append(agent['slug'])
            print(f"Created: {agent['slug']}")
        else:
            print(f"Failed: {agent['slug']}")

    print(f"Done. Created {created}, already existed {existing}.")
    if not run_backfill:
        return
    if not created_slugs:
        print("No newly created agents for backfill.")
        return

    command = [
        sys.executable,
        'pipeline/main.py',
        '--backfill',
        '--agents',
        ','.join(created_slugs),
        '--backfill-days',
        str(max(1, backfill_days)),
        '--max-links',
        str(max(1, max_links)),
        '--max-versions-per-article',
        str(max(1, max_versions_per_article)),
        '--scoring-mode',
        'calibrated',
    ]
    print("\nRunning seeded backfill")
    print("──────────────────────")
    print("Command:", ' '.join(command))
    subprocess.run(command, check=True)


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


def _normalize_capabilities(capabilities: object) -> dict:
    if not isinstance(capabilities, dict):
        return {}

    clean = {}
    for key, value in capabilities.items():
        if key not in REQUIRED_CAPABILITIES:
            continue
        if not isinstance(value, (int, float)):
            continue
        clean[key] = int(value)
    return clean


def _sanitize_only_scores(raw_caps: dict) -> tuple[dict, list[dict]]:
    adjusted = dict(raw_caps)
    adjustments = []
    for capability, value in raw_caps.items():
        fixed = value
        if value < 1:
            fixed = 1
        elif value > 10:
            fixed = 10
        if fixed != value:
            adjusted[capability] = fixed
            adjustments.append({
                'capability': capability,
                'from': value,
                'to': fixed,
                'reason': 'out_of_range_clamped',
            })
    return adjusted, adjustments


def backfill_capabilities(scoring_mode: str, apply_changes: bool, status: str, strategy: str):
    rows = []
    has_confidence = True
    has_impact = True
    try:
        rows = supabase.table('agent_versions')\
            .select('id, capabilities, what_changed, extraction_confidence, impact_factors, status')\
            .eq('status', status)\
            .order('release_date', desc=True)\
            .execute().data or []
    except Exception:
        has_confidence = False
        has_impact = False
        rows = supabase.table('agent_versions')\
            .select('id, capabilities, what_changed, status')\
            .eq('status', status)\
            .order('release_date', desc=True)\
            .execute().data or []

    scanned = 0
    changed = 0
    skipped = 0

    for row in rows:
        scanned += 1
        row_id = row.get('id')
        raw_caps = _normalize_capabilities(row.get('capabilities'))
        if not raw_caps:
            skipped += 1
            continue

        confidence = row.get('extraction_confidence') if has_confidence else None
        if not isinstance(confidence, (int, float)):
            confidence = 0.7

        if strategy == 'sanitize':
            adjusted, adjustments = _sanitize_only_scores(raw_caps)
            score_meta = {
                'mode': 'sanitize',
                'llm_suggested_scores': raw_caps,
                'calibrated_scores': adjusted,
                'score_adjustments': adjustments,
            }
        else:
            adjusted, score_meta = apply_scoring_mode(
                raw_caps,
                what_changed=str(row.get('what_changed') or ''),
                extraction_confidence=float(confidence),
                scoring_mode=scoring_mode,
            )

        if adjusted == raw_caps:
            continue

        changed += 1

        if not apply_changes:
            print(f"DRY-RUN change {row_id}: {raw_caps} -> {adjusted}")
            continue

        update_payload = {
            'capabilities': adjusted,
        }
        if has_impact:
            impact = row.get('impact_factors')
            if not isinstance(impact, dict):
                impact = {}
            impact.update({
                'scoringMode': score_meta['mode'],
                'llmSuggestedScores': score_meta['llm_suggested_scores'],
                'calibratedScores': score_meta['calibrated_scores'],
                'scoreAdjustments': score_meta['score_adjustments'],
            })
            update_payload['impact_factors'] = impact

        supabase.table('agent_versions')\
            .update(update_payload)\
            .eq('id', row_id)\
            .execute()
        print(f"UPDATED {row_id}")

    mode_text = 'APPLY' if apply_changes else 'DRY-RUN'
    print(
        f"{mode_text} complete. scanned={scanned} changed={changed} skipped={skipped} "
        f"status={status} scoring_mode={scoring_mode} strategy={strategy}"
    )


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
            'backfill-capabilities',
        ],
    )
    parser.add_argument('--agent-slug', default='claude')
    parser.add_argument('--status', default='published', choices=['published', 'draft', 'rejected'])
    parser.add_argument('--scoring-mode', default='calibrated', choices=['legacy', 'calibrated'])
    parser.add_argument('--strategy', default='sanitize', choices=['sanitize', 'calibrated'])
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--no-backfill', action='store_true')
    parser.add_argument('--backfill-days', type=int, default=90)
    parser.add_argument('--max-links', type=int, default=8)
    parser.add_argument('--max-versions-per-article', type=int, default=12)
    args = parser.parse_args()

    if args.command == 'seed-onboarding-agents':
        seed_onboarding_agents(
            run_backfill=not args.no_backfill,
            backfill_days=max(1, args.backfill_days),
            max_links=max(1, args.max_links),
            max_versions_per_article=max(1, args.max_versions_per_article),
        )
    elif args.command == 'create-test-draft':
        create_test_draft(args.agent_slug)
    elif args.command == 'delete-test-drafts':
        delete_test_drafts()
    elif args.command == 'detect-misclassified':
        detect_misclassified_versions()
    elif args.command == 'reassign-misclassified':
        reassign_misclassified_versions()
    elif args.command == 'backfill-capabilities':
        backfill_capabilities(
            scoring_mode=args.scoring_mode,
            apply_changes=args.apply,
            status=args.status,
            strategy=args.strategy,
        )


if __name__ == '__main__':
    main()
