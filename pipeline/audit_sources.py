from urllib.parse import urlparse

from sources import SOURCES


OFFICIAL_DOMAIN_RULES = {
    'chatgpt': {'openai.com', 'help.openai.com'},
    'codex': {'openai.com', 'help.openai.com'},
    'claude': {'anthropic.com'},
    'claude-code': {'claude.com', 'anthropic.com', 'code.claude.com'},
    'gemini': {'google.com', 'deepmind.google'},
    'llama': {'meta.com', 'fb.com', 'facebook.com'},
    'github-copilot': {'github.com', 'github.blog'},
    'cursor': {'cursor.com'},
    'perplexity': {'perplexity.ai'},
    'devin': {'cognition.ai'},
    'bolt-new': {'stackblitz.com'},
    'windsurf': {'codeium.com'},
    'mistral': {'mistral.ai'},
    'amazon-q': {'amazon.com', 'aws.amazon.com'},
    'grok': {'x.ai'},
    'v0': {'v0.dev', 'vercel.com'},
    'replit-agent': {'replit.com'},
    'cline': {'github.com', 'cline.bot'},
    'midjourney': {'midjourney.com'},
    'stable-diffusion': {'stability.ai'},
    'suno': {'suno.com'},
    'aider': {'github.com', 'aider.chat'},
    'roo-code': {'github.com'},
    'continue': {'continue.dev', 'github.com'},
}


PREFERRED_SOURCE_HINTS = {
    'chatgpt': 'https://openai.com/news/',
    'codex': 'https://help.openai.com/en/articles/11428266-codex-changelog',
    'claude': 'https://www.anthropic.com/news',
    'claude-code': 'https://code.claude.com/docs/en/changelog',
    'gemini': 'https://blog.google/technology/ai/',
    'llama': 'https://ai.meta.com/blog/',
    'github-copilot': 'https://github.blog/changelog/label/copilot/',
    'cursor': 'https://cursor.com/changelog',
    'perplexity': 'https://www.perplexity.ai/hub/blog',
    'devin': 'https://cognition.ai/blog',
    'bolt-new': 'https://blog.stackblitz.com',
    'windsurf': 'https://codeium.com/blog',
    'mistral': 'https://mistral.ai/news',
    'amazon-q': 'https://aws.amazon.com/blogs/aws/',
    'grok': 'https://x.ai/blog',
    'v0': 'https://v0.dev/changelog',
    'replit-agent': 'https://blog.replit.com',
    'cline': 'https://github.com/cline/cline/releases',
    'midjourney': 'https://www.midjourney.com/updates',
    'stable-diffusion': 'https://stability.ai/news',
    'suno': 'https://suno.com/blog',
    'aider': 'https://github.com/Aider-AI/aider/releases',
    'roo-code': 'https://github.com/RooVetGit/Roo-Code/releases',
    'continue': 'https://github.com/continuedev/continue/releases',
}

SPECIFICITY_RULES = {
    'chatgpt': {
        'recommended_path_tokens': ['/news', '/changelog', '/release', '/updates'],
        'strict': False,
    },
    'github-copilot': {
        'recommended_path_tokens': ['/copilot', '/changelog', '/release'],
        'strict': False,
    },
    'gemini': {
        'recommended_path_tokens': ['/ai', '/gemini', '/news', '/blog'],
        'strict': False,
    },
    'llama': {
        'recommended_path_tokens': ['/ai', '/llama', '/blog', '/news'],
        'strict': False,
    },
    'amazon-q': {
        'recommended_path_tokens': ['/amazon-q', '/q-developer', '/q/', '/artificial-intelligence'],
        'strict': False,
    },
}


def hostname(url: str) -> str:
    host = urlparse(url).hostname or ''
    return host.lower()


def is_allowed_domain(host: str, allowed_roots: set[str]) -> bool:
    for root in allowed_roots:
        root = root.lower()
        if host == root or host.endswith(f'.{root}'):
            return True
    return False


def check_source(source: dict) -> list[dict]:
    findings = []
    host = hostname(source['url'])
    method = source.get('method', 'unknown')
    parsed = urlparse(source['url'])
    path = (parsed.path or '/').lower()

    if not host:
        return [{
            'status': 'error',
            'slug': '(unknown)',
            'url': source['url'],
            'issue': 'Invalid URL hostname',
            'hint': '',
        }]

    for slug in source.get('agent_slugs', []):
        allowed = OFFICIAL_DOMAIN_RULES.get(slug)
        if not allowed:
            findings.append({
                'status': 'warn',
                'slug': slug,
                'url': source['url'],
                'issue': 'No official domain rule yet',
                'hint': PREFERRED_SOURCE_HINTS.get(slug, ''),
            })
            continue

        if is_allowed_domain(host, allowed):
            findings.append({
                'status': 'ok',
                'slug': slug,
                'url': source['url'],
                'issue': f'{method} source host is within expected official domains',
                'hint': '',
            })
            specificity = SPECIFICITY_RULES.get(slug)
            if specificity:
                tokens = specificity.get('recommended_path_tokens', [])
                if tokens and not any(token in path for token in tokens):
                    findings.append({
                        'status': 'warn',
                        'slug': slug,
                        'url': source['url'],
                        'issue': 'Source is official but broad; may include noisy/non-product updates',
                        'hint': PREFERRED_SOURCE_HINTS.get(slug, ''),
                    })
        else:
            findings.append({
                'status': 'warn',
                'slug': slug,
                'url': source['url'],
                'issue': f'Host "{host}" is outside expected official domains: {sorted(allowed)}',
                'hint': PREFERRED_SOURCE_HINTS.get(slug, ''),
            })

    return findings


def main():
    findings = []
    for source in SOURCES:
        findings.extend(check_source(source))

    oks = [row for row in findings if row['status'] == 'ok']
    warns = [row for row in findings if row['status'] == 'warn']
    errors = [row for row in findings if row['status'] == 'error']

    print('AgentCodex Source Audit')
    print(f'Checked mappings: {len(findings)}')
    print(f'OK: {len(oks)} | WARN: {len(warns)} | ERROR: {len(errors)}\n')

    for row in warns + errors:
        print(f"[{row['status'].upper()}] {row['slug']}")
        print(f"  URL: {row['url']}")
        print(f"  Issue: {row['issue']}")
        if row['hint']:
            print(f"  Suggested official source: {row['hint']}")
        print()

    if not warns and not errors:
        print('All configured sources match current official-domain rules.')


if __name__ == '__main__':
    main()
