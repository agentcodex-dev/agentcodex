import os
import json
import time
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# ─────────────────────────────────────
# PROMPTS
# ─────────────────────────────────────

HAIKU_FILTER_PROMPT = """Does this article announce a NEW version, release or significant update to an AI agent or AI model?

Answer with just YES or NO. Nothing else.

Title: {title}
Content: {content}"""

EXTRACTION_PROMPT = """You are an AI agent version tracker.
Analyze this content from {source_name} and determine if it mentions a NEW version, release or significant update to any of these AI agents: {agent_slugs}

Content:
{content}

If you find a new version or update respond with a JSON object in this exact format:
{{
    "found": true,
    "agent_slug": "the-agent-slug",
    "version_number": "version name or number",
    "release_date": "YYYY-MM-DD",
    "what_changed": "2-3 sentences describing what changed",
    "capabilities": {{
        "coding": 0,
        "reasoning": 0,
        "multimodal": 0,
        "tool_use": 0,
        "memory": 0,
        "speed": 0
    }},
    "context_window": null,
    "pricing_info": null,
    "source_url": "url of the article"
}}

For capabilities score each from 1-10 based on information in the article.
Use null if information not mentioned.

If NO new version or update is found respond with exactly:
{{"found": false}}

Respond with JSON only. No other text."""

# ─────────────────────────────────────
# VERSION KEYWORDS PRE-FILTER
# ─────────────────────────────────────

VERSION_KEYWORDS = [
    'version', 'release', 'update', 'launch',
    'new', 'introducing', 'announce', 'available',
    'upgrade', 'improved', 'changelog', 'v1', 'v2',
    'v3', 'v4', 'v5', 'model', 'feature', 'capability'
]

def is_potentially_version_related(article: dict) -> bool:
    """Quick keyword check before any API calls"""
    text = (
        article.get('title', '') + ' ' +
        article.get('content', '')
    ).lower()
    matches = sum(1 for kw in VERSION_KEYWORDS if kw in text)
    return matches >= 2

# ─────────────────────────────────────
# HAIKU FILTER - CHEAP MODEL
# ─────────────────────────────────────

def haiku_is_version_related(article: dict, haiku_model: str) -> bool:
    """
    Use cheap Haiku model to decide
    if article is worth sending to Sonnet
    Cost ~$0.0002 per article
    vs Sonnet ~$0.01 per article
    50x cheaper
    """
    try:
        message = client.messages.create(
            model=haiku_model,
            max_tokens=5,
            messages=[{
                "role": "user",
                "content": HAIKU_FILTER_PROMPT.format(
                    title=article.get('title', ''),
                    content=article.get('content', '')[:500]
                )
            }]
        )

        response = message.content[0].text.strip().upper()
        is_relevant = 'YES' in response

        if is_relevant:
            print(f"  🟢 Haiku: YES - sending to Sonnet")
        else:
            print(f"  🔴 Haiku: NO - skipping")

        return is_relevant

    except Exception as e:
        print(f"  ⚠️  Haiku error: {e} - defaulting to process")
        return True  # If Haiku fails process it anyway


# ─────────────────────────────────────
# SONNET EXTRACTION - FULL DETAILS
# ─────────────────────────────────────

