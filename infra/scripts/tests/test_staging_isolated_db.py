import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'staging-isolated-db.sh'


@unittest.skipIf(os.name == 'nt' or not shutil.which('flock'), 'requires Linux bash and flock')
class StagingIsolatedDbTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.app, self.bin, self.mock = root / 'app', root / 'bin', root / 'mock'
        for p in (self.app / 'config', self.app / '.deploy', self.app / 'infra/scripts', self.bin, self.mock):
            p.mkdir(parents=True, exist_ok=True)
        self.config = self.app / 'config/.env.staging'
        self.original = ('SPRING_PROFILES_ACTIVE=staging\nDB_RUNTIME=local\n'
                         'SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/actual_stage?sslMode=REQUIRED\n'
                         'ADMIN_ACCESS_ALLOWED_CIDRS=10.0.0.1/32\n')
        self.config.write_text(self.original)
        self.config.chmod(0o600)
        mysql_env = self.app / 'config/.env.mysql.staging'
        mysql_env.write_text('MYSQL_USER=stage_app\n')
        mysql_env.chmod(0o600)
        self.image = self.app / '.deploy/staging.current-image'
        self.image.write_text('existing-image')
        backup = self.app / 'infra/scripts/backup-db.sh'
        backup.write_text('#!/bin/sh\nexit "${MOCK_BACKUP_EXIT:-0}"\n')
        backup.chmod(0o755)
        docker = self.bin / 'docker'
        docker.write_text('''#!/usr/bin/env python3
import os, pathlib, sys
args=sys.argv[1:]; state=pathlib.Path(os.environ['MOCK_STATE'])
if args[0]=='ps':
    if not any('project=herfree-staging' in x for x in args): sys.exit(5)
    if os.getenv('MOCK_WRONG_PROJECT') == '1': sys.exit(0)
    print('mysql-id' if any('service=mysql' in x for x in args) else 'api-id')
elif args[0]=='inspect':
    fmt=args[args.index('--format')+1]
    if 'PortBindings' in fmt: print('null')
    elif fmt=='{{.Config.Image}}': print(os.getenv('MOCK_RUNNING_IMAGE') or pathlib.Path(os.environ['MOCK_IMAGE']).read_text())
    elif 'Config.Env' in fmt:
        print('SPRING_PROFILES_ACTIVE=' + os.getenv('MOCK_PROFILE','staging'))
        print('DB_RUNTIME=local')
        print('SPRING_DATASOURCE_URL=' + os.getenv('MOCK_URL','jdbc:mysql://mysql:3306/actual_stage?sslMode=REQUIRED'))
    else: print('staging-network')
elif args[0]=='exec':
    sql=sys.stdin.read(); (state/'queries').open('a').write(sql+'\\n')
    if 'information_schema.schemata' in sql: print('1' if (state/'database').exists() else '0')
    elif 'information_schema.schema_privileges' in sql: print('1' if (state/'grant').exists() else '0')
    elif sql.startswith('CREATE DATABASE'): (state/'database').touch()
    elif sql.startswith('GRANT ALL'): (state/'grant').touch()
    elif sql.startswith('REVOKE ALL'): (state/'grant').unlink(missing_ok=True)
    elif sql.startswith('DROP DATABASE'): (state/'database').unlink(missing_ok=True)
    else: sys.exit(3)
else: sys.exit(3)
''')
        docker.chmod(0o755)
        curl = self.bin / 'curl'
        curl.write_text('#!/bin/sh\n[ "${MOCK_HEALTH_FAILURE:-0}" = 0 ] || exit 1\nprintf \'{"status":"UP"}\\n\'\n')
        curl.chmod(0o755)
        self.env = {**os.environ, 'PATH': str(self.bin) + os.pathsep + os.environ['PATH'],
                    'HERFREE_APP_DIR': str(self.app), 'MOCK_STATE': str(self.mock), 'MOCK_IMAGE': str(self.image)}

    def run_script(self, mode, run='a1b2c3d4', env=None):
        return subprocess.run(['bash', str(SCRIPT), mode, run], env=env or self.env,
                              capture_output=True, text=True, timeout=20)

    def test_prepare_restore_and_cleanup_are_scoped(self):
        self.assertEqual(self.run_script('prepare').returncode, 0)
        self.assertTrue((self.mock/'database').exists())
        self.assertTrue((self.mock/'grant').exists())
        self.assertIn('/hfqa_a1b2c3d4?sslMode=REQUIRED', self.config.read_text())
        self.assertNotEqual(self.run_script('prepare', 'b1b2c3d4').returncode, 0)
        self.image.write_text('candidate-image')
        self.assertEqual(self.run_script('restore-config').returncode, 0)
        self.assertEqual(self.config.read_text(), self.original)
        self.assertNotEqual(self.run_script('finalize').returncode, 0)
        self.assertTrue((self.mock/'database').exists())
        self.image.write_text('existing-image')
        self.assertEqual(self.run_script('finalize').returncode, 0)
        self.assertFalse((self.mock/'database').exists())
        self.assertFalse((self.mock/'grant').exists())
        self.assertFalse((self.app/'.deploy/isolated-a1b2c3d4').exists())
        self.assertNotIn('actual_stage`', (self.mock/'queries').read_text())

    def test_unknown_creation_outcome_never_drops_database(self):
        self.assertEqual(self.run_script('prepare').returncode, 0)
        (self.app/'.deploy/isolated-a1b2c3d4/db-created').unlink()
        self.assertEqual(self.run_script('restore-config').returncode, 0)
        self.assertNotEqual(self.run_script('finalize').returncode, 0)
        self.assertTrue((self.mock/'database').exists())

    def test_database_is_not_dropped_while_running_api_still_uses_it(self):
        self.assertEqual(self.run_script('prepare').returncode, 0)
        self.assertEqual(self.run_script('restore-config').returncode, 0)
        qa = {**self.env, 'MOCK_URL':'jdbc:mysql://mysql:3306/hfqa_a1b2c3d4?sslMode=REQUIRED'}
        self.assertNotEqual(self.run_script('finalize', env=qa).returncode, 0)
        self.assertTrue((self.mock/'database').exists())

    def test_changed_config_is_not_overwritten(self):
        self.assertEqual(self.run_script('prepare').returncode, 0)
        self.config.write_text(self.config.read_text() + 'OTHER_CHANGE=keep\n')
        self.assertNotEqual(self.run_script('restore-config').returncode, 0)
        self.assertIn('OTHER_CHANGE=keep', self.config.read_text())

    def test_refuses_nonstaging_and_failed_backup_before_writing(self):
        for env in ({**self.env, 'MOCK_PROFILE':'prod'}, {**self.env, 'MOCK_BACKUP_EXIT':'1'}):
            self.assertNotEqual(self.run_script('prepare', env=env).returncode, 0)
            self.assertFalse((self.mock/'database').exists())
            self.assertEqual(self.config.read_text(), self.original)

    def test_invalid_run_name_never_targets_a_database(self):
        self.assertNotEqual(self.run_script('prepare', '../../prod').returncode, 0)
        self.assertFalse((self.mock/'database').exists())

    def test_refuses_containers_from_another_compose_project(self):
        env = {**self.env, 'MOCK_WRONG_PROJECT': '1'}
        self.assertNotEqual(self.run_script('prepare', env=env).returncode, 0)
        self.assertFalse((self.mock/'database').exists())
        self.assertFalse((self.mock/'queries').exists())

    def test_refuses_unhealthy_or_unrecorded_running_image_before_mutation(self):
        for env in ({**self.env, 'MOCK_RUNNING_IMAGE': 'unexpected-image'},
                    {**self.env, 'MOCK_HEALTH_FAILURE': '1'}):
            with self.subTest(env=env):
                self.assertNotEqual(self.run_script('prepare', env=env).returncode, 0)
                self.assertFalse((self.mock/'database').exists())
                self.assertFalse((self.mock/'queries').exists())
                self.assertEqual(self.config.read_text(), self.original)


if __name__ == '__main__':
    unittest.main()
