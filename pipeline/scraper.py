import re
import feedparser
import requests
import calendar
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Set
from urllib.parse import urlparse
from sources import SOURCES
from deduplicator import is_url_seen, is_content_seen
from rate_limiter import RateLimiter, env_interval

MAX_ARTICLE_AGE_DAYS = 30
JINA_LIMITER = RateLimiter(env_interval('PIPELINE_JINA_INTERVAL_SECONDS', 0.5))
SOURCE_MODES = {'rss', 'listing_links', 'listing_snapshot', 'hybrid'}


# ─────────────────────────────────────
# RSS
# ─────────────────────────────────────

def fetch_rss(
    source: dict,
    run_logger=None,
    max_links: int = 5,
    max_article_age_days: int = MAX_ARTICLE_AGE_DAYS,
    skip_url_dedupe: bool = False,
) -> list[dict]:
    """Fetch recent articles from an RSS feed, skipping entries older than MAX_ARTICLE_AGE_DAYS."""
    articles = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_article_age_days)

    try:
        feed = feedparser.parse(source['url'])

        for entry in feed.entries[:max(10, max_links)]:
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
            if not skip_url_dedupe and is_url_seen(article_url):
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

            if len(articles) >= max_links:
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


def _extract_article_urls(
    listing_text: str,
    base_url: str,
    limit: int = 5,
    allowed_hosts: Optional[Set[str]] = None,
    include_patterns: Optional[list[str]] = None,
    exclude_patterns: Optional[list[str]] = None,
) -> list[str]:
    """
    Parse markdown links from a Jina-rendered listing page.
    Returns individual article URLs that are one level deeper than base_url.
    """
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc.lower()
    base_path = parsed_base.path.rstrip('/')
    host_allowlist = {base_domain}
    if allowed_hosts:
        host_allowlist.update(host.lower() for host in allowed_hosts)

    # Jina renders links as [title](url)
    raw_links = re.findall(r'\[([^\]]{5,120})\]\((https?://[^\)\s]{10,200})\)', listing_text)

    skip_terms = ('/tag/', '/category/', '/author/', '/page/', '/search', '/feed', '.xml', '.rss', '/cdn-cgi/', '/assets/')
    skip_extensions = ('.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.mp4')

    include_rx = [re.compile(pattern, re.IGNORECASE) for pattern in (include_patterns or [])]
    exclude_rx = [re.compile(pattern, re.IGNORECASE) for pattern in (exclude_patterns or [])]
    release_terms = (
        'changelog', 'release', 'announce', 'update', 'updates', 'new', 'model',
        'launch', 'introducing', 'version', 'preview', 'ga'
    )

    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()

    for title, url in raw_links:
        parsed = urlparse(url)
        title_lower = title.lower()

        host = parsed.netloc.lower()
        # Must be in allowed domains
        if host not in host_allowlist:
            continue

        # For strict listing paths keep one-level-deeper rule, otherwise allow same-host deep paths.
        if base_path and base_path != '/':
            if not parsed.path.startswith(base_path + '/') and '/research' not in parsed.path.lower():
                continue

        # Skip navigation, tag, author pages
        path_lower = parsed.path.lower()
        if any(t in path_lower for t in skip_terms):
            continue
        if path_lower.endswith(skip_extensions):
            continue
        if exclude_rx and any(rx.search(url) or rx.search(path_lower) or rx.search(title_lower) for rx in exclude_rx):
            continue

        # Strip fragment/query for deduplication
        clean = parsed._replace(fragment='', query='').geturl()
        if clean in seen:
            continue

        score = 0
        if include_rx and any(rx.search(clean) or rx.search(path_lower) or rx.search(title_lower) for rx in include_rx):
            score += 8
        score += sum(2 for token in release_terms if token in path_lower or token in title_lower)
        if '/docs' in path_lower or '/api' in path_lower:
            score -= 3
        if '/news' in path_lower or '/blog' in path_lower or '/research' in path_lower:
            score += 1

        seen.add(clean)
        candidates.append((score, clean))

    candidates.sort(key=lambda row: row[0], reverse=True)
    return [url for _, url in candidates[:limit]]


def _extract_canonical_source_url(listing_text: str, fallback_url: str) -> str:
    # Jina pages frequently include a stable line: "URL Source: <url>"
    match = re.search(r'URL Source:\s*(https?://\S+)', listing_text)
    if not match:
        return fallback_url
    return match.group(1).rstrip(').,')


