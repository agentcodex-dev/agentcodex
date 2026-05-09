import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

DAILY_LIMIT = 1.00  # $1 per day max
MAX_ARTICLES_PER_DAY = int(os.getenv('PIPELINE_MAX_ARTICLES_PER_DAY', '100'))
MAX_SONNET_CALLS_PER_DAY = int(os.getenv('PIPELINE_MAX_SONNET_CALLS_PER_DAY', '50'))

def check_cost_safe() -> bool:
    """
    Basic guard - just counts
    articles processed today
    as proxy for cost
    """
    from supabase import create_client
    
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    
    today_iso = datetime.now(timezone.utc).date().isoformat()

    try:
        runs = supabase.table('pipeline_runs')\
            .select('sonnet_checked')\
            .gte('started_at', today_iso)\
            .execute()

        sonnet_calls_today = sum(row.get('sonnet_checked', 0) for row in runs.data)
        if sonnet_calls_today >= MAX_SONNET_CALLS_PER_DAY:
            print(f"⚠️  Already made {sonnet_calls_today} Sonnet calls today")
            print("   Stopping to prevent excess cost")
            return False
    except Exception:
        # Migration may not be deployed yet; fall back to article-count guard.
        pass

    result = supabase.table('pipeline_seen_articles')\
        .select('id')\
        .gte('first_seen_at', today_iso)\
        .execute()

    articles_today = len(result.data)

    if articles_today >= MAX_ARTICLES_PER_DAY:
        print(f"⚠️  Already processed {articles_today} articles today")
        print("   Stopping to prevent excess cost")
        return False
    
    return True
