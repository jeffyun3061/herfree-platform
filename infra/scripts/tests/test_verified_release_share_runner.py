import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'run-verified-release-share-qa.sh'
BASH = shutil.which('bash')


@unittest.skipIf(not BASH, 'requires bash')
class VerifiedReleaseShareRunnerTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        base = Path(tmp.name)
        self.repo, self.bin = base / 'repo', base / 'bin'
        for directory in (self.repo / 'frontend', self.bin):
            directory.mkdir(parents=True)
        self.log = base / 'calls'
        self.sha = 'a' * 40
        self.branch = 'qa-' + self.sha[:12] + '-1234abcd'
        self.repo_posix = self.posix(self.repo)
        self.log_posix = self.posix(self.log)
        commands = {
            'git': '''#!/bin/sh
case "$*" in
  *--show-toplevel*) printf '%s\\n' "$MOCK_REPO";;
  *'rev-parse HEAD'*) printf '%s\\n' "$RELEASE_SHA";;
  *) printf 'same-test-hash\\n';;
esac
''',
            'python3': '''#!/bin/sh
printf 'verify:%s\\n' "${1##*/}" >> "$MOCK_LOG"
if [ "${MOCK_FAIL_POST_TOOL:-}" = "${1##*/}" ] && grep -q '^npm:' "$MOCK_LOG"; then exit 1; fi
[ "${MOCK_VERIFY_FAIL:-0}" = 0 ]
''',
            'npm': '''#!/bin/sh
printf 'npm:%s\\n' "$*" >> "$MOCK_LOG"
[ "$ISOLATED_RELEASE_SHARE_QA" = true ] || exit 2
case "$*" in *e2e/release.spec.ts*)
  [ "$E2E_ALLOW_MUTATION" = true ] && [ "$E2E_EXPECTED_BASE_URL" = "$PLAYWRIGHT_BASE_URL" ] || exit 2;;
esac
[ "${MOCK_NPM_FAIL:-0}" = 0 ]
''',
        }
        for name, contents in commands.items():
            path = self.bin / name
            path.write_text(contents, newline='\n')
            path.chmod(0o755)
        self.env = {**os.environ, 'PATH': str(self.bin) + os.pathsep + os.environ['PATH'],
                    'MOCK_REPO': self.repo_posix, 'MOCK_LOG': self.log_posix, 'MOCK_BIN': self.posix(self.bin),
                    'RELEASE_SHA': self.sha, 'RELEASE_QA_BRANCH': self.branch,
                    'RELEASE_IMAGE': 'test-image', 'ISOLATED_QA_RUN': '1234abcd',
                    'ISOLATED_QA_BASIC_USERNAME': 'qa-user', 'ISOLATED_QA_BASIC_PASSWORD': 'qa-password',
                    'PLAYWRIGHT_BASE_URL': f'https://{self.branch}.d2bcg3vnlv5hkh.amplifyapp.com'}

    def posix(self, path):
        if os.name != 'nt': return str(path)
        return subprocess.check_output([BASH, '-c', 'cygpath -u "$1"', '_', str(path)], text=True).strip()

    def run_script(self, changes=None):
        return subprocess.run([BASH, '-c', 'export PATH="$MOCK_BIN:$PATH"; exec bash "$1"', '_', self.posix(SCRIPT)], env={**self.env, **(changes or {})},
                              capture_output=True, text=True, timeout=15)

    def test_browser_runs_only_between_all_preflight_checks(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text().splitlines()
        expected = ['verify:verify-live-release-qa.py', 'verify:verify-isolated-staging.py',
                    'verify:verify-isolated-frontend.py']
        self.assertEqual(calls[:3], expected)
        self.assertIn('--project=iphone-webkit', calls[3])
        self.assertIn('e2e/release.spec.ts', calls[4])
        self.assertIn('e2e/bff-session.spec.ts', calls[4])
        self.assertEqual(calls[5:], expected)
        self.assertNotIn('qa-password', result.stdout + result.stderr)
        self.assertIn('cleanup and promotion remain unverified', result.stdout)

    def test_bad_target_and_failed_check_never_run_browser(self):
        for changes in ({'PLAYWRIGHT_BASE_URL': 'https://www.herpfree.co.kr'},
                        {'RELEASE_QA_BRANCH': '../../main'}, {'MOCK_VERIFY_FAIL': '1'}):
            if self.log.exists(): self.log.unlink()
            with self.subTest(changes=changes):
                self.assertNotEqual(self.run_script(changes).returncode, 0)
                self.assertFalse(self.log.exists() and 'npm:' in self.log.read_text())

    def test_failed_browser_still_rechecks_isolation(self):
        result = self.run_script({'MOCK_NPM_FAIL': '1'})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len([x for x in self.log.read_text().splitlines() if x.startswith('verify:')]), 6)

    def test_each_postflight_failure_refuses_success(self):
        for name in ('verify-live-release-qa.py', 'verify-isolated-staging.py', 'verify-isolated-frontend.py'):
            if self.log.exists(): self.log.unlink()
            with self.subTest(tool=name):
                result = self.run_script({'MOCK_FAIL_POST_TOOL': name})
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn('checks passed', result.stdout)


if __name__ == '__main__':
    unittest.main()
