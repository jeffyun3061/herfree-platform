import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'propose-current-main-qa-policy.py'
spec = importlib.util.spec_from_file_location('qa_policy', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PolicyTest(unittest.TestCase):
    def test_only_exact_qa_branch_and_jobs_are_granted(self):
        sha = 'a' * 40
        branch = 'qa-' + sha[:12] + '-1234abcd'
        statements = module.propose(sha, branch)['Statement']
        arn = 'arn:aws:amplify:ap-northeast-2:439777528445:apps/d2bcg3vnlv5hkh/branches/' + branch
        self.assertEqual(statements[0]['Resource'], arn)
        self.assertEqual(set(statements[0]['Action']), {'amplify:CreateBranch', 'amplify:GetBranch', 'amplify:ListJobs'})
        self.assertEqual(statements[1]['Resource'], arn + '/jobs/*')
        self.assertEqual(set(statements[1]['Action']), {'amplify:StartJob', 'amplify:GetJob'})

    def test_invalid_or_different_branch_is_rejected(self):
        for sha, branch in (('a' * 40, 'main'), ('a' * 40, 'qa-' + 'b' * 12 + '-1234abcd'),
                            ('../../bad', 'qa-' + 'a' * 12 + '-1234abcd')):
            with self.subTest(branch=branch), self.assertRaises(ValueError):
                module.propose(sha, branch)


if __name__ == '__main__':
    unittest.main()
