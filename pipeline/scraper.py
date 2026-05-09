import re
import feedparser
import requests
import calendar
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
from sources import SOURCES
from deduplicator import is_url_seen
from rate_limiter import RateLimiter, env_interval

MAX_ARTICLE_AGE_DAYS = 30
JINA_LIMITER = RateLimiter(env_interval('PIPELINE_JINA_INTERVAL_SECONDS', 0.5))


# ─────────────────────────────────────
# RSS
# ─────────────────────────────────────

def fetch_rss(source: dict, run_logger=None) -> list[dict]:
    """Fetch recent articles from an RSS feed, skipping entries older than MAX_ARTICLE_AGE_DAYS."""
    articles = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_ARTICLE_AGE_DAYS)

    try:
        feed = feedparser.parse(source['url'])

        for entry in feed.entries[:10]:  # Check up to 10, filter by date
            # Parse published date if available
            published_parsed = entry.get('published_parsed') or entry.get('updated_parsed')
            if published_parsed:
                try:
                    published_dt = datetime.utcfromtimestamp(
                        calendar.timegm(published_parsed)
                    ).replace(tzinfo=timezone.utc)
                    if published_dt < cutoff:
                        continue  # Skip stale articles
                except Exception:
                    pass  # Unknown date format — include it

            article_url = entry.get('link', '')
            if is_url_seen(article_url):
                print(f"  ⏭️  URL already seen: {article_url[:70]}")
                if run_logger:
                    run_logger.increment('url_duplicates')
                    run_logger.event(
                        {
                            'source_name': source['name'],
                            'url': article_url,
                            'title': entry.get('title', ''),
                        },
                        'scrape',
                        'url_duplicate',
                    )
                continue

            articles.append({
                'source_name': source['name'],
                'agent_slugs': source['agent_slugs'],
                'title': entry.get('title', ''),
                'url': article_url,
                'content': entry.get('summary', '')[:5000],
                'published': entry.get('published', ''),
                'method': 'rss'
            })

            if len(articles) >= 5:
                break

    except Exception as e:
        print(f"❌  RSS error for {source['name']}: {e}")

    return articles


# ─────────────────────────────────────
# JINA HELPERS
# ─────────────────────────────────────

def _jina_get(url: str) -> str:
    """Fetch a URL via Jina Reader, return plaintext or empty string."""
    for attempt in range(2):
        try:
            JINA_LIMITER.wait()
            response = requests.get(
                f"https://r.jina.ai/{url}",
                timeout=45,
                headers={'Accept': 'text/plain'}
            )
            if response.status_code == 200:
                return response.text
            print(f"⚠️  Jina {response.status_code} for {url[:70]}")
        except Exception as e:
            if attempt == 0:
                print(f"⚠️  Retry for {url[:70]}...")
            else:
                print(f"❌  Jina failed for {url[:70]}: {str(e)[:50]}")
    return ''


def _extract_article_urls(listing_text: str, base_url: str, limit: int = 5) -> list[str]:
    """
    Parse markdown links from a Jina-rendered listing page.
    Returns individual article URLs that are one level deeper than base_url.
    """
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    base_path = parsed_base.path.rstrip('/')

    # Jina renders links as [title](url)
    raw_links = re.findall(r'\[[^\]]{5,120}\]\((https?://[^\)\s]{10,200})\)', listing_text)

    skip_terms = ('/tag/', '/category/', '/author/', '/page/', '/search', '/feed', '.xml', '.rss', '/cdn-cgi/')

    seen: set[str] = set()
    results: list[str] = []

    for url in raw_links:
        parsed = urlparse(url)

        # Must be the same domain
        if parsed.netloc != base_domain:
            continue

        # Must be deeper than the listing page (e.g. /news → /news/slug)
        if not parsed.path.startswith(base_path + '/'):
            continue

        # Skip navigation, tag, author pages
        if any(t in parsed.path.lower() for t in skip_terms):
            continue

        # Strip fragment/query for deduplication
        clean = parsed._replace(fragment='', query='').geturl()
        if clean in seen:
            continue

        seen.add(clean)
        results.append(clean)

        if len(results) >= limit:
            break

    return results


