#!/usr/bin/env python3
"""Inspect the existing staging account/host through its existing GitHub OIDC role.

No resource creation, start/stop, deployment, secret writes, or data mutations.
Only SSM's fixed metadata probe executes remotely. Output is allowlisted.
"""
import base64
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
import zlib
from pathlib import Path

ACCOUNT = "439777528445"
REGION = "ap-northeast-2"
INSTANCE = "i-02cf5b8f3a7aa32da"
APP = "d2bcg3vnlv5hkh"
FRONTEND = "https://develop.d2bcg3vnlv5hkh.amplifyapp.com"
API = "https://api-staging.herpfree.co.kr"
ROOT = Path(__file__).resolve().parents[2]


def failure_reason(error):
    if isinstance(error, subprocess.CalledProcessError):
        match = re.search(r"An error occurred \(([A-Za-z0-9.]+)\)", error.stderr or "")
        if match and match.group(1) in {"AccessDenied", "AccessDeniedException", "UnauthorizedOperation",
                                     "InvalidInstanceId", "InvalidInstanceID.NotFound", "ResourceNotFoundException",
                                     "ThrottlingException", "ExpiredToken", "RequestExpired"}:
            return match.group(1)
        return "aws_request_failed"
    return "inspection_unavailable"


def aws(*args):
    result = subprocess.run(["aws", *args, "--region", REGION, "--output", "json", "--no-cli-pager"],
                            check=True, capture_output=True, text=True, timeout=45)
    return json.loads(result.stdout or "{}")


def validate_identity(identity):
    if identity.get("Account") != ACCOUNT or not re.fullmatch(
            rf"arn:aws:sts::{ACCOUNT}:assumed-role/herfree-github-staging-deploy/[A-Za-z0-9+=,.@_-]+",
            identity.get("Arn", "")):
        raise ValueError("Expected staging deployment role required")


def migration_check(migrations, directory):
    conflicts = []
    if not migrations:
        return {"compatible": False, "conflicts": ["migration_history_unavailable"]}
    for item in migrations:
        script = item.get("script", "")
        if not re.fullmatch(r"V[0-9_]+__[a-zA-Z0-9_]+\.sql", script):
            conflicts.append("unexpected_migration_name")
            continue
        path = directory / script
        if not path.is_file() or not item.get("success"):
            conflicts.append(script)
            continue
        checksum = 0
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            checksum = zlib.crc32(line.encode("utf-8"), checksum)
        if checksum >= 2**31:
            checksum -= 2**32
        if checksum != item.get("checksum"):
            conflicts.append(script)
    return {"compatible": not conflicts, "conflicts": conflicts}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def http_status(url, authorization=None):
    request = urllib.request.Request(url, headers={"Authorization": authorization} if authorization else {})
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=15) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        return exc.code


