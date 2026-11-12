import base64
import importlib.util
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch

path = Path(__file__).resolve().parents[1] / 'create-isolated-frontend.py'
spec = importlib.util.spec_from_file_location('create_qa', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CreateIsolatedFrontendTest(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.branch = 'qa-' + self.sha[:12] + '-1234abcd'
        self.calls = []
        self.info = {'name':self.branch, 'basic':True, 'auto':False,
                     'api':'https://api-staging.herpfree.co.kr',
                     'origin':f'https://{self.branch}.d2bcg3vnlv5hkh.amplifyapp.com'}

    def run_git(self, args, root):
        if args[:3] == ['git', 'remote', 'get-url']:
            return 'https://github.com/jeffyun3061/herfree-platform.git\n'
        if args[:3] == ['git', 'rev-parse', 'HEAD']:
            return self.sha + '\n'
        return self.sha + '\t' + args[-1] + '\n'

    def lookup(self, *args):
        return '439777528445' if args[:2] == ('sts', 'get-caller-identity') else self.info

    def invoke(self, **overrides):
        args = dict(branch=self.branch, sha=self.sha, pr='195', username='qa-user',
                    password='safe-qa-password-1234', root=Path('.'), run=self.run_git,
                    lookup=self.lookup, create=self.calls.append)
        args.update(overrides)
        return module.prepare(**args)

    def test_creates_only_a_protected_non_building_branch(self):
        result = self.invoke()
        self.assertEqual(result, {'protectedBranchCreated':True, 'buildStarted':False, 'promotionAllowed':False})
        request, = self.calls
        self.assertEqual(request['branchName'], self.branch)
        self.assertTrue(request['enableBasicAuth'])
        self.assertFalse(request['enableAutoBuild'])
        self.assertEqual(base64.b64decode(request['basicAuthCredentials']).decode(), 'qa-user:safe-qa-password-1234')

    def test_rejects_unsafe_inputs_before_creation(self):
        for value in ({'branch':'main'}, {'pr':'0'}, {'password':'short'}, {'username':'a:b'}):
            with self.subTest(value=value), self.assertRaises(module.preflight.Refused):
                self.invoke(**value)
        self.assertEqual(self.calls, [])

    def test_rejects_wrong_account_before_creation(self):
        with self.assertRaisesRegex(module.preflight.Refused, 'ACCOUNT_MISMATCH'):
            self.invoke(lookup=lambda *args: 'other')
        self.assertEqual(self.calls, [])

    def test_rejects_a_different_remote_candidate(self):
        def different_remote(args, root):
            if args[:3] == ['git', 'ls-remote', '--exit-code']:
                return 'b' * 40 + '\t' + args[-1] + '\n'
            return self.run_git(args, root)
        with self.assertRaisesRegex(module.preflight.Refused, 'REMOTE_COMMIT_MISMATCH'):
            self.invoke(run=different_remote)
        self.assertEqual(self.calls, [])

    def test_requires_readback_after_creation(self):
        self.info['basic'] = False
        with self.assertRaisesRegex(module.preflight.Refused, 'CREATED_BRANCH_REQUIRES_MANUAL_REVIEW'):
            self.invoke()
        self.assertEqual(len(self.calls), 1)

    def test_current_main_requires_locked_branch_before_creation_and_after(self):
        protection = {key: {'enabled': value} for key, value in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        checks = []
        def lookup(branch):
            checks.append(branch)
            return protection
        result = self.invoke(pr=None, protection_lookup=lookup)
        self.assertTrue(result['protectedBranchCreated'])
        self.assertEqual(checks, [self.branch, self.branch])
        self.calls.clear()
        protection['lock_branch']['enabled'] = False
        with self.assertRaisesRegex(module.preflight.Refused, 'BRANCH_PROTECTION_REQUIRED'):
            self.invoke(pr=None, protection_lookup=lookup)
        self.assertEqual(self.calls, [])

    def test_current_main_rejects_unavailable_branch_protection(self):
        with self.assertRaisesRegex(module.preflight.Refused, 'BRANCH_PROTECTION_REQUIRED'):
            self.invoke(pr=None)
        self.assertEqual(self.calls, [])

    def test_pr_206_requires_locked_branch_before_creation(self):
        with self.assertRaisesRegex(module.preflight.Refused, 'BRANCH_PROTECTION_REQUIRED'):
            self.invoke(pr='206')
        self.assertEqual(self.calls, [])
        locked = {key: {'enabled': value} for key, value in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        self.assertTrue(self.invoke(pr='206', protection_lookup=lambda _: locked)['protectedBranchCreated'])

    def test_current_main_change_after_creation_requires_review(self):
        protection = {key: {'enabled': value} for key, value in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        def create(request):
            self.calls.append(request)
            protection['lock_branch']['enabled'] = False
        with self.assertRaisesRegex(module.preflight.Refused, 'CREATED_BRANCH_REQUIRES_MANUAL_REVIEW'):
            self.invoke(pr=None, protection_lookup=lambda _: protection, create=create)
        self.assertEqual(len(self.calls), 1)

    @unittest.skipIf(os.name != 'posix', 'requires POSIX file permissions')
    def test_request_file_is_private_and_removed_without_secret_arguments(self):
        seen = []
        def command(args, root):
            path = Path(args[args.index('--cli-input-json') + 1][7:])
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(json.loads(path.read_text())['basicAuthCredentials'], 'sensitive-value')
            self.assertNotIn('sensitive-value', ' '.join(args))
            seen.append(path)
        with patch.object(module.preflight, 'command', side_effect=command):
            module.create_branch({'basicAuthCredentials':'sensitive-value'})
        self.assertEqual(len(seen), 1)
        self.assertFalse(seen[0].exists())


if __name__ == '__main__':
    unittest.main()
