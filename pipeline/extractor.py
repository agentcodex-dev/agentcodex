import os
import json
import time
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

EXTRACTION_PROMPT = """
You are an AI agent version tracker.
Analyze this content from {source_name} 
and determine if it mentions a NEW version, 
release or significant update to any of 
these AI agents: {agent_slugs}

Content:
{content}

If you find a new version or update respond
with a JSON object in this exact format:
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

For capabilities score each from 1-10
based on information in the article.
Use null if information not mentioned.

If NO new version or update is found
respond with exactly:
{{"found": false}}

Respond with JSON only. No other text.
"""

def extract_version(article: dict) -> Optional[dict]:
    """
    Send article to Claude
    Extract version information if found
    """
    
    prompt = EXTRACTION_PROMPT.format(
        source_name=article['source_name'],
        agent_slugs=article['agent_slugs'],
        content=article['content'][:6000]
    )
    
    for attempt in range(3):
        try:
            # Call Claude API
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Get raw response
            response_text = message.content[0].text.strip()

            # Debug - see what Claude returns
            print(f"  Raw response: {response_text[:200]}")

            # Clean markdown code blocks if present
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            response_text = response_text.strip()

            # Parse JSON
            result = json.loads(response_text)

            if result.get('found'):
                print(f"  🎯 Found version: {result.get('version_number')}")
                return result
            else:
                print(f"  ⬜ No new version found")
                return None

        except json.JSONDecodeError as e:
            print(f"  ❌ JSON parse error: {e}")
            print(f"  Raw was: {response_text[:100]}")
            return None

        except Exception as e:
            error_str = str(e)
            if '429' in error_str and attempt < 2:
                wait_time = (attempt + 1) * 15
                print(f"  ⏳ Rate limited - waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                print(f"  ❌ Extraction error: {e}")
                return None

    # All retries exhausted
    print(f"  ❌ All retries failed")
    return None

    
def extract_all(articles: list) -> list:
    versions_found = []
    
    print(f"\nExtracting versions from {len(articles)} articles...\n")
    
    for index, article in enumerate(articles):
        print(f"[{index + 1}/{len(articles)}] Analyzing {article['source_name']}: {article['title'][:50]}...")
        
        result = extract_version(article)
        
        if result:
            result['pipeline_source'] = article['url']
            versions_found.append(result)

        # Wait 3 seconds between each call
        # Stays well within 30k tokens/minute limit
        if index < len(articles) - 1:
            print(f"  ⏳ Waiting 3s before next call...")
            time.sleep(3)
    
    print(f"\nVersions found: {len(versions_found)}")
    return versions_found


if __name__ == "__main__":
    # Test with a sample article
    test_article = {
        'source_name': 'Anthropic',
        'agent_slugs': ['claude'],
        'title': 'Test Article',
        'url': 'https://anthropic.com/news',
        'content': '''
        Today we are releasing Claude 4.0, our most capable model yet.
        Claude 4.0 features extended reasoning with a 500K context window.
        It scores 95/100 on coding benchmarks, significantly better than
        previous versions. Pricing is $5 per million input tokens.
        Available now at claude.ai
        '''
    }
    
    print("Testing extractor with sample article...\n")
    result = extract_version(test_article)
    print(f"\nResult: {json.dumps(result, indent=2)}")
