#!/usr/bin/env python3
"""Reuse an exact successful/in-progress build and serialize with Amplify webhooks.

RELEASE builds the branch's latest commit, so commit-id alone is not a pin.
Verify the remote branch before starting, while waiting and after completion.
Never cancel another actor's job or accept an ambiguous HEAD as evidence.
"""
import argparse
import json
import re
import subprocess
import time

ACTIVE = {"CREATED", "PENDING", "PROVISIONING", "RUNNING", "CANCELLING"}


def aws(*args):
    result = subprocess.run(["aws", "amplify", *args, "--output", "json"],
                            capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def branch_head(branch):
    result = subprocess.run(["git", "ls-remote", "--exit-code", "origin", "refs/heads/" + branch],
                            capture_output=True, text=True, check=True)
    return result.stdout.split()[0]


def release(app, branch, sha, call=aws, head=branch_head, sleep=time.sleep, attempts=240):
    if not re.fullmatch(r"d[a-z0-9]{1,19}", app) or branch not in {"main", "develop"} or not re.fullmatch(r"[a-f0-9]{40}", sha):
        raise ValueError("Explicit application, main/develop branch and commit SHA are required")
    options = ["--app-id", app, "--branch-name", branch]
    owned = None
    for _ in range(attempts):
        if head(branch) != sha:
            raise RuntimeError("Branch advanced; refusing to deploy or certify a stale release")
        jobs = call("list-jobs", *options, "--max-results", "10").get("jobSummaries", [])
        active = [job for job in jobs if job["status"] in ACTIVE]
        # Wait even if a previous matching build succeeded: another active job
        # could overwrite that version. A finite timeout leaves that job alone.
        if active:
            sleep(10)
            continue
        latest = jobs[0] if jobs else None
        if latest and latest["status"] == "SUCCEED" and latest.get("commitId") == sha:
            if head(branch) != sha:
                raise RuntimeError("Branch advanced after the build")
            return {"jobId": latest["jobId"], "commit": sha, "status": "SUCCEED", "reused": owned is None}
        if owned:
            raise RuntimeError("Requested build failed, was superseded or lacks exact commit evidence")
        try:
            result = call("start-job", *options, "--job-type", "RELEASE", "--commit-id", sha)
            owned = result["jobSummary"]["jobId"]
        except subprocess.CalledProcessError as error:
            # An automatic webhook can win the race between list and start.
            if "LimitExceededException" not in (error.stderr or ""):
                raise
        sleep(10)
    raise TimeoutError("Amplify validation timed out; inspect pending jobs before retrying")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ["app", "branch", "sha"]:
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args()
    print(json.dumps(release(args.app, args.branch, args.sha)))


if __name__ == "__main__":
    main()
