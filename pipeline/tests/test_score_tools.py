import os
import tempfile
import unittest

from pipeline.score_tools import (
    compute_score_diff,
    flatten_versions,
    read_snapshot_json,
    write_snapshot_json,
)


class ScoreToolsTests(unittest.TestCase):
    def test_flatten_versions_ignores_non_numeric_scores(self):
        rows = [{
            'id': 'v1',
            'version_number': '1.0',
            'release_date': '2026-01-01',
            'agent': {'slug': 'alpha', 'name': 'Alpha'},
            'capabilities': {'coding': 8, 'reasoning': 'high', 'memory': None},
        }]
        flat = flatten_versions(rows)
        self.assertEqual(len(flat), 1)
        self.assertEqual(flat[0].capability, 'coding')
        self.assertEqual(flat[0].score, 8.0)

    def test_snapshot_roundtrip(self):
        rows = [{
            'id': 'v1',
            'version_number': '1.0',
            'release_date': '2026-01-01',
            'agent': {'slug': 'alpha', 'name': 'Alpha'},
            'capabilities': {'coding': 8, 'reasoning': 7},
        }]
        flat = flatten_versions(rows)

        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, 'snapshot.json')
            write_snapshot_json(path, flat)
            loaded = read_snapshot_json(path)
            self.assertEqual(len(loaded), len(flat))
            self.assertEqual(loaded[0].key, flat[0].key)

    def test_compute_score_diff(self):
        before = flatten_versions([{
            'id': 'v1',
            'version_number': '1.0',
            'release_date': '2026-01-01',
            'agent': {'slug': 'alpha', 'name': 'Alpha'},
            'capabilities': {'coding': 8, 'reasoning': 7},
        }])
        after = flatten_versions([{
            'id': 'v1',
            'version_number': '1.0',
            'release_date': '2026-01-01',
            'agent': {'slug': 'alpha', 'name': 'Alpha'},
            'capabilities': {'coding': 9, 'reasoning': 7, 'memory': 6},
        }])
        report = compute_score_diff(before, after)
        self.assertEqual(report['summary']['changed_rows'], 1)
        self.assertEqual(report['summary']['added_rows'], 1)
        self.assertEqual(report['summary']['removed_rows'], 0)
        self.assertAlmostEqual(report['summary']['max_abs_delta'], 1.0)


if __name__ == '__main__':
    unittest.main()