def _title_from_markdown(text: str) -> str:
    """Extract the first heading from Jina markdown output."""
    for line in text.split('\n')[:30]:
        stripped = line.strip()
        if stripped.startswith('# '):
            return stripped[2:].strip()
        if stripped.startswith('## '):
            return stripped[3:].strip()
    return ''


# ─────────────────────────────────────
# JINA
# ─────────────────────────────────────

def fetch_jina(source: dict, run_logger=None) -> list[dict]:
    """
    Fetch a news/changelog listing via Jina Reader.
    Extracts individual article URLs from the listing and fetches each one,
    so each release becomes its own article with stable content for deduplication.
    Falls back to the listing page if no article links are found (e.g. SPA changelogs).
    """
    articles = []
    listing_url = source['url']

    print(f"  Fetching listing: {listing_url[:70]}...")
    listing_text = _jina_get(listing_url)
    if not listing_text:
        return articles

    article_urls = _extract_article_urls(listing_text, listing_url, limit=5)

    if article_urls:
        print(f"  Found {len(article_urls)} article links — fetching individually")
        for url in article_urls:
            if is_url_seen(url):
                print(f"  ⏭️  URL already seen: {url[:70]}")
                if run_logger:
                    run_logger.increment('url_duplicates')
                    run_logger.event(
                        {
                            'source_name': source['name'],
                            'url': url,
                            'title': source['name'],
                        },
                        'scrape',
                        'url_duplicate',
                    )
                continue

            content = _jina_get(url)
            if not content:
                continue
            title = _title_from_markdown(content) or source['name']
            articles.append({
                'source_name': source['name'],
                'agent_slugs': source['agent_slugs'],
                'title': title,
                'url': url,
                'content': content[:5000],
                'published': datetime.now(timezone.utc).isoformat(),
                'method': 'jina'
            })
    else:
        # Fallback for single-page changelogs (e.g. cursor.com/changelog, v0.dev/changelog)
        if is_url_seen(listing_url):
            print(f"  ⏭️  Listing URL already seen: {listing_url[:70]}")
            if run_logger:
                run_logger.increment('url_duplicates')
                run_logger.event(
                    {
                        'source_name': source['name'],
                        'url': listing_url,
                        'title': f"{source['name']} - Latest Updates",
                    },
                    'scrape',
                    'url_duplicate',
                )
            return articles

        print(f"  No article links found — using listing page content")
        articles.append({
            'source_name': source['name'],
            'agent_slugs': source['agent_slugs'],
            'title': f"{source['name']} - Latest Updates",
            'url': listing_url,
            'content': listing_text[:5000],
            'published': datetime.now(timezone.utc).isoformat(),
            'method': 'jina'
        })

    return articles


# ─────────────────────────────────────
# SCRAPE ALL
# ─────────────────────────────────────

def scrape_all(run_logger=None) -> list[dict]:
    """Scrape all sources and return articles."""
    all_articles = []

    print(f"Starting scrape of {len(SOURCES)} sources...\n")

    for source in SOURCES:
        print(f"Fetching {source['name']} via {source['method']}...")

        if source['method'] == 'rss':
            articles = fetch_rss(source, run_logger=run_logger)
        else:
            articles = fetch_jina(source, run_logger=run_logger)

        print(f"  Got {len(articles)} articles")
        all_articles.extend(articles)

    print(f"\nTotal articles fetched: {len(all_articles)}")
    return all_articles


if __name__ == "__main__":
    articles = scrape_all()
    print("\nSample article:")
    if articles:
        a = articles[0]
        print(f"Source:  {a['source_name']}")
        print(f"Title:   {a['title']}")
        print(f"URL:     {a['url']}")
        print(f"Content: {a['content'][:200]}...")
