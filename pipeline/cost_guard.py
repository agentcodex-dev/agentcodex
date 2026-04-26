import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

DAILY_LIMIT = 1.00  # $1 per day max

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

    result = supabase.table('pipeline_seen_articles')\
        .select('id')\
        .gte('first_seen_at', today_iso)\
        .execute()
    
    articles_today = len(result.data)
    
    if articles_today > 100:
        print(f"⚠️  Already processed {articles_today} articles today")
        print(f"   Stopping to prevent excess cost")
        return False
    
    return True