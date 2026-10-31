import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'run-isolated-staging-smoke.sh'


@unittest.skipIf(os.name == 'nt' or not shutil.which('bash'), 'requires Linux bash')
class IsolatedSmokeRunnerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.root, self.bin = root / 'repo', root / 'bin'
        (self.root / 'frontend').mkdir(parents=True)
        (self.root / 'infra/scripts').mkdir(parents=True)
        self.bin.mkdir()
        for name, contents in {
            'git': '#!/bin/sh\nprintf "%s\\n" "$MOCK_REPO"\n',
            'python3': '#!/bin/sh\n[ "${MOCK_PREFLIGHT_FAIL:-0}" = 0 ] || exit 1\n',
            'npm': '#!/bin/sh\nprintf "%s\\n" "$*" > "$MOCK_NPM_LOG"\n',
        }.items():
            path = self.bin / name
            path.write_text(contents)
            path.chmod(0o755)
        self.log = root / 'npm.log'
        branch = 'qa-' + 'a' * 12 + '-' + 'b' * 8
        self.env = {**os.environ, 'PATH': str(self.bin) + os.pathsep + os.environ['PATH'],
                    'MOCK_REPO': str(self.root), 'MOCK_NPM_LOG': str(self.log),
                    'ISOLATED_QA_BRANCH': branch, 'ISOLATED_QA_COMMIT': 'a' * 40,
                    'ISOLATED_QA_BASIC_USERNAME': 'qa-user', 'ISOLATED_QA_BASIC_PASSWORD': 'qa-password',
                    'PLAYWRIGHT_BASE_URL': f'https://{branch}.d2bcg3vnlv5hkh.amplifyapp.com'}
        self.env.pop('E2E_ALLOW_MUTATION', None)

    def run_script(self, env=None):
        return subprocess.run(['bash', str(SCRIPT)], env=env or self.env, capture_output=True, text=True)

    def test_preflight_success_runs_only_smoke_without_printing_credentials(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.log.read_text().strip(), 'run e2e:staging:smoke')
        self.assertNotIn('qa-password', result.stdout + result.stderr)

    def test_preflight_failure_or_unsafe_target_never_runs_browser(self):
        for changes in ({'MOCK_PREFLIGHT_FAIL': '1'}, {'E2E_ALLOW_MUTATION': 'true'},
                        {'PLAYWRIGHT_BASE_URL': 'https://www.herpfree.co.kr'}):
            with self.subTest(changes=changes):
                result = self.run_script({**self.env, **changes})
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(self.log.exists())


if __name__ == '__main__':
    unittest.main()
