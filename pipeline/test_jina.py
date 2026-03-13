import requests

def test_jina(url):
    print(f"Testing Jina Reader on {url}\n")
    try:
        response = requests.get(
            f"https://r.jina.ai/{url}",
            timeout=30
        )
        if response.status_code == 200:
            print("✅  Success")
            print(f"Content preview:\n")
            print(response.text[:500])
        else:
            print(f"❌  Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌  Error: {e}")

if __name__ == "__main__":
    test_jina("https://cursor.com/changelog")