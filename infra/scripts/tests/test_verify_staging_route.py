import unittest
import json
import importlib.util
from pathlib import Path
from unittest.mock import Mock, patch

path = Path(__file__).resolve().parents[1] / 'verify_staging_route.py'
spec = importlib.util.spec_from_file_location('verify_staging_route', path)
route = importlib.util.module_from_spec(spec)
spec.loader.exec_module(route)


class StagingRouteTest(unittest.TestCase):
    def setUp(self):
        self.account = route.ACCOUNT
        self.instances = [{'id':route.INSTANCE, 'state':'running', 'ip':'8.8.8.8'}]
        self.ssm = [{'id':route.INSTANCE, 'status':'Online'}]
        self.dns = {'8.8.8.8'}
        self.payload = {'success':True, 'data':{'status':'UP', 'environment':'staging'}}

    def lookup(self, *args):
        if args[:2] == ('sts', 'get-caller-identity'): return self.account
        if args[:2] == ('ec2', 'describe-instances'): return self.instances
        if args[:2] == ('ssm', 'describe-instance-information'): return self.ssm
        raise AssertionError('unexpected AWS operation')

    def run_verifier(self):
        return route.verify(self.lookup, lambda host: self.dns, lambda host, ip: self.payload)

    def test_valid_route_does_not_authorize_promotion(self):
        self.assertEqual(self.run_verifier(), {'stagingRouteVerified':True,
                                              'isolatedDatabaseVerified':False,
                                              'promotionAllowed':False})

    def test_wrong_account_or_instance_is_rejected(self):
        self.account = 'other'
        with self.assertRaisesRegex(route.Refused, 'ACCOUNT_MISMATCH'): self.run_verifier()
        self.account = route.ACCOUNT
        self.instances[0]['id'] = 'i-production'
        with self.assertRaisesRegex(route.Refused, 'STAGING_INSTANCE_UNAVAILABLE'): self.run_verifier()

    def test_stopped_or_offline_instance_is_rejected(self):
        self.instances[0]['state'] = 'stopped'
        with self.assertRaisesRegex(route.Refused, 'STAGING_INSTANCE_UNAVAILABLE'): self.run_verifier()
        self.instances[0]['state'] = 'running'; self.ssm[0]['status'] = 'ConnectionLost'
        with self.assertRaisesRegex(route.Refused, 'STAGING_SSM_OFFLINE'): self.run_verifier()

    def test_wrong_dns_and_extra_ipv6_are_rejected(self):
        for addresses in ({'1.1.1.1'}, {'8.8.8.8','2606:4700:4700::1111'}, set()):
            self.dns = addresses
            with self.subTest(addresses=addresses), self.assertRaisesRegex(route.Refused, 'STAGING_DNS_MISMATCH'):
                self.run_verifier()

    def test_health_is_not_contacted_after_dns_mismatch(self):
        self.dns = {'1.1.1.1'}
        contacted = []
        with self.assertRaisesRegex(route.Refused, 'STAGING_DNS_MISMATCH'):
            route.verify(self.lookup, lambda host: self.dns, lambda host, ip: contacted.append((host, ip)))
        self.assertEqual(contacted, [])

    def test_public_ip_must_be_ipv4_and_globally_routable(self):
        for value in ('127.0.0.1', 'not-an-ip', '::1', None):
            self.instances[0]['ip'] = value
            with self.subTest(value=value), self.assertRaisesRegex(route.Refused, 'STAGING_PUBLIC_IP_INVALID'):
                self.run_verifier()

    def test_wrong_health_and_private_ip_are_rejected(self):
        self.payload['data']['environment'] = 'production'
        with self.assertRaisesRegex(route.Refused, 'STAGING_HEALTH_INVALID'): self.run_verifier()
        self.instances[0]['ip'] = '10.0.0.1'
        with self.assertRaisesRegex(route.Refused, 'STAGING_PUBLIC_IP_INVALID'): self.run_verifier()

    def test_health_is_sent_to_checked_ip_with_hostname_verification(self):
        raw, wrapped, context = Mock(), Mock(), Mock()
        context.wrap_socket.return_value = wrapped
        with patch.object(route.socket, 'create_connection', return_value=raw) as connect:
            connection = route.PinnedHTTPSConnection(route.HOST, '8.8.8.8', context=context, timeout=10)
            connection.connect()
        connect.assert_called_once_with(('8.8.8.8', 443), 10)
        context.wrap_socket.assert_called_once_with(raw, server_hostname=route.HOST)
        self.assertIs(connection.sock, wrapped)

    def test_failed_tls_closes_socket(self):
        raw, context = Mock(), Mock()
        context.wrap_socket.side_effect = OSError('failed')
        with patch.object(route.socket, 'create_connection', return_value=raw):
            with self.assertRaises(OSError):
                route.PinnedHTTPSConnection(route.HOST, '8.8.8.8', context=context, timeout=10).connect()
        raw.close.assert_called_once()

    def test_health_requires_success_and_never_follows_redirects(self):
        connection = Mock()
        response = connection.getresponse.return_value
        response.status = 302
        with patch.object(route, 'PinnedHTTPSConnection', return_value=connection):
            with self.assertRaisesRegex(route.Refused, 'STAGING_HEALTH_INVALID'):
                route.health(route.HOST, '8.8.8.8')
        connection.request.assert_called_once_with('GET', '/api/health', headers={'Accept':'application/json'})
        connection.close.assert_called_once()

    def test_health_accepts_bounded_json_and_closes_connection(self):
        connection = Mock()
        response = connection.getresponse.return_value
        response.status = 200
        response.read.return_value = json.dumps(self.payload).encode()
        with patch.object(route, 'PinnedHTTPSConnection', return_value=connection) as factory:
            self.assertEqual(route.health(route.HOST, '8.8.8.8'), self.payload)
        self.assertEqual(factory.call_args.args[:2], (route.HOST, '8.8.8.8'))
        self.assertTrue(factory.call_args.kwargs['context'].check_hostname)
        connection.close.assert_called_once()

    def test_oversized_or_malformed_health_response_is_rejected(self):
        for body in (b' ' * 65537, b'not-json'):
            connection = Mock()
            response = connection.getresponse.return_value
            response.status = 200
            response.read.return_value = body
            with self.subTest(size=len(body)), patch.object(route, 'PinnedHTTPSConnection', return_value=connection):
                with self.assertRaises(route.Refused): route.health(route.HOST, '8.8.8.8')
            connection.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()
