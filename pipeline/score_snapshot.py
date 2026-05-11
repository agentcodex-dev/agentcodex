import argparse
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client

from score_tools import flatten_versions, write_snapshot_csv, write_snapshot_json

load_dotenv()


def fetch_published_versions(limit: int) -> list:
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY'),
    )
    result = (
        supabase.table('agent_versions')
        .select('id,version_number,release_date,capabilities,agent:agents(slug,name)')
        .eq('status', 'published')
        .order('release_date', desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def parse_args():
    parser = argparse.ArgumentParser(description='Export baseline capability score snapshot')
    parser.add_argument('--out-prefix', default='pipeline/artifacts/score_snapshot')
    parser.add_argument('--limit', type=int, default=5000)
    return parser.parse_args()


def main():
    args = parse_args()
    rows = fetch_published_versions(max(1, args.limit))
    flat_rows = flatten_versions(rows)

    os.makedirs(os.path.dirname(args.out_prefix), exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    json_path = f'{args.out_prefix}_{timestamp}.json'
    csv_path = f'{args.out_prefix}_{timestamp}.csv'

    write_snapshot_json(json_path, flat_rows)
    write_snapshot_csv(csv_path, flat_rows)

    print(f'Exported {len(flat_rows)} score rows')
    print(f'JSON: {json_path}')
    print(f'CSV:  {csv_path}')


if __name__ == '__main__':
    main()

