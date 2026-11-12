import importlib.util
import json
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'send-staging-qa-tools.py'
spec = importlib.util.spec_from_file_location('sender', path)
sender = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sender)


class SenderTests(unittest.TestCase):
    def test_invalid_run_never_sends(self):
        with self.assertRaises(sender.route.Refused):
            sender.submit('install', 'bad', b'abc', lambda: None, lambda _: self.fail('sent'))

    def test_failed_preflight_never_sends(self):
        def fail():
            raise sender.route.Refused('offline')
        with self.assertRaises(sender.route.Refused):
            sender.submit('install', '1234abcd', b'abc', fail, lambda _: self.fail('sent'))

    def test_restore_checks_instance_without_http(self):
        def lookup(service, operation, *args):
            if service == 'sts':
                return sender.route.ACCOUNT
            if service == 'ec2':
                return [{'id': sender.route.INSTANCE, 'state': 'running'}]
            return [{'id': sender.route.INSTANCE, 'status': 'Online'}]
        sender.verify_restore_target(lookup)
        with self.assertRaises(sender.route.Refused):
            sender.verify_restore_target(lambda *args: 'wrong-account')

    def test_inspection_requires_exact_success(self):
        cid = '12345678-1234-1234-1234-123456789abc'
        account = lambda: sender.route.ACCOUNT
        pending = sender.inspect('install', cid, account, lambda _: {'Status':'Pending'})
        self.assertFalse(pending['completed'])
        output = {'installed':True, 'cleanupVerified':False, 'promotionAllowed':False}
        success = sender.inspect('install', cid, account, lambda _: {
            'Status':'Success', 'ResponseCode':0, 'StandardOutputContent':json.dumps(output)})
        self.assertTrue(success['installed'])
        self.assertTrue(success['completed'])
        with self.assertRaises(sender.route.Refused):
            sender.inspect('install', cid, account, lambda _: {
                'Status':'Success', 'ResponseCode':0, 'StandardOutputContent':'{}'})


if __name__ == '__main__':
    unittest.main()
