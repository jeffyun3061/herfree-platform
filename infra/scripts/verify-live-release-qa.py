#!/usr/bin/env python3
"""Read-only verification of release identity; never grants promotion approval."""
import argparse
import json
import re
import subprocess
import sys

from verify_release_qa_branch import VerificationError, require, verify_release_image, verify_release_qa_branch

ACCOUNT = '439777528445'
APP = 'd2bcg3vnlv5hkh'
API = 'https://api-staging.herpfree.co.kr'
REPO = 'repos/jeffyun3061/herfree-platform/branches/'


def check(sha, branch, image, request):
    # Validate path components before making API requests.
    require(re.fullmatch(r'[a-f0-9]{40}', sha or '') is not None, 'INVALID_RELEASE_SHA')
    require(re.fullmatch(r'qa-[a-f0-9]{12}-[a-f0-9]{8}', branch or '') is not None
            and branch[3:15] == sha[:12], 'INVALID_QA_BRANCH')
    main = request('gh', REPO + 'main')
    qa = request('gh', REPO + branch)
    protection = request('gh', REPO + branch + '/protection')
    account = request('aws', 'sts', 'get-caller-identity', '--query', 'Account')
    require(account == ACCOUNT, 'ACCOUNT_MISMATCH')
    # Request only the non-secret values required for verification.
    amplify = request('aws', 'amplify', 'get-branch', '--app-id', APP, '--branch-name', branch,
                      '--query', 'branch.{branchName:branchName,enableBasicAuth:enableBasicAuth,enableAutoBuild:enableAutoBuild,environmentVariables:{API_REWRITE_TARGET:environmentVariables.API_REWRITE_TARGET,NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN:environmentVariables.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN}}')
    jobs = request('aws', 'amplify', 'list-jobs', '--app-id', APP, '--branch-name', branch,
                   '--max-results', '1', '--query', 'jobSummaries')
    require(isinstance(main, dict) and isinstance(main.get('commit'), dict)
            and isinstance(qa, dict) and isinstance(qa.get('commit'), dict), 'GITHUB_RESPONSE_INVALID')
    require(isinstance(jobs, list) and len(jobs) == 1, 'BUILD_UNAVAILABLE')
    origin = verify_release_qa_branch(sha, branch, main['commit'].get('sha'), qa['commit'].get('sha'),
                                      protection, amplify, jobs[0], APP, API)
    tag_digest = request('aws', 'ecr', 'describe-images', '--repository-name', 'herfree-api',
                         '--image-ids', 'imageTag=' + sha, '--query', 'imageDetails[0].imageDigest')
    mutability = request('aws', 'ecr', 'describe-repositories', '--repository-names', 'herfree-api',
                         '--query', 'repositories[0].imageTagMutability')
    verify_release_image(sha, image, tag_digest, mutability)
    return {'verified': True, 'origin': origin, 'promotionAllowed': False}


def request(kind, *args):
    cmd = (['gh', 'api', *args] if kind == 'gh' else
           ['aws', *args, '--region', 'ap-northeast-2', '--output', 'json', '--no-cli-pager'])
    try:
        response = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
        return json.loads(response.stdout)
    except (OSError, subprocess.SubprocessError, ValueError):
        raise VerificationError('REMOTE_CHECK_FAILED') from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sha', required=True)
    parser.add_argument('--branch', required=True)
    parser.add_argument('--image', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(check(args.sha, args.branch, args.image, request)))
        return 0
    except (VerificationError, TypeError, ValueError):
        print(json.dumps({'verified': False, 'promotionAllowed': False}), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
