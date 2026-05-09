from datetime import datetime, timezone, timedelta
from typing import Optional

REQUIRED_CAPABILITIES = {
    'coding',
    'reasoning',
    'multimodal',
    'tool_use',
    'memory',
    'speed',
}

MAX_FUTURE_DAYS = 7
DEFAULT_MAX_RELEASE_AGE_DAYS = 30


def _valid_date(value: str, max_release_age_days: int) -> bool:
    try:
        release_date = datetime.strptime(value, '%Y-%m-%d').date()
        today = datetime.now(timezone.utc).date()
        return (
            release_date >= (today - timedelta(days=max_release_age_days))
            and release_date <= (today + timedelta(days=MAX_FUTURE_DAYS))
        )
    except Exception:
        return False


def _clean_capabilities(raw: object) -> dict:
    if not isinstance(raw, dict):
        return {}

    clean = {}
    for key, value in raw.items():
        if value is None:
            continue
        if not isinstance(value, (int, float)):
            continue

        score = int(value)
        if 1 <= score <= 10:
            clean[key] = score

    return clean


def validate_extraction(
    extraction: dict,
    article: dict,
    max_release_age_days: int = DEFAULT_MAX_RELEASE_AGE_DAYS,
) -> tuple[Optional[dict], list[str]]:
    """
    Validate and normalize model output before writing drafts.
    Returns (clean_extraction, errors).
    """
    errors = []

    agent_slug = extraction.get('agent_slug')
    allowed_slugs = article.get('agent_slugs', [])
    if agent_slug not in allowed_slugs:
        errors.append(f"agent_slug must be one of {allowed_slugs}")

    version_number = str(extraction.get('version_number') or '').strip()
    if not version_number:
        errors.append('version_number is required')

    release_date = str(extraction.get('release_date') or '').strip()
    if not release_date or not _valid_date(release_date, max_release_age_days):
        errors.append(f'release_date must be within {max_release_age_days} days (YYYY-MM-DD)')

    what_changed = str(extraction.get('what_changed') or '').strip()
    if len(what_changed) < 25:
        errors.append('what_changed is too short')

    capabilities = _clean_capabilities(extraction.get('capabilities'))

    context_window = extraction.get('context_window')
    if context_window is not None:
        if not isinstance(context_window, int) or context_window <= 0:
            errors.append('context_window must be a positive integer or null')

    if errors:
        return None, errors

    clean = {
        **extraction,
        'agent_slug': agent_slug,
        'version_number': version_number,
        'release_date': release_date,
        'what_changed': what_changed,
        'capabilities': capabilities,
        'context_window': context_window,
        'pricing_info': extraction.get('pricing_info'),
        'source_url': extraction.get('source_url') or article.get('url'),
    }

    missing_scores = REQUIRED_CAPABILITIES - set(capabilities.keys())
    if missing_scores:
        clean['validation_warnings'] = [
            f"Missing capability scores: {', '.join(sorted(missing_scores))}"
        ]

    return clean, []
