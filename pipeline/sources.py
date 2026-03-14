SOURCES = [
    # RSS sources - confirmed working
    {
        'name': 'OpenAI',
        'agent_slugs': ['chatgpt'],
        'method': 'rss',
        'url': 'https://openai.com/blog/rss.xml',
    },
    {
        'name': 'GitHub',
        'agent_slugs': ['github-copilot'],
        'method': 'rss',
        'url': 'https://github.blog/feed/',
    },
    {
        'name': 'Google DeepMind',
        'agent_slugs': ['gemini'],
        'method': 'rss',
        'url': 'https://deepmind.google/blog/rss.xml',
    },
    {
        'name': 'Meta AI',
        'agent_slugs': ['llama'],
        'method': 'rss',
        'url': 'https://engineering.fb.com/feed/',
    },
    {
        'name': 'Codeium Windsurf',
        'agent_slugs': ['windsurf'],
        'method': 'rss',
        'url': 'https://codeium.com/feed.xml',
    },

    # Jina sources - no RSS available
    {
        'name': 'Anthropic',
        'agent_slugs': ['claude'],
        'method': 'jina',
        'url': 'https://www.anthropic.com/news',
    },
    {
        'name': 'Cursor',
        'agent_slugs': ['cursor'],
        'method': 'jina',
        'url': 'https://cursor.com/changelog',
    },
    {
        'name': 'Perplexity',
        'agent_slugs': ['perplexity'],
        'method': 'jina',
        'url': 'https://blog.perplexity.ai',
    },
    {
        'name': 'Cognition AI',
        'agent_slugs': ['devin'],
        'method': 'jina',
        'url': 'https://cognition.ai/blog',
    },
    {
        'name': 'StackBlitz',
        'agent_slugs': ['bolt-new'],
        'method': 'jina',
        'url': 'https://blog.stackblitz.com',
    },
    # ─────────────────────────────
    # NEW AGENTS - 10 Added
    # ─────────────────────────────

    {
        'name': 'Mistral AI',
        'agent_slugs': ['mistral'],
        'method': 'jina',
        'url': 'https://mistral.ai/news',
    },
    {
        'name': 'AWS Amazon Q',
        'agent_slugs': ['amazon-q'],
        'method': 'rss',
        'url': 'https://aws.amazon.com/blogs/aws/feed/',
    },
    {
        'name': 'xAI Grok',
        'agent_slugs': ['grok'],
        'method': 'jina',
        'url': 'https://x.ai/blog',
    },
    {
        'name': 'Vercel v0',
        'agent_slugs': ['v0'],
        'method': 'jina',
        'url': 'https://v0.dev/changelog',
    },
    {
        'name': 'Replit',
        'agent_slugs': ['replit-agent'],
        'method': 'rss',
        'url': 'https://blog.replit.com/feed.xml',
    },
    {
        'name': 'Cline GitHub',
        'agent_slugs': ['cline'],
        'method': 'jina',
        'url': 'https://github.com/cline/cline/releases',
    },
    {
        'name': 'Midjourney',
        'agent_slugs': ['midjourney'],
        'method': 'jina',
        'url': 'https://www.midjourney.com/updates',
    },
    {
        'name': 'Stability AI',
        'agent_slugs': ['stable-diffusion'],
        'method': 'jina',
        'url': 'https://stability.ai/news',
    },
    {
        'name': 'Suno',
        'agent_slugs': ['suno'],
        'method': 'jina',
        'url': 'https://suno.com/blog',
    },
]