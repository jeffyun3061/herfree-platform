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
    def test_interrupted_state_save_preserves_previous_cleanup_intent(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            original = {"run": "owned", "started": True, "profileChanged": False}
            drill.save(path, original)
            with patch.object(drill.os, "replace", side_effect=OSError("interrupted before replacement")):
                with self.assertRaises(OSError):
                    drill.save(path, {**original, "profileChanged": True})
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), original)
            self.assertEqual(list(Path(directory).iterdir()), [path])
            drill.save(path, {**original, "profileChanged": True})
            self.assertTrue(json.loads(path.read_text(encoding="utf-8"))["profileChanged"])

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

    def test_workflow_can_restore_stopped_profile_only_on_designated_staging(self):
        policies = iam.policies("123456789012", "ap-northeast-2", "backups", "herfree", "i-stage", "normal-stage", "drill")
        target = "arn:aws:ec2:ap-northeast-2:123456789012:instance/i-stage"
        for action in ("ec2:AssociateIamInstanceProfile", "ec2:DisassociateIamInstanceProfile"):
            grants = [item for item in policies["restore-workflow"] if action in item["Action"]]
            self.assertEqual(len(grants), 1)
            self.assertEqual(grants[0]["Resource"], target)

    def test_restore_ssm_connectivity_grants_no_parameter_store_or_other_document_reads(self):
        policies = iam.policies("123456789012", "ap-northeast-2", "backups", "herfree", "i-stage", "normal-stage", "drill")
        statements = policies["restore-ssm-channel"]
        actions = {action for item in statements for action in item["Action"]}
        self.assertIn("ssmmessages:OpenControlChannel", actions)
        self.assertIn("ssm:UpdateInstanceInformation", actions)
        self.assertFalse(any("Parameter" in action for action in actions))
        self.assertFalse(any(action.endswith("*") for action in actions))
        documents = next(item for item in statements if "ssm:GetDocument" in item["Action"])
        self.assertEqual(documents["Resource"], "arn:aws:ssm:ap-northeast-2::document/AWS-RunShellScript")


if __name__ == "__main__":
    unittest.main()
