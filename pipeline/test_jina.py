import requests

NEW_SOURCES = [
    'https://mistral.ai/news',
    'https://x.ai/blog',
    'https://v0.dev/changelog',
    'https://github.com/cline/cline/releases',
    'https://www.midjourney.com/updates',
    'https://stability.ai/news',
    'https://suno.com/blog',
    'https://cognition.ai/blog',
]

def test_jina(url):
    try:
        response = requests.get(
            f"https://r.jina.ai/{url}",
            timeout=45,
            headers={'Accept': 'text/plain'}
        )
        if response.status_code == 200:
            preview = response.text[:150].replace('\n', ' ')
            print(f"✅  {url}")
            print(f"    Preview: {preview}")
        else:
            print(f"❌  {url}")
            print(f"    Status: {response.status_code}")
    except Exception as e:
        print(f"⚠️   {url}")
        print(f"    Error: {str(e)[:50]}")
    print()

if __name__ == "__main__":
    print("Testing Jina on new sources...\n")
    for url in NEW_SOURCES:
        test_jina(url)