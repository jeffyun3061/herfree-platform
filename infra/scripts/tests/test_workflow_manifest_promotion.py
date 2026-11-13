"""Exercise the actual promotion snippets with a byte-checking fake AWS CLI."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = b'{"schemaVersion":2,"layers":[]}\n'
DIGEST = "sha256:" + hashlib.sha256(MANIFEST).hexdigest()


@unittest.skipUnless(shutil.which("bash") and shutil.which("jq"), "requires bash and jq")
class WorkflowManifestPromotionTest(unittest.TestCase):
    def run_snippet(self, workflow, start, extra_env):
        lines = (ROOT / ".github/workflows" / workflow).read_text(encoding="utf-8").splitlines()
        first = next(i for i, line in enumerate(lines) if line.strip().startswith(start))
        selected = []
        for line in lines[first:]:
            if line and not line.startswith("          "):
                break
            selected.append(line[10:])
        self.assertTrue(any("aws ecr put-image" in line for line in selected))
        with tempfile.TemporaryDirectory() as temp:
            fake = Path(temp) / "aws"
            fake.write_text('''#!/usr/bin/env python3
import hashlib, json, os, pathlib, sys
args = sys.argv[1:]
manifest = b'{"schemaVersion":2,"layers":[]}\\n'
digest = "sha256:" + hashlib.sha256(manifest).hexdigest()
if args[:2] == ["ecr", "batch-get-image"]:
    print(json.dumps({"images": [{"imageId": {"imageDigest": digest}, "imageManifest": manifest.decode()}], "failures": []}))
elif args[:2] == ["ecr", "put-image"]:
    value = args[args.index("--image-manifest") + 1]
    if not value.startswith("file://") or pathlib.Path(value[7:]).read_bytes() != manifest:
        sys.exit(4)
    if args[args.index("--image-digest") + 1] != digest:
        sys.exit(5)
else:
    sys.exit(6)
''', encoding="utf-8")
            fake.chmod(0o755)
            env = os.environ.copy()
            env.update(extra_env, PATH=temp + os.pathsep + env["PATH"])
            result = subprocess.run(["bash", "-euo", "pipefail", "-c", "\n".join(selected)],
                                    env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_release_backend_preserves_manifest_bytes(self):
        self.run_snippet("release-backend.yml", 'result="$(aws ecr batch-get-image',
                         {"ECR_REPOSITORY": "herfree-api", "GITHUB_SHA": "a" * 40})

    def test_isolated_qa_preserves_manifest_bytes(self):
        self.run_snippet("run-current-main-sharing-qa.yml", 'result="$(aws ecr batch-get-image',
                         {"QA_DIGEST": DIGEST, "tag": "staging-passed-" + "a" * 40})


if __name__ == "__main__":
    unittest.main()
