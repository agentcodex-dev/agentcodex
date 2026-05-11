import unittest

from pipeline.scoring import apply_scoring_mode


class ScoringTests(unittest.TestCase):
    def test_legacy_mode_keeps_scores(self):
        scores, meta = apply_scoring_mode({'coding': 8, 'reasoning': 7}, 'legacy')
        self.assertEqual(scores, {'coding': 8, 'reasoning': 7})
        self.assertEqual(meta['mode'], 'legacy')
        self.assertEqual(meta['score_adjustments'], [])

    def test_calibrated_mode_fills_missing(self):
        scores, meta = apply_scoring_mode({'coding': 8, 'reasoning': 6}, 'calibrated')
        self.assertIn('memory', scores)
        self.assertIn('speed', scores)
        self.assertEqual(meta['mode'], 'calibrated')
        self.assertGreaterEqual(len(meta['score_adjustments']), 1)

    def test_calibrated_mode_clamps_out_of_range(self):
        scores, meta = apply_scoring_mode({'coding': 99, 'reasoning': -1}, 'calibrated')
        self.assertEqual(scores['coding'], 10)
        self.assertEqual(scores['reasoning'], 1)
        reasons = {item['reason'] for item in meta['score_adjustments']}
        self.assertIn('out_of_range_clamped', reasons)


if __name__ == '__main__':
    unittest.main()

