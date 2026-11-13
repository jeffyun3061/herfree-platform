import importlib.util
import json
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'manage-isolated-release-run.py'
spec = importlib.util.spec_from_file_location('release_run', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ManageRunTest(unittest.TestCase):
    def setUp(self):
        self.image = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@sha256:' + 'a' * 64
        self.command_id = '12345678-1234-1234-1234-123456789abc'
        self.sent = []

    def send(self, command):
        self.sent.append(command)
        return self.command_id

    def test_start_and_cleanup_accept_only_fixed_staging_commands(self):
        start = module.submit('start', 'a1b2c3d4', self.image, lambda: None, self.send)
        self.assertFalse(start['promotionAllowed'])
        self.assertEqual(self.sent[0], '/opt/herfree/infra/scripts/orchestrate-isolated-staging.sh start a1b2c3d4 ' + self.image)
        module.submit('cleanup', 'a1b2c3d4', None, lambda: None, self.send)
        self.assertEqual(self.sent[1], '/opt/herfree/infra/scripts/orchestrate-isolated-staging.sh cleanup a1b2c3d4')

    def test_bad_target_or_preflight_never_sends_command(self):
        for mode, run, image in (('start', '../prod', self.image), ('start', 'a1b2c3d4', 'bad'),
                                 ('cleanup', 'a1b2c3d4', self.image)):
            with self.subTest(mode=mode), self.assertRaises(module.route.Refused):
                module.submit(mode, run, image, lambda: None, self.send)
        def fail(): raise module.route.Refused('offline')
        with self.assertRaises(module.route.Refused):
            module.submit('start', 'a1b2c3d4', self.image, fail, self.send)
        self.assertEqual(self.sent, [])

    def test_only_exact_successful_cleanup_can_be_reported(self):
        account = lambda: module.route.ACCOUNT
        expected = module.command_for('cleanup', 'a1b2c3d4')
        describe = lambda _: {'document': 'AWS-RunShellScript', 'instances': [module.route.INSTANCE],
                              'commands': [expected]}
        pending = module.inspect('cleanup', self.command_id, 'a1b2c3d4', None, account,
                                 lambda _: {'Status': 'Pending'}, describe)
        self.assertFalse(pending['completed'])
        good = {'Status': 'Success', 'ResponseCode': 0,
                'StandardOutputContent': 'isolated staging DB and grant removed; promotion is not authorized\n'}
        result = module.inspect('cleanup', self.command_id, 'a1b2c3d4', None, account, lambda _: good, describe)
        self.assertTrue(result['completed'])
        self.assertFalse(result['promotionAllowed'])
        for response in ({**good, 'ResponseCode': 1}, {**good, 'Status': 'Failed'},
                         {**good, 'StandardOutputContent': 'missing marker'}):
            with self.subTest(response=response), self.assertRaises(module.route.Refused):
                module.inspect('cleanup', self.command_id, 'a1b2c3d4', None, account, lambda _: response, describe)

    def test_inspection_rejects_a_different_instance_or_command(self):
        account = lambda: module.route.ACCOUNT
        good = {'Status': 'Success', 'ResponseCode': 0,
                'StandardOutputContent': 'isolated staging DB and grant removed; promotion is not authorized\n'}
        for command in ({'document': 'AWS-RunShellScript', 'instances': ['other'], 'commands': ['wrong']},
                        {'document': 'other', 'instances': [module.route.INSTANCE], 'commands': ['wrong']}):
            with self.subTest(command=command), self.assertRaisesRegex(module.route.Refused, 'SSM_COMMAND_MISMATCH'):
                module.inspect('cleanup', self.command_id, 'a1b2c3d4', None, account,
                               lambda _: good, lambda _: command)

    def test_ambiguous_submission_is_not_retried(self):
        calls = []
        with self.assertRaisesRegex(module.route.Refused, 'SSM_SUBMISSION_UNKNOWN'):
            module.submit('start', 'a1b2c3d4', self.image, lambda: None,
                          lambda command: calls.append(command))
        self.assertEqual(len(calls), 1)


if __name__ == '__main__':
    unittest.main()
