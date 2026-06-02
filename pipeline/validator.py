from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib
from scoring import apply_scoring_mode

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
CHANGE_TYPES = {'major', 'minor', 'patch', 'noise'}
SIGNAL_TYPES = {'meta_update', 'capability_update', 'policy_update'}
OFFICIAL_DOMAINS = {
    'chatgpt': ['openai.com', 'help.openai.com'],
    'codex': ['openai.com', 'help.openai.com'],
    'claude': ['anthropic.com'],
    'claude-code': ['claude.com', 'anthropic.com', 'code.claude.com'],
    'cursor': ['cursor.com'],
    'github-copilot': ['github.com', 'github.blog'],
    'gemini': ['google.com', 'deepmind.google'],
    'llama': ['meta.com', 'fb.com', 'facebook.com'],
    'perplexity': ['perplexity.ai'],
    'devin': ['cognition.ai'],
    'bolt-new': ['stackblitz.com'],
    'windsurf': ['codeium.com'],
    'mistral': ['mistral.ai'],
    'amazon-q': ['amazon.com', 'aws.amazon.com'],
    'grok': ['x.ai', 'grok.com'],
    'v0': ['v0.dev', 'vercel.com'],
    'replit-agent': ['replit.com'],
    'cline': ['github.com', 'cline.bot'],
    'midjourney': ['midjourney.com'],
    'stable-diffusion': ['stability.ai'],
    'suno': ['suno.com'],
    'aider': ['github.com', 'aider.chat'],
    'roo-code': ['github.com'],
    'continue': ['continue.dev', 'github.com'],
    'antigravity': ['antigravity.google', 'google.com', 'developers.googleblog.com', 'blog.google'],
    'openhands': ['github.com', 'openhands.dev'],
    'deepseek': ['deepseek.com', 'api-docs.deepseek.com'],
    'qwen': ['qwen.ai', 'qwenlm.github.io', 'qwenlm.ai', 'github.com', 'alibabacloud.com'],
    'cohere': ['cohere.com', 'docs.cohere.com'],
    'microsoft-mai': ['microsoft.ai', 'microsoft.com', 'news.microsoft.com', 'blogs.microsoft.com', 'techcommunity.microsoft.com', 'azure.microsoft.com'],
}


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


def _derive_change_type(what_changed: str) -> str:
    text = what_changed.lower()
    major_keywords = ('launch', 'major', 'breaking', 'ga', 'preview', 'new model', 'enterprise')
    patch_keywords = ('patch', 'hotfix', 'bug fix', 'stability')
    if any(token in text for token in major_keywords):
        return 'major'
    if any(token in text for token in patch_keywords):
        return 'patch'
    return 'minor'


def _is_official_source(agent_slug: str, source_url: str) -> bool:
    if not source_url:
        return False
    roots = OFFICIAL_DOMAINS.get(agent_slug, [])
    if not roots:
        return False
    host = source_url.lower()
    host = host.replace('https://', '').replace('http://', '').split('/')[0]
    for root in roots:
        if host == root or host.endswith(f'.{root}'):
            return True
    return False


