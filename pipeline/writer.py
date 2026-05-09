import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

MAX_RELEASE_AGE_DAYS = 30


def _is_recent_enough(release_date_str: str, max_release_age_days: int) -> bool:
    """Return False if the release date is older than max_release_age_days."""
    try:
        release_date = datetime.strptime(release_date_str, '%Y-%m-%d').date()
        cutoff = (datetime.now(timezone.utc) - timedelta(days=max_release_age_days)).date()
        return release_date >= cutoff
    except Exception:
        return True  # Unparseable date — let it through


def version_exists(agent_slug: str, version_number: str) -> bool:
    """
    Check if this version already exists in database
    Prevents duplicate entries
    """
    try:
        agent = supabase.table('agents')\
            .select('id')\
            .eq('slug', agent_slug)\
            .single()\
            .execute()

        if not agent.data:
            print(f"  ⚠️  Agent not found: {agent_slug}")
            return False

        agent_id = agent.data['id']

        existing = supabase.table('agent_versions')\
            .select('id')\
            .eq('agent_id', agent_id)\
            .eq('version_number', version_number)\
            .execute()

        return len(existing.data) > 0

    except Exception as e:
        print(f"  ❌ Check error: {e}")
        return False


def save_draft(extraction: dict, max_release_age_days: int = MAX_RELEASE_AGE_DAYS) -> bool:
    """
    Save extracted version as draft to Supabase
    Returns True if saved successfully
    """
    try:
        agent_slug = extraction.get('agent_slug')
        version_number = extraction.get('version_number')

        # Get agent ID from slug
        agent = supabase.table('agents')\
            .select('id, name')\
            .eq('slug', agent_slug)\
            .single()\
            .execute()

        if not agent.data:
            print(f"  ❌ Agent not found: {agent_slug}")
            return False

        agent_id = agent.data['id']
        agent_name = agent.data['name']

        # Check for duplicates
        if version_exists(agent_slug, version_number):
            print(f"  ⏭️  Already exists: {agent_name} {version_number}")
            return False

        # Reject stale releases (old articles re-surfaced by the pipeline)
        release_date = extraction.get('release_date')
        if release_date and not _is_recent_enough(release_date, max_release_age_days):
            print(f"  ⏭️  Stale release skipped: {agent_name} {version_number} ({release_date})")
            return False

        # Clean capabilities
        # Remove null values
        capabilities = extraction.get('capabilities', {})
        capabilities = {
            k: v for k, v in capabilities.items()
            if v is not None
        }

        # Parse release date (recency already validated above)
        if not release_date:
            release_date = datetime.now(timezone.utc).date().isoformat()

        # Build the version record
        version_data = {
            'agent_id': agent_id,
            'version_number': version_number,
            'release_date': release_date,
            'what_changed': extraction.get('what_changed', ''),
            'capabilities': capabilities,
            'context_window': extraction.get('context_window'),
            'pricing_info': extraction.get('pricing_info'),
            'source_url': extraction.get('source_url') or extraction.get('pipeline_source'),
            'is_auto_generated': True,
            'status': 'draft',
            'pipeline_source': extraction.get('pipeline_source', ''),
            'pipeline_run_date': datetime.now(timezone.utc).isoformat(),
        }

        # Insert to Supabase
        result = supabase.table('agent_versions')\
            .insert(version_data)\
            .execute()

        if result.data:
            print(f"  ✅ Saved draft: {agent_name} {version_number}")
            return True
        else:
            print(f"  ❌ Save failed: {result}")
            return False

    except Exception as e:
        print(f"  ❌ Writer error: {e}")
        return False


def save_all_drafts(
    extractions: list,
    run_logger=None,
    max_release_age_days: int = MAX_RELEASE_AGE_DAYS,
    dry_run: bool = False,
) -> dict:
    """
    Save all extractions to Supabase
    Returns summary of results
    """
    results = {
        'saved': 0,
        'skipped': 0,
        'failed': 0,
    }

    print(f"\nSaving {len(extractions)} extractions to Supabase...\n")

    for extraction in extractions:
        if dry_run:
            print(
                "  🧪 DRY-RUN "
                f"{extraction.get('agent_slug')} {extraction.get('version_number')}"
            )
            results['saved'] += 1
            continue

        success = save_draft(extraction, max_release_age_days=max_release_age_days)
        if success:
            results['saved'] += 1
            if run_logger:
                run_logger.increment('saved')
        elif version_exists(
            extraction.get('agent_slug', ''),
            extraction.get('version_number', '')
        ):
            results['skipped'] += 1
            if run_logger:
                run_logger.increment('skipped')
        else:
            results['failed'] += 1
            if run_logger:
                run_logger.increment('failed')

    return results


if __name__ == "__main__":
    # Test with sample extraction
    test_extraction = {
        'found': True,
        'agent_slug': 'claude',
        'version_number': 'Test Version 99.0',
        'release_date': '2025-01-01',
        'what_changed': 'This is a test entry from the pipeline.',
        'capabilities': {
            'coding': 9,
            'reasoning': 10,
            'multimodal': 8,
            'tool_use': 9,
            'memory': 7,
            'speed': 8
        },
        'context_window': 200000,
        'pricing_info': 'Test pricing',
        'source_url': 'https://anthropic.com',
        'pipeline_source': 'test'
    }

    print("Testing writer with sample extraction...\n")
    success = save_draft(test_extraction)
    print(f"\nResult: {'✅ Saved' if success else '❌ Failed'}")
