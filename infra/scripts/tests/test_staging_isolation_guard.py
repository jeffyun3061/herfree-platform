import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'guard-staging-isolation.sh'


@unittest.skipIf(os.name == 'nt' or not shutil.which('bash'), 'requires Linux bash')
class IsolationGuardTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.config = self.root / 'config'
        self.config.write_text('qa settings\n')
        self.state = self.root / 'isolated-a1b2c3d4'
        self.env = dict(os.environ)
        self.env.pop('HERFREE_ISOLATED_QA_RUN', None)

    def check(self, mode='deploy', run=None, image='original-image'):
        env = dict(self.env)
        if run is not None:
            env['HERFREE_ISOLATED_QA_RUN'] = run
        return subprocess.run(['bash', str(SCRIPT), str(self.root), str(self.config), mode, image],
                              env=env, capture_output=True, text=True).returncode

    def test_normal_deploy_allowed_without_isolation(self):
        self.assertEqual(self.check(), 0)

    def test_unrelated_run_and_partial_isolation_block_deploy(self):
        self.state.mkdir()
        self.assertNotEqual(self.check(), 0)
        self.assertNotEqual(self.check(run='b1b2c3d4'), 0)
        self.assertNotEqual(self.check(run='a1b2c3d4'), 0)
        self.assertEqual(self.check(mode='reconcile'), 0)

    def test_matching_run_requires_approved_configuration(self):
        self.state.mkdir()
        (self.state / 'prepared').touch()
        (self.state / 'qa-env').write_text('qa settings\n')
        self.assertEqual(self.check(run='a1b2c3d4'), 0)
        self.config.write_text('unexpected config\n')
        self.assertNotEqual(self.check(run='a1b2c3d4'), 0)
        (self.state / 'original-env').write_text('original settings\n')
        (self.state / 'original-image').write_text('original-image')
        (self.state / 'config-restored').touch()
        self.config.write_text('original settings\n')
        self.assertNotEqual(self.check(run='a1b2c3d4'), 0)
        self.assertNotEqual(self.check(mode='rollback', run='a1b2c3d4', image='candidate-image'), 0)
        self.assertEqual(self.check(mode='rollback', run='a1b2c3d4'), 0)
        (self.root / 'isolated-b1b2c3d4').mkdir()
        self.assertNotEqual(self.check(run='a1b2c3d4'), 0)

    def test_symlink_record_is_never_accepted(self):
        target = self.root / 'elsewhere'
        target.mkdir()
        self.state.symlink_to(target, target_is_directory=True)
        (target / 'prepared').touch()
        (target / 'qa-env').write_text('qa settings\n')
        self.assertNotEqual(self.check(run='a1b2c3d4'), 0)


if __name__ == '__main__':
    unittest.main()