def validate_extraction(
    extraction: dict,
    article: dict,
    max_release_age_days: int = DEFAULT_MAX_RELEASE_AGE_DAYS,
    scoring_mode: str = 'legacy',
    allow_signal_lane: bool = False,
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

    signal_type = str(extraction.get('signal_type') or '').strip().lower()
    is_signal = allow_signal_lane and signal_type in SIGNAL_TYPES

    version_number = str(extraction.get('version_number') or '').strip()
    if not version_number and not is_signal:
        errors.append('version_number is required')

    release_date = str(extraction.get('release_date') or '').strip()
    if not release_date and is_signal:
        release_date = datetime.now(timezone.utc).date().isoformat()
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

    if is_signal:
        source_url = str(extraction.get('source_url') or article.get('url') or '')
        hash_basis = f"{agent_slug}|{signal_type}|{release_date}|{source_url}|{what_changed[:220]}"
        signal_id = hashlib.sha1(hash_basis.encode()).hexdigest()[:10]
        version_number = f"SIGNAL:{signal_type}:{release_date}:{signal_id}"

    extraction_confidence = extraction.get('extraction_confidence')
    if not isinstance(extraction_confidence, (int, float)):
        extraction_confidence = 0.56

    capabilities, score_meta = apply_scoring_mode(
        capabilities,
        what_changed=what_changed,
        extraction_confidence=float(extraction_confidence),
        scoring_mode=scoring_mode,
    )
    clean_change_type = extraction.get('change_type')
    if is_signal:
        clean_change_type = 'minor' if signal_type == 'capability_update' else 'patch'

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
        'importance_score': extraction.get('importance_score'),
        'change_type': clean_change_type,
        'extraction_confidence': extraction.get('extraction_confidence'),
        'editor_note': extraction.get('editor_note'),
        'scoring_mode': score_meta['mode'],
        'score_adjustments': score_meta['score_adjustments'],
    }
    source_url = str(clean.get('source_url') or '')
    is_official = _is_official_source(agent_slug, source_url)

    if clean['change_type'] not in CHANGE_TYPES:
        clean['change_type'] = _derive_change_type(what_changed)

    if not isinstance(clean['importance_score'], int):
        clean['importance_score'] = 8 if clean['change_type'] == 'major' else 6 if clean['change_type'] == 'minor' else 4

    confidence = clean['extraction_confidence']
    if not isinstance(confidence, (int, float)):
        measured_confidence = 0.56
    else:
        measured_confidence = max(0.0, min(1.0, float(confidence)))

    # Apply lightweight confidence calibration so values reflect evidence quality.
    has_summary = bool(clean['what_changed'] and len(clean['what_changed'].strip()) >= 30)
    has_caps = isinstance(clean['capabilities'], dict) and len(clean['capabilities']) >= 4
    has_source = bool(clean.get('source_url'))
    has_impact_fields = isinstance(clean.get('importance_score'), int) and bool(clean.get('change_type'))
    completeness = sum([has_summary, has_caps, has_source, has_impact_fields]) / 4.0
    source_factor = 0.12 if is_official else (-0.06 if has_source else -0.12)
    completeness_factor = (completeness - 0.5) * 0.26
    calibrated_confidence = measured_confidence + source_factor + completeness_factor
    if not has_summary:
        calibrated_confidence -= 0.08
    clean['extraction_confidence'] = max(0.2, min(0.98, round(calibrated_confidence, 2)))

    quality_flags = []
    if not is_official:
        quality_flags.append('needs_source_review')
    if clean['extraction_confidence'] < 0.6:
        quality_flags.append('low_confidence')
    if clean['importance_score'] >= 8:
        quality_flags.append('high_impact')
    if is_signal:
        quality_flags.extend([
            'non_version_signal',
            f'signal_type:{signal_type}',
        ])
    clean['quality_flags'] = quality_flags

    trust_impact = 1.1 if is_official else 0.85
    confidence_impact = 0.8 + (clean['extraction_confidence'] * 0.6)
    capability_delta_impact = float(clean['importance_score'])
    release_type_impact = 3.2 if clean['change_type'] == 'major' else 2.1 if clean['change_type'] == 'minor' else 1.2
    final_impact = round((capability_delta_impact + release_type_impact) * trust_impact * confidence_impact, 2)
    clean['impact_factors'] = {
        'capabilityDeltaImpact': round(capability_delta_impact, 2),
        'releaseTypeImpact': round(release_type_impact, 2),
        'trustImpact': round(trust_impact, 2),
        'confidenceImpact': round(confidence_impact, 2),
        'finalImpact': final_impact,
        'summary': f"{clean['change_type']} update with {'official' if is_official else 'non-official'} source and {int(clean['extraction_confidence'] * 100)}% confidence",
        'scoringMode': score_meta['mode'],
        'llmSuggestedScores': score_meta['llm_suggested_scores'],
        'calibratedScores': score_meta['calibrated_scores'],
        'scoreAdjustments': score_meta['score_adjustments'],
    }
    if is_signal:
        clean['impact_factors'].update({
            'recordLane': 'signal',
            'signalType': signal_type,
            'signalTitle': str(extraction.get('title') or '').strip() or clean['what_changed'][:80],
        })
        existing_note = str(clean.get('editor_note') or '').strip()
        signal_note = f"signal_lane({signal_type})"
        clean['editor_note'] = f"{existing_note} | {signal_note}".strip(' |')

    missing_scores = REQUIRED_CAPABILITIES - set(capabilities.keys())
    if missing_scores:
        clean['validation_warnings'] = [
            f"Missing capability scores: {', '.join(sorted(missing_scores))}"
        ]

    return clean, []