def main():
    validate_identity(aws("sts", "get-caller-identity"))
    report = {"target": "staging", "resourceChanges": False, "checks": {}, "unavailable": {}}

    def check(name, action):
        try:
            report["checks"][name] = action()
        except Exception as error:
            report["unavailable"][name] = failure_reason(error)

    check("instance", lambda: aws("ec2", "describe-instances", "--instance-ids", INSTANCE, "--query",
          "Reservations[].Instances[].{state:State.Name,type:InstanceType,metadataTokens:MetadataOptions.HttpTokens}"))
    check("encryptedVolumes", lambda: aws("ec2", "describe-volumes", "--filters", f"Name=attachment.instance-id,Values={INSTANCE}",
          "--query", "Volumes[].{encrypted:Encrypted,sizeGiB:Size}"))
    check("ssm", lambda: aws("ssm", "describe-instance-information", "--filters", f"Key=InstanceIds,Values={INSTANCE}",
          "--query", "InstanceInformationList[].{status:PingStatus}"))
    check("amplify", lambda: aws("amplify", "get-branch", "--app-id", APP, "--branch-name", "develop", "--query",
          "branch.{basicAuth:enableBasicAuth,autoBuild:enableAutoBuild}"))
    check("frontendBuild", lambda: aws("amplify", "list-jobs", "--app-id", APP, "--branch-name", "develop",
          "--max-results", "1", "--query", "jobSummaries[].{status:status,commit:commitId}"))
    check("frontendUnauthenticatedStatus", lambda: http_status(FRONTEND))
    username = os.environ.get("E2E_HTTP_USERNAME", "")
    password = os.environ.get("E2E_HTTP_PASSWORD", "")
    if username and password:
        authorization = "Basic " + base64.b64encode(f"{username}:{password}".encode()).decode()
        check("frontendAuthenticatedStatus", lambda: http_status(FRONTEND, authorization))
    else:
        report["unavailable"]["frontendAuthenticatedStatus"] = "credentials_not_configured"
    check("apiHealthStatus", lambda: http_status(API + "/api/health"))

    def host():
        payload = base64.b64encode((ROOT / "infra/scripts/staging-host-preflight.py").read_bytes()).decode()
        command = "python3 -c \"import base64; exec(base64.b64decode('" + payload + "'))\""
        command_id = aws("ssm", "send-command", "--instance-ids", INSTANCE, "--document-name", "AWS-RunShellScript",
                         "--timeout-seconds", "60", "--parameters", json.dumps({"commands": [command], "executionTimeout": ["60"]}))["Command"]["CommandId"]
        for _ in range(36):
            time.sleep(5)
            try:
                result = aws("ssm", "get-command-invocation", "--command-id", command_id, "--instance-id", INSTANCE)
            except subprocess.CalledProcessError:
                continue
            if result["Status"] in ("Pending", "InProgress", "Delayed"):
                continue
            if result["Status"] != "Success":
                raise ValueError("Host probe unavailable")
            value = json.loads(result["StandardOutputContent"])
            # Never echo remote stdout/stderr wholesale; only known metadata fields.
            allowed = ("profile", "configPrivate", "localDatabase", "mfaKeyConfigured", "mfaRequired", "mfaKeyAvailableForRelease",
                       "bootstrapDisabled", "currentImageRevision", "mysqlHasNoHostPorts")
            clean = {key: value[key] for key in allowed if key in value}
            clean["migrationHistory"] = migration_check(value.get("migrations"), ROOT / "backend/src/main/resources/db/migration")
            return clean
        raise TimeoutError("Host probe timed out")

    check("host", host)
    checks = report["checks"]
    host_report = checks.get("host", {})
    report["hostPreconditionsPassed"] = not report["unavailable"] and all([
        checks.get("frontendUnauthenticatedStatus") == 401,
        checks.get("frontendAuthenticatedStatus") == 200,
        checks.get("apiHealthStatus") == 200,
        checks.get("amplify", {}).get("basicAuth") is True,
        bool(checks.get("encryptedVolumes")) and all(v.get("encrypted") is True for v in checks["encryptedVolumes"]),
        bool(checks.get("instance")) and all(v.get("state") == "running" and v.get("metadataTokens") == "required" for v in checks["instance"]),
        bool(checks.get("ssm")) and all(v.get("status") == "Online" for v in checks["ssm"]),
        # Existing runtime predates MFA; the candidate renderer enables MFA when deploying.
        # Readiness requires its independent key in Secrets Manager, not a prior MFA deployment.
        all(host_report.get(key) is True for key in ("configPrivate", "localDatabase", "mfaKeyAvailableForRelease", "bootstrapDisabled", "mysqlHasNoHostPorts")),
        host_report.get("migrationHistory", {}).get("compatible") is True,
    ])
    rendered = json.dumps(report, indent=2)
    print(rendered)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as output:
            output.write("### Existing staging preflight\n```json\n" + rendered + "\n```\n")
    return 0 if report["hostPreconditionsPassed"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        print("Staging inspection unavailable; credentials and AWS error payloads are not logged.")
        raise SystemExit(1)
