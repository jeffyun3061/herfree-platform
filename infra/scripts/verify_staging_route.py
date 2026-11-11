"""Read-only, fail-closed staging DNS and EC2 identity check (draft).

This does not prove database isolation and never authorizes deployment.
"""
import http.client
import ipaddress
import json
import socket
import ssl
import subprocess

ACCOUNT = '439777528445'
INSTANCE = 'i-02cf5b8f3a7aa32da'
HOST = 'api-staging.herpfree.co.kr'


class Refused(Exception):
    pass


def require(condition, code):
    if not condition:
        raise Refused(code)


def verify(lookup, resolve, health):
    require(lookup('sts', 'get-caller-identity', '--query', 'Account') == ACCOUNT, 'ACCOUNT_MISMATCH')
    instances = lookup('ec2', 'describe-instances', '--instance-ids', INSTANCE,
                       '--query', 'Reservations[].Instances[].{id:InstanceId,state:State.Name,ip:PublicIpAddress}')
    require(isinstance(instances, list) and len(instances) == 1 and instances[0].get('id') == INSTANCE
            and instances[0].get('state') == 'running', 'STAGING_INSTANCE_UNAVAILABLE')
    try:
        address = ipaddress.ip_address(instances[0].get('ip') or '')
    except ValueError:
        raise Refused('STAGING_PUBLIC_IP_INVALID') from None
    require(address.version == 4 and address.is_global, 'STAGING_PUBLIC_IP_INVALID')
    ssm = lookup('ssm', 'describe-instance-information', '--filters', f'Key=InstanceIds,Values={INSTANCE}',
                 '--query', 'InstanceInformationList[].{id:InstanceId,status:PingStatus}')
    require(ssm == [{'id':INSTANCE, 'status':'Online'}], 'STAGING_SSM_OFFLINE')
    resolved = resolve(HOST)
    require(isinstance(resolved, set) and resolved == {str(address)}, 'STAGING_DNS_MISMATCH')
    payload = health(HOST, str(address))
    require(isinstance(payload, dict) and payload.get('success') is True
            and isinstance(payload.get('data'), dict) and payload['data'].get('status') == 'UP'
            and payload['data'].get('environment') == 'staging', 'STAGING_HEALTH_INVALID')
    return {'stagingRouteVerified':True, 'isolatedDatabaseVerified':False, 'promotionAllowed':False}


def lookup(*args):
    try:
        result = subprocess.run(['aws', *args, '--region', 'ap-northeast-2', '--output', 'json', '--no-cli-pager'],
                                check=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout)
    except (OSError, subprocess.SubprocessError, ValueError):
        raise Refused('AWS_READ_FAILED') from None


def resolve(host):
    try:
        return {row[4][0] for row in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
    except OSError:
        raise Refused('STAGING_DNS_UNAVAILABLE') from None


class PinnedHTTPSConnection(http.client.HTTPSConnection):
    def __init__(self, hostname, address, *, context, timeout):
        super().__init__(hostname, context=context, timeout=timeout)
        self.address = address

    def connect(self):
        raw = socket.create_connection((self.address, 443), self.timeout)
        try:
            # Preserve hostname verification and SNI while connecting to the
            # exact address returned by EC2; do not resolve DNS a second time.
            self.sock = self._context.wrap_socket(raw, server_hostname=self.host)
        except BaseException:
            raw.close()
            raise


def health(hostname, address):
    connection = PinnedHTTPSConnection(hostname, address, context=ssl.create_default_context(), timeout=10)
    try:
        connection.request('GET', '/api/health', headers={'Accept':'application/json'})
        response = connection.getresponse()
        require(response.status == 200, 'STAGING_HEALTH_INVALID')
        body = response.read(65537)
        require(len(body) <= 65536, 'STAGING_HEALTH_INVALID')
        return json.loads(body)
    except (OSError, ValueError, http.client.HTTPException):
        raise Refused('STAGING_HEALTH_UNAVAILABLE') from None
    finally:
        connection.close()


if __name__ == '__main__':
    try:
        print(json.dumps(verify(lookup, resolve, health)))
    except Refused as error:
        print(json.dumps({'stagingRouteVerified':False, 'error':str(error), 'promotionAllowed':False}))
        raise SystemExit(1)
