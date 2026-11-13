#!/usr/bin/env python3
"""Submit or inspect one staging-only isolated-run operation, without promotion.

An ambiguous submission or timeout must be inspected before another command is
sent. The caller must hold the staging workflow lease for the whole test run.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sender', ROOT / 'send-staging-qa-tools.py')
sender = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sender)
route = sender.route
IMAGE = re.compile(r'439777528445\.dkr\.ecr\.ap-northeast-2\.amazonaws\.com/herfree-api@sha256:[a-f0-9]{64}')
RUN = re.compile(r'[a-f0-9]{8}')
COMMAND = re.compile(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')


def command_for(mode, run, image=None):
    route.require(mode in ('start', 'cleanup') and RUN.fullmatch(run or '') is not None, 'INVALID_INPUT')
    if mode == 'start':
        route.require(IMAGE.fullmatch(image or '') is not None, 'INVALID_IMAGE')
        return f'/opt/herfree/infra/scripts/orchestrate-isolated-staging.sh start {run} {image}'
    route.require(image is None, 'INVALID_INPUT')
    return f'/opt/herfree/infra/scripts/orchestrate-isolated-staging.sh cleanup {run}'


def submit(mode, run, image, preflight, send):
    command = command_for(mode, run, image)
    preflight()
    command_id = send(command)
    route.require(isinstance(command_id, str) and COMMAND.fullmatch(command_id) is not None,
                  'SSM_SUBMISSION_UNKNOWN')
    return {'commandId': command_id, 'mode': mode, 'completed': False, 'promotionAllowed': False}


def inspect(mode, command_id, run, image, account, get, describe):
    route.require(mode in ('start', 'cleanup') and COMMAND.fullmatch(command_id or '') is not None, 'INVALID_INPUT')
    expected = command_for(mode, run, image)
    route.require(account() == route.ACCOUNT, 'ACCOUNT_MISMATCH')
    command = describe(command_id)
    route.require(command == {'document': 'AWS-RunShellScript', 'instances': [route.INSTANCE],
                              'commands': [expected]}, 'SSM_COMMAND_MISMATCH')
    result = get(command_id)
    route.require(isinstance(result, dict), 'SSM_RESPONSE_INVALID')
    status = result.get('Status')
    if status in ('Pending', 'InProgress', 'Delayed'):
        return {'status': status, 'completed': False, 'promotionAllowed': False}
    route.require(status == 'Success' and result.get('ResponseCode') == 0, 'SSM_COMMAND_FAILED')
    output = result.get('StandardOutputContent')
    marker = ('isolated candidate and datasource verified; promotion is not authorized' if mode == 'start'
              else 'isolated staging DB and grant removed; promotion is not authorized')
    route.require(isinstance(output, str) and output.rstrip().endswith(marker), 'SSM_OUTPUT_INVALID')
    return {'status': 'Success', 'completed': True, 'mode': mode, 'promotionAllowed': False}


def send(command):
    return sender.aws('ssm', 'send-command', '--instance-ids', route.INSTANCE,
                      '--document-name', 'AWS-RunShellScript', '--timeout-seconds', '1800',
                      '--parameters', json.dumps({'commands': [command], 'executionTimeout': ['1800']}),
                      '--query', 'Command.CommandId')


def describe(command_id):
    return sender.aws('ssm', 'list-commands', '--command-id', command_id,
                      '--query', 'Commands[0].{document:DocumentName,instances:InstanceIds,commands:Parameters.commands}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('start', 'cleanup', 'inspect-start', 'inspect-cleanup'))
    parser.add_argument('--run')
    parser.add_argument('--image')
    parser.add_argument('--command-id')
    args = parser.parse_args()
    try:
        if args.mode.startswith('inspect-'):
            result = inspect(args.mode.removeprefix('inspect-'), args.command_id, args.run, args.image,
                             lambda: route.lookup('sts', 'get-caller-identity', '--query', 'Account'), sender.get, describe)
        else:
            route.require(args.command_id is None, 'INVALID_INPUT')
            check = (lambda: route.verify(route.lookup, route.resolve, route.health)) if args.mode == 'start' \
                else (lambda: sender.verify_restore_target(route.lookup))
            result = submit(args.mode, args.run, args.image, check, send)
        print(json.dumps(result))
        return 0
    except route.Refused as error:
        print(json.dumps({'error': str(error), 'manualInspectionMayBeRequired': True, 'promotionAllowed': False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