def extract_version(article: dict, sonnet_model: str) -> Optional[dict]:
    """
    Use Sonnet to extract full version details
    Only called after Haiku confirms relevance
    """
    prompt = EXTRACTION_PROMPT.format(
        source_name=article['source_name'],
        agent_slugs=article['agent_slugs'],
        content=article['content'][:2000]
    )

    for attempt in range(3):
        try:
            message = client.messages.create(
                model=sonnet_model,
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            response_text = message.content[0].text.strip()

            # Clean markdown code blocks if present
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            response_text = response_text.strip()

            result = json.loads(response_text)

            if result.get('found'):
                print(f"  🎯 Found version: {result.get('version_number')}")
                return result
            else:
                print(f"  ⬜ No new version found")
                return None

        except json.JSONDecodeError as e:
            print(f"  ❌ JSON parse error: {e}")
            return None

        except Exception as e:
            error_str = str(e)
            if '429' in error_str and attempt < 2:
                wait_time = (attempt + 1) * 60
                print(f"  ⏳ Rate limited - waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                print(f"  ❌ Extraction error: {e}")
                return None

    print(f"  ❌ All retries failed")
    return None


# ─────────────────────────────────────
# MAIN EXTRACT ALL FUNCTION
# ─────────────────────────────────────

def extract_all(
    articles: list,
    haiku_model: str = "claude-haiku-4-5",
    sonnet_model: str = "claude-sonnet-4-6"
) -> list:
    """
    Three stage pipeline
    Stage 1 - Keyword filter  (free)
    Stage 2 - Haiku filter    (cheap)
    Stage 3 - Sonnet extract  (only what matters)
    """
    from deduplicator import is_seen, mark_seen

    versions_found = []

    # ── Stage 1: Keyword filter ──
    keyword_filtered = [
        a for a in articles
        if is_potentially_version_related(a)
    ]

    # ── Stage 2: Deduplication ──
    not_seen = [
        a for a in keyword_filtered
        if not is_seen(a)
    ]

    print(f"\nFiltering pipeline")
    print(f"──────────────────")
    print(f"Total articles:    {len(articles)}")
    print(f"Keyword match:     {len(keyword_filtered)}")
    print(f"Not seen before:   {len(not_seen)}")

    if not not_seen:
        print("\nAll articles already processed")
        print("Nothing new to send to Claude")
        return []

    # ── Stage 3: Haiku filter ──
    print(f"\nRunning Haiku filter on {len(not_seen)} articles...")
    print(f"────────────────────────────────────────")

    sonnet_queue = []
    haiku_rejected = 0

    for article in not_seen:
        print(f"\nChecking: {article['source_name']} - {article['title'][:50]}...")
        
        if haiku_is_version_related(article, haiku_model):
            sonnet_queue.append(article)
        else:
            haiku_rejected += 1
            mark_seen(article)  # Mark seen so not reprocessed tomorrow
        
        time.sleep(0.5)  # Small delay between Haiku calls

    print(f"\nHaiku results")
    print(f"─────────────")
    print(f"Rejected by Haiku: {haiku_rejected}")
    print(f"Sending to Sonnet: {len(sonnet_queue)}")

    if not sonnet_queue:
        print("\nHaiku found nothing version-related today")
        return []

    # ── Stage 4: Sonnet extraction ──
    print(f"\nRunning Sonnet extraction on {len(sonnet_queue)} articles...")
    print(f"────────────────────────────────────────────────────────")

    for index, article in enumerate(sonnet_queue):
        print(f"\n[{index + 1}/{len(sonnet_queue)}] {article['source_name']}: {article['title'][:50]}...")

        result = extract_version(article, sonnet_model)

        if result:
            result['pipeline_source'] = article['url']
            versions_found.append(result)

        mark_seen(article)

        if index < len(sonnet_queue) - 1:
            print(f"  ⏳ Waiting 6s...")
            time.sleep(6)

    print(f"\nVersions found: {len(versions_found)}")
    return versions_found


# ─────────────────────────────────────
# TEST
# ─────────────────────────────────────

if __name__ == "__main__":
    test_article = {
        'source_name': 'Anthropic',
        'agent_slugs': ['claude'],
        'title': 'Introducing Claude 4.0',
        'url': 'https://anthropic.com',
        'content': '''
        Today we are releasing Claude 4.0.
        This version features extended reasoning
        with a 500K context window and scores
        95/100 on coding benchmarks.
        Pricing is $5 per million tokens.
        '''
    }

    print("Testing Haiku filter...")
    print("─────────────────────")
    
    haiku_model = "claude-haiku-4-5"
    sonnet_model = "claude-sonnet-4-6"
    
    is_relevant = haiku_is_version_related(test_article, haiku_model)
    print(f"Haiku decision: {'YES' if is_relevant else 'NO'}")

    if is_relevant:
        print("\nTesting Sonnet extraction...")
        print("────────────────────────────")
        result = extract_version(test_article, sonnet_model)
        print(f"\nResult: {json.dumps(result, indent=2)}")