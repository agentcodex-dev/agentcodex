import hashlib
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

def generate_hash(article: dict) -> str:
    """
    Generate content hash from article
    Uses first 500 chars of content + title
    URL independent
    """
    content = (
        article.get('title', '').strip().lower() +
        article.get('content', '')[:500].strip().lower()
    )
    return hashlib.sha256(content.encode()).hexdigest()


def is_seen(article: dict) -> bool:
    """
    Check if article was processed before
    Returns True if already seen
    """
    content_hash = generate_hash(article)

    try:
        result = supabase.table('pipeline_seen_articles')\
            .select('id, run_count')\
            .eq('content_hash', content_hash)\
            .execute()

        if result.data:
            # Update run count for analytics
            supabase.table('pipeline_seen_articles')\
                .update({'run_count': result.data[0]['run_count'] + 1})\
                .eq('content_hash', content_hash)\
                .execute()
            return True

        return False

    except Exception as e:
        print(f"  ⚠️  Dedup check error: {e}")
        # If check fails, process the article anyway
        return False


def mark_seen(article: dict) -> None:
    """
    Mark article as seen in database
    Call this after processing an article
    """
    content_hash = generate_hash(article)

    try:
        supabase.table('pipeline_seen_articles')\
            .upsert({
                'content_hash': content_hash,
                'source_name': article.get('source_name', ''),
                'article_url': article.get('url', ''),
                'article_title': article.get('title', ''),
            })\
            .execute()

    except Exception as e:
        print(f"  ⚠️  Mark seen error: {e}")


def cleanup_old_entries(days: int = 90) -> int:
    """
    Remove entries older than X days
    Keeps table from growing forever
    Call this weekly
    """
    try:
        result = supabase.rpc(
            'cleanup_pipeline_seen',
            {'days_old': days}
        ).execute()
        return result.data or 0
    except Exception as e:
        print(f"  ⚠️  Cleanup error: {e}")
        return 0


def get_stats() -> dict:
    """
    Get deduplication statistics
    Useful for monitoring pipeline efficiency
    """
    try:
        result = supabase.table('pipeline_seen_articles')\
            .select('source_name, run_count')\
            .execute()

        total = len(result.data)
        sources = {}
        for row in result.data:
            src = row['source_name']
            sources[src] = sources.get(src, 0) + 1

        return {
            'total_seen': total,
            'by_source': sources
        }
    except Exception as e:
        return {'error': str(e)}