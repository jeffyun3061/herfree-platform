import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'orchestrate-isolated-staging.sh'
IMAGE = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@sha256:' + 'a' * 64
ORIGINAL = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api:' + 'b' * 40


@unittest.skipIf(os.name == 'nt' or not shutil.which('flock'), 'requires Linux bash and flock')
class IsolatedCoordinatorTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory(); self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name); self.app = self.root / 'app'; self.bin = self.root / 'bin'
        self.scripts = self.app / 'infra/scripts'; self.state = self.app / '.deploy'; self.trace = self.root / 'trace'
        for directory in (self.scripts, self.state, self.bin, self.app / 'config'): directory.mkdir(parents=True)
        (self.app / 'config/.env.staging').write_text('staging config\n')
        (self.app / 'config/.env.mysql.staging').write_text('mysql config\n')
        (self.state / 'staging.current-image').write_text(ORIGINAL)
        self.write('validate-release-env.sh', '#!/bin/sh\n[ "${MOCK_VALIDATE_FAIL:-0}" = 0 ]\n')
        self.write('staging-isolated-db.sh', '''#!/bin/sh
echo "helper:$1" >> "$TRACE"
case "$1" in
  prepare) mkdir "$HERFREE_APP_DIR/.deploy/isolated-$2"; cp "$HERFREE_APP_DIR/.deploy/staging.current-image" "$HERFREE_APP_DIR/.deploy/isolated-$2/original-image"; cp "$HERFREE_APP_DIR/config/.env.staging" "$HERFREE_APP_DIR/.deploy/isolated-$2/original-env" ;;
  pin|verify|restore-config|finalize) [ "${MOCK_HELPER_FAIL:-}" != "$1" ] ;;
esac
''')
        self.write('deploy-release.sh', '''#!/bin/sh
# guard-staging-isolation.sh
echo "deploy:$1:$3" >> "$TRACE"
echo sensitive-test-log
[ "${MOCK_DEPLOY_FAIL:-0}" = 0 ]
''')
        self.write('guard-staging-isolation.sh', '#!/bin/sh\nexit 0\n')
        for name, body in {
            'aws': '#!/bin/sh\n[ "${MOCK_AUTH_FAIL:-0}" = 0 ] || exit 1\nprintf token\n',
            'docker': '#!/bin/sh\n[ "${MOCK_PULL_FAIL:-0}" = 0 ] || [ "$1" != pull ]\n',
        }.items():
            path = self.bin / name; path.write_text(body); path.chmod(0o755)
        curl = self.bin / 'curl'
        curl.write_text('''#!/bin/sh
case "$*" in
  *api/token*) printf 'temporary-token' ;;
  *) printf '{"accountId":"439777528445","instanceId":"%s","region":"ap-northeast-2"}' "${MOCK_INSTANCE:-i-02cf5b8f3a7aa32da}" ;;
esac
'''); curl.chmod(0o755)
        self.env = {**os.environ, 'PATH':str(self.bin) + os.pathsep + os.environ['PATH'],
                    'HERFREE_APP_DIR':str(self.app), 'TRACE':str(self.trace)}

    def write(self, name, body):
        path = self.scripts / name; path.write_text(body); path.chmod(0o755)

    def invoke(self, mode, image=None, env=None):
        args = ['bash', str(SCRIPT), mode, 'a1b2c3d4']
        if image is not None: args.append(image)
        return subprocess.run(args, env=env or self.env, capture_output=True, text=True, timeout=20)

    def test_start_verifies_and_cleanup_restores_in_order(self):
        result = self.invoke('start', IMAGE)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn('sensitive-test-log', result.stdout + result.stderr)
        self.assertEqual(self.trace.read_text().splitlines(), ['helper:prepare','helper:pin','deploy:staging:', 'helper:verify'])
        self.assertEqual(self.invoke('cleanup').returncode, 0)
        self.assertEqual(self.trace.read_text().splitlines()[-3:], ['helper:restore-config','deploy:staging:rollback','helper:finalize'])

    def test_wrong_host_and_invalid_image_never_call_helpers(self):
        self.assertNotEqual(self.invoke('start', IMAGE, {**self.env, 'MOCK_INSTANCE':'i-production'}).returncode, 0)
        self.assertNotEqual(self.invoke('start', 'untrusted-image').returncode, 0)
        self.assertFalse(self.trace.exists())

    def test_failed_deploy_never_verifies_or_deletes(self):
        self.assertNotEqual(self.invoke('start', IMAGE, {**self.env, 'MOCK_DEPLOY_FAIL':'1'}).returncode, 0)
        self.assertEqual(self.trace.read_text().splitlines(), ['helper:prepare','helper:pin','deploy:staging:'])
        self.assertTrue((self.state / 'isolated-a1b2c3d4').exists())

    def test_failed_restore_never_finalizes(self):
        self.assertEqual(self.invoke('start', IMAGE).returncode, 0)
        self.assertNotEqual(self.invoke('cleanup', env={**self.env, 'MOCK_DEPLOY_FAIL':'1'}).returncode, 0)
        self.assertNotIn('helper:finalize', self.trace.read_text())

    def test_preflight_failures_never_mutate_database(self):
        for failure in ('MOCK_VALIDATE_FAIL', 'MOCK_AUTH_FAIL', 'MOCK_PULL_FAIL'):
            with self.subTest(failure=failure):
                result = self.invoke('start', IMAGE, {**self.env, failure:'1'})
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(self.trace.exists())
                self.assertFalse((self.state / 'isolated-a1b2c3d4').exists())


if __name__ == '__main__':
    unittest.main()
