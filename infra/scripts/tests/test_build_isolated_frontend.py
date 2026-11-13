import importlib.util
import json
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'build-isolated-frontend.py'
spec = importlib.util.spec_from_file_location('build_qa', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BuildIsolatedFrontendTest(unittest.TestCase):
    def setUp(self):
        self.account = module.ACCOUNT
        self.info = {'name':module.BRANCH, 'basic':True, 'auto':False, 'api':module.API,
                     'origin':f'https://{module.BRANCH}.{module.APP}.amplifyapp.com'}
        self.jobs = []
        self.summary = {'id':'42', 'status':'SUCCEED', 'commit':module.SHA}
        self.submitted = 0
        self.remote_sha = module.SHA

    def git(self, args, root):
        if args[:3] == ['git', 'remote', 'get-url']:
            return 'https://github.com/jeffyun3061/herfree-platform.git\n'
        if args[:3] == ['git', 'rev-parse', 'HEAD']:
            return module.SHA + '\n'
        return self.remote_sha + '\t' + args[-1] + '\n'

    def lookup(self, *args):
        if args[:2] == ('sts', 'get-caller-identity'): return self.account
        if args[:2] == ('amplify', 'get-branch'): return self.info
        if args[:2] == ('amplify', 'list-jobs'): return self.jobs
        if args[:2] == ('amplify', 'get-job'): return self.summary
        raise AssertionError('unexpected AWS operation')

    def submit(self):
        self.submitted += 1
        return {'id':'42'}

    def start(self):
        return module.start(Path('.'), self.git, self.lookup, self.submit)

    def test_starts_exact_protected_candidate_without_claiming_release(self):
        result = self.start()
        self.assertEqual(result, {'buildStarted':True, 'jobId':'42', 'buildVerified':False, 'promotionAllowed':False})
        self.assertEqual(self.submitted, 1)

    def test_reuses_successful_build_without_starting_another(self):
        self.jobs = [{'id':'42', 'status':'SUCCEED', 'commit':module.SHA}]
        result = self.start()
        self.assertEqual(result['existingJobId'], '42')
        self.assertFalse(result['buildStarted'])
        self.assertFalse(result['buildVerified'])
        self.assertEqual(self.submitted, 0)

    def test_rejects_active_job_even_if_not_first(self):
        self.jobs = [{'id':'42', 'status':'FAILED', 'commit':module.SHA},
                     {'id':'41', 'status':'RUNNING', 'commit':module.SHA}]
        with self.assertRaisesRegex(module.preflight.Refused, 'BUILD_ALREADY_ACTIVE'):
            self.start()
        self.assertEqual(self.submitted, 0)

    def test_wrong_remote_or_unprotected_branch_never_starts(self):
        for change in ('remote', 'basic', 'auto', 'api', 'account'):
            with self.subTest(change=change):
                self.setUp()
                if change == 'remote': self.remote_sha = 'b' * 40
                if change == 'basic': self.info['basic'] = False
                if change == 'auto': self.info['auto'] = True
                if change == 'api': self.info['api'] = 'https://production.example'
                if change == 'account': self.account = 'other'
                with self.assertRaises(module.preflight.Refused): self.start()
                self.assertEqual(self.submitted, 0)

    def test_successful_job_requires_exact_commit_not_head(self):
        self.assertTrue(module.inspect('42', Path('.'), self.git, self.lookup)['buildVerified'])
        self.summary['commit'] = 'HEAD'
        with self.assertRaisesRegex(module.preflight.Refused, 'BUILD_COMMIT_UNVERIFIED'):
            module.inspect('42', Path('.'), self.git, self.lookup)

    def test_pending_and_failed_jobs_do_not_approve_promotion(self):
        for status in ('PENDING', 'RUNNING', 'FAILED', 'CANCELLED'):
            self.summary['status'] = status
            result = module.inspect('42', Path('.'), self.git, self.lookup)
            self.assertFalse(result['buildVerified'])
            self.assertFalse(result['promotionAllowed'])

    def test_ref_change_after_submit_is_not_reported_as_verified(self):
        def submit_then_change_ref():
            self.submitted += 1
            self.remote_sha = 'b' * 40
            return {'id':'42'}
        with self.assertRaisesRegex(module.preflight.Refused, 'REMOTE_COMMIT_MISMATCH'):
            module.start(Path('.'), self.git, self.lookup, submit_then_change_ref)
        self.assertEqual(self.submitted, 1)

    def test_ambiguous_start_result_is_not_automatically_retried(self):
        with self.assertRaisesRegex(module.preflight.Refused, 'START_RESULT_UNKNOWN'):
            module.start(Path('.'), self.git, self.lookup, lambda: {'id':42})

    def test_main_build_requires_locked_branch_and_checks_again_after_submit(self):
        protection = {key: {'enabled': value} for key, value in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        checks = []
        def locked(branch):
            checks.append(branch)
            return protection
        result = module.start(Path('.'), self.git, self.lookup, self.submit,
                              module.BRANCH, module.SHA, None, locked)
        self.assertTrue(result['buildStarted'])
        self.assertEqual(checks, [module.BRANCH, module.BRANCH])
        self.submitted = 0
        protection['lock_branch']['enabled'] = False
        with self.assertRaisesRegex(module.preflight.Refused, 'BRANCH_PROTECTION_REQUIRED'):
            module.start(Path('.'), self.git, self.lookup, self.submit,
                         module.BRANCH, module.SHA, None, locked)
        self.assertEqual(self.submitted, 0)

    def test_pr_206_cannot_build_without_locked_branch(self):
        with self.assertRaisesRegex(module.preflight.Refused, 'BRANCH_PROTECTION_REQUIRED'):
            module.start(Path('.'), self.git, self.lookup, self.submit,
                         module.BRANCH, module.SHA, '206', None)
        self.assertEqual(self.submitted, 0)

    def test_main_build_checks_protection_again_after_ambiguous_change(self):
        protection = {key: {'enabled': value} for key, value in {
            'lock_branch': True, 'enforce_admins': True,
            'allow_force_pushes': False, 'allow_deletions': False}.items()}
        def change_lock():
            protection['lock_branch']['enabled'] = False
            return self.submit()
        with self.assertRaisesRegex(module.preflight.Refused, 'BRANCH_PROTECTION_REQUIRED'):
            module.start(Path('.'), self.git, self.lookup, change_lock,
                         module.BRANCH, module.SHA, None, lambda _: protection)
        self.assertEqual(self.submitted, 1)

    def test_invalid_job_id_never_queries_aws(self):
        with self.assertRaisesRegex(module.preflight.Refused, 'INVALID_JOB_ID'):
            module.inspect('../other', Path('.'), self.git, lambda *args: self.fail('AWS was contacted'))

    def test_proposed_build_policy_is_scoped_to_one_qa_branch(self):
        policy_path = path.parents[1] / 'aws' / 'isolated-qa-build-policy.proposed.json'
        policy = json.loads(policy_path.read_text())
        statements = policy['Statement']
        branch_arn = f'arn:aws:amplify:ap-northeast-2:{module.ACCOUNT}:apps/{module.APP}/branches/{module.BRANCH}'
        self.assertEqual(len(statements), 2)
        self.assertEqual(set(statements[0]['Action']), {'amplify:GetBranch', 'amplify:ListJobs'})
        self.assertEqual(statements[0]['Resource'], branch_arn)
        self.assertEqual(set(statements[1]['Action']), {'amplify:StartJob', 'amplify:GetJob'})
        self.assertEqual(statements[1]['Resource'], branch_arn + '/jobs/*')

    def test_proposed_git_branch_lock_does_not_enable_pushes(self):
        policy_path = path.parents[1] / 'aws' / 'isolated-qa-git-protection.proposed.json'
        policy = json.loads(policy_path.read_text())
        self.assertTrue(policy['lock_branch'])
        self.assertTrue(policy['enforce_admins'])
        self.assertFalse(policy['allow_force_pushes'])
        self.assertFalse(policy['allow_deletions'])


if __name__ == '__main__':
    unittest.main()
