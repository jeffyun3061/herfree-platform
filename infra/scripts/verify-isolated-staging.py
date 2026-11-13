#!/usr/bin/env python3
"""Check a running isolated staging candidate; never grant promotion approval.

This is a point-in-time, read-only check. It does not lock the environment,
start a server, create isolation, run browser tests, or verify cleanup.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('route', ROOT / 'verify_staging_route.py')
route = importlib.util.module_from_spec(spec)
spec.loader.exec_module(route)

IMAGE = re.compile(r'439777528445\.dkr\.ecr\.ap-northeast-2\.amazonaws\.com/herfree-api@sha256:[a-f0-9]{64}')
RUN = re.compile(r'[a-f0-9]{8}')
COMMAND_ID = re.compile(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
SCRIPTS = ('orchestrate-isolated-staging.sh', 'staging-isolated-db.sh',
           'guard-staging-isolation.sh', 'deploy-release.sh', 'validate-release-env.sh')
MARKER = 'ISOLATED_QA_VERIFIED'


def command_for(run, image, hashes):
    route.require(RUN.fullmatch(run or '') is not None, 'INVALID_RUN')
    route.require(IMAGE.fullmatch(image or '') is not None, 'INVALID_IMAGE')
    route.require(set(hashes) == set(SCRIPTS), 'INVALID_TOOL_SET')
    tests = []
    for script in SCRIPTS:
        digest = hashes[script]
        route.require(re.fullmatch(r'[a-f0-9]{64}', digest or '') is not None, 'INVALID_TOOL_HASH')
        tests.append(f"test \"$(sha256sum /opt/herfree/infra/scripts/{script} | cut -d' ' -f1)\" = '{digest}'")
    tests.extend((
        f"test \"$(cat /opt/herfree/.deploy/isolated-{run}/candidate-image)\" = '{image}'",
        f'/opt/herfree/infra/scripts/orchestrate-isolated-staging.sh verify {run} >/dev/null',
        f"printf '{MARKER}\\n'",
    ))
    return ' && '.join(tests)


def verify(run, image, hashes, check_route, send, poll, wait):
    command = command_for(run, image, hashes)
    check_route()
    command_id = send(command)
    route.require(isinstance(command_id, str) and COMMAND_ID.fullmatch(command_id) is not None,
                  'INVALID_COMMAND_ID')
    for _ in range(30):
        result = poll(command_id)
        route.require(isinstance(result, dict), 'SSM_RESPONSE_INVALID')
        status = result.get('Status')
        if status == 'Success':
            route.require(result.get('ResponseCode') == 0 and result.get('StandardOutputContent') == MARKER + '\n',
                          'ISOLATION_VERIFICATION_FAILED')
            check_route()
            return {'isolatedDatabaseVerified': True, 'candidateImage': image,
                    'pointInTimeOnly': True, 'fullE2ePassed': False,
                    'cleanupVerified': False, 'promotionAllowed': False}
        route.require(status in ('Pending', 'InProgress', 'Delayed'), 'ISOLATION_VERIFICATION_FAILED')
        wait(3)
    raise route.Refused('ISOLATION_VERIFICATION_TIMED_OUT')


def aws(*args, invocation_pending_ok=False):
    try:
        result = subprocess.run(['aws', *args, '--region', 'ap-northeast-2', '--output', 'json', '--no-cli-pager'],
                                check=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as error:
        # SSM can briefly report that a newly submitted invocation does not
        # exist. Only this specific polling response is retryable.
        if invocation_pending_ok and 'InvocationDoesNotExist' in (error.stderr or ''):
            return {'Status': 'Pending'}
        raise route.Refused('AWS_COMMAND_FAILED') from None
    except (OSError, subprocess.SubprocessError, ValueError):
        raise route.Refused('AWS_COMMAND_FAILED') from None


def send(command):
    response = aws('ssm', 'send-command', '--instance-ids', route.INSTANCE,
                   '--document-name', 'AWS-RunShellScript',
                   '--parameters', json.dumps({'commands': [command], 'executionTimeout': ['90']}),
                   '--query', 'Command.CommandId')
    return response


def poll(command_id):
    return aws('ssm', 'get-command-invocation', '--instance-id', route.INSTANCE,
               '--command-id', command_id,
               '--query', '{Status:Status,ResponseCode:ResponseCode,StandardOutputContent:StandardOutputContent}',
               invocation_pending_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True)
    parser.add_argument('--image', required=True)
    args = parser.parse_args()
    try:
        hashes = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in SCRIPTS}
        result = verify(args.run, args.image, hashes,
                        lambda: route.verify(route.lookup, route.resolve, route.health), send, poll, time.sleep)
        print(json.dumps(result))
        return 0
    except (route.Refused, OSError) as error:
        code = str(error) if isinstance(error, route.Refused) else 'LOCAL_TOOL_UNAVAILABLE'
        print(json.dumps({'isolatedDatabaseVerified': False, 'error': code, 'promotionAllowed': False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
