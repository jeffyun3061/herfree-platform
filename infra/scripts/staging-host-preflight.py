#!/usr/bin/env python3
"""Fixed, read-only staging SSM probe. Never print env values or application data."""
import json
import base64
import re
import subprocess
from pathlib import Path


def read_env(path):
    return dict(line.split("=", 1) for line in path.read_text().splitlines()
                if "=" in line and not line.startswith("#"))


def independent_key(key, other_keys):
    try:
        return bool(key) and len(base64.b64decode(key, validate=True)) == 32 and key not in other_keys
    except (ValueError, TypeError):
        return False


def inspect(root=Path("/opt/herfree"), run=subprocess.check_output):
    path = root / "config/.env.staging"
    env = read_env(path)
    if env.get("SPRING_PROFILES_ACTIVE") != "staging":
        raise ValueError("Staging profile required")
    if (root / ".deploy/staging.pending-operation").exists():
        raise ValueError("Staging deployment requires reconciliation")
    key = env.get("ADMIN_MFA_ENCRYPTION_KEY", "")
    report = {
        "profile": "staging",
        "configPrivate": path.stat().st_mode & 0o077 == 0,
        "localDatabase": env.get("DB_RUNTIME") == "local",
        "mfaKeyConfigured": independent_key(key, (env.get("HEALTH_DATA_ENCRYPTION_KEY"), env.get("JWT_SECRET"))),
        "mfaRequired": env.get("ADMIN_MFA_REQUIRED") == "true",
        "bootstrapDisabled": env.get("ADMIN_BOOTSTRAP_ENABLED") == "false",
    }
    try:
        # Read on the existing instance role; never return the secret JSON or its values.
        secret = json.loads(run(["aws", "secretsmanager", "get-secret-value", "--region", "ap-northeast-2",
                                 "--secret-id", "herfree/staging/app-config", "--query", "SecretString",
                                 "--output", "text", "--no-cli-pager"], text=True,
                                stderr=subprocess.DEVNULL, timeout=20))
        report["mfaKeyAvailableForRelease"] = independent_key(secret.get("adminMfaEncryptionKey"),
                                                             (secret.get("healthDataEncryptionKey"), secret.get("jwtSecret")))
        del secret
    except Exception:
        report["mfaKeyAvailableForRelease"] = "unavailable"
    image = root / ".deploy/staging.current-image"
    if image.exists():
        match = re.search(r"(?:@sha256:([a-f0-9]{64})|:([a-f0-9]{40}))$", image.read_text().strip())
        report["currentImageRevision"] = (match.group(1) or match.group(2)) if match else "unrecognized"
    if not report["localDatabase"]:
        return report
    containers = run(["docker", "ps", "-q", "--filter", "label=com.docker.compose.project=herfree-staging",
                      "--filter", "label=com.docker.compose.service=mysql"], text=True,
                     stderr=subprocess.DEVNULL, timeout=10).split()
    if len(containers) != 1 or not re.fullmatch(r"[a-f0-9]{12,64}", containers[0]):
        raise ValueError("Exactly one staging MySQL container required")
    container = containers[0]
    ports = run(["docker", "port", container], text=True, stderr=subprocess.DEVNULL, timeout=10)
    report["mysqlHasNoHostPorts"] = not ports.strip()
    # MYSQL_* is expanded inside the existing container, not in SSM or process arguments.
    # The query returns migration metadata only. No user/health tables are read.
    query = "SELECT version,script,checksum,success FROM flyway_schema_history ORDER BY installed_rank"
    command = ('MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --batch --skip-column-names '
               '--host=127.0.0.1 --ssl-mode=REQUIRED --user="$MYSQL_USER" '
               '--database="$MYSQL_DATABASE" --execute="' + query + '"')
    rows = run(["docker", "exec", container, "sh", "-c", command], text=True,
               stderr=subprocess.DEVNULL, timeout=20).splitlines()
    migrations = []
    for row in rows:
        version, script, checksum, success = row.split("\t")
        if not re.fullmatch(r"[0-9.]+", version) or not re.fullmatch(r"V[0-9_]+__[a-zA-Z0-9_]+\.sql", script) \
                or not re.fullmatch(r"-?[0-9]+", checksum) or success not in ("0", "1"):
            raise ValueError("Unexpected migration metadata")
        migrations.append({"version": version, "script": script, "checksum": int(checksum), "success": success == "1"})
    report["migrations"] = migrations
    return report


if __name__ == "__main__":
    try:
        print(json.dumps(inspect()))
    except Exception:
        # Do not echo exceptions: CLI diagnostics can include credentials/SQL/hostnames.
        print(json.dumps({"error": "Staging host inspection unavailable; no deployment performed"}))
        raise SystemExit(1)
