import feedparser
import requests

def test_url(name, url):
    try:
        feed = feedparser.parse(url)
        if feed.entries:
            print(f"✅  {name}")
            print(f"    URL: {url}")
            print(f"    Latest: {feed.entries[0].title}")
            print()
            return True
        else:
            r = requests.get(url, timeout=10)
            print(f"⚠️   {name} - No entries")
            print(f"    URL: {url}")
            print(f"    Status: {r.status_code}")
            print()
            return False
    except Exception as e:
        print(f"❌  {name} - {str(e)[:50]}")
        print()
        return False

print("Testing Anthropic URLs...")
anthropic_urls = [
    'https://www.anthropic.com/news/rss',
    'https://www.anthropic.com/rss',
    'https://anthropic.com/news.rss',
    'https://www.anthropic.com/feed.xml',
    'https://www.anthropic.com/news/feed',
]
for url in anthropic_urls:
    test_url('Anthropic', url)

print("\nTesting Perplexity URLs...")
perplexity_urls = [
    'https://blog.perplexity.ai/feed',
    'https://blog.perplexity.ai/rss',
    'https://blog.perplexity.ai/rss.xml',
    'https://blog.perplexity.ai/feed.xml',
    'https://www.perplexity.ai/blog/feed',
]
for url in perplexity_urls:
    test_url('Perplexity', url)

print("\nTesting Meta AI URLs...")
meta_urls = [
    'https://ai.meta.com/blog/feed/',
    'https://ai.meta.com/blog/rss/',
    'https://ai.meta.com/blog/rss.xml',
    'https://engineering.fb.com/feed/',
    'https://research.facebook.com/feed/',
]
for url in meta_urls:
    test_url('Meta AI', url)

print("\nTesting Codeium/Windsurf URLs...")
codeium_urls = [
    'https://codeium.com/blog/feed',
    'https://codeium.com/blog/rss',
    'https://codeium.com/blog/rss.xml',
    'https://codeium.com/feed.xml',
    'https://windsurf.com/blog/feed',
]
for url in codeium_urls:
    test_url('Codeium', url)