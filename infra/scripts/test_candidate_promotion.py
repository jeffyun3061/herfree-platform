import copy
import importlib.util
from pathlib import Path
import subprocess
import tempfile
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
        with self.assertRaisesRegex(ValueError, "MERGED_PR_TREE_MISMATCH"):
            self.check("d" * 40)

    def test_updated_pr_requires_exact_merged_tree_and_tested_ancestor(self):
        updated_head, merged_tree = "d" * 40, "e" * 40
        self.pr["head"]["sha"] = updated_head
        def check(tree=merged_tree, ancestor=True):
            return promotion.verify(self.pr, self.run, self.jobs, self.candidate, self.main,
                                    self.tree, merged_tree, True, updated_head, tree, ancestor)
        self.assertTrue(check()["evidenceVerified"])
        with self.assertRaisesRegex(ValueError, "MERGED_PR_TREE_MISMATCH"):
            check("f" * 40)
        with self.assertRaisesRegex(ValueError, "TESTED_COMMIT_NOT_ANCESTOR"):
            check(ancestor=False)

    def test_only_audit_fixes_after_the_release_are_accepted(self):
        new_main, new_tree = "d" * 40, "e" * 40
        def check(postmerge):
            return promotion.verify(self.pr, self.run, self.jobs, self.candidate, new_main,
                                    self.tree, new_tree, False, self.candidate, self.tree, False,
                                    self.main, self.tree, postmerge)
        with self.assertRaisesRegex(ValueError, "MAIN_CHANGED_AFTER_RELEASE"):
            check(False)
        self.assertTrue(check(True)["evidenceVerified"])
        name = "infra/scripts/promote-tested-pr206.sh"
        def git(*args):
            if args[1:3] == ("diff", "--name-status"):
                return "M\t" + name
            return ""
        self.assertTrue(promotion.verify_postmerge_changes(self.main, new_main, git))
        def changed_application(*args):
            if args[1:3] == ("diff", "--name-status"):
                return "M\tbackend/src/Main.java"
            return ""
        with self.assertRaisesRegex(ValueError, "MAIN_CHANGED_AFTER_RELEASE"):
            promotion.verify_postmerge_changes(self.main, new_main, changed_application)

    def test_bootstrap_only_inherits_audit_files_from_parent(self):
        gate = sorted(promotion.BOOTSTRAP_FILES)
        blob = "e" * 40
        parent = "f" * 40
        def git(*args):
            if args[1:3] == ("diff", "--name-status"):
                return "\n".join("A\t" + name for name in gate)
            if args[-1] == f"{self.main}^1":
                return parent
            return blob
        self.assertTrue(promotion.verify_bootstrap_changes(self.candidate, self.main, git))
        def changed_code(*args):
            if args[1:3] == ("diff", "--name-status"):
                return "M\tbackend/src/Main.java"
            return git(*args)
        with self.assertRaisesRegex(ValueError, "TREE_MISMATCH"):
            promotion.verify_bootstrap_changes(self.candidate, self.main, changed_code)
        def changed_gate(*args):
            if args[-1].startswith(self.main + ":"):
                return "d" * 40
            return git(*args)
        with self.assertRaisesRegex(ValueError, "GATE_CHANGED_BY_PR"):
            promotion.verify_bootstrap_changes(self.candidate, self.main, changed_gate)

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

    def test_real_git_history_only_allows_preexisting_audit_additions(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            def git(*args):
                return subprocess.run(args, cwd=root, capture_output=True, text=True, check=True).stdout.strip()
            git("git", "init", "-q")
            git("git", "config", "user.email", "qa@example.invalid")
            git("git", "config", "user.name", "QA")
            (root / "app.txt").write_text("base", encoding="utf-8")
            git("git", "add", ".")
            git("git", "commit", "-qm", "base")
            git("git", "checkout", "-qb", "candidate")
            (root / "app.txt").write_text("tested", encoding="utf-8")
            git("git", "add", ".")
            git("git", "commit", "-qm", "candidate")
            candidate = git("git", "rev-parse", "HEAD")
            git("git", "checkout", "-q", "--detach", "HEAD^1")
            for name in promotion.BOOTSTRAP_FILES:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("trusted audit file", encoding="utf-8")
            git("git", "add", ".")
            git("git", "commit", "-qm", "audit gate")
            git("git", "merge", "--no-ff", "--no-edit", "candidate")
            main = git("git", "rev-parse", "HEAD")
            git("git", "merge-base", "--is-ancestor", candidate, main)
            self.assertTrue(promotion.verify_bootstrap_changes(candidate, main, git))
            (root / "app.txt").write_text("different", encoding="utf-8")
            git("git", "add", ".")
            git("git", "commit", "-qm", "different app")
            with self.assertRaisesRegex(ValueError, "TREE_MISMATCH"):
                promotion.verify_bootstrap_changes(candidate, git("git", "rev-parse", "HEAD"), git)


if __name__ == "__main__":
    unittest.main()
