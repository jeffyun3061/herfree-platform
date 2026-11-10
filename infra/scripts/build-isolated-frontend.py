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

ACCOUNT = '439777528445'
APP = 'd2bcg3vnlv5hkh'
BRANCH = 'qa-4160aee7de7a-4160aee7'
SHA = '4160aee7de7a7e7a8b8333813580332fe2ba7785'
API = 'https://api-staging.herpfree.co.kr'
PR = '195'


def check_branch(root, run, lookup):
    origin = preflight.validate_inputs(ACCOUNT, APP, BRANCH, SHA, API)
    preflight.check_remote(SHA, BRANCH, root, run, PR)
    preflight.require(lookup('sts', 'get-caller-identity', '--query', 'Account') == ACCOUNT, 'ACCOUNT_MISMATCH')
    info = lookup('amplify', 'get-branch', '--app-id', APP, '--branch-name', BRANCH,
                  '--query', 'branch.{name:branchName,basic:enableBasicAuth,auto:enableAutoBuild,api:environmentVariables.API_REWRITE_TARGET,origin:environmentVariables.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN}')
    preflight.require(info == {'name':BRANCH, 'basic':True, 'auto':False, 'api':API, 'origin':origin},
                      'PROTECTED_BRANCH_MISMATCH')


def start(root, run, lookup, submit):
    check_branch(root, run, lookup)
    jobs = lookup('amplify', 'list-jobs', '--app-id', APP, '--branch-name', BRANCH,
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
        if job.get('status') == 'SUCCEED' and job.get('commit') == SHA:
            return {'buildStarted':False, 'existingJobId':job['id'], 'buildVerified':False, 'promotionAllowed':False}
    # A failed response may still have created a job; never retry automatically.
    response = submit()
    preflight.require(isinstance(response, dict) and isinstance(response.get('id'), str)
                      and re.fullmatch(r'[0-9]+', response['id']) is not None,
                      'START_RESULT_UNKNOWN')
    check_branch(root, run, lookup)
    return {'buildStarted':True, 'jobId':response['id'], 'buildVerified':False, 'promotionAllowed':False}


def inspect(job_id, root, run, lookup):
    preflight.require(re.fullmatch(r'[0-9]+', job_id or '') is not None, 'INVALID_JOB_ID')
    check_branch(root, run, lookup)
    summary = lookup('amplify', 'get-job', '--app-id', APP, '--branch-name', BRANCH, '--job-id', job_id,
                     '--query', 'job.summary.{id:jobId,status:status,commit:commitId}')
    preflight.require(isinstance(summary, dict) and summary.get('id') == job_id, 'JOB_MISMATCH')
    status = summary.get('status')
    preflight.require(status in ('PENDING', 'PROVISIONING', 'RUNNING', 'CANCELLING', 'SUCCEED', 'FAILED', 'CANCELLED'),
                      'JOB_STATE_UNKNOWN')
    if status == 'SUCCEED':
        # HEAD is not sufficient evidence of which revision was actually built.
        preflight.require(summary.get('commit') == SHA, 'BUILD_COMMIT_UNVERIFIED')
        check_branch(root, run, lookup)
    return {'jobId':job_id, 'status':status, 'buildVerified':status == 'SUCCEED', 'promotionAllowed':False}


def submit():
    return preflight.aws_lookup(None, 'amplify', 'start-job', '--app-id', APP, '--branch-name', BRANCH,
                                '--job-type', 'RELEASE', '--commit-id', SHA,
                                '--query', 'jobSummary.{id:jobId}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('start', 'inspect'))
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--job-id')
    args = parser.parse_args()
    try:
        lookup = lambda *items: preflight.aws_lookup(None, *items)
        if args.mode == 'start':
            preflight.require(args.job_id is None, 'INVALID_INPUT')
            result = start(args.repo, preflight.command, lookup, submit)
        else:
            result = inspect(args.job_id, args.repo, preflight.command, lookup)
        print(json.dumps(result))
        return 0
    except preflight.Refused as error:
        print(json.dumps({'error':str(error), 'manualJobInspectionMayBeRequired':True, 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
