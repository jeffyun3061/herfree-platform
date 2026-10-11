import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SCRIPTS = Path(__file__).resolve().parents[1]
BASH = (str(Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Git/bin/bash.exe")
        if os.name == "nt" else shutil.which("bash"))


@unittest.skipUnless(BASH and Path(BASH).is_file(), "Bash is required")
class ReleaseConfigurationTests(unittest.TestCase):
    def run_script(self, script, target, directory, extra_env=None, prefix=""):
        env = dict(os.environ, HERFREE_APP_DIR=".", HERFREE_CONFIG_DIR="./config")
        env.update(extra_env or {})
        # AWS is stubbed within the child shell; these tests never contact AWS or Docker.
        return subprocess.run(
            [BASH, "-c", prefix + 'exec bash "$1" "$2"', "release-test",
             (SCRIPTS / script).as_posix(), target],
            cwd=directory, env=env, text=True, encoding="utf-8", errors="replace", capture_output=True, timeout=30)

    def test_database_preparation_writes_the_file_used_by_the_release(self):
        fixture = json.dumps({"database": "release_test", "username": "fixture_user",
                              "password": "fixture-app-password", "rootPassword": "fixture-root-password"})
        for target, suffix in [("production", "prod"), ("staging", "staging")]:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as directory:
                result = self.run_script("prepare-local-db-env.sh", target, directory,
                    {"CONFIRM_LOCAL_DB_PREP": "YES", "HERFREE_TEST_DB_JSON": fixture,
                     "HERFREE_TEST_PYTHON": Path(sys.executable).as_posix()},
                    # Git Bash cannot set POSIX modes on the Windows temporary directory.
                    # Linux CI uses the real permission operations, with mode asserted below.
                    ('install() { mkdir -p "${@: -1}"; }; chmod() { return 0; }; export -f install chmod; '
                     if os.name == "nt" else "") +
                    'aws() { printf "%s\\n" "$HERFREE_TEST_DB_JSON"; }; export -f aws; '
                    'jq() { "$HERFREE_TEST_PYTHON" -c '
                    '\'import json,sys; print(json.load(sys.stdin)[sys.argv[1][1:]])\' "$2"; }; export -f jq; ')
                self.assertEqual(result.returncode, 0, result.stderr)
                path = Path(directory) / "config" / f".env.mysql.{suffix}"
                self.assertIn("MYSQL_DATABASE=release_test", path.read_text())
                if os.name != "nt":
                    self.assertEqual(path.stat().st_mode & 0o777, 0o600)
                self.assertNotIn("fixture-app-password", result.stdout + result.stderr)

    def test_deployment_validates_the_same_database_file_before_any_changes(self):
        image = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/herfree@sha256:" + "a" * 64
        for target, suffix in [("production", "prod"), ("staging", "staging")]:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root / "config").mkdir()
                (root / "config" / f".env.{suffix}").write_text("DB_RUNTIME=rds\n")
                (root / "docker-compose.release.yml").write_text("services: {}\n")
                validator = root / "infra/scripts/validate-release-env.sh"
                validator.parent.mkdir(parents=True)
                validator.write_text('#!/usr/bin/env bash\nprintf "%s" "$HERFREE_MYSQL_ENV_FILE"\nexit 42\n')
                validator.chmod(0o755)
                env = dict(os.environ, HERFREE_APP_DIR=".", HERFREE_CONFIG_DIR="./config")
                result = subprocess.run([BASH, (SCRIPTS / "deploy-release.sh").as_posix(), target, image],
                    cwd=directory, env=env, text=True, encoding="utf-8", errors="replace", capture_output=True, timeout=30)
                self.assertEqual(result.returncode, 42, result.stderr)
                self.assertEqual(result.stdout, f"./config/.env.mysql.{suffix}")


if __name__ == "__main__":
    unittest.main()
