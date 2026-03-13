import os
from datetime import datetime, timezone
from typing import Optional
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

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


def save_draft(extraction: dict) -> bool:
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

        # Clean capabilities
        # Remove null values
        capabilities = extraction.get('capabilities', {})
        capabilities = {
            k: v for k, v in capabilities.items()
            if v is not None
        }

        # Parse release date
        release_date = extraction.get('release_date')
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


def save_all_drafts(extractions: list) -> dict:
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
        success = save_draft(extraction)
        if success:
            results['saved'] += 1
        elif version_exists(
            extraction.get('agent_slug', ''),
            extraction.get('version_number', '')
        ):
            results['skipped'] += 1
        else:
            results['failed'] += 1

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