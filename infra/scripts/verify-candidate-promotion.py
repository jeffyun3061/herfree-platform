#!/usr/bin/env python3
"""Inspect evidence for a tested PR tree; never tag or deploy images.

This checker is not an authorization boundary. Its caller must independently
trust the tested workflow and scripts, protect the execution environment, and
recheck the actual ECR digest and current main before performing any mutation.
"""
import argparse
import json
import re
import subprocess
import sys

SHA = re.compile(r"^[a-f0-9]{40}$")
REPO = "jeffyun3061/herfree-platform"
WORKFLOW = ".github/workflows/staging-preflight.yml"
REQUIRED_STEPS = (
    "Prepare isolated QA frontend", "Build exact isolated QA frontend",
    "Build exact candidate image if absent", "Scan candidate image",
    "Resolve candidate digest and check isolation", "Start only a stopped staging instance",
    "Test and restore isolated staging", "Stop staging after verified restoration",
)
IMAGE_PREFIX = "439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@"
BOOTSTRAP_FILES = frozenset({
    ".github/workflows/verify-promotion-evidence.yml",
    ".github/workflows/promote-tested-pr206.yml",
    "infra/scripts/verify-candidate-promotion.py",
    "infra/scripts/test_candidate_promotion.py",
    "infra/scripts/promote-tested-pr206.sh",
    "infra/tests/test-promote-tested-pr206.sh",
})


def require(condition, code):
    if not condition:
        raise ValueError(code)


def verify(pr, run, jobs, candidate_sha, main_sha, candidate_tree, main_tree, bootstrap_verified=False,
           pr_head_sha=None, pr_head_tree=None, ancestry_verified=False):
    pr_head_sha = pr_head_sha or candidate_sha
    pr_head_tree = pr_head_tree or candidate_tree
    require(all(SHA.fullmatch(s or "") for s in (candidate_sha, main_sha, candidate_tree, main_tree,
                                                 pr_head_sha, pr_head_tree)), "INVALID_OBJECT_ID")
    require(pr.get("merged") is True and pr.get("state") == "closed", "PR_NOT_MERGED")
    require(pr.get("base", {}).get("ref") == "main" and pr.get("head", {}).get("sha") == pr_head_sha,
            "PR_MISMATCH")
    require(pr.get("head", {}).get("repo", {}).get("full_name") == REPO, "UNTRUSTED_PR_SOURCE")
    require(pr.get("merge_commit_sha") == main_sha, "MAIN_NOT_PR_MERGE")
    require(pr_head_tree == main_tree, "MERGED_PR_TREE_MISMATCH")
    require(pr_head_sha == candidate_sha or ancestry_verified is True, "TESTED_COMMIT_NOT_ANCESTOR")
    require(candidate_tree == main_tree or bootstrap_verified is True, "TREE_MISMATCH")
    require(run.get("status") == "completed" and run.get("conclusion") == "success", "RUN_NOT_SUCCESSFUL")
    require(run.get("event") == "workflow_dispatch" and run.get("path") == WORKFLOW,
            "UNTRUSTED_WORKFLOW")
    require(run.get("head_sha") == candidate_sha and run.get("head_branch") == "codex/verified-qa-staging",
            "RUN_COMMIT_MISMATCH")
    require(run.get("repository", {}).get("full_name") == REPO
            and run.get("head_repository", {}).get("full_name") == REPO, "UNTRUSTED_RUN_SOURCE")
    require(isinstance(jobs, list) and len(jobs) == 1, "UNEXPECTED_JOBS")
    job = jobs[0]
    require(job.get("name") == "candidate" and job.get("status") == "completed"
            and job.get("conclusion") == "success", "CANDIDATE_JOB_FAILED")
    steps = job.get("steps")
    require(isinstance(steps, list), "MISSING_STEPS")
    for name in REQUIRED_STEPS:
        found = [step for step in steps if step.get("name") == name]
        require(len(found) == 1 and found[0].get("status") == "completed"
                and found[0].get("conclusion") == "success", "REQUIRED_STEP_FAILED")
    return {"candidate": candidate_sha, "main": main_sha, "tree": main_tree,
            "runId": run.get("id"), "evidenceVerified": True, "promotionPerformed": False}


