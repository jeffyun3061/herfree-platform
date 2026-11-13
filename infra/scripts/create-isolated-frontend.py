#!/usr/bin/env python3
"""Create a password-protected, non-building QA branch; never promote it.

This review-only helper does not start a build, deploy an API, or authorize a
release. Credentials are supplied via the environment and never printed.
"""
import argparse
import base64
import importlib.util
import json
import os
from pathlib import Path
import re
import tempfile

spec = importlib.util.spec_from_file_location('preflight', Path(__file__).with_name('verify-isolated-frontend.py'))
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)
lock_spec = importlib.util.spec_from_file_location('release_lock', Path(__file__).with_name('verify_release_qa_branch.py'))
release_lock = importlib.util.module_from_spec(lock_spec)
lock_spec.loader.exec_module(release_lock)


def prepare(branch, sha, pr, username, password, root, run, lookup, create, protection_lookup=None):
    origin = preflight.validate_inputs('439777528445', 'd2bcg3vnlv5hkh', branch, sha,
                                       'https://api-staging.herpfree.co.kr')
    preflight.require(pr is None or re.fullmatch(r'[1-9][0-9]{0,8}', pr or '') is not None, 'INVALID_PR')
    preflight.require(re.fullmatch(r'[A-Za-z0-9_.-]{1,64}', username or '') is not None
                      and isinstance(password, str) and len(password) >= 16
                      and '\n' not in password and '\r' not in password, 'INVALID_BASIC_CREDENTIALS')
    preflight.check_remote(sha, branch, root, run, pr)
    if pr is None or pr == '206':
        preflight.require(protection_lookup is not None, 'BRANCH_PROTECTION_REQUIRED')
        try:
            release_lock.verify_branch_lock(protection_lookup(branch))
        except release_lock.VerificationError:
            raise preflight.Refused('BRANCH_PROTECTION_REQUIRED') from None
    preflight.require(lookup('sts', 'get-caller-identity', '--query', 'Account') == '439777528445',
                      'ACCOUNT_MISMATCH')
    encoded = base64.b64encode((username + ':' + password).encode()).decode()
    request = {'appId':'d2bcg3vnlv5hkh', 'branchName':branch, 'stage':'DEVELOPMENT',
               'enableBasicAuth':True, 'basicAuthCredentials':encoded, 'enableAutoBuild':False,
               'environmentVariables':{'API_REWRITE_TARGET':'https://api-staging.herpfree.co.kr',
                                       'NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN':origin}}
    # The CLI response and any diagnostic error may contain credentials. The
    # caller must not print them. Failure after creation requires manual review.
    create(request)
    info = lookup('amplify', 'get-branch', '--app-id', 'd2bcg3vnlv5hkh', '--branch-name', branch,
                  '--query', 'branch.{name:branchName,basic:enableBasicAuth,auto:enableAutoBuild,api:environmentVariables.API_REWRITE_TARGET,origin:environmentVariables.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN}')
    preflight.require(info == {'name':branch, 'basic':True, 'auto':False,
                               'api':'https://api-staging.herpfree.co.kr', 'origin':origin},
                      'CREATED_BRANCH_REQUIRES_MANUAL_REVIEW')
    if pr is None or pr == '206':
        preflight.check_remote(sha, branch, root, run, pr)
        try:
            release_lock.verify_branch_lock(protection_lookup(branch))
        except release_lock.VerificationError:
            raise preflight.Refused('CREATED_BRANCH_REQUIRES_MANUAL_REVIEW') from None
    return {'protectedBranchCreated':True, 'buildStarted':False, 'promotionAllowed':False}


def create_branch(request):
    # Never put the Basic credential in process arguments, stdout, or logs.
    preflight.require(os.name == 'posix', 'POSIX_PERMISSIONS_REQUIRED')
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'request.json'
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            json.dump(request, stream)
        preflight.command(['aws', 'amplify', 'create-branch', '--region', 'ap-northeast-2',
                           '--cli-input-json', 'file://' + str(path), '--no-cli-pager'], Path.cwd())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--branch', required=True)
    parser.add_argument('--sha', required=True)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--candidate-pr')
    source.add_argument('--current-main', action='store_true')
    parser.add_argument('--repo', type=Path, default=Path.cwd())
    args = parser.parse_args()
    try:
        def protection_lookup(branch):
            try:
                output = preflight.command(['gh', 'api', 'repos/jeffyun3061/herfree-platform/branches/' + branch + '/protection'], args.repo)
                return json.loads(output)
            except (preflight.Refused, ValueError):
                raise preflight.Refused('BRANCH_PROTECTION_UNAVAILABLE') from None
        result = prepare(args.branch, args.sha, args.candidate_pr,
                         os.getenv('ISOLATED_QA_BASIC_USERNAME', ''),
                         os.getenv('ISOLATED_QA_BASIC_PASSWORD', ''), args.repo,
                         preflight.command, lambda *items: preflight.aws_lookup(None, *items), create_branch,
                         protection_lookup if args.current_main or args.candidate_pr == '206' else None)
        print(json.dumps(result))
        return 0
    except preflight.Refused as error:
        print(json.dumps({'protectedBranchCreated':False, 'error':str(error),
                          'manualReviewMayBeRequired':True, 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
