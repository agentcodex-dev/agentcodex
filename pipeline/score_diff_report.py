import argparse
import json
import os
from datetime import datetime, timezone

from score_tools import compute_score_diff, read_snapshot_json


def parse_args():
    parser = argparse.ArgumentParser(description='Compare two score snapshots and print diff report')
    parser.add_argument('--before', required=True, help='Path to baseline snapshot JSON')
    parser.add_argument('--after', required=True, help='Path to candidate snapshot JSON')
    parser.add_argument('--out-dir', default='pipeline/artifacts')
    parser.add_argument('--max-change-ratio', type=float, default=0.35)
    parser.add_argument('--max-abs-delta', type=float, default=5.0)
    return parser.parse_args()


def main():
    args = parse_args()
    before = read_snapshot_json(args.before)
    after = read_snapshot_json(args.after)
    report = compute_score_diff(before, after)
    summary = report['summary']

    print('Score Diff Summary')
    print(f"Before rows:   {summary['before_rows']}")
    print(f"After rows:    {summary['after_rows']}")
    print(f"Changed rows:  {summary['changed_rows']}")
    print(f"Added rows:    {summary['added_rows']}")
    print(f"Removed rows:  {summary['removed_rows']}")
    print(f"Change ratio:  {summary['change_ratio']:.4f}")
    print(f"Max abs delta: {summary['max_abs_delta']:.3f}")

    os.makedirs(args.out_dir, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    out_path = os.path.join(args.out_dir, f'score_diff_{stamp}.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    print(f'Report:        {out_path}')

    if summary['change_ratio'] > args.max_change_ratio:
        raise SystemExit(
            f"FAIL: change_ratio {summary['change_ratio']:.4f} exceeded threshold {args.max_change_ratio:.4f}"
        )
    if summary['max_abs_delta'] > args.max_abs_delta:
        raise SystemExit(
            f"FAIL: max_abs_delta {summary['max_abs_delta']:.3f} exceeded threshold {args.max_abs_delta:.3f}"
        )

    print('PASS: score drift is within thresholds')


if __name__ == '__main__':
    main()

