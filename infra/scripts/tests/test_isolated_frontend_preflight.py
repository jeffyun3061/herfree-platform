import importlib.util
import json
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'verify-isolated-frontend.py'
spec = importlib.util.spec_from_file_location('isolated_frontend', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class IsolatedFrontendPreflightTest(unittest.TestCase):
    def setUp(self):
        self.account = '439777528445'
        self.app = 'd2bcg3vnlv5hkh'
        self.sha = 'a' * 40
        self.branch = 'qa-' + self.sha[:12] + '-1234abcd'
        self.api = 'https://api-staging.herpfree.co.kr'
        self.origin = f'https://{self.branch}.{self.app}.amplifyapp.com'
        self.branch_info = {'name':self.branch, 'basic':True, 'api':self.api, 'origin':self.origin}
        self.jobs = [{'status':'SUCCEED', 'commit':self.sha}]
        self.main_sha = self.sha
        self.qa_sha = self.sha
        self.guest_status = 401
        self.health_environment = 'staging'
        self.requests = []

    def run_command(self, args, root):
        if args[:3] == ['git', 'remote', 'get-url']:
            return 'https://github.com/jeffyun3061/herfree-platform.git\n'
        if args[:3] == ['git', 'rev-parse', 'HEAD']:
            return self.sha + '\n'
        ref = args[-1]
        value = self.main_sha if ref == 'refs/heads/main' else self.qa_sha
        return value + '\t' + ref + '\n'

    def lookup(self, *args):
        if args[:2] == ('sts', 'get-caller-identity'): return self.account
        if args[:2] == ('amplify', 'get-branch'): return self.branch_info
        if args[:2] == ('amplify', 'list-jobs'): return self.jobs
        raise AssertionError('unexpected lookup')

    def fetch(self, url, credentials):
        self.requests.append((url, credentials is not None))
        if url.endswith('/api/health'):
            return 200, json.dumps({'success':True, 'data':{'status':'UP', 'environment':self.health_environment}}).encode()
        return (self.guest_status if credentials is None else 200), b''

    def verify(self):
        return module.verify(self.account, self.app, self.branch, self.sha, self.api,
                             ('synthetic-user', 'synthetic-password'), Path('.'),
                             self.lookup, self.run_command, self.fetch)

    def refused(self, code):
        with self.assertRaisesRegex(module.Refused, '^' + code + '$'):
            self.verify()

    def test_verified_frontend_never_authorizes_promotion(self):
        result = self.verify()
        self.assertTrue(result['frontendPreflightPassed'])
        self.assertFalse(result['fullE2ePassed'])
        self.assertFalse(result['cleanupVerified'])
        self.assertFalse(result['promotionAllowed'])
        self.assertEqual(self.requests[0], (self.origin + '/', False))
        self.assertEqual(self.requests[1], (self.origin + '/', True))

    def test_untrusted_app_or_production_api_is_refused_before_credentials_are_sent(self):
        self.app = 'another-app'
        self.refused('INVALID_APP')
        self.assertEqual(self.requests, [])
        self.app = 'd2bcg3vnlv5hkh'
        self.api = 'https://api.herpfree.co.kr'
        self.refused('STAGING_API_REQUIRED')
        self.assertEqual(self.requests, [])

    def test_both_remote_main_and_qa_branch_must_point_to_exact_commit(self):
        self.main_sha = 'b' * 40
        self.refused('REMOTE_COMMIT_MISMATCH')
        self.main_sha = self.sha
        self.qa_sha = 'c' * 40
        self.refused('REMOTE_COMMIT_MISMATCH')

    def test_branch_must_be_protected_and_build_must_match(self):
        self.branch_info['basic'] = False
        self.refused('PROTECTED_BRANCH_MISMATCH')
        self.branch_info['basic'] = True
        self.jobs = [{'status':'SUCCEED', 'commit':'HEAD'}]
        self.refused('BUILD_MISMATCH')
        self.jobs = [{'status':'RUNNING', 'commit':self.sha}]
        self.refused('BUILD_MISMATCH')

    def test_public_frontend_and_nonstaging_health_are_rejected(self):
        self.guest_status = 200
        self.refused('ANONYMOUS_ACCESS_NOT_BLOCKED')
        self.guest_status = 401
        self.health_environment = 'production'
        self.refused('HEALTH_NOT_STAGING')

    def test_qa_branch_must_be_bound_to_commit(self):
        self.branch = 'qa-' + 'b' * 12 + '-1234abcd'
        self.refused('INVALID_BRANCH')
        self.assertEqual(self.requests, [])


if __name__ == '__main__':
    unittest.main()
