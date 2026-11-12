#!/usr/bin/env python3
"""Start or inspect one protected QA frontend build; never approve deployment.

Starting an Amplify job consumes build resources. A failed or ambiguous start
requires inspection of the branch's jobs before retrying; this tool never
retries a start call. RELEASE builds the latest branch revision, so callers
must verify the branch before and after the job and reject a mismatched build.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import re

spec = importlib.util.spec_from_file_location('preflight', Path(__file__).with_name('verify-isolated-frontend.py'))
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)
lock_spec = importlib.util.spec_from_file_location('release_lock', Path(__file__).with_name('verify_release_qa_branch.py'))
release_lock = importlib.util.module_from_spec(lock_spec)
lock_spec.loader.exec_module(release_lock)

ACCOUNT = '439777528445'
APP = 'd2bcg3vnlv5hkh'
BRANCH = 'qa-aaad889901ab-aaad8899'
SHA = 'aaad889901ab1a085c2d5dbd10d58b47f8edc38f'
API = 'https://api-staging.herpfree.co.kr'
PR = '195'


def check_branch(root, run, lookup, branch=BRANCH, sha=SHA, pr=PR, protection_lookup=None):
    origin = preflight.validate_inputs(ACCOUNT, APP, branch, sha, API)
    preflight.check_remote(sha, branch, root, run, pr)
    if pr is None:
        preflight.require(protection_lookup is not None, 'BRANCH_PROTECTION_REQUIRED')
        try:
            release_lock.verify_branch_lock(protection_lookup(branch))
        except release_lock.VerificationError:
            raise preflight.Refused('BRANCH_PROTECTION_REQUIRED') from None
    preflight.require(lookup('sts', 'get-caller-identity', '--query', 'Account') == ACCOUNT, 'ACCOUNT_MISMATCH')
    info = lookup('amplify', 'get-branch', '--app-id', APP, '--branch-name', branch,
                  '--query', 'branch.{name:branchName,basic:enableBasicAuth,auto:enableAutoBuild,api:environmentVariables.API_REWRITE_TARGET,origin:environmentVariables.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN}')
    preflight.require(info == {'name':branch, 'basic':True, 'auto':False, 'api':API, 'origin':origin},
                      'PROTECTED_BRANCH_MISMATCH')


def start(root, run, lookup, submit, branch=BRANCH, sha=SHA, pr=PR, protection_lookup=None):
    check_branch(root, run, lookup, branch, sha, pr, protection_lookup)
    jobs = lookup('amplify', 'list-jobs', '--app-id', APP, '--branch-name', branch,
                  '--query', 'jobSummaries[].{id:jobId,status:status,commit:commitId}')
    preflight.require(isinstance(jobs, list), 'JOB_LIST_INVALID')
    for job in jobs:
        preflight.require(isinstance(job, dict) and isinstance(job.get('id'), str)
                          and re.fullmatch(r'[0-9]+', job['id']) is not None,
                          'JOB_LIST_INVALID')
        preflight.require(job.get('status') in ('PENDING', 'PROVISIONING', 'RUNNING', 'CANCELLING',
                                                 'SUCCEED', 'FAILED', 'CANCELLED'), 'JOB_STATE_UNKNOWN')
        preflight.require(job['status'] not in ('PENDING', 'PROVISIONING', 'RUNNING', 'CANCELLING'),
                          'BUILD_ALREADY_ACTIVE')
    if jobs:
        job = jobs[0]
        if job.get('status') == 'SUCCEED' and job.get('commit') == sha:
            return {'buildStarted':False, 'existingJobId':job['id'], 'buildVerified':False, 'promotionAllowed':False}
    # A failed response may still have created a job; never retry automatically.
    response = submit()
    preflight.require(isinstance(response, dict) and isinstance(response.get('id'), str)
                      and re.fullmatch(r'[0-9]+', response['id']) is not None,
                      'START_RESULT_UNKNOWN')
    check_branch(root, run, lookup, branch, sha, pr, protection_lookup)
    return {'buildStarted':True, 'jobId':response['id'], 'buildVerified':False, 'promotionAllowed':False}


def inspect(job_id, root, run, lookup, branch=BRANCH, sha=SHA, pr=PR, protection_lookup=None):
    preflight.require(re.fullmatch(r'[0-9]+', job_id or '') is not None, 'INVALID_JOB_ID')
    check_branch(root, run, lookup, branch, sha, pr, protection_lookup)
    summary = lookup('amplify', 'get-job', '--app-id', APP, '--branch-name', branch, '--job-id', job_id,
                     '--query', 'job.summary.{id:jobId,status:status,commit:commitId}')
    preflight.require(isinstance(summary, dict) and summary.get('id') == job_id, 'JOB_MISMATCH')
    status = summary.get('status')
    preflight.require(status in ('PENDING', 'PROVISIONING', 'RUNNING', 'CANCELLING', 'SUCCEED', 'FAILED', 'CANCELLED'),
                      'JOB_STATE_UNKNOWN')
    if status == 'SUCCEED':
        # HEAD is not sufficient evidence of which revision was actually built.
        preflight.require(summary.get('commit') == sha, 'BUILD_COMMIT_UNVERIFIED')
        check_branch(root, run, lookup, branch, sha, pr, protection_lookup)
    return {'jobId':job_id, 'status':status, 'buildVerified':status == 'SUCCEED', 'promotionAllowed':False}


def submit(branch=BRANCH, sha=SHA):
    return preflight.aws_lookup(None, 'amplify', 'start-job', '--app-id', APP, '--branch-name', branch,
                                '--job-type', 'RELEASE', '--commit-id', sha,
                                '--query', 'jobSummary.{id:jobId}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('start', 'inspect'))
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--job-id')
    parser.add_argument('--current-main', action='store_true')
    parser.add_argument('--branch')
    parser.add_argument('--sha')
    args = parser.parse_args()
    try:
        lookup = lambda *items: preflight.aws_lookup(None, *items)
        if args.current_main:
            preflight.require(args.branch is not None and args.sha is not None, 'INVALID_INPUT')
            branch, sha, pr = args.branch, args.sha, None
            def protection_lookup(name):
                try:
                    return json.loads(preflight.command(['gh', 'api', 'repos/jeffyun3061/herfree-platform/branches/' + name + '/protection'], args.repo))
                except (preflight.Refused, ValueError):
                    raise preflight.Refused('BRANCH_PROTECTION_UNAVAILABLE') from None
        else:
            preflight.require(args.branch is None and args.sha is None, 'INVALID_INPUT')
            branch, sha, pr, protection_lookup = BRANCH, SHA, PR, None
        if args.mode == 'start':
            preflight.require(args.job_id is None, 'INVALID_INPUT')
            result = start(args.repo, preflight.command, lookup, lambda: submit(branch, sha), branch, sha, pr, protection_lookup)
        else:
            result = inspect(args.job_id, args.repo, preflight.command, lookup, branch, sha, pr, protection_lookup)
        print(json.dumps(result))
        return 0
    except preflight.Refused as error:
        print(json.dumps({'error':str(error), 'manualJobInspectionMayBeRequired':True, 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
