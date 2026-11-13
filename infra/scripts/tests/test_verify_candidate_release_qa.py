import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
path = Path(__file__).resolve().parents[1] / 'verify-candidate-release-qa.py'
spec = importlib.util.spec_from_file_location('candidate_qa', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CandidateQaTest(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.pr = {'state': 'open', 'base': {'ref': 'main'},
                   'head': {'sha': self.sha, 'repo': {'full_name': 'jeffyun3061/herfree-platform'}}}
        self.responses = [self.pr, self.pr]

    def request(self, kind, *args):
        self.assertEqual((kind, args), ('gh', (module.PULL + '206',)))
        return self.responses.pop(0)

    def run_check(self):
        return module.check(206, self.sha, 'qa-' + self.sha[:12] + '-12345678', 'image', self.request)

    def test_open_exact_pr_never_authorizes_promotion(self):
        with patch.object(module.live, 'check', return_value={'verified': True, 'promotionAllowed': False}):
            self.assertFalse(self.run_check()['promotionAllowed'])

    def test_wrong_ref_or_fork_is_rejected(self):
        for key, value in [('sha', 'b' * 40), ('repo', {'full_name': 'other/repo'})]:
            with self.subTest(key=key):
                self.pr['head'][key] = value
                with self.assertRaises(module.VerificationError):
                    self.run_check()
                self.setUp()

    def test_changed_pr_during_checks_is_rejected(self):
        self.responses[1] = {**self.pr, 'state': 'closed'}
        with patch.object(module.live, 'check', return_value={'verified': True, 'promotionAllowed': False}):
            with self.assertRaises(module.VerificationError):
                self.run_check()

    def test_promotion_is_never_allowed(self):
        with patch.object(module.live, 'check', return_value={'verified': True, 'promotionAllowed': True}):
            with self.assertRaises(module.VerificationError):
                self.run_check()


if __name__ == '__main__':
    unittest.main()
