import copy
import json
import subprocess
import sys
import unittest
from pathlib import Path

from infra.scripts.verify_release_qa_branch import VerificationError, verify_release_qa_branch, verify_release_image


class ReleaseQaBranchTest(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.branch = 'qa-' + self.sha[:12] + '-' + self.sha[:8]
        self.app = 'd2bcg3vnlv5hkh'
        self.api = 'https://api-staging.herpfree.co.kr'
        self.origin = f'https://{self.branch}.{self.app}.amplifyapp.com'
        self.protection = {k: {'enabled': v} for k, v in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        self.amplify = {'branchName': self.branch, 'enableBasicAuth': True, 'enableAutoBuild': False,
                        'environmentVariables': {'API_REWRITE_TARGET': self.api,
                                                 'NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN': self.origin}}
        self.job = {'status': 'SUCCEED', 'commitId': self.sha}
        self.digest = 'sha256:' + 'c' * 64
        self.image = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@' + self.digest

    def verify(self, **overrides):
        values = dict(sha=self.sha, branch=self.branch, main_sha=self.sha, branch_sha=self.sha,
                      protection=copy.deepcopy(self.protection), amplify=copy.deepcopy(self.amplify),
                      latest_job=copy.deepcopy(self.job), app_id=self.app, api_origin=self.api)
        values.update(overrides)
        return verify_release_qa_branch(**values)

    def test_valid_locked_exact_branch(self):
        self.assertEqual(self.verify(), self.origin)

    def test_ref_or_build_drift_fails(self):
        for changes in ({'main_sha': 'b' * 40}, {'branch_sha': 'b' * 40},
                        {'latest_job': {'status': 'SUCCEED', 'commitId': 'HEAD'}},
                        {'latest_job': {'status': 'FAILED', 'commitId': self.sha}}):
            with self.subTest(changes=changes), self.assertRaises(VerificationError):
                self.verify(**changes)

    def test_missing_or_weakened_protection_fails(self):
        for key in self.protection:
            value = copy.deepcopy(self.protection)
            value[key]['enabled'] = not value[key]['enabled']
            with self.subTest(key=key), self.assertRaises(VerificationError):
                self.verify(protection=value)
        with self.assertRaises(VerificationError):
            self.verify(protection={})

    def test_wrong_auth_origin_or_staging_target_fails(self):
        for key, value in [('enableBasicAuth', False), ('enableAutoBuild', True)]:
            branch = copy.deepcopy(self.amplify); branch[key] = value
            with self.subTest(key=key), self.assertRaises(VerificationError):
                self.verify(amplify=branch)
        branch = copy.deepcopy(self.amplify)
        branch['environmentVariables']['API_REWRITE_TARGET'] = 'https://api.herpfree.co.kr'
        with self.assertRaises(VerificationError):
            self.verify(amplify=branch)

    def test_command_fails_closed_without_echoing_sensitive_input(self):
        script = Path(__file__).resolve().parents[1] / 'verify_release_qa_branch.py'
        payload = {'sha': self.sha, 'branch': self.branch, 'main_sha': self.sha,
                   'branch_sha': self.sha, 'protection': self.protection,
                   'amplify': self.amplify, 'latest_job': self.job,
                   'app_id': self.app, 'api_origin': self.api, 'image': self.image,
                   'tag_digest': self.digest, 'mutability': 'IMMUTABLE'}
        result = subprocess.run([sys.executable, str(script)], input=json.dumps(payload),
                                text=True, capture_output=True, check=False)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(json.loads(result.stdout), {'verified': True, 'origin': self.origin,
                                                      'promotionAllowed': False})
        payload['amplify']['enableBasicAuth'] = False
        payload['amplify']['sensitive'] = 'never-log-this'
        result = subprocess.run([sys.executable, str(script)], input=json.dumps(payload),
                                text=True, capture_output=True, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('never-log-this', result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stderr), {'verified': False})

    def test_release_image_requires_immutable_matching_tag(self):
        verify_release_image(self.sha, self.image, self.digest, 'IMMUTABLE')
        for image, digest, mutability in (
                (self.image, 'sha256:' + 'd' * 64, 'IMMUTABLE'),
                (self.image, self.digest, 'MUTABLE'),
                (self.image.replace('herfree-api', 'another-repo'), self.digest, 'IMMUTABLE'),
                (self.image + 'extra', self.digest, 'IMMUTABLE')):
            with self.subTest(image=image, mutability=mutability), self.assertRaises(VerificationError):
                verify_release_image(self.sha, image, digest, mutability)


if __name__ == '__main__':
    unittest.main()
