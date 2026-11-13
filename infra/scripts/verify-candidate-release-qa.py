#!/usr/bin/env python3
"""Verify an unmerged PR for isolated QA; never authorize production release."""
import argparse
import json
import re
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path

from verify_release_qa_branch import VerificationError, require

live = SourceFileLoader('live_release_qa', str(Path(__file__).with_name('verify-live-release-qa.py'))).load_module()
PULL = 'repos/jeffyun3061/herfree-platform/pulls/'


def check(pr_number, sha, branch, image, request):
    require(isinstance(pr_number, int) and pr_number > 0, 'INVALID_PR')
    require(re.fullmatch(r'[a-f0-9]{40}', sha or '') is not None, 'INVALID_RELEASE_SHA')
    pr = request('gh', PULL + str(pr_number))
    def assert_candidate(value):
        require(isinstance(value, dict) and value.get('state') == 'open'
                and value.get('base', {}).get('ref') == 'main'
                and value.get('head', {}).get('sha') == sha
                and value.get('head', {}).get('repo', {}).get('full_name') == 'jeffyun3061/herfree-platform',
                'CANDIDATE_CHANGED')

    assert_candidate(pr)

    # The existing verifier checks the QA branch lock, protected Amplify target,
    # exact frontend build and immutable image. Substitute only its main-ref
    # lookup with the already validated PR head; no promotion is permitted.
    def candidate_request(kind, *args):
        if kind == 'gh' and args == (live.REPO + 'main',):
            return {'commit': {'sha': sha}}
        return request(kind, *args)

    result = live.check(sha, branch, image, candidate_request)
    # Detect a PR change while the other remote checks were running.
    after = request('gh', PULL + str(pr_number))
    assert_candidate(after)
    require(result.get('promotionAllowed') is False, 'PROMOTION_FORBIDDEN')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pr', type=int, required=True)
    parser.add_argument('--sha', required=True)
    parser.add_argument('--branch', required=True)
    parser.add_argument('--image', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(check(args.pr, args.sha, args.branch, args.image, live.request)))
    except (VerificationError, TypeError, ValueError, AttributeError):
        print(json.dumps({'verified': False, 'promotionAllowed': False}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
