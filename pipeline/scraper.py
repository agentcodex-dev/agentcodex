import feedparser
import requests
from datetime import datetime, timezone
from sources import SOURCES

def fetch_rss(source: dict) -> list[dict]:
    """Fetch articles from RSS feed"""
    articles = []
    
    try:
        feed = feedparser.parse(source['url'])
        
        for entry in feed.entries[:5]:  # Latest 5 articles
            articles.append({
                'source_name': source['name'],
                'agent_slugs': source['agent_slugs'],
                'title': entry.get('title', ''),
                'url': entry.get('link', ''),
                'content': entry.get('summary', ''),
                'published': entry.get('published', ''),
                'method': 'rss'
            })
            
    except Exception as e:
        print(f"❌  RSS error for {source['name']}: {e}")
    
    return articles


def fetch_jina(source: dict) -> list[dict]:
    """Fetch page content via Jina Reader"""
    articles = []
    
    for attempt in range(2):  # Try twice
        try:
            response = requests.get(
                f"https://r.jina.ai/{source['url']}",
                timeout=45,
                headers={'Accept': 'text/plain'}
            )
            
            if response.status_code == 200:
                articles.append({
                    'source_name': source['name'],
                    'agent_slugs': source['agent_slugs'],
                    'title': f"{source['name']} - Latest Updates",
                    'url': source['url'],
                    'content': response.text[:4000],
                    'published': datetime.now(timezone.utc).isoformat(),
                    'method': 'jina'
                })
                break  # Success, stop retrying
            else:
                print(f"⚠️  Jina status {response.status_code} for {source['name']}")
                
        except Exception as e:
            if attempt == 0:
                print(f"⚠️  Retry for {source['name']}...")
            else:
                print(f"❌  Jina failed for {source['name']}: {str(e)[:50]}")
    
    return articles


def scrape_all() -> list[dict]:
    """Scrape all sources and return articles"""
    all_articles = []
    
    print(f"Starting scrape of {len(SOURCES)} sources...\n")
    
    for source in SOURCES:
        print(f"Fetching {source['name']} via {source['method']}...")
        
        if source['method'] == 'rss':
            articles = fetch_rss(source)
        else:
            articles = fetch_jina(source)
            
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