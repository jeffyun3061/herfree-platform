#!/usr/bin/env python3
"""Build a deterministic QA-tools bundle from the exact reviewed PR commit.

This does not upload, install or execute the bundle and cannot approve a
release. SSM commands must never contain passwords or other secrets.
"""
import argparse
import base64
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile

FILES = ('orchestrate-isolated-staging.sh', 'staging-isolated-db.sh',
         'guard-staging-isolation.sh', 'deploy-release.sh', 'validate-release-env.sh')
INSTALLER = 'staging-qa-tools.py'
MAX_ENCODED = 60_000


class Refused(Exception):
    pass


def require(condition, code):
    if not condition:
        raise Refused(code)


def build(commit, git):
    require(re.fullmatch(r'[a-f0-9]{40}', commit or '') is not None, 'INVALID_COMMIT')
    require(git('remote', 'get-url', 'origin').strip() in (
        b'https://github.com/jeffyun3061/herfree-platform.git',
        b'https://github.com/jeffyun3061/herfree-platform',
        b'git@github.com:jeffyun3061/herfree-platform.git'), 'REMOTE_REFUSED')
    require(git('rev-parse', 'HEAD').strip() == commit.encode(), 'LOCAL_COMMIT_MISMATCH')
    ref = b'refs/pull/196/head'
    require(git('ls-remote', '--exit-code', 'origin', ref.decode()).strip() == commit.encode() + b'\t' + ref,
            'REMOTE_COMMIT_MISMATCH')
    contents = {}
    for name in (*FILES, INSTALLER):
        path = f'infra/scripts/{name}'
        entry = git('ls-tree', commit, '--', path).strip()
        require(re.fullmatch(rb'100(?:644|755) blob [a-f0-9]{40}\t' + re.escape(path.encode()), entry) is not None,
                'SOURCE_MODE_INVALID')
        data = git('show', f'{commit}:{path}')
        require(isinstance(data, bytes) and 0 < len(data) <= 1_000_000, 'SOURCE_INVALID')
        contents[name] = data
    hashes = {name:hashlib.sha256(contents[name]).hexdigest() for name in FILES}
    contents['hashes.json'] = (json.dumps(hashes, sort_keys=True, separators=(',', ':')) + '\n').encode()
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w', format=tarfile.USTAR_FORMAT) as archive:
        for name in (*FILES, INSTALLER, 'hashes.json'):
            data = contents[name]
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mode = 0o600 if name == 'hashes.json' else 0o755
            info.mtime = info.uid = info.gid = 0
            info.uname = info.gname = ''
            archive.addfile(info, io.BytesIO(data))
    bundle = gzip.compress(stream.getvalue(), mtime=0)
    require(len(base64.b64encode(bundle)) <= MAX_ENCODED, 'BUNDLE_TOO_LARGE')
    # A branch change while building makes the result unusable.
    require(git('ls-remote', '--exit-code', 'origin', ref.decode()).strip() == commit.encode() + b'\t' + ref,
            'REMOTE_COMMIT_MISMATCH')
    return bundle


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    def git(*items):
        try:
            result = subprocess.run(['git', *items], cwd=args.repo, check=True, capture_output=True,
                                    timeout=30, env={**os.environ, 'GIT_TERMINAL_PROMPT':'0'})
            return result.stdout
        except (OSError, subprocess.SubprocessError):
            raise Refused('GIT_COMMAND_FAILED') from None
    try:
        bundle = build(args.commit, git)
        fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0), 0o600)
        with os.fdopen(fd, 'wb') as stream:
            stream.write(bundle)
            stream.flush()
            os.fsync(stream.fileno())
        print(json.dumps({'bundleSha256':hashlib.sha256(bundle).hexdigest(), 'bytes':len(bundle),
                          'installed':False, 'promotionAllowed':False}))
        return 0
    except (Refused, OSError) as error:
        code = str(error) if isinstance(error, Refused) else 'OUTPUT_FAILED'
        print(json.dumps({'error':code, 'installed':False, 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
