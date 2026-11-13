#!/usr/bin/env python3
"""Submit one reviewed staging QA tool install/restore command via SSM.

This does not start the instance, run application QA, or authorize promotion.
SSM parameters contain source code but must never contain credentials or data.
If submission is ambiguous, inspect SSM history before any retry.
"""
import argparse
import base64
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent
def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

route = load('route', 'verify_staging_route.py')
package = load('package', 'package-staging-qa-tools.py')
RUN = re.compile(r'[a-f0-9]{8}')
COMMAND_ID = re.compile(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')


def verify_restore_target(lookup):
    # Recovery must remain possible when the application or DNS is down.
    route.require(lookup('sts', 'get-caller-identity', '--query', 'Account') == route.ACCOUNT, 'ACCOUNT_MISMATCH')
    instances = lookup('ec2', 'describe-instances', '--instance-ids', route.INSTANCE,
                       '--query', 'Reservations[].Instances[].{id:InstanceId,state:State.Name}')
    route.require(instances == [{'id':route.INSTANCE, 'state':'running'}], 'STAGING_INSTANCE_UNAVAILABLE')
    ssm = lookup('ssm', 'describe-instance-information', '--filters', f'Key=InstanceIds,Values={route.INSTANCE}',
                 '--query', 'InstanceInformationList[].{id:InstanceId,status:PingStatus}')
    route.require(ssm == [{'id':route.INSTANCE, 'status':'Online'}], 'STAGING_SSM_OFFLINE')


def command_for(mode, run, bundle):
    route.require(mode in ('install', 'restore') and RUN.fullmatch(run or '') is not None, 'INVALID_INPUT')
    route.require(isinstance(bundle, bytes) and 0 < len(base64.b64encode(bundle)) <= package.MAX_ENCODED,
                  'BUNDLE_INVALID')
    encoded = base64.b64encode(bundle).decode('ascii')
    digest = hashlib.sha256(bundle).hexdigest()
    action = f'python3 "$qa_dir/staging-qa-tools.py" {mode} --run {run}'
    if mode == 'install':
        action += ' --source "$qa_dir" --hashes "$qa_dir/hashes.json"'
    # The archive is generated locally from fixed Git paths. Validate its
    # digest before unpacking, then remove only our own mktemp directory.
    return ("set -eu; umask 077; qa_dir=$(mktemp -d /tmp/herfree-qa-tools.XXXXXXXX); "
            "case \"$qa_dir\" in /tmp/herfree-qa-tools.*) ;; *) exit 1;; esac; "
            "trap 'rm -rf -- \"$qa_dir\"' EXIT; "
            f"printf '%s' '{encoded}' | base64 -d > \"$qa_dir/bundle.tar.gz\"; "
            f"printf '%s  %s\\n' '{digest}' \"$qa_dir/bundle.tar.gz\" | sha256sum -c - >/dev/null; "
            'tar -xzf "$qa_dir/bundle.tar.gz" -C "$qa_dir"; ' + action)


def submit(mode, run, bundle, check_route, send):
    command = command_for(mode, run, bundle)
    check_route()
    result = send(command)
    route.require(isinstance(result, str) and COMMAND_ID.fullmatch(result) is not None, 'SSM_SUBMISSION_UNKNOWN')
    return {'commandId':result, 'mode':mode, 'completed':False,
            'manualInspectionRequired':True, 'promotionAllowed':False}


def inspect(mode, command_id, account, get):
    route.require(mode in ('install', 'restore') and COMMAND_ID.fullmatch(command_id or '') is not None,
                  'INVALID_INPUT')
    route.require(account() == route.ACCOUNT, 'ACCOUNT_MISMATCH')
    result = get(command_id)
    route.require(isinstance(result, dict), 'SSM_RESPONSE_INVALID')
    status = result.get('Status')
    if status in ('Pending', 'InProgress', 'Delayed'):
        return {'status':status, 'completed':False, 'promotionAllowed':False}
    route.require(status == 'Success' and result.get('ResponseCode') == 0, 'SSM_COMMAND_FAILED')
    try:
        output = json.loads(result.get('StandardOutputContent') or '')
    except (TypeError, ValueError):
        raise route.Refused('SSM_OUTPUT_INVALID') from None
    key = 'installed' if mode == 'install' else 'toolsRestored'
    route.require(output == {key:True, 'cleanupVerified':False, 'promotionAllowed':False}, 'SSM_OUTPUT_INVALID')
    return {'status':'Success', 'completed':True, key:True, 'cleanupVerified':False, 'promotionAllowed':False}


def aws(*args, pending_ok=False):
    try:
        result = subprocess.run(['aws', *args, '--region', 'ap-northeast-2', '--output', 'json', '--no-cli-pager'],
                                check=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as error:
        if pending_ok and 'InvocationDoesNotExist' in (error.stderr or ''):
            return {'Status':'Pending'}
        raise route.Refused('AWS_COMMAND_FAILED') from None
    except (OSError, subprocess.SubprocessError, ValueError):
        raise route.Refused('AWS_COMMAND_FAILED') from None


def send(command):
    return aws('ssm', 'send-command', '--instance-ids', route.INSTANCE, '--document-name', 'AWS-RunShellScript',
               '--parameters', json.dumps({'commands':[command], 'executionTimeout':['180']}),
               '--query', 'Command.CommandId')


def get(command_id):
    return aws('ssm', 'get-command-invocation', '--instance-id', route.INSTANCE, '--command-id', command_id,
               '--query', '{Status:Status,ResponseCode:ResponseCode,StandardOutputContent:StandardOutputContent}',
               pending_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('install', 'restore', 'inspect-install', 'inspect-restore'))
    parser.add_argument('--run')
    parser.add_argument('--commit')
    parser.add_argument('--repo', type=Path)
    parser.add_argument('--command-id')
    parser.add_argument('--source', choices=('candidate', 'main'), default='candidate')
    args = parser.parse_args()
    try:
        if args.mode.startswith('inspect-'):
            route.require(args.run is None and args.commit is None and args.repo is None and args.source == 'candidate', 'INVALID_INPUT')
            result = inspect(args.mode.removeprefix('inspect-'), args.command_id,
                             lambda: route.lookup('sts', 'get-caller-identity', '--query', 'Account'), get)
        else:
            route.require(args.command_id is None and args.repo is not None and args.commit is not None, 'INVALID_INPUT')
            def git(*items):
                try:
                    result = subprocess.run(['git', *items], cwd=args.repo, check=True, capture_output=True,
                                            timeout=30, env={**os.environ, 'GIT_TERMINAL_PROMPT':'0'})
                    return result.stdout
                except (OSError, subprocess.SubprocessError):
                    raise package.Refused('GIT_COMMAND_FAILED') from None
            bundle = package.build(args.commit, git, args.source)
            check = (lambda: route.verify(route.lookup, route.resolve, route.health)) if args.mode == 'install' \
                else (lambda: verify_restore_target(route.lookup))
            result = submit(args.mode, args.run, bundle, check, send)
        print(json.dumps(result))
        return 0
    except (route.Refused, package.Refused) as error:
        print(json.dumps({'error':str(error), 'manualInspectionMayBeRequired':True, 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