def extract_verified_digest(log, candidate_sha):
    """Require both the published manifest and QA target to identify one digest.

    Legacy runs without a push line fail closed; they need a signed attestation
    or a new run with explicit immutable-image evidence.
    """
    require(SHA.fullmatch(candidate_sha or "") is not None, "INVALID_COMMIT")
    digest_pattern = r"sha256:[a-f0-9]{64}"
    published = set(re.findall(re.escape(candidate_sha) + r": digest: (" + digest_pattern + r") size: [0-9]+", log))
    tested = set(re.findall(r"QA_IMAGE:\s*" + re.escape(IMAGE_PREFIX) + "(" + digest_pattern + ")", log))
    require(len(published) == 1 and published == tested, "IMAGE_EVIDENCE_MISMATCH")
    return next(iter(published))


def call(*args):
    return subprocess.run(args, check=True, text=True, encoding="utf-8", capture_output=True, timeout=30).stdout.strip()


def verify_bootstrap_changes(candidate, main_sha, git=call):
    """Accept only newly added audit files inherited unchanged from main's parent."""
    raw = git("git", "diff", "--name-status", "--no-renames", candidate, main_sha, "--")
    changes = [line.split("\t", 1) for line in raw.splitlines()]
    require(len(changes) > 0 and all(len(row) == 2 and row[0] == "A" and row[1] in BOOTSTRAP_FILES
                                      for row in changes), "TREE_MISMATCH")
    require(len({row[1] for row in changes}) == len(changes), "TREE_MISMATCH")
    parent = git("git", "rev-parse", f"{main_sha}^1")
    require(SHA.fullmatch(parent or "") is not None, "INVALID_PARENT")
    for _, path in changes:
        inherited = git("git", "rev-parse", f"{parent}:{path}")
        current = git("git", "rev-parse", f"{main_sha}:{path}")
        require(SHA.fullmatch(inherited or "") is not None and inherited == current, "GATE_CHANGED_BY_PR")
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pr", type=int, required=True)
    parser.add_argument("--run", type=int, required=True)
    parser.add_argument("--tested-sha", help="Previously tested ancestor, if the PR was updated from main")
    args = parser.parse_args()
    try:
        require(args.pr > 0 and args.run > 0, "INVALID_INPUT")
        pr = json.loads(call("gh", "api", f"repos/{REPO}/pulls/{args.pr}"))
        run = json.loads(call("gh", "api", f"repos/{REPO}/actions/runs/{args.run}"))
        require(run.get("id") == args.run, "RUN_ID_MISMATCH")
        attempt = run.get("run_attempt")
        require(isinstance(attempt, int) and attempt > 0, "INVALID_RUN_ATTEMPT")
        jobs = json.loads(call("gh", "api", f"repos/{REPO}/actions/runs/{args.run}/attempts/{attempt}/jobs?per_page=100"))
        require(jobs.get("total_count") == len(jobs.get("jobs", [])), "INCOMPLETE_JOBS")
        pr_head = pr.get("head", {}).get("sha", "")
        candidate = args.tested_sha or pr_head
        main_sha = call("git", "rev-parse", "refs/remotes/origin/main")
        require(all(SHA.fullmatch(s or "") for s in (candidate, pr_head, main_sha)), "INVALID_COMMIT")
        if pr_head != candidate:
            call("git", "merge-base", "--is-ancestor", candidate, pr_head)
        candidate_tree = call("git", "rev-parse", f"{candidate}^{{tree}}")
        pr_head_tree = call("git", "rev-parse", f"{pr_head}^{{tree}}")
        main_tree = call("git", "rev-parse", f"{main_sha}^{{tree}}")
        bootstrap_verified = (candidate_tree != main_tree
                              and verify_bootstrap_changes(candidate, main_sha))
        result = verify(pr, run, jobs["jobs"], candidate, main_sha, candidate_tree, main_tree, bootstrap_verified,
                        pr_head, pr_head_tree, pr_head != candidate)
        result["inheritedAuditFilesOnly"] = bootstrap_verified
        log = call("gh", "run", "view", str(args.run), "--repo", REPO, "--attempt", str(attempt), "--log")
        result["testedImageDigest"] = extract_verified_digest(log, candidate)
        remote = call("git", "ls-remote", "origin", "refs/heads/main").split()
        require(len(remote) == 2 and remote[0] == main_sha and remote[1] == "refs/heads/main", "MAIN_CHANGED")
        final_run = json.loads(call("gh", "api", f"repos/{REPO}/actions/runs/{args.run}"))
        require(final_run.get("run_attempt") == attempt and final_run.get("status") == "completed"
                and final_run.get("conclusion") == "success" and final_run.get("head_sha") == candidate,
                "RUN_CHANGED")
        print(json.dumps(result))
    except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError, UnicodeError) as error:
        print(json.dumps({"evidenceVerified": False, "promotionPerformed": False,
                          "error": str(error) if isinstance(error, ValueError) else "LOOKUP_FAILED"}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
