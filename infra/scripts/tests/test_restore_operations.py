import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).parents[1] / file)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


drill = module("drill", "run-staging-restore-drill.py")
iam = module("iam", "render-operations-iam.py")


class RestoreSafetyTests(unittest.TestCase):
    def test_refuses_production_unidentified_or_already_running_staging(self):
        for tags, state in [({"Environment": "production"}, "stopped"), ({}, "stopped"),
                            ({"Environment": "staging"}, "running")]:
            value = {"Tags": [{"Key": k, "Value": v} for k, v in tags.items()], "State": {"Name": state}}
            with self.assertRaises(ValueError):
                drill.require_staging(value, stopped=True)

    def test_cleanup_refuses_volume_without_matching_drill_ownership(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)/"state.json"
            state.write_text(json.dumps({"region": "ap-northeast-2", "instance": "i-staging", "run": "owned",
                                         "started": False, "volume": "vol-original", "profileChanged": False}))
            target = {"Tags": [{"Key": "Environment", "Value": "staging"}], "State": {"Name": "stopped"}}
            with patch.object(drill, "instance", return_value=target), patch.object(drill, "aws", return_value={
                "Volumes": [{"Encrypted": True, "Tags": [], "Attachments": []}]
            }) as call:
                with self.assertRaises(ValueError):
                    drill.cleanup(state)
                self.assertFalse(any("delete-volume" in args.args for args in call.call_args_list))

    def test_restore_role_has_no_live_production_database_secrets_or_external_resource_control(self):
        policies = iam.policies("123456789012", "ap-northeast-2", "backups", "herfree", "i-stage", "normal-stage", "drill")
        encoded = json.dumps(policies["restore-instance"])
        self.assertNotIn("app-config", encoded)
        self.assertNotIn("db-app", encoded)
        self.assertNotIn("ssm:SendCommand", encoded)
        self.assertNotIn("ec2:StopInstances", encoded)
        self.assertIn("health-data-recovery-*", encoded)


if __name__ == "__main__":
    unittest.main()
