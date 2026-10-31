#!/usr/bin/env python3
"""Fail-closed read-only checks for an isolated staging frontend.

This tool creates nothing and never marks an image as tested or deployable.
Its caller supplies trusted account/app configuration and separate QA-only
Basic credentials through the environment, never command-line arguments.
"""
from __future__ import annotations
import argparse
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener


class Refused(Exception):
    pass


def require(value: bool, code: str) -> None:
    if not value:
        raise Refused(code)


def validate_inputs(account: str, app: str, branch: str, sha: str, api: str) -> str:
    # Pin the known staging account and app before sending Basic credentials.
    require(account == '439777528445', 'INVALID_ACCOUNT')
    require(app == 'd2bcg3vnlv5hkh', 'INVALID_APP')
    require(re.fullmatch(r'[a-f0-9]{40}', sha) is not None, 'INVALID_COMMIT')
    require(re.fullmatch(r'qa-[a-f0-9]{12}-[a-f0-9]{8}', branch) is not None
            and branch[3:15] == sha[:12], 'INVALID_BRANCH')
    require(api == 'https://api-staging.herpfree.co.kr', 'STAGING_API_REQUIRED')
    return f'https://{branch}.{app}.amplifyapp.com'


def check_remote(sha: str, branch: str, root: Path, run) -> None:
    remote = run(['git', 'remote', 'get-url', 'origin'], root).strip()
    require(remote in ('https://github.com/jeffyun3061/herfree-platform.git',
                       'https://github.com/jeffyun3061/herfree-platform',
                       'git@github.com:jeffyun3061/herfree-platform.git'), 'REMOTE_REFUSED')
    require(run(['git', 'rev-parse', 'HEAD'], root).strip() == sha, 'LOCAL_COMMIT_MISMATCH')
    for ref in ('refs/heads/main', 'refs/heads/' + branch):
        result = run(['git', 'ls-remote', '--exit-code', 'origin', ref], root).strip()
        require(result == sha + '\t' + ref, 'REMOTE_COMMIT_MISMATCH')


def verify(account: str, app: str, branch: str, sha: str, api: str,
           credentials: tuple[str, str], root: Path, lookup, run, fetch) -> dict:
    origin = validate_inputs(account, app, branch, sha, api)
    require(len(credentials) == 2 and all(isinstance(x, str) and x for x in credentials)
            and ':' not in credentials[0], 'BASIC_CREDENTIALS_REQUIRED')
    check_remote(sha, branch, root, run)
    require(lookup('sts', 'get-caller-identity', '--query', 'Account') == account, 'ACCOUNT_MISMATCH')
    info = lookup('amplify', 'get-branch', '--app-id', app, '--branch-name', branch,
                  '--query', 'branch.{name:branchName,basic:enableBasicAuth,api:environmentVariables.API_REWRITE_TARGET,origin:environmentVariables.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN}')
    require(isinstance(info, dict) and info == {'name':branch, 'basic':True, 'api':api, 'origin':origin},
            'PROTECTED_BRANCH_MISMATCH')
    jobs = lookup('amplify', 'list-jobs', '--app-id', app, '--branch-name', branch,
                  '--max-results', '1', '--query', 'jobSummaries[].{status:status,commit:commitId}')
    require(isinstance(jobs, list) and jobs == [{'status':'SUCCEED', 'commit':sha}], 'BUILD_MISMATCH')
    require(fetch(origin + '/', None)[0] == 401, 'ANONYMOUS_ACCESS_NOT_BLOCKED')
    require(fetch(origin + '/', credentials)[0] == 200, 'BASIC_AUTH_FAILED')
    for url, auth in ((origin + '/api/health', credentials), (api + '/api/health', None)):
        status, body = fetch(url, auth)
        require(status == 200 and len(body) <= 65536, 'HEALTH_UNAVAILABLE')
        try:
            payload = json.loads(body)
        except (ValueError, TypeError):
            raise Refused('HEALTH_INVALID') from None
        require(isinstance(payload, dict) and payload.get('success') is True
                and isinstance(payload.get('data'), dict)
                and payload['data'].get('status') == 'UP'
                and payload['data'].get('environment') == 'staging', 'HEALTH_NOT_STAGING')
    return {'frontendPreflightPassed':True, 'candidateSha':sha,
            'fullE2ePassed':False, 'cleanupVerified':False, 'promotionAllowed':False}


def command(args: list[str], root: Path) -> str:
    try:
        result = subprocess.run(args, cwd=root, check=True, capture_output=True, text=True,
                                timeout=30, env={**os.environ, 'GIT_TERMINAL_PROMPT':'0'})
        return result.stdout
    except (OSError, subprocess.SubprocessError):
        raise Refused('COMMAND_FAILED') from None


def aws_lookup(profile: str | None, *args: str):
    base = ['aws', *args, '--region', 'ap-northeast-2', '--output', 'json', '--no-cli-pager']
    if profile:
        require(re.fullmatch(r'[A-Za-z0-9_.-]{1,64}', profile) is not None, 'INVALID_PROFILE')
        base.extend(['--profile', profile])
    try:
        return json.loads(command(base, Path.cwd()))
    except ValueError:
        raise Refused('AWS_RESPONSE_INVALID') from None


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_url(url: str, credentials: tuple[str, str] | None):
    headers = {'Accept':'application/json'}
    if credentials:
        token = base64.b64encode((credentials[0] + ':' + credentials[1]).encode()).decode()
        headers['Authorization'] = 'Basic ' + token
    try:
        with build_opener(NoRedirect()).open(Request(url, headers=headers), timeout=12) as response:
            return response.status, response.read(65537)
    except HTTPError as error:
        return error.code, b''
    except (URLError, OSError, ValueError):
        raise Refused('HTTPS_UNAVAILABLE') from None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--account', required=True)
    parser.add_argument('--app', required=True)
    parser.add_argument('--branch', required=True)
    parser.add_argument('--sha', required=True)
    parser.add_argument('--api', required=True)
    parser.add_argument('--repo', type=Path, default=Path.cwd())
    parser.add_argument('--profile')
    args = parser.parse_args()
    try:
        result = verify(args.account, args.app, args.branch, args.sha, args.api,
                        (os.getenv('ISOLATED_QA_BASIC_USERNAME', ''), os.getenv('ISOLATED_QA_BASIC_PASSWORD', '')),
                        args.repo, lambda *items: aws_lookup(args.profile, *items), command, fetch_url)
        print(json.dumps(result))
        return 0
    except Refused as error:
        print(json.dumps({'frontendPreflightPassed':False, 'error':str(error), 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    sys.exit(main())