def _listing_snapshot_hash(source: dict, listing_text: str) -> str:
    normalized = re.sub(r'\s+', ' ', listing_text.strip().lower())
    payload = f"{source.get('name', '')}|{source.get('url', '')}|{normalized[:4000]}"
    digest = hashlib.sha256(payload.encode()).hexdigest()
    return f"https://agentcodex.snapshot/{source.get('name','source').lower().replace(' ', '-')}/{digest}"


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

def fetch_jina(
    source: dict,
    run_logger=None,
    max_links: int = 5,
    skip_url_dedupe: bool = False,
) -> list[dict]:
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

    mode = source.get('mode', 'listing_links')
    if mode not in SOURCE_MODES:
        mode = 'listing_links'
    canonical_url = _extract_canonical_source_url(listing_text, listing_url)
    allowed_hosts = set(source.get('canonical_hosts', []))
    allowed_hosts.add(urlparse(canonical_url).netloc.lower())
    article_urls = _extract_article_urls(
        listing_text,
        listing_url,
        limit=max_links,
        allowed_hosts=allowed_hosts,
        include_patterns=source.get('include_patterns'),
        exclude_patterns=source.get('exclude_patterns'),
    )
    always_fetch_listing = bool(source.get('always_fetch_listing'))
    treat_as_snapshot = mode in {'listing_snapshot', 'hybrid'} or always_fetch_listing

    if mode != 'listing_snapshot' and article_urls:
        print(f"  Found {len(article_urls)} article links — fetching individually")
        for url in article_urls:
            if not skip_url_dedupe and is_url_seen(url):
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
        # Fallback for single-page changelogs and dynamic listing hubs.
        if (not treat_as_snapshot) and (not always_fetch_listing) and (not skip_url_dedupe) and is_url_seen(listing_url):
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

        if treat_as_snapshot and not skip_url_dedupe:
            snapshot_article = {
                'source_name': source['name'],
                'url': _listing_snapshot_hash(source, listing_text),
                'title': f"{source['name']} - Latest Updates",
                'content': listing_text[:5000],
            }
            if is_content_seen(snapshot_article):
                print("  ⏭️  Listing snapshot unchanged — skipping")
                if run_logger:
                    run_logger.increment('listing_snapshot_skipped')
                    run_logger.event(
                        {'source_name': source['name'], 'url': listing_url, 'title': f"{source['name']} snapshot"},
                        'scrape',
                        'listing_snapshot_duplicate',
                    )
                return articles

        print(f"  No article links found — using listing page content")
        articles.append({
            'source_name': source['name'],
            'agent_slugs': source['agent_slugs'],
            'title': f"{source['name']} - Latest Updates",
            'url': canonical_url,
            'content': listing_text[:5000],
            'published': datetime.now(timezone.utc).isoformat(),
            'method': 'jina'
        })

    return articles


# ─────────────────────────────────────
# SCRAPE ALL
# ─────────────────────────────────────

def scrape_all(
    run_logger=None,
    target_agent_slugs: Optional[Set[str]] = None,
    max_links: int = 5,
    max_article_age_days: int = MAX_ARTICLE_AGE_DAYS,
    skip_url_dedupe: bool = False,
    source_mode_overrides: Optional[dict] = None,
) -> list[dict]:
    """Scrape all sources and return articles."""
    all_articles = []

    print(f"Starting scrape of {len(SOURCES)} sources...\n")

    for source in SOURCES:
        if target_agent_slugs:
            if not any(slug in target_agent_slugs for slug in source['agent_slugs']):
                continue

        source_for_run = dict(source)
        if source_mode_overrides:
            for slug in source_for_run.get('agent_slugs', []):
                if slug in source_mode_overrides:
                    source_for_run['mode'] = source_mode_overrides[slug]
        source_max_links = max(1, int(source_for_run.get('max_links', max_links)))
        print(f"Fetching {source_for_run['name']} via {source_for_run['method']}...")

        if source_for_run['method'] == 'rss':
            articles = fetch_rss(
                source_for_run,
                run_logger=run_logger,
                max_links=source_max_links,
                max_article_age_days=max_article_age_days,
                skip_url_dedupe=skip_url_dedupe,
            )
        else:
            articles = fetch_jina(
                source_for_run,
                run_logger=run_logger,
                max_links=source_max_links,
                skip_url_dedupe=skip_url_dedupe,
            )

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
