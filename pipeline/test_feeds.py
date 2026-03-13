import feedparser

FEEDS = {
    'Anthropic': 'https://www.anthropic.com/rss.xml',
    'OpenAI': 'https://openai.com/blog/rss.xml',
    'GitHub': 'https://github.blog/feed/',
    'Google DeepMind': 'https://deepmind.google/blog/rss.xml',
    'Perplexity': 'https://blog.perplexity.ai/feed',
    'Meta AI': 'https://ai.meta.com/blog/feed/',
    'Codeium': 'https://codeium.com/blog/feed',
}

def test_feeds():
    print("Testing RSS feeds...\n")
    
    for name, url in FEEDS.items():
        try:
            feed = feedparser.parse(url)
            if feed.entries:
                latest = feed.entries[0]
                print(f"✅  {name}")
                print(f"    Latest: {latest.title}")
                print(f"    Date:   {latest.get('published', 'no date')}")
                print()
            else:
                print(f"⚠️   {name} - No entries found")
                print(f"    URL: {url}")
                print()
        except Exception as e:
            print(f"❌  {name} - Error: {e}")
            print()

if __name__ == "__main__":
    test_feeds()