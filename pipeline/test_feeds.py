import feedparser

FEEDS = {
    'OpenAI': 'https://openai.com/blog/rss.xml',
    'GitHub': 'https://github.blog/feed/',
    'Google DeepMind': 'https://deepmind.google/blog/rss.xml',
    'Meta AI': 'https://engineering.fb.com/feed/',
    'Codeium': 'https://codeium.com/feed.xml',
    'AWS': 'https://aws.amazon.com/blogs/aws/feed/',
    'Replit': 'https://blog.replit.com/feed.xml',
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