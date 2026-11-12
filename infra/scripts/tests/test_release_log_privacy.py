import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
DEPLOY = ROOT / "infra/scripts/deploy-release.sh"
WORKFLOW = ROOT / ".github/workflows/release-backend.yml"
MARKER = "SYNTHETIC_PRIVATE_HEALTH_LOG_MUST_NOT_LEAVE_HOST"


class ReleaseLogPrivacyTests(unittest.TestCase):
    def test_all_ssm_invocation_reads_select_only_status_fields(self):
        workflow = WORKFLOW.read_text(encoding="utf-8")
        logical_lines = re.sub(r"\\[ \t]*\r?\n[ \t]*", " ", workflow)
        invocations = re.findall(r"aws ssm get-command-invocation\b[^\n]*", logical_lines)
        self.assertGreaterEqual(len(invocations), 3)
        for invocation in invocations:
            with self.subTest(invocation=invocation):
                self.assertRegex(invocation, r"--query\s+['\"](?:Status|\{Status:Status,ResponseCode:ResponseCode\})['\"]")
                self.assertNotRegex(invocation, r"Standard(Output|Error)Content")

    @unittest.skipIf(os.name == "nt" or not shutil.which("flock") or not shutil.which("bash"),
                     "requires Linux-compatible bash and flock")
    def test_failed_deployment_rolls_back_without_exporting_api_logs(self):
        for fallback_fails in (False, True):
            with self.subTest(fallback_fails=fallback_fails), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                app = root / "app"
                config = app / "config"
                scripts = app / "infra/scripts"
                state = app / ".deploy"
                binaries = root / "bin"
                for directory in (config, scripts, state, binaries):
                    directory.mkdir(parents=True, exist_ok=True)
                (config / ".env.staging").write_text("DB_RUNTIME=managed\n", encoding="utf-8")
                (app / "docker-compose.release.yml").write_text("services: {}\n", encoding="utf-8")
                validate = scripts / "validate-release-env.sh"
                validate.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
                validate.chmod(0o755)
                previous = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/herfree@sha256:" + "a" * 64
                candidate = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/herfree@sha256:" + "b" * 64
                (state / "staging.current-image").write_text(previous, encoding="utf-8")
                docker = binaries / "docker"
                docker.write_text("""#!/bin/sh
case " $* " in
  *" logs "*) printf '%s\\n' "$MOCK_PRIVATE_MARKER"; exit 0 ;;
  *" up "*)
    printf '%s\\n' "$API_IMAGE" >> "$MOCK_DEPLOYS"
    if [ "$API_IMAGE" = "$MOCK_CANDIDATE" ] || [ "$MOCK_FALLBACK_FAIL" = 1 ]; then exit 1; fi
    exit 0 ;;
  *" stop "*) exit 0 ;;
esac
exit 0
""", encoding="utf-8")
                docker.chmod(0o755)
                curl = binaries / "curl"
                curl.write_text("#!/bin/sh\nprintf '%s\\n' '{\"status\":\"UP\"}'\n", encoding="utf-8")
                curl.chmod(0o755)
                env = dict(os.environ, PATH=str(binaries) + os.pathsep + os.environ["PATH"],
                           HERFREE_APP_DIR=str(app), MOCK_PRIVATE_MARKER=MARKER,
                           MOCK_CANDIDATE=candidate, MOCK_DEPLOYS=str(root / "deploys"),
                           MOCK_FALLBACK_FAIL="1" if fallback_fails else "0")
                result = subprocess.run(["bash", str(DEPLOY), "staging", candidate], env=env,
                                        capture_output=True, text=True, timeout=30)
                combined = result.stdout + result.stderr
                self.assertNotEqual(result.returncode, 0, combined)
                self.assertNotIn(MARKER, combined)
                self.assertIn("API logs withheld", combined)
                self.assertEqual((root / "deploys").read_text(encoding="utf-8").splitlines(), [candidate, previous])
                if fallback_fails:
                    self.assertIn("manual recovery is required", combined)
                    self.assertFalse((state / "staging.current-image").exists())
                    self.assertEqual((state / "staging.failed-fallback-image").read_text(), previous)
                else:
                    self.assertIn("rollback image healthy", combined)
                    self.assertEqual((state / "staging.current-image").read_text(), previous)
                    self.assertEqual((state / "staging.rejected-image").read_text(), candidate)


if __name__ == "__main__":
    unittest.main()
