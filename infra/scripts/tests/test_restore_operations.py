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
    def test_ssm_failure_classification_never_returns_restored_content(self):
        phase, category = drill.classify_ssm_failure({
            "StandardOutputContent": "private medical note: example\nRestored application verification failed; exit=1; category=BeanCreationException",
            "StandardErrorContent": "patient@example.invalid",
        })
        self.assertEqual((phase, category), ("app-verification", "BeanCreationException"))
        self.assertNotIn("private medical note", phase + category)
        self.assertEqual(drill.classify_ssm_failure({"StandardErrorContent": "category=SensitiveRecordError"}),
                         ("unknown", "unknown"))

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

    def test_cleanup_restores_profile_on_stopped_instance_and_can_resume(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            path.write_text(json.dumps({"region": "ap-northeast-2", "instance": "i-staging", "run": "owned",
                                        "started": True, "profileChanged": True, "restoreProfile": "restore",
                                        "originalProfile": "normal"}))
            target = {"Tags": [{"Key": "Environment", "Value": "staging"}], "State": {"Name": "stopped"}}
            association_states = [
                [{"State": "associated", "AssociationId": "assoc-restore", "IamInstanceProfile": {"Arn": "restore"}}],
                [{"State": "disassociating", "AssociationId": "assoc-restore", "IamInstanceProfile": {"Arn": "restore"}}],
                [],
                [{"State": "associating", "AssociationId": "assoc-normal", "IamInstanceProfile": {"Arn": "normal"}}],
                [{"State": "associated", "AssociationId": "assoc-normal", "IamInstanceProfile": {"Arn": "normal"}}],
            ]
            calls = []

            def fake_aws(region, *args):
                calls.append(args)
                if args[:2] == ("ec2", "describe-volumes"):
                    return {"Volumes": []}
                if args[:2] == ("ec2", "describe-iam-instance-profile-associations"):
                    return {"IamInstanceProfileAssociations": association_states.pop(0)}
                return {}

            with patch.object(drill, "instance", return_value=target), patch.object(drill, "aws", side_effect=fake_aws), \
                    patch.object(drill.time, "sleep"):
                drill.cleanup(path)
                drill.cleanup(path)
            self.assertTrue(json.loads(path.read_text())["cleaned"])
            self.assertEqual(sum("disassociate-iam-instance-profile" in call for call in calls), 1)
            self.assertEqual(sum("associate-iam-instance-profile" in call for call in calls), 1)
            self.assertFalse(any("replace-iam-instance-profile-association" in call for call in calls))

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
