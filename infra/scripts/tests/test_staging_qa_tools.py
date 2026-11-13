import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

module = None
if os.name != 'nt':
    path = Path(__file__).resolve().parents[1] / 'staging-qa-tools.py'
    spec = importlib.util.spec_from_file_location('staging_qa_tools', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)


@unittest.skipIf(os.name == 'nt', 'requires Linux file locks and permissions')
class StagingQAToolsTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        base = Path(temporary.name)
        self.app, self.source = base / 'app', base / 'source'
        self.scripts, self.state = self.app / 'infra/scripts', self.app / '.deploy'
        for directory in (self.scripts, self.state, self.source):
            directory.mkdir(parents=True)
        self.hashes = {}
        for index, name in enumerate(module.TOOLS):
            data = f'candidate-{name}\n'.encode()
            (self.source / name).write_bytes(data)
            self.hashes[name] = module.digest(data)
            if index % 2 == 0:
                path = self.scripts / name
                path.write_bytes(f'original-{name}\n'.encode())
                path.chmod(0o750)

    def original(self, name):
        index = module.TOOLS.index(name)
        return f'original-{name}\n'.encode() if index % 2 == 0 else None

    def test_install_and_restore_exact_original_files_and_modes(self):
        self.assertFalse(module.install(self.app, 'a1b2c3d4', self.source, self.hashes)['promotionAllowed'])
        for name in module.TOOLS:
            self.assertEqual((self.scripts / name).read_bytes(), (self.source / name).read_bytes())
        result = module.restore(self.app, 'a1b2c3d4')
        self.assertTrue(result['toolsRestored'])
        self.assertFalse(result['cleanupVerified'])
        for name in module.TOOLS:
            path, old = self.scripts / name, self.original(name)
            if old is None:
                self.assertFalse(path.exists())
            else:
                self.assertEqual(path.read_bytes(), old)
                self.assertEqual(path.stat().st_mode & 0o777, 0o750)
        self.assertFalse((self.state / 'qa-tool-install-a1b2c3d4').exists())

    def test_source_hash_mismatch_never_changes_target(self):
        (self.source / module.TOOLS[0]).write_text('tampered')
        with self.assertRaisesRegex(module.Refused, 'SOURCE_HASH_MISMATCH'):
            module.install(self.app, 'a1b2c3d4', self.source, self.hashes)
        self.assertEqual((self.scripts / module.TOOLS[0]).read_bytes(), self.original(module.TOOLS[0]))
        self.assertFalse((self.state / 'qa-tool-install-a1b2c3d4').exists())

    def test_external_change_prevents_any_restore(self):
        module.install(self.app, 'a1b2c3d4', self.source, self.hashes)
        changed = self.scripts / module.TOOLS[-1]
        changed.write_text('external-change')
        with self.assertRaisesRegex(module.Refused, 'TARGET_CHANGED_RECONCILE'):
            module.restore(self.app, 'a1b2c3d4')
        self.assertEqual(changed.read_text(), 'external-change')
        self.assertEqual((self.scripts / module.TOOLS[0]).read_bytes(), (self.source / module.TOOLS[0]).read_bytes())
        self.assertTrue((self.state / 'qa-tool-install-a1b2c3d4').exists())

    def test_interrupted_install_can_be_reconciled(self):
        real_write = module.write_atomic
        calls = 0
        def interrupted(path, content, mode):
            nonlocal calls
            if path.parent == self.scripts:
                calls += 1
                if calls == 2:
                    raise OSError('simulated interruption')
            return real_write(path, content, mode)
        with patch.object(module, 'write_atomic', side_effect=interrupted), self.assertRaises(OSError):
            module.install(self.app, 'a1b2c3d4', self.source, self.hashes)
        self.assertTrue(module.restore(self.app, 'a1b2c3d4')['toolsRestored'])
        self.assertEqual((self.scripts / module.TOOLS[0]).read_bytes(), self.original(module.TOOLS[0]))

    def test_active_isolation_blocks_install_and_restore(self):
        (self.state / 'isolated-a1b2c3d4').mkdir()
        with self.assertRaisesRegex(module.Refused, 'STAGING_OPERATION_ACTIVE'):
            module.install(self.app, 'a1b2c3d4', self.source, self.hashes)
        self.assertFalse((self.state / 'qa-tool-install-a1b2c3d4').exists())

    def test_symlinked_target_is_refused(self):
        name = module.TOOLS[1]
        (self.scripts / name).symlink_to(self.source / name)
        with self.assertRaisesRegex(module.Refused, 'UNSAFE_FILE'):
            module.install(self.app, 'a1b2c3d4', self.source, self.hashes)
        self.assertEqual((self.source / name).read_bytes(), f'candidate-{name}\n'.encode())

    def test_held_staging_lock_prevents_install(self):
        import fcntl
        with (self.state / 'staging.lock').open('w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaisesRegex(module.Refused, 'STAGING_LOCK_BUSY'):
                module.install(self.app, 'a1b2c3d4', self.source, self.hashes)
        self.assertFalse((self.state / 'qa-tool-install-a1b2c3d4').exists())


if __name__ == '__main__':
    unittest.main()
