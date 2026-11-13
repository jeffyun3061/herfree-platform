#!/usr/bin/env python3
"""Print a branch-scoped AWS proposal. Never installs or grants permissions."""
import argparse
import json
import re
import sys


def propose(sha, branch):
    if (re.fullmatch(r'[a-f0-9]{40}', sha or '') is None
            or re.fullmatch(r'qa-[a-f0-9]{12}-[a-f0-9]{8}', branch or '') is None
            or branch[3:15] != sha[:12]):
        raise ValueError('invalid release or QA branch')
    arn = 'arn:aws:amplify:ap-northeast-2:439777528445:apps/d2bcg3vnlv5hkh/branches/' + branch
    return {'Version': '2012-10-17', 'Statement': [
        {'Sid': 'PrepareAndInspectOnlyThisQaBranch', 'Effect': 'Allow',
         'Action': ['amplify:CreateBranch', 'amplify:GetBranch', 'amplify:ListJobs'], 'Resource': arn},
        {'Sid': 'BuildOnlyThisQaBranch', 'Effect': 'Allow',
         'Action': ['amplify:StartJob', 'amplify:GetJob'], 'Resource': arn + '/jobs/*'},
    ]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sha', required=True)
    parser.add_argument('--branch', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(propose(args.sha, args.branch), indent=2))
        return 0
    except ValueError:
        print('Invalid QA branch or release SHA; no policy produced.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
