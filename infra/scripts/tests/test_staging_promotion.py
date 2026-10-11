import importlib.util
from pathlib import Path
import subprocess
import unittest


spec = importlib.util.spec_from_file_location("staging_release", Path(__file__).resolve().parents[1] / "resolve-staging-release.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StagingPromotionTests(unittest.TestCase):
    sha = "a" * 40
    digest = "sha256:" + "b" * 64
    registry = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com"

    def resolve(self, images, mutable="IMMUTABLE"):
        def aws(*args, region):
            self.assertEqual(region, "ap-northeast-2")
            if args[1] == "describe-repositories":
                return {"repositories": [{"imageTagMutability": mutable}]}
            self.assertEqual(args[1], "describe-images")
            self.assertIn("imageTag=" + self.sha, args)
            self.assertIn("imageTag=staging-passed-" + self.sha, args)
            return {"imageDetails": images}
        return module.resolve_release(self.sha, "herfree-api", self.registry, "ap-northeast-2", aws)

    def test_promotes_the_exact_tested_digest_without_rebuilding(self):
        result = self.resolve([{"imageDigest": self.digest, "imageTags": [self.sha, "staging-passed-" + self.sha]}])
        self.assertEqual(result["image"], self.registry + "/herfree-api@" + self.digest)
        self.assertEqual(result["commit"], self.sha)

    def test_missing_or_different_staging_evidence_blocks_release(self):
        for images in [[], [{"imageDigest": self.digest, "imageTags": [self.sha]}],
                       [{"imageDigest": self.digest, "imageTags": [self.sha]},
                        {"imageDigest": "sha256:" + "c" * 64, "imageTags": ["staging-passed-" + self.sha]}]]:
            with self.subTest(images=images), self.assertRaisesRegex(ValueError, "not passed staging"):
                self.resolve(images)

    def test_mutable_tags_and_malformed_digest_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "immutable"):
            self.resolve([], mutable="MUTABLE")
        with self.assertRaisesRegex(ValueError, "Invalid image digest"):
            self.resolve([{"imageDigest": "latest", "imageTags": [self.sha]}])

    def test_invalid_commit_or_cross_region_registry_makes_no_aws_calls(self):
        def forbidden(*args, **kwargs):
            self.fail("Invalid inputs must not contact AWS")
        for sha, registry in [("main", self.registry), (self.sha, "123456789012.dkr.ecr.us-east-1.amazonaws.com")]:
            with self.subTest(sha=sha, registry=registry), self.assertRaises(ValueError):
                module.resolve_release(sha, "herfree-api", registry, "ap-northeast-2", forbidden)

    def test_aws_failure_never_returns_a_candidate(self):
        def unavailable(*args, **kwargs):
            raise subprocess.CalledProcessError(1, "aws")
        with self.assertRaises(subprocess.CalledProcessError):
            module.resolve_release(self.sha, "herfree-api", self.registry, "ap-northeast-2", unavailable)


if __name__ == "__main__":
    unittest.main()
