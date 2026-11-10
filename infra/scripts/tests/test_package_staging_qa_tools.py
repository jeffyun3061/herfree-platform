import gzip
import importlib.util
import io
import json
import os
from pathlib import Path
import tarfile
import unittest

path = Path(__file__).resolve().parents[1] / 'package-staging-qa-tools.py'
spec = importlib.util.spec_from_file_location('qa_bundle', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

COMMIT = 'a' * 40


class PackageStagingQAToolsTest(unittest.TestCase):
    def setUp(self):
        self.remote = 'https://github.com/jeffyun3061/herfree-platform.git'
        self.ref = COMMIT
        self.refs_seen = 0
        self.mode = '100644'
        self.contents = {name: f'contents:{name}\n'.encode() for name in (*module.FILES, module.INSTALLER)}

    def git(self, *args):
        if args[:3] == ('remote', 'get-url', 'origin'): return (self.remote + '\n').encode()
        if args[:2] == ('rev-parse', 'HEAD'): return (COMMIT + '\n').encode()
        if args[:2] == ('ls-remote', '--exit-code'):
            self.refs_seen += 1
            return (self.ref + '\t' + args[-1] + '\n').encode()
        if args[0] == 'ls-tree':
            return (f'{self.mode} blob ' + 'b' * 40 + '\t' + args[-1] + '\n').encode()
        if args[0] == 'show': return self.contents[args[1].split('/')[-1]]
        raise AssertionError('unexpected git command')

    def test_bundle_has_only_expected_files_and_matching_manifest(self):
        first = module.build(COMMIT, self.git)
        self.assertEqual(first, module.build(COMMIT, self.git))
        with tarfile.open(fileobj=io.BytesIO(gzip.decompress(first)), mode='r:') as archive:
            self.assertEqual(set(archive.getnames()), {*module.FILES, module.INSTALLER, 'hashes.json'})
            hashes = json.load(archive.extractfile('hashes.json'))
            for name in module.FILES:
                self.assertEqual(hashes[name], module.hashlib.sha256(self.contents[name]).hexdigest())
                self.assertEqual(archive.extractfile(name).read(), self.contents[name])
            self.assertEqual(archive.getmember('hashes.json').mode, 0o600)

    def test_rejects_wrong_remote_sha_and_unsafe_tree_modes(self):
        for change in ('remote', 'ref', 'mode', 'commit'):
            with self.subTest(change=change):
                self.setUp()
                commit = COMMIT
                if change == 'remote': self.remote = 'https://example.invalid/other.git'
                if change == 'ref': self.ref = 'c' * 40
                if change == 'mode': self.mode = '120000'
                if change == 'commit': commit = '../../bad'
                with self.assertRaises(module.Refused): module.build(commit, self.git)

    def test_branch_change_during_packaging_is_rejected(self):
        original = self.git
        def changed(*args):
            result = original(*args)
            if args[0] == 'ls-remote' and self.refs_seen == 2:
                return ('c' * 40 + '\t' + args[-1] + '\n').encode()
            return result
        with self.assertRaisesRegex(module.Refused, 'REMOTE_COMMIT_MISMATCH'):
            module.build(COMMIT, changed)

    def test_oversized_bundle_is_not_produced(self):
        self.contents[module.FILES[0]] = os.urandom(60_000)
        with self.assertRaisesRegex(module.Refused, 'BUNDLE_TOO_LARGE'):
            module.build(COMMIT, self.git)


if __name__ == '__main__':
    unittest.main()
