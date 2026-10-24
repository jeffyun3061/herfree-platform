import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import zlib


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parents[1] / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


probe = load("staging-preflight")
host = load("staging-host-preflight")


class PreflightTests(unittest.TestCase):
    def test_production_cross_account_and_other_roles_are_rejected(self):
        for account, role in [(probe.ACCOUNT, "herfree-github-production-deploy"),
                              ("123456789012", "herfree-github-staging-deploy"),
                              (probe.ACCOUNT, "other")]:
            with self.subTest(role=role), self.assertRaises(ValueError):
                probe.validate_identity({"Account": account, "Arn": f"arn:aws:sts::{account}:assumed-role/{role}/ci"})
        probe.validate_identity({"Account": probe.ACCOUNT,
                                 "Arn": f"arn:aws:sts::{probe.ACCOUNT}:assumed-role/herfree-github-staging-deploy/ci"})

    def test_flyway_checksum_ignores_bom_and_line_endings_but_detects_content_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            path = directory / "V43__test.sql"
            path.write_bytes(b"\xef\xbb\xbfCREATE TABLE sample (id BIGINT);\r\n-- comment\r\n")
            checksum = zlib.crc32(b"CREATE TABLE sample (id BIGINT);-- comment")
            if checksum >= 2**31:
                checksum -= 2**32
            rows = [{"version": "43", "script": path.name, "checksum": checksum, "success": True}]
            self.assertTrue(probe.migration_check(rows, directory)["compatible"])
            path.write_text("CREATE TABLE sample (id INT);\n-- comment\n")
            self.assertFalse(probe.migration_check(rows, directory)["compatible"])
            path.unlink()
            self.assertFalse(probe.migration_check(rows, directory)["compatible"])

    def test_unknown_failed_and_path_traversal_migrations_fail_closed(self):
        self.assertFalse(probe.migration_check([], Path("."))["compatible"])
        self.assertFalse(probe.migration_check([{"script": "../../private", "success": True}], Path("."))["compatible"])
        self.assertFalse(probe.migration_check([{"script": "V1__init.sql", "success": False}], Path("."))["compatible"])

    def test_basic_auth_redirects_are_not_followed(self):
        self.assertIsNone(probe.NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.invalid"))

    def test_host_probe_never_queries_users_or_returns_secrets(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "config").mkdir()
            (root / "config/.env.staging").write_text(
                "SPRING_PROFILES_ACTIVE=staging\nDB_RUNTIME=local\nADMIN_BOOTSTRAP_ENABLED=false\n"
                "JWT_SECRET=sentinel-jwt-secret\nSPRING_DATASOURCE_PASSWORD=sentinel-db-secret\n")
            commands = []

            def run(args, **kwargs):
                commands.append(args)
                if args[1] == "ps":
                    return "abcdef012345\n"
                if args[1] == "port":
                    return ""
                self.assertEqual(args[1], "exec")
                self.assertIn("FROM flyway_schema_history", args[-1])
                self.assertNotIn("sentinel", str(args))
                return "43\tV43__test.sql\t-12345\t1\n"

            report = host.inspect(root, run)
            self.assertTrue(report["mysqlHasNoHostPorts"])
            self.assertFalse(report["mfaKeyConfigured"])
            self.assertFalse(report["mfaRequired"])
            self.assertNotIn("sentinel", json.dumps(report))
            self.assertEqual(len(commands), 3)

    def test_non_staging_profile_stops_before_container_access(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "config").mkdir()
            (root / "config/.env.staging").write_text("SPRING_PROFILES_ACTIVE=prod\n")
            with self.assertRaises(ValueError):
                host.inspect(root, lambda *args, **kwargs: self.fail("Must not access Docker"))

    def test_remote_failure_does_not_print_credentials(self):
        script = Path(host.__file__)
        # No /opt/herfree config exists on the test runner. Only a fixed failure is emitted.
        result = subprocess.run([__import__("sys").executable, str(script)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout), {"error": "Staging host inspection unavailable; no deployment performed"})
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
