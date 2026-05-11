from typing import Dict, Tuple, List


REQUIRED_CAPABILITIES = (
    'coding',
    'reasoning',
    'multimodal',
    'tool_use',
    'memory',
    'speed',
)


def clamp_score(value: float) -> int:
    return max(1, min(10, int(round(value))))


def _keyword_adjustments(what_changed: str) -> Dict[str, int]:
    text = (what_changed or '').lower()
    adjustments = {
        'coding': 0,
        'reasoning': 0,
        'multimodal': 0,
        'tool_use': 0,
        'memory': 0,
        'speed': 0,
    }
    keyword_map = {
        'coding': ('code', 'coding', 'developer', 'repo', 'ide'),
        'reasoning': ('reasoning', 'thinking', 'analysis'),
        'multimodal': ('image', 'video', 'audio', 'multimodal'),
        'tool_use': ('tool', 'integration', 'api', 'plugin'),
        'memory': ('memory', 'context', 'long context', 'state'),
        'speed': ('speed', 'latency', 'faster', 'performance'),
    }
    for capability, words in keyword_map.items():
        if any(word in text for word in words):
            adjustments[capability] += 1
    return adjustments


def _confidence_regression(value: int, extraction_confidence: float) -> int:
    """
    Pull uncertain scores slightly toward neutral center (6).
    Higher confidence = less regression.
    """
    confidence = max(0.0, min(1.0, extraction_confidence))
    if confidence >= 0.8:
        return value
    pull_strength = (0.8 - confidence) * 0.75
    regressed = value + (6 - value) * pull_strength
    return clamp_score(regressed)


def apply_scoring_mode(
    capabilities: Dict[str, int],
    what_changed: str = '',
    extraction_confidence: float = 0.7,
    scoring_mode: str = 'legacy',
) -> Tuple[Dict[str, int], dict]:
    """
    Returns (final_scores, metadata).
    metadata has:
      - mode
      - llm_suggested_scores
      - calibrated_scores
      - score_adjustments
    """
    if what_changed in {'legacy', 'calibrated'} and scoring_mode == 'legacy':
        scoring_mode = what_changed
        what_changed = ''

    llm_suggested = {k: int(v) for k, v in capabilities.items() if isinstance(v, int)}

    if scoring_mode == 'legacy':
        return llm_suggested, {
            'mode': 'legacy',
            'llm_suggested_scores': llm_suggested,
            'calibrated_scores': llm_suggested,
            'score_adjustments': [],
        }

    adjusted = dict(llm_suggested)
    adjustments: List[dict] = []

    existing_values = [v for v in adjusted.values() if 1 <= v <= 10]
    fallback = 6 if not existing_values else clamp_score(sum(existing_values) / len(existing_values))

    for capability in REQUIRED_CAPABILITIES:
        if capability not in adjusted:
            adjusted[capability] = fallback
            adjustments.append({
                'capability': capability,
                'from': None,
                'to': fallback,
                'reason': 'missing_capability_filled',
            })
            continue

        raw = adjusted[capability]
        clamped = clamp_score(raw)
        if clamped != raw:
            adjusted[capability] = clamped
            adjustments.append({
                'capability': capability,
                'from': raw,
                'to': clamped,
                'reason': 'out_of_range_clamped',
            })

    # Keyword-sensitive directional uplift.
    keyword_adjust = _keyword_adjustments(what_changed)
    for capability in REQUIRED_CAPABILITIES:
        current = adjusted[capability]
        next_value = clamp_score(current + keyword_adjust.get(capability, 0))
        if next_value != current:
            adjusted[capability] = next_value
            adjustments.append({
                'capability': capability,
                'from': current,
                'to': next_value,
                'reason': 'keyword_signal_adjustment',
            })

    # Confidence regression toward neutral center for low confidence.
    for capability in REQUIRED_CAPABILITIES:
        current = adjusted[capability]
        regressed = _confidence_regression(current, extraction_confidence)
        if regressed != current:
            adjusted[capability] = regressed
            adjustments.append({
                'capability': capability,
                'from': current,
                'to': regressed,
                'reason': 'low_confidence_regression',
            })

    return adjusted, {
        'mode': 'calibrated',
        'llm_suggested_scores': llm_suggested,
        'calibrated_scores': adjusted,
        'score_adjustments': adjustments,
    }
