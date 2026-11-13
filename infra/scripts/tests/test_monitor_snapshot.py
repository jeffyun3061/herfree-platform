import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "monitor-local-db.sh"


@unittest.skipUnless(os.name != "nt" and shutil.which("jq") and shutil.which("bash"), "Linux Bash and jq are required")
class MonitorSnapshotTests(unittest.TestCase):
    def test_root_monitor_publishes_safe_snapshot_before_cloudwatch_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "config").mkdir()
            (root / "config/.env.prod").write_text(
                "AWS_REGION=ap-northeast-2\nDB_BACKUP_S3_BUCKET=fixture-only\n"
                "OPERATIONS_PUBLIC_URL=https://example.invalid\nJWT_SECRET=must-not-leak\n"
                "HEALTH_DATA_ENCRYPTION_KEY=must-not-leak\n")
            # No subprocess contacts AWS, Docker or a network. A failed metric delivery
            # must still leave accurate, independently timestamped local evidence.
            stub = r'''
            docker() { if [[ "$1" == ps ]]; then echo fixture-container; else echo healthy; fi; }
            df() { printf 'Filesystem 1024-blocks Used Available Capacity Mounted\nfixture 100 25 75 25%% /\n'; }
            curl() { printf 200; }
            aws() {
              if [[ "$1" == s3api && "$2" == list-objects-v2 ]]; then date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ;
              elif [[ "$1" == s3api && "$2" == get-object ]]; then
                if [[ "$*" == *last-success.json* ]]; then printf '{"completedEpoch":%s}' "$(date -u +%s)" >"${!#}";
                else printf '{"success":true}' >"${!#}"; fi
              else return 1; fi
            }
            export -f docker df curl aws
            exec bash "$1"
            '''
            result = subprocess.run(["bash", "-c", stub, "monitor-test", str(SCRIPT)],
                env=dict(os.environ, HERFREE_APP_DIR=directory, DEPLOY_ENV="production"),
                capture_output=True, text=True, timeout=20)
            self.assertNotEqual(result.returncode, 0)
            file = root / "operations/production/status.json"
            data = json.loads(file.read_text())
            self.assertEqual(data["environment"], "production")
            self.assertTrue(data["databaseHealthy"])
            self.assertTrue(data["httpsHealthy"])
            self.assertTrue(data["restoreHealthy"])
            self.assertAlmostEqual(data["backupAgeHours"], 2, delta=0.01)
            self.assertEqual(data["databaseDiskPercent"], 25)
            self.assertEqual(file.stat().st_mode & 0o777, 0o644)
            self.assertNotIn("must-not-leak", file.read_text() + result.stdout + result.stderr)
            self.assertFalse(list(file.parent.glob(".status.*")))


if __name__ == "__main__":
    unittest.main()
