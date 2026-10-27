import argparse
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("resume", Path(__file__).parents[1] / "resume-staging-apps.py")
resume = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resume)

MYSQL = "a" * 64
API = "b" * 64
ROLE = "arn:aws:iam::123456789012:role/herfree-staging-ec2"
PROFILE = "arn:aws:iam::123456789012:instance-profile/herfree-staging-ec2"
CALLER = "arn:aws:sts::123456789012:assumed-role/herfree-staging-ec2/i-0123456789abcdef0"


def containers():
    def value(container_id, service):
        return {"Id": container_id, "State": {"Status": "exited"}, "HostConfig": {"PortBindings": None},
                "Config": {"Labels": {"com.docker.compose.project": "herfree-staging",
                                       "com.docker.compose.service": service}, "Env": []}, "Mounts": []}
    mysql, api = value(MYSQL, "mysql"), value(API, "api")
    mysql["Mounts"] = [{"Type": "bind", "Source": "/var/lib/herfree/mysql-staging", "Destination": "/var/lib/mysql"}]
    api["Config"]["Env"] = ["SPRING_PROFILES_ACTIVE=staging", "DB_RUNTIME=local",
                               "SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/herfree_staging?sslMode=REQUIRED"]
    return [mysql, api]


class FakeHost:
    def __init__(self):
        self.containers = containers()
        self.calls = []
        self.caller = CALLER
        self.restore_containers = ""
        self.database_health = "healthy"

    def run(self, command):
        self.calls.append(command)
        if command[:2] == ["aws", "sts"]:
            return json.dumps({"Arn": self.caller})
        if command[:3] == ["docker", "ps", "-aq"]:
            if "name=herfree-restore-drill-" in command:
                return self.restore_containers
            return MYSQL if "label=com.docker.compose.service=mysql" in command else API
        if command[:3] == ["docker", "inspect", "--format"]:
            return self.database_health
        if command[:2] == ["docker", "inspect"]:
            return json.dumps(self.containers)
        if command[:2] in (["docker", "start"], ["docker", "stop"]):
            return command[2]
        raise AssertionError("Unexpected host command")

    def started(self):
        return [command[2] for command in self.calls if command[:2] == ["docker", "start"]]


class StagingResumeTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.args = argparse.Namespace(instance_id="i-0123456789abcdef0", normal_role_arn=ROLE,
                                       normal_profile_arn=PROFILE, root=Path(self.directory.name), region="ap-northeast-2")
        self.identity = lambda: {"instance": self.args.instance_id, "profile": PROFILE}
        self.host = FakeHost()

    def invoke(self, **kwargs):
        resume.resume(self.args, execute=self.host.run, identify=kwargs.get("identify", self.identity),
                      mounted=kwargs.get("mounted", lambda path: False), sleep=lambda seconds: None,
                      health=kwargs.get("health", lambda: True))

    def test_starts_only_existing_mysql_then_api_after_normal_role_checks(self):
        self.invoke()
        self.assertEqual(self.host.started(), [MYSQL, API])
        self.assertEqual(sum(command[:2] == ["aws", "sts"] for command in self.host.calls), 3)
        self.assertFalse(any("compose" in command or "pull" in command or "run" in command for command in self.host.calls))

    def test_wrong_instance_profile_or_recovery_role_never_starts_containers(self):
        for identity in ({"instance": "i-00000000000000000", "profile": PROFILE},
                         {"instance": self.args.instance_id, "profile": "restore-profile"}):
            with self.assertRaises(ValueError):
                self.invoke(identify=lambda: identity)
        self.host.caller = "arn:aws:sts::123456789012:assumed-role/herfree-restore-drill/session"
        with self.assertRaises(ValueError):
            self.invoke()
        self.assertEqual(self.host.started(), [])

    def test_caller_cannot_relabel_recovery_role_or_cross_account_profile_as_normal(self):
        self.args.normal_role_arn = "arn:aws:iam::123456789012:role/herfree-restore-drill"
        self.args.normal_profile_arn = "arn:aws:iam::123456789012:instance-profile/herfree-restore-drill"
        self.host.caller = "arn:aws:sts::123456789012:assumed-role/herfree-restore-drill/session"
        with self.assertRaises(resume.ResumeRefused):
            self.invoke(identify=lambda: {"instance": self.args.instance_id, "profile": self.args.normal_profile_arn})
        self.args.normal_role_arn = ROLE
        self.args.normal_profile_arn = "arn:aws:iam::999999999999:instance-profile/herfree-staging-ec2"
        with self.assertRaises(resume.ResumeRefused):
            self.invoke(identify=lambda: {"instance": self.args.instance_id, "profile": self.args.normal_profile_arn})
        self.assertEqual(self.host.calls, [])

    def test_restore_mount_container_or_pending_deployment_never_starts_containers(self):
        with self.assertRaises(ValueError):
            self.invoke(mounted=lambda path: True)
        self.host.restore_containers = "c" * 64
        with self.assertRaises(ValueError):
            self.invoke()
        self.host.restore_containers = ""
        pending = self.args.root / ".deploy/staging.pending-operation"
        pending.parent.mkdir()
        pending.write_text("pending")
        with self.assertRaises(ValueError):
            self.invoke()
        self.assertEqual(self.host.started(), [])

    def test_production_or_restored_mount_configuration_never_starts_containers(self):
        unsafe = []
        for source in ("/var/lib/herfree/mysql-production", "/mnt/herfree-restore-drill/drill.private/mysql"):
            pair = containers()
            pair[0]["Mounts"][0]["Source"] = source
            unsafe.append(pair)
        pair = containers()
        pair[1]["Config"]["Env"][0] = "SPRING_PROFILES_ACTIVE=prod"
        unsafe.append(pair)
        pair = containers()
        pair[0]["HostConfig"]["PortBindings"] = {"3306/tcp": [{"HostPort": "3306"}]}
        unsafe.append(pair)
        for pair in unsafe:
            self.host.containers = copy.deepcopy(pair)
            with self.assertRaises(ValueError):
                self.invoke()
        self.assertEqual(self.host.started(), [])

    def test_unhealthy_mysql_prevents_api_start(self):
        self.host.database_health = "unhealthy"
        with self.assertRaises(RuntimeError):
            self.invoke()
        self.assertEqual(self.host.started(), [MYSQL])

    def test_role_change_while_database_starts_prevents_api_start(self):
        def identity():
            if self.host.started():
                return {"instance": self.args.instance_id, "profile": "restore-profile"}
            return self.identity()
        with self.assertRaises(ValueError):
            self.invoke(identify=identity)
        self.assertEqual(self.host.started(), [MYSQL])
        self.assertIn(["docker", "stop", MYSQL], self.host.calls)


if __name__ == "__main__":
    unittest.main()
