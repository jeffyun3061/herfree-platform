import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("promotion", Path(__file__).with_name("verify-candidate-promotion.py"))
promotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promotion)


class CandidateEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.candidate, self.main, self.tree = "a" * 40, "b" * 40, "c" * 40
        self.pr = {"merged": True, "state": "closed", "base": {"ref": "main"},
                   "head": {"sha": self.candidate, "repo": {"full_name": promotion.REPO}},
                   "merge_commit_sha": self.main}
        self.run = {"id": 123, "status": "completed", "conclusion": "success", "event": "workflow_dispatch",
                    "path": promotion.WORKFLOW, "head_sha": self.candidate,
                    "head_branch": "codex/verified-qa-staging", "repository": {"full_name": promotion.REPO},
                    "head_repository": {"full_name": promotion.REPO}}
        self.jobs = [{"name": "candidate", "status": "completed", "conclusion": "success", "steps": [
            {"name": n, "status": "completed", "conclusion": "success"} for n in promotion.REQUIRED_STEPS]}]

    def check(self, tree=None):
        return promotion.verify(self.pr, self.run, self.jobs, self.candidate, self.main, self.tree, tree or self.tree)

    def test_matching_evidence_does_not_perform_promotion(self):
        result = self.check()
        self.assertTrue(result["evidenceVerified"])
        self.assertFalse(result["promotionPerformed"])

    def test_different_tree_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "TREE_MISMATCH"):
            self.check("d" * 40)

    def test_unmerged_or_wrong_merge_rejected(self):
        self.pr["merged"] = False
        with self.assertRaisesRegex(ValueError, "PR_NOT_MERGED"):
            self.check()
        self.pr["merged"] = True
        self.pr["merge_commit_sha"] = "d" * 40
        with self.assertRaisesRegex(ValueError, "MAIN_NOT_PR_MERGE"):
            self.check()

    def test_untrusted_or_failed_run_rejected(self):
        for key, value in (("head_sha", "d" * 40), ("path", "evil.yml"),
                           ("event", "pull_request"), ("conclusion", "failure")):
            with self.subTest(key=key):
                old = copy.deepcopy(self.run[key])
                self.run[key] = value
                with self.assertRaises(ValueError):
                    self.check()
                self.run[key] = old

    def test_skipped_cleanup_or_additional_jobs_rejected(self):
        self.jobs[0]["steps"][-1]["conclusion"] = "skipped"
        with self.assertRaisesRegex(ValueError, "REQUIRED_STEP_FAILED"):
            self.check()
        self.jobs[0]["steps"][-1]["conclusion"] = "success"
        self.jobs.append(copy.deepcopy(self.jobs[0]))
        with self.assertRaisesRegex(ValueError, "UNEXPECTED_JOBS"):
            self.check()

    def test_image_requires_matching_published_and_tested_digests(self):
        digest = "sha256:" + "e" * 64
        log = (f"{self.candidate}: digest: {digest} size: 2208\n"
               f"  QA_IMAGE: {promotion.IMAGE_PREFIX}{digest}\n")
        self.assertEqual(promotion.extract_verified_digest(log, self.candidate), digest)
        with self.assertRaisesRegex(ValueError, "IMAGE_EVIDENCE_MISMATCH"):
            promotion.extract_verified_digest(log.replace(promotion.IMAGE_PREFIX + digest,
                                                         promotion.IMAGE_PREFIX + "sha256:" + "f" * 64),
                                                self.candidate)
        with self.assertRaisesRegex(ValueError, "IMAGE_EVIDENCE_MISMATCH"):
            promotion.extract_verified_digest(log.splitlines()[1], self.candidate)
        with self.assertRaisesRegex(ValueError, "IMAGE_EVIDENCE_MISMATCH"):
            promotion.extract_verified_digest(log + f"  QA_IMAGE: {promotion.IMAGE_PREFIX}sha256:{'f' * 64}\n",
                                                self.candidate)


if __name__ == "__main__":
    unittest.main()
