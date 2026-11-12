#!/usr/bin/env python3
"""Run and restore one serialized staging QA session; never promote an image.

The caller must hold the backend-staging workflow lease throughout this
process. Ambiguous SSM outcomes require manual inspection and are never retried.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sender = load('qa_sender', 'send-staging-qa-tools.py')
manager = load('qa_manager', 'manage-isolated-release-run.py')
live = load('qa_live', 'verify-live-release-qa.py')


class Failed(Exception):
    pass


class RestoredFailure(Failed):
    """Checks failed but the staging session was safely restored."""
    pass


class Unknown(Exception):
    pass


class NotStarted(Exception):
    pass


def orchestrate(install, start, browser, cleanup, restore):
    """Known failures can clean up; unknown remote state must not be retried."""
    install()  # An ambiguous install must be inspected manually.
    try:
        start()
    except NotStarted as error:
        restore()
        raise RestoredFailure('isolated start did not run; tools restored') from error
    except Unknown:
        raise
    except Failed as error:
        cleanup()
        restore()
        raise RestoredFailure('isolated start failed; staging restored') from error
    try:
        browser()
    except Exception as error:
        cleanup()
        restore()
        raise RestoredFailure('browser checks failed; staging restored') from error
    cleanup()
    restore()
    return {'browserChecksPassed': True, 'cleanupVerified': True, 'toolsRestored': True,
            'promotionAllowed': False}


def wait_for(label, command_id, inspect, *, wait=time.sleep, attempts=400):
    print(json.dumps({'phase': label, 'commandId': command_id}), flush=True)
    for _ in range(attempts):
        try:
            result = inspect(command_id)
        except (sender.route.Refused, manager.route.Refused) as error:
            if str(error) == 'SSM_COMMAND_FAILED':
                raise Failed(label + ' failed') from None
            raise Unknown(label + ' outcome requires inspection') from None
        if result.get('completed') is True:
            return
        if result.get('status') not in ('Pending', 'InProgress', 'Delayed'):
            raise Unknown(label + ' outcome requires inspection')
        wait(5)
    raise Unknown(label + ' is still running; inspect the command before retrying')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sha', required=True)
    parser.add_argument('--branch', required=True)
    parser.add_argument('--image', required=True)
    parser.add_argument('--run', required=True)
    parser.add_argument('--repo', required=True, type=Path)
    args = parser.parse_args()
    try:
        sender.route.require(os.getenv('GITHUB_ACTIONS') == 'true'
                             and os.getenv('GITHUB_REPOSITORY') == 'jeffyun3061/herfree-platform'
                             and os.getenv('GITHUB_REF') == 'refs/heads/main'
                             and os.getenv('GITHUB_WORKFLOW') == 'Run isolated current-main sharing QA'
                             and os.getenv('GITHUB_SHA') == args.sha, 'WORKFLOW_CONTEXT_REQUIRED')
        manager.command_for('start', args.run, args.image)
        live.check(args.sha, args.branch, args.image, live.request)
        def git(*items):
            try:
                return subprocess.run(['git', *items], cwd=args.repo, check=True, capture_output=True,
                                      timeout=30, env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'}).stdout
            except (OSError, subprocess.SubprocessError):
                raise sender.package.Refused('GIT_COMMAND_FAILED') from None
        bundle = sender.package.build(args.sha, git, 'main')
        account = lambda: sender.route.lookup('sts', 'get-caller-identity', '--query', 'Account')
        def tool_phase(mode):
            check = (lambda: sender.route.verify(sender.route.lookup, sender.route.resolve, sender.route.health)) \
                if mode == 'install' else (lambda: sender.verify_restore_target(sender.route.lookup))
            try:
                result = sender.submit(mode, args.run, bundle, check, sender.send)
            except (sender.route.Refused, OSError):
                raise Unknown(mode + ' submission requires inspection') from None
            wait_for(mode, result['commandId'], lambda cid: sender.inspect(mode, cid, account, sender.get))
        def run_phase(mode):
            image = args.image if mode == 'start' else None
            check = (lambda: sender.route.verify(sender.route.lookup, sender.route.resolve, sender.route.health)) \
                if mode == 'start' else (lambda: sender.verify_restore_target(sender.route.lookup))
            try:
                check()
            except (sender.route.Refused, OSError):
                if mode == 'start':
                    raise NotStarted('staging preflight failed') from None
                raise Unknown('cleanup preflight requires inspection') from None
            try:
                result = manager.submit(mode, args.run, image, lambda: None, manager.send)
            except (sender.route.Refused, manager.route.Refused, OSError):
                raise Unknown(mode + ' submission requires inspection') from None
            wait_for(mode, result['commandId'], lambda cid: manager.inspect(
                mode, cid, args.run, image, account, sender.get, manager.describe))
        def browser():
            env = {**os.environ, 'RELEASE_SHA': args.sha, 'RELEASE_QA_BRANCH': args.branch,
                   'RELEASE_IMAGE': args.image, 'ISOLATED_QA_RUN': args.run,
                   'PLAYWRIGHT_BASE_URL': f'https://{args.branch}.d2bcg3vnlv5hkh.amplifyapp.com'}
            # Do not pass workflow output and environment files to test subprocesses.
            for key in ('GITHUB_OUTPUT', 'GITHUB_ENV', 'GITHUB_PATH', 'GITHUB_STEP_SUMMARY'):
                env.pop(key, None)
            subprocess.run(['bash', str(ROOT / 'run-verified-release-share-qa.sh')], cwd=args.repo,
                           env=env, check=True)
        result = orchestrate(lambda: tool_phase('install'), lambda: run_phase('start'), browser,
                             lambda: run_phase('cleanup'), lambda: tool_phase('restore'))
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write('safe_to_stop=true\n')
        print(json.dumps(result))
        return 0
    except RestoredFailure as error:
        try:
            with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
                output.write('safe_to_stop=true\n')
        except (KeyError, OSError):
            print(json.dumps({'sessionPassed': False, 'error': 'restored but stop signal unavailable',
                              'manualInspectionMayBeRequired': True, 'promotionAllowed': False}), file=sys.stderr)
            return 1
        print(json.dumps({'sessionPassed': False, 'error': str(error), 'restored': True,
                          'promotionAllowed': False}), file=sys.stderr)
        return 1
    except (sender.route.Refused, sender.package.Refused, manager.route.Refused, live.VerificationError,
            Failed, Unknown, OSError, KeyError, subprocess.SubprocessError) as error:
        print(json.dumps({'sessionPassed': False, 'error': str(error), 'manualInspectionMayBeRequired': True,
                          'promotionAllowed': False}), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
