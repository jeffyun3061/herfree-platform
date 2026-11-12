"""Fail-closed checks for an immutable, isolated release QA branch.

This module validates metadata only. It does not run tests, authorize an image
promotion, change a branch, or deploy a release.
"""
from __future__ import annotations

import json
import re
import sys


class VerificationError(ValueError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise VerificationError(message)


def verify_release_qa_branch(sha: str, branch: str, main_sha: str, branch_sha: str,
                             protection: dict, amplify: dict, latest_job: dict,
                             app_id: str, api_origin: str) -> str:
    """Return the QA origin only after all independent identity checks pass."""
    require(re.fullmatch(r'[a-f0-9]{40}', sha or '') is not None, 'INVALID_RELEASE_SHA')
    require(re.fullmatch(r'qa-[a-f0-9]{12}-[a-f0-9]{8}', branch or '') is not None
            and branch[3:15] == sha[:12], 'INVALID_QA_BRANCH')
    require(main_sha == sha and branch_sha == sha, 'REF_MISMATCH')
    require(app_id == 'd2bcg3vnlv5hkh' and api_origin == 'https://api-staging.herpfree.co.kr',
            'UNEXPECTED_STAGING_TARGET')
    require(isinstance(protection, dict), 'PROTECTION_UNAVAILABLE')
    for name, expected in (('lock_branch', True), ('enforce_admins', True),
                           ('allow_force_pushes', False), ('allow_deletions', False)):
        setting = protection.get(name)
        require(isinstance(setting, dict) and setting.get('enabled') is expected, 'BRANCH_NOT_LOCKED')
    origin = f'https://{branch}.{app_id}.amplifyapp.com'
    require(isinstance(amplify, dict) and amplify.get('branchName') == branch
            and amplify.get('enableBasicAuth') is True and amplify.get('enableAutoBuild') is False,
            'AMPLIFY_BRANCH_NOT_PROTECTED')
    env = amplify.get('environmentVariables')
    require(isinstance(env, dict) and env.get('API_REWRITE_TARGET') == api_origin
            and env.get('NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN') == origin, 'AMPLIFY_TARGET_MISMATCH')
    require(isinstance(latest_job, dict) and latest_job.get('status') == 'SUCCEED'
            and latest_job.get('commitId') == sha, 'AMPLIFY_BUILD_MISMATCH')
    return origin


def verify_release_image(sha: str, image: str, tag_digest: str, mutability: str) -> None:
    """Verify the actual image digest is attached to the exact immutable release tag."""
    require(re.fullmatch(r'[a-f0-9]{40}', sha or '') is not None, 'INVALID_RELEASE_SHA')
    prefix = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@'
    require(isinstance(image, str) and image.startswith(prefix), 'UNEXPECTED_IMAGE_REPOSITORY')
    digest = image[len(prefix):]
    require(re.fullmatch(r'sha256:[a-f0-9]{64}', digest) is not None, 'INVALID_IMAGE_DIGEST')
    require(tag_digest == digest and mutability == 'IMMUTABLE', 'IMAGE_NOT_PINNED_TO_RELEASE')


def main() -> int:
    """Validate trusted API responses from stdin without logging their contents."""
    try:
        payload = json.load(sys.stdin)
        require(isinstance(payload, dict), 'INVALID_INPUT')
        origin = verify_release_qa_branch(
            payload.get('sha'), payload.get('branch'), payload.get('main_sha'),
            payload.get('branch_sha'), payload.get('protection'), payload.get('amplify'),
            payload.get('latest_job'), payload.get('app_id'), payload.get('api_origin'))
        verify_release_image(payload.get('sha'), payload.get('image'),
                             payload.get('tag_digest'), payload.get('mutability'))
    except (ValueError, TypeError, AttributeError):
        # API responses can contain sensitive branch configuration: do not echo
        # the payload or exceptions from JSON parsing into CI logs.
        print(json.dumps({'verified': False}), file=sys.stderr)
        return 1
    print(json.dumps({'verified': True, 'origin': origin, 'promotionAllowed': False}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
