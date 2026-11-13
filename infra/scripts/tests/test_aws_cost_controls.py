import datetime as dt
import importlib.util
from pathlib import Path
import unittest
import argparse
import json
import tempfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("cost", Path(__file__).parents[1]/"aws-cost-controls.py")
cost = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cost)


class CleanupTests(unittest.TestCase):
    def test_preserves_active_rollbacks_unknown_tags_and_recently_pulled_images(self):
        now = dt.datetime(2026, 10, 11, tzinfo=dt.timezone.utc)
        old = (now-dt.timedelta(days=40)).isoformat()
        images = [
            {"imageDigest": "active", "imagePushedAt": old},
            {"imageDigest": "rollback", "imagePushedAt": old},
            {"imageDigest": "unknown", "imagePushedAt": old, "imageTags": ["prod-stable"]},
            {"imageDigest": "used", "imagePushedAt": old, "lastRecordedPullTime": now.isoformat()},
            {"imageDigest": "candidate", "imagePushedAt": old, "imageTags": ["a"*40]},
            {"imageDigest": "missing-time"},
        ]
        self.assertEqual(cost.cleanup_candidates(images, {"active", "rollback"}, now), [{"imageDigest": "candidate"}])

    def test_cleanup_refuses_incomplete_rollback_or_staging_protection(self):
        current = "sha256:" + "a"*64
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/"manifest.json"
            for manifest in [{"currentDigest": current, "rollbackDigests": [], "stagingDigests": []},
                             {"currentDigest": current, "rollbackDigests": ["sha256:"+x*64 for x in "abc"], "stagingDigests": []},
                             {"currentDigest": current, "rollbackDigests": ["sha256:"+x*64 for x in "bcd"]}]:
                path.write_text(json.dumps(manifest))
                with patch.object(cost, "aws") as calls, self.assertRaises(ValueError):
                    cost.cleanup(argparse.Namespace(protected_manifest=path, repository="herfree", region="ap-northeast-2", apply=True))
                calls.assert_not_called()

    def test_dry_run_never_deletes_images(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/"manifest.json"
            path.write_text(json.dumps({"currentDigest": "sha256:"+"a"*64, "rollbackDigests": ["sha256:"+x*64 for x in "bcd"], "stagingDigests": []}))
            with patch.object(cost, "aws", return_value={"imageDetails": [{"imageDigest": "old", "imagePushedAt": "2020-01-01T00:00:00Z"}]}) as calls:
                cost.cleanup(argparse.Namespace(protected_manifest=path, repository="herfree", region="ap-northeast-2", apply=False))
                self.assertEqual(calls.call_count, 1)
                self.assertEqual(calls.call_args.args[:2], ("ecr", "describe-images"))


if __name__ == "__main__": unittest.main()
