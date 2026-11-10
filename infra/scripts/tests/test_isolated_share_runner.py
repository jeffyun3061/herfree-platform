import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'run-isolated-share-qa.sh'


@unittest.skipIf(os.name == 'nt' or not shutil.which('bash'), 'requires Linux bash')
class IsolatedShareRunnerTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        base = Path(tmp.name)
        self.repo, self.bin, self.candidate = base / 'repo', base / 'bin', base / 'candidate'
        for directory in (self.repo / 'frontend', self.repo / 'infra/scripts', self.bin, self.candidate):
            directory.mkdir(parents=True)
        self.log = base / 'calls'
        commands = {
            'git': '#!/bin/sh\nprintf "%s\\n" "$MOCK_REPO"\n',
            'python3': '''#!/bin/sh
printf 'verify:%s\\n' "${1##*/}" >> "$MOCK_LOG"
[ "${MOCK_VERIFY_FAIL:-0}" = 0 ]
''',
            'npm': '''#!/bin/sh
printf 'npm:%s\\n' "$*" >> "$MOCK_LOG"
[ "$ISOLATED_SHARE_QA" = true ] || exit 2
[ "${MOCK_NPM_FAIL:-0}" = 0 ]
''',
        }
        for name, contents in commands.items():
            path = self.bin / name
            path.write_text(contents)
            path.chmod(0o755)
        self.env = {**os.environ, 'PATH':str(self.bin) + os.pathsep + os.environ['PATH'],
                    'MOCK_REPO':str(self.repo), 'MOCK_LOG':str(self.log),
                    'ISOLATED_QA_RUN':'a1b2c3d4', 'ISOLATED_QA_CANDIDATE_DIR':str(self.candidate),
                    'ISOLATED_QA_BASIC_USERNAME':'qa-user', 'ISOLATED_QA_BASIC_PASSWORD':'qa-password',
                    'PLAYWRIGHT_BASE_URL':'https://qa-4160aee7de7a-4160aee7.d2bcg3vnlv5hkh.amplifyapp.com'}

    def run_script(self, changes=None):
        return subprocess.run(['bash', str(SCRIPT)], env={**self.env, **(changes or {})},
                              capture_output=True, text=True, timeout=10)

    def test_checks_before_and_after_three_browser_projects(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text().splitlines()
        self.assertEqual(calls[:2], ['verify:verify-isolated-staging.py', 'verify:verify-isolated-frontend.py'])
        self.assertIn('--project=chromium', calls[2])
        self.assertIn('--project=mobile-chromium', calls[2])
        self.assertIn('--project=iphone-webkit', calls[2])
        self.assertIn('--workers=1', calls[2])
        self.assertEqual(calls[3:], calls[:2])
        self.assertNotIn('qa-password', result.stdout + result.stderr)
        self.assertIn('cleanup and promotion remain unverified', result.stdout)

    def test_bad_target_and_failed_preflight_never_run_browser(self):
        for changes in ({'ISOLATED_QA_RUN':'../../prod'},
                        {'PLAYWRIGHT_BASE_URL':'https://www.herpfree.co.kr'},
                        {'MOCK_VERIFY_FAIL':'1'}):
            if self.log.exists(): self.log.unlink()
            with self.subTest(changes=changes):
                self.assertNotEqual(self.run_script(changes).returncode, 0)
                self.assertFalse(self.log.exists() and 'npm:' in self.log.read_text())

    def test_failed_browser_still_checks_isolation_and_never_succeeds(self):
        result = self.run_script({'MOCK_NPM_FAIL':'1'})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.log.read_text().splitlines()[-2:],
                         ['verify:verify-isolated-staging.py', 'verify:verify-isolated-frontend.py'])
        self.assertNotIn('checks passed', result.stdout)


if __name__ == '__main__':
    unittest.main()
