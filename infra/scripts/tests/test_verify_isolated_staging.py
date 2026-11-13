import importlib.util
from pathlib import Path
import unittest
import subprocess
from unittest.mock import patch

path = Path(__file__).resolve().parents[1] / 'verify-isolated-staging.py'
spec = importlib.util.spec_from_file_location('verify_isolated_staging', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

IMAGE = '439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@sha256:' + 'a' * 64
COMMAND_ID = '12345678-1234-1234-1234-123456789abc'
HASHES = {name: 'b' * 64 for name in module.SCRIPTS}


class IsolationEvidenceTest(unittest.TestCase):
    def setUp(self):
        self.route_checks = 0
        self.sent = []
        self.replies = [{'Status': 'Success', 'ResponseCode': 0,
                         'StandardOutputContent': module.MARKER + '\n'}]

    def check_route(self):
        self.route_checks += 1

    def send(self, command):
        self.sent.append(command)
        return COMMAND_ID

    def poll(self, command_id):
        self.assertEqual(command_id, COMMAND_ID)
        return self.replies.pop(0)

    def verify(self, run='a1b2c3d4', image=IMAGE, hashes=HASHES):
        return module.verify(run, image, hashes, self.check_route, self.send, self.poll, lambda _: None)

    def test_success_is_only_point_in_time_and_never_promotes(self):
        result = self.verify()
        self.assertTrue(result['isolatedDatabaseVerified'])
        self.assertTrue(result['pointInTimeOnly'])
        self.assertFalse(result['fullE2ePassed'])
        self.assertFalse(result['cleanupVerified'])
        self.assertFalse(result['promotionAllowed'])
        self.assertEqual(self.route_checks, 2)
        self.assertIn('/opt/herfree/infra/scripts/orchestrate-isolated-staging.sh verify a1b2c3d4', self.sent[0])
        self.assertIn(IMAGE, self.sent[0])
        for name in module.SCRIPTS:
            self.assertIn(name, self.sent[0])

    def test_untrusted_inputs_never_contact_aws(self):
        for run, image in (('../../prod', IMAGE), ('a1b2c3d4', 'untrusted'),
                           ('a1b2c3d4', IMAGE + ';echo bad')):
            with self.subTest(run=run, image=image), self.assertRaises(module.route.Refused):
                self.verify(run=run, image=image)
        self.assertEqual(self.sent, [])
        self.assertEqual(self.route_checks, 0)

    def test_wrong_or_missing_tool_hash_refused(self):
        for hashes in ({}, {**HASHES, module.SCRIPTS[0]: 'x' * 64}, {**HASHES, 'extra': 'b' * 64}):
            with self.subTest(hashes=hashes), self.assertRaises(module.route.Refused):
                self.verify(hashes=hashes)
        self.assertEqual(self.sent, [])

    def test_host_or_output_failure_never_claims_success(self):
        for result in ({'Status':'Failed'}, {'Status':'Success', 'ResponseCode':1, 'StandardOutputContent':module.MARKER + '\n'},
                       {'Status':'Success', 'ResponseCode':0, 'StandardOutputContent':'unexpected data'}):
            self.replies = [result]
            with self.subTest(result=result), self.assertRaises(module.route.Refused):
                self.verify()

    def test_timeout_does_not_claim_success(self):
        self.replies = [{'Status':'InProgress'}] * 30
        with self.assertRaisesRegex(module.route.Refused, 'TIMED_OUT'):
            self.verify()

    def test_failed_initial_route_prevents_remote_command(self):
        def failed_route():
            raise module.route.Refused('STAGING_DNS_MISMATCH')
        with self.assertRaises(module.route.Refused):
            module.verify('a1b2c3d4', IMAGE, HASHES, failed_route, self.send, self.poll, lambda _: None)
        self.assertEqual(self.sent, [])

    def test_route_change_after_host_check_fails_closed(self):
        def changed_route():
            self.route_checks += 1
            if self.route_checks == 2:
                raise module.route.Refused('STAGING_DNS_MISMATCH')
        with self.assertRaises(module.route.Refused):
            module.verify('a1b2c3d4', IMAGE, HASHES, changed_route, self.send, self.poll, lambda _: None)

    def test_only_new_invocation_not_found_is_retryable(self):
        error = subprocess.CalledProcessError(1, ['aws'], stderr='InvocationDoesNotExist')
        with patch.object(module.subprocess, 'run', side_effect=error):
            self.assertEqual(module.poll(COMMAND_ID), {'Status': 'Pending'})
            with self.assertRaises(module.route.Refused):
                module.send('fixed command')


if __name__ == '__main__':
    unittest.main()
