import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location('release_session', ROOT / 'run-isolated-release-session.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SessionTest(unittest.TestCase):
    def setUp(self):
        self.calls = []
    def step(self, name, error=None):
        def run():
            self.calls.append(name)
            if error: raise error(name)
        return run
    def run_session(self, fail=None, exception=module.Failed):
        steps = [self.step(name, exception if name == fail else None)
                 for name in ('install', 'start', 'browser', 'cleanup', 'restore')]
        return module.orchestrate(*steps)

    def test_pass_requires_browser_cleanup_and_restore(self):
        result = self.run_session()
        self.assertEqual(self.calls, ['install', 'start', 'browser', 'cleanup', 'restore'])
        self.assertTrue(result['cleanupVerified'])
        self.assertFalse(result['promotionAllowed'])

    def test_failed_browser_restores_but_never_passes(self):
        with self.assertRaises(module.RestoredFailure): self.run_session('browser')
        self.assertEqual(self.calls, ['install', 'start', 'browser', 'cleanup', 'restore'])

    def test_terminal_start_failure_attempts_cleanup_and_restore(self):
        with self.assertRaises(module.RestoredFailure): self.run_session('start')
        self.assertEqual(self.calls, ['install', 'start', 'cleanup', 'restore'])

    def test_unknown_start_never_sends_cleanup_or_retries(self):
        with self.assertRaises(module.Unknown): self.run_session('start', module.Unknown)
        self.assertEqual(self.calls, ['install', 'start'])

    def test_start_preflight_failure_only_restores_tools(self):
        with self.assertRaises(module.RestoredFailure): self.run_session('start', module.NotStarted)
        self.assertEqual(self.calls, ['install', 'start', 'restore'])

    def test_failed_cleanup_never_restores_or_passes(self):
        with self.assertRaises(module.Failed): self.run_session('cleanup')
        self.assertEqual(self.calls, ['install', 'start', 'browser', 'cleanup'])

    def test_unknown_install_or_cleanup_never_retries(self):
        for name, expected in [('install', ['install']),
                               ('cleanup', ['install', 'start', 'browser', 'cleanup'])]:
            self.calls.clear()
            with self.subTest(name=name), self.assertRaises(module.Unknown):
                self.run_session(name, module.Unknown)
            self.assertEqual(self.calls, expected)

    def test_wait_does_not_retry_a_failed_or_unknown_command(self):
        for error, expected in ((module.sender.route.Refused('SSM_COMMAND_FAILED'), module.Failed),
                                (module.manager.route.Refused('SSM_COMMAND_MISMATCH'), module.Unknown)):
            calls = []
            def inspect(_):
                calls.append(1)
                raise error
            with self.subTest(error=error), self.assertRaises(expected):
                module.wait_for('start', 'command', inspect, wait=lambda _: None)
            self.assertEqual(calls, [1])

    def test_wait_requires_explicit_terminal_success(self):
        replies = iter([{'status': 'Pending', 'completed': False},
                        {'status': 'Success', 'completed': True}])
        module.wait_for('cleanup', 'command', lambda _: next(replies), wait=lambda _: None)
        with self.assertRaises(module.Unknown):
            module.wait_for('cleanup', 'command', lambda _: {'status': 'Pending'},
                            wait=lambda _: None, attempts=2)

    def test_wait_accepts_real_successful_install_inspection(self):
        import json
        cid = '12345678-1234-1234-1234-123456789abc'
        output = {'installed': True, 'cleanupVerified': False, 'promotionAllowed': False}
        inspect = lambda command_id: module.sender.inspect(
            'install', command_id, lambda: module.sender.route.ACCOUNT,
            lambda _: {'Status': 'Success', 'ResponseCode': 0,
                       'StandardOutputContent': json.dumps(output)})
        module.wait_for('install', cid, inspect, wait=lambda _: None)

    def test_unknown_outcome_reports_only_safe_reason(self):
        for reason, expected in [('SSM_OUTPUT_INVALID', 'SSM_OUTPUT_INVALID'),
                                 ('sensitive detail', 'UNCLASSIFIED')]:
            def inspect(_):
                raise module.sender.route.Refused(reason)
            with self.subTest(reason=reason), self.assertRaises(module.Unknown) as result:
                module.wait_for('install', 'command', inspect, wait=lambda _: None)
            self.assertIn(expected, str(result.exception))
            self.assertNotIn('sensitive detail', str(result.exception))


if __name__ == '__main__':
    unittest.main()
