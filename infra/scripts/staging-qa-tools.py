#!/usr/bin/env python3
"""Install and reconcile reviewed staging QA tools, without deploying them.

The caller must serialize staging workflows for the entire QA session. This
tool protects only its own install/restore operations with the release lock.
It never starts an instance, creates a DB, executes the installed code, or
authorizes production promotion.
"""
from __future__ import annotations
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import tempfile
import urllib.request

TOOLS = ('orchestrate-isolated-staging.sh', 'staging-isolated-db.sh',
         'guard-staging-isolation.sh', 'deploy-release.sh', 'validate-release-env.sh')
ACCOUNT = '439777528445'
INSTANCE = 'i-02cf5b8f3a7aa32da'
RUN = re.compile(r'[a-f0-9]{8}')


class Refused(Exception):
    pass


def require(condition, message):
    if not condition:
        raise Refused(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def sync_dir(path):
    directory = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def read_regular(path, missing_ok=False):
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    except FileNotFoundError:
        if missing_ok:
            return None
        raise Refused('REQUIRED_FILE_MISSING') from None
    except OSError:
        raise Refused('UNSAFE_FILE') from None
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        require(stat.S_ISREG(info.st_mode) and info.st_size <= 1_000_000, 'UNSAFE_FILE')
        return stream.read(), stat.S_IMODE(info.st_mode)


def write_atomic(path, content, mode):
    fd, name = tempfile.mkstemp(prefix='.qa-', dir=path.parent)
    try:
        os.fchmod(fd, mode)
        with os.fdopen(fd, 'wb') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
        sync_dir(path.parent)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def check_identity():
    base = 'http://169.254.169.254/latest/'
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request = urllib.request.Request(base + 'api/token', method='PUT',
                                     headers={'X-aws-ec2-metadata-token-ttl-seconds':'60'})
    try:
        with opener.open(request, timeout=3) as response:
            token = response.read(4097).decode()
        require(0 < len(token) <= 4096, 'INSTANCE_IDENTITY_UNAVAILABLE')
        request = urllib.request.Request(base + 'dynamic/instance-identity/document',
                                         headers={'X-aws-ec2-metadata-token':token})
        with opener.open(request, timeout=3) as response:
            body = response.read(16385)
        require(len(body) <= 16384, 'INSTANCE_IDENTITY_UNAVAILABLE')
        identity = json.loads(body)
    except (OSError, ValueError):
        raise Refused('INSTANCE_IDENTITY_UNAVAILABLE') from None
    require(isinstance(identity, dict) and identity.get('accountId') == ACCOUNT
            and identity.get('instanceId') == INSTANCE and identity.get('region') == 'ap-northeast-2',
            'STAGING_IDENTITY_MISMATCH')


def directories(app):
    state, scripts = app / '.deploy', app / 'infra/scripts'
    for path in (app, app / 'infra', state, scripts):
        require(path.is_dir() and not path.is_symlink(), 'STAGING_PATH_UNSAFE')
        info = path.stat()
        require(info.st_uid == os.geteuid() and not (stat.S_IMODE(info.st_mode) & 0o022),
                'STAGING_PATH_UNSAFE')
    require(not list(state.glob('isolated-????????')) and not (state / 'staging.pending-operation').exists(),
            'STAGING_OPERATION_ACTIVE')
    return state, scripts


def with_lock(state, action):
    try:
        fd = os.open(state / 'staging.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    except OSError:
        raise Refused('STAGING_LOCK_UNAVAILABLE') from None
    with os.fdopen(fd, 'r+b') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise Refused('STAGING_LOCK_BUSY') from None
        return action()


def install(app, run, source, expected):
    require(RUN.fullmatch(run or '') is not None and set(expected) == set(TOOLS), 'INVALID_INPUT')
    require(source.is_dir() and not source.is_symlink(), 'SOURCE_UNSAFE')
    state, scripts = directories(app)
    def perform():
        directories(app)
        record = state / ('qa-tool-install-' + run)
        require(not record.exists() and not record.is_symlink(), 'INSTALL_RECORD_EXISTS')
        require(not list(state.glob('qa-tool-install-????????')), 'OTHER_INSTALL_RECORD_EXISTS')
        incoming = {}
        manifest = {}
        for name in TOOLS:
            wanted = expected[name]
            require(isinstance(wanted, str) and re.fullmatch(r'[a-f0-9]{64}', wanted), 'INVALID_TOOL_HASH')
            data, _ = read_regular(source / name)
            require(digest(data) == wanted, 'SOURCE_HASH_MISMATCH')
            original = read_regular(scripts / name, missing_ok=True)
            incoming[name] = (data, original)
            manifest[name] = {'new':wanted, 'original':digest(original[0]) if original else None,
                              'mode':original[1] if original else None}
        record.mkdir(mode=0o700)
        sync_dir(state)
        for name, (_, original) in incoming.items():
            if original:
                write_atomic(record / name, original[0], 0o600)
        write_atomic(record / 'manifest.json', json.dumps(manifest, sort_keys=True).encode(), 0o600)
        for name, (data, original) in incoming.items():
            current = read_regular(scripts / name, missing_ok=True)
            require(current == original, 'TARGET_CHANGED_RECONCILE')
            write_atomic(scripts / name, data, 0o755)
        return {'installed':True, 'cleanupVerified':False, 'promotionAllowed':False}
    return with_lock(state, perform)


def restore(app, run):
    require(RUN.fullmatch(run or '') is not None, 'INVALID_INPUT')
    state, scripts = directories(app)
    def perform():
        directories(app)
        record = state / ('qa-tool-install-' + run)
        require(record.is_dir() and not record.is_symlink(), 'INSTALL_RECORD_MISSING')
        raw, _ = read_regular(record / 'manifest.json')
        try:
            manifest = json.loads(raw)
        except ValueError:
            raise Refused('INSTALL_RECORD_INVALID') from None
        require(isinstance(manifest, dict) and set(manifest) == set(TOOLS), 'INSTALL_RECORD_INVALID')
        changes = []
        for name in TOOLS:
            entry = manifest[name]
            require(isinstance(entry, dict) and set(entry) == {'new', 'original', 'mode'}
                    and re.fullmatch(r'[a-f0-9]{64}', entry['new'] or ''), 'INSTALL_RECORD_INVALID')
            old = read_regular(record / name, missing_ok=True)
            if entry['original'] is None:
                require(old is None and entry['mode'] is None, 'INSTALL_RECORD_INVALID')
            else:
                require(isinstance(entry['mode'], int) and 0 <= entry['mode'] <= 0o777
                        and old is not None and digest(old[0]) == entry['original'], 'INSTALL_RECORD_INVALID')
            current = read_regular(scripts / name, missing_ok=True)
            current_hash = digest(current[0]) if current else None
            require(current_hash in (entry['original'], entry['new']), 'TARGET_CHANGED_RECONCILE')
            changes.append((name, entry, old))
        for name, entry, old in changes:
            current = read_regular(scripts / name, missing_ok=True)
            current_hash = digest(current[0]) if current else None
            require(current_hash in (entry['original'], entry['new']), 'TARGET_CHANGED_RECONCILE')
            if old is not None:
                if current_hash != entry['original'] or current[1] != entry['mode']:
                    write_atomic(scripts / name, old[0], entry['mode'])
            elif current is not None:
                (scripts / name).unlink()
                sync_dir(scripts)
        for name in TOOLS:
            backup = record / name
            if backup.exists():
                backup.unlink()
        (record / 'manifest.json').unlink()
        record.rmdir()
        sync_dir(state)
        return {'toolsRestored':True, 'cleanupVerified':False, 'promotionAllowed':False}
    return with_lock(state, perform)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('install', 'restore'))
    parser.add_argument('--run', required=True)
    parser.add_argument('--source', type=Path)
    parser.add_argument('--hashes', type=Path)
    args = parser.parse_args()
    try:
        check_identity()
        app = Path('/opt/herfree')
        if args.mode == 'install':
            require(args.source is not None and args.hashes is not None, 'INVALID_INPUT')
            raw, _ = read_regular(args.hashes)
            expected = json.loads(raw)
            require(isinstance(expected, dict), 'INVALID_INPUT')
            result = install(app, args.run, args.source, expected)
        else:
            require(args.source is None and args.hashes is None, 'INVALID_INPUT')
            result = restore(app, args.run)
        print(json.dumps(result))
        return 0
    except (Refused, OSError, ValueError, TypeError) as error:
        code = str(error) if isinstance(error, Refused) else 'FILESYSTEM_OR_INPUT_ERROR'
        print(json.dumps({'error':code, 'reconciliationMayBeRequired':True, 'promotionAllowed':False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
