import copy
import importlib.util
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
path = Path(__file__).resolve().parents[1] / 'verify-live-release-qa.py'
spec = importlib.util.spec_from_file_location('verify_live_release_qa', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LiveReleaseQaTest(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.branch = 'qa-' + self.sha[:12] + '-1234abcd'
        self.origin = f'https://{self.branch}.{module.APP}.amplifyapp.com'
        self.digest = 'sha256:' + 'b' * 64
        self.image = f'{module.ACCOUNT}.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@{self.digest}'
        self.main = self.sha
        self.qa = self.sha
        self.account = module.ACCOUNT
        self.protection = {key: {'enabled': value} for key, value in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        self.amplify = {'branchName': self.branch, 'enableBasicAuth': True, 'enableAutoBuild': False,
                        'environmentVariables': {'API_REWRITE_TARGET': module.API,
                                                 'NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN': self.origin}}
        self.jobs = [{'status': 'SUCCEED', 'commitId': self.sha}]
        self.calls = []

    def request(self, *args):
        self.calls.append(args)
        if args[0] == 'gh':
            if args[1].endswith('/protection'): return copy.deepcopy(self.protection)
            return {'commit': {'sha': self.main if args[1].endswith('/main') else self.qa}}
        if args[1:3] == ('sts', 'get-caller-identity'): return self.account
        if args[1:3] == ('amplify', 'get-branch'): return copy.deepcopy(self.amplify)
        if args[1:3] == ('amplify', 'list-jobs'): return copy.deepcopy(self.jobs)
        if args[1:3] == ('ecr', 'describe-images'): return self.digest
        if args[1:3] == ('ecr', 'describe-repositories'): return 'IMMUTABLE'
        raise AssertionError(args)

    def check(self):
        return module.check(self.sha, self.branch, self.image, self.request)

    def test_success_does_not_authorize_promotion(self):
        self.assertEqual(self.check(), {'verified': True, 'origin': self.origin, 'promotionAllowed': False})
        self.assertTrue(any('imageTag=' + self.sha in call for call in self.calls))

    def test_ref_drift_bad_account_and_unlocked_branch_fail_closed(self):
        for field, value in (('main', 'b' * 40), ('qa', 'b' * 40), ('account', 'wrong')):
            with self.subTest(field=field):
                old = getattr(self, field)
                setattr(self, field, value)
                with self.assertRaises(module.VerificationError): self.check()
                setattr(self, field, old)
        self.protection['lock_branch']['enabled'] = False
        with self.assertRaises(module.VerificationError): self.check()

    def test_bad_path_is_rejected_before_any_network_request(self):
        self.branch = '../../main'
        with self.assertRaises(module.VerificationError): self.check()
        self.assertEqual(self.calls, [])

    def test_stale_or_failed_amplify_build_is_rejected(self):
        for jobs in ([], [{'status': 'FAILED', 'commitId': self.sha}],
                     [{'status': 'SUCCEED', 'commitId': 'HEAD'}]):
            self.jobs = jobs
            with self.subTest(jobs=jobs), self.assertRaises(module.VerificationError): self.check()


if __name__ == '__main__':
    unittest.main()
