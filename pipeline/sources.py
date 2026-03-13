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
]