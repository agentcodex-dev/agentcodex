import hashlib
import os
from datetime import datetime, timezone
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)


TRACKING_PARAMS = {
    'fbclid',
    'gclid',
    'mc_cid',
    'mc_eid',
}


def normalize_url(url: str) -> str:
    """Normalize URLs so tracking params and fragments do not defeat dedupe."""
    if not url:
        return ''

    parsed = urlparse(url.strip())
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith('utm_') and key.lower() not in TRACKING_PARAMS
    ]
    normalized_path = parsed.path.rstrip('/') or '/'

    return urlunparse((
        parsed.scheme.lower(),
        parsed.netloc.lower(),
        normalized_path,
        '',
        urlencode(query, doseq=True),
        '',
    ))


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


def is_url_seen(url: str) -> bool:
    """Check URL-level dedupe before fetching full article content."""
    normalized_url = normalize_url(url)
    if not normalized_url:
        return False

    try:
        result = supabase.table('pipeline_seen_articles')\
            .select('id, run_count')\
            .eq('normalized_url', normalized_url)\
            .execute()

        if result.data:
            now_iso = datetime.now(timezone.utc).isoformat()
            supabase.table('pipeline_seen_articles')\
                .update({
                    'run_count': result.data[0]['run_count'] + 1,
                    'last_seen_at': now_iso,
                })\
                .eq('id', result.data[0]['id'])\
                .execute()
            return True

        return False

    except Exception as e:
        print(f"  ⚠️  URL dedup check error: {e}")
        return False


def is_content_seen(article: dict) -> bool:
    """
    Check if article content was processed before.
    Returns True if already seen
    """
    content_hash = generate_hash(article)

    try:
        result = supabase.table('pipeline_seen_articles')\
            .select('id, run_count')\
            .eq('content_hash', content_hash)\
            .execute()

        if result.data:
            now_iso = datetime.now(timezone.utc).isoformat()
            # Update run count for analytics
            supabase.table('pipeline_seen_articles')\
                .update({
                    'run_count': result.data[0]['run_count'] + 1,
                    'last_seen_at': now_iso,
                })\
                .eq('id', result.data[0]['id'])\
                .execute()
            return True

        return False

    except Exception as e:
        print(f"  ⚠️  Dedup check error: {e}")
        # If check fails, process the article anyway
        return False


def is_seen(article: dict) -> bool:
    """Backward-compatible dedupe check by URL first, then content hash."""
    return is_url_seen(article.get('url', '')) or is_content_seen(article)


def mark_seen(article: dict) -> None:
    """
    Mark article as seen in database
    Call this after processing an article
    """
    content_hash = generate_hash(article)
    normalized_url = normalize_url(article.get('url', ''))
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        supabase.table('pipeline_seen_articles')\
            .upsert({
                'content_hash': content_hash,
                'normalized_url': normalized_url or None,
                'source_name': article.get('source_name', ''),
                'article_url': article.get('url', ''),
                'article_title': article.get('title', ''),
                'last_seen_at': now_iso,
            }, on_conflict='content_hash')\
            .execute()

    except Exception as e:
        try:
            supabase.table('pipeline_seen_articles')\
                .upsert({
                    'content_hash': content_hash,
                    'source_name': article.get('source_name', ''),
                    'article_url': article.get('url', ''),
                    'article_title': article.get('title', ''),
                }, on_conflict='content_hash')\
                .execute()
        except Exception:
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
