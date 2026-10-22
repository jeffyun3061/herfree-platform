import importlib.util
from pathlib import Path
import subprocess
import unittest

spec = importlib.util.spec_from_file_location("amplify_release", Path(__file__).resolve().parents[1] / "release-amplify.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AmplifyReleaseTests(unittest.TestCase):
    sha = "a" * 40

    def job(self, status="SUCCEED", commit=None):
        return {"jobId": "42", "status": status, "commitId": commit or self.sha}

    def run_release(self, snapshots, start_error=None, head=None):
        calls = []
        def aws(action, *args):
            calls.append(action)
            if action == "list-jobs":
                return {"jobSummaries": snapshots.pop(0)}
            self.assertEqual(action, "start-job")
            if start_error:
                raise start_error
            return {"jobSummary": self.job("PENDING")}
        result = module.release("dtest", "develop", self.sha, aws, head or (lambda branch: self.sha), lambda seconds: None, attempts=4)
        return result, calls

    def test_reuses_latest_exact_build_without_a_new_chargeable_build(self):
        result, calls = self.run_release([[self.job()]])
        self.assertTrue(result["reused"])
        self.assertEqual(calls, ["list-jobs"])

    def test_waits_for_automatic_job_and_reuses_its_result(self):
        result, calls = self.run_release([[self.job("RUNNING")], [self.job()]])
        self.assertTrue(result["reused"])
        self.assertNotIn("start-job", calls)

    def test_webhook_race_does_not_fail_or_start_duplicate_jobs(self):
        error = subprocess.CalledProcessError(1, "aws", stderr="LimitExceededException")
        _, calls = self.run_release([[], [self.job("PENDING")], [self.job()]], start_error=error)
        self.assertEqual(calls.count("start-job"), 1)

    def test_missing_build_starts_once_and_waits_for_exact_success(self):
        result, calls = self.run_release([[], [self.job("RUNNING")], [self.job()]])
        self.assertFalse(result["reused"])
        self.assertEqual(calls.count("start-job"), 1)

    def test_failed_own_job_and_ambiguous_head_are_never_certified(self):
        for job in [self.job("FAILED"), self.job(commit="HEAD"), self.job(commit="b" * 40)]:
            with self.subTest(job=job), self.assertRaises(RuntimeError):
                self.run_release([[], [job]])

    def test_stale_branch_is_rejected_before_contacting_aws(self):
        with self.assertRaisesRegex(RuntimeError, "Branch advanced"):
            self.run_release([], head=lambda branch: "b" * 40)

    def test_active_job_timeout_never_cancels_another_release(self):
        with self.assertRaises(TimeoutError):
            self.run_release([[self.job("RUNNING")]] * 4)

    def test_unexpected_aws_error_fails_closed(self):
        with self.assertRaises(subprocess.CalledProcessError):
            self.run_release([[]], start_error=subprocess.CalledProcessError(1, "aws", stderr="AccessDenied"))


if __name__ == "__main__":
    unittest.main()
