import csv
import json
from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass(frozen=True)
class ScoreRow:
    agent_slug: str
    agent_name: str
    version_id: str
    version_number: str
    release_date: str
    capability: str
    score: float

    @property
    def key(self) -> Tuple[str, str, str]:
        return (self.agent_slug, self.version_id, self.capability)


def flatten_versions(rows: List[dict]) -> List[ScoreRow]:
    flat: List[ScoreRow] = []
    for row in rows:
        agent = row.get('agent') or {}
        capabilities = row.get('capabilities') or {}
        for capability, score in capabilities.items():
            if not isinstance(score, (int, float)):
                continue
            flat.append(
                ScoreRow(
                    agent_slug=str(agent.get('slug', '')),
                    agent_name=str(agent.get('name', '')),
                    version_id=str(row.get('id', '')),
                    version_number=str(row.get('version_number', '')),
                    release_date=str(row.get('release_date', '')),
                    capability=str(capability),
                    score=float(score),
                )
            )
    return flat


def write_snapshot_json(path: str, rows: List[ScoreRow]) -> None:
    payload = [row.__dict__ for row in rows]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2)


def write_snapshot_csv(path: str, rows: List[ScoreRow]) -> None:
    with open(path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                'agent_slug',
                'agent_name',
                'version_id',
                'version_number',
                'release_date',
                'capability',
                'score',
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(row.__dict__)


def read_snapshot_json(path: str) -> List[ScoreRow]:
    with open(path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    return [ScoreRow(**item) for item in raw]


def compute_score_diff(before: List[ScoreRow], after: List[ScoreRow]) -> dict:
    before_map: Dict[Tuple[str, str, str], ScoreRow] = {row.key: row for row in before}
    after_map: Dict[Tuple[str, str, str], ScoreRow] = {row.key: row for row in after}

    all_keys = sorted(set(before_map.keys()) | set(after_map.keys()))
    changed = []
    added = []
    removed = []

    for key in all_keys:
        left = before_map.get(key)
        right = after_map.get(key)
        if left and right:
            delta = right.score - left.score
            if abs(delta) > 1e-9:
                changed.append({
                    'agent_slug': key[0],
                    'version_id': key[1],
                    'capability': key[2],
                    'before': left.score,
                    'after': right.score,
                    'delta': round(delta, 3),
                })
        elif right and not left:
            added.append({
                'agent_slug': key[0],
                'version_id': key[1],
                'capability': key[2],
                'after': right.score,
            })
        elif left and not right:
            removed.append({
                'agent_slug': key[0],
                'version_id': key[1],
                'capability': key[2],
                'before': left.score,
            })

    total_before = len(before)
    total_after = len(after)
    total_changed = len(changed)
    max_abs_delta = max([abs(item['delta']) for item in changed], default=0.0)

    return {
        'summary': {
            'before_rows': total_before,
            'after_rows': total_after,
            'changed_rows': total_changed,
            'added_rows': len(added),
            'removed_rows': len(removed),
            'change_ratio': round((total_changed / total_before), 4) if total_before else 0.0,
            'max_abs_delta': round(max_abs_delta, 3),
        },
        'changed': changed,
        'added': added,
        'removed': removed,
    }

