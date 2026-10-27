#!/usr/bin/env python3
"""Resume only existing staging containers after normal IAM restoration; never deploy or recreate them."""
import argparse
from contextlib import contextmanager
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request


# Renaming either resource requires code and runbook review. Caller-supplied
# ARNs are expected identity assertions, not an allowlist of arbitrary roles.
NORMAL_STAGING_ROLE_NAME = "herfree-staging-ec2"
NORMAL_STAGING_PROFILE_NAME = "herfree-staging-ec2"


class ResumeRefused(ValueError):
    """A fixed local guard message safe to show without host data."""


class ResumeUnhealthy(RuntimeError):
    """A fixed health failure message safe to show without application logs."""


def run(command):
    return subprocess.check_output(command, text=True, stderr=subprocess.DEVNULL, timeout=30)


def metadata():
    # IMDS credentials/identity must not be routed through an HTTP proxy.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    base = "http://169.254.169.254/latest/"
    request = urllib.request.Request(base + "api/token", method="PUT",
                                     headers={"X-aws-ec2-metadata-token-ttl-seconds": "60"})
    with opener.open(request, timeout=5) as response:
        token = response.read().decode()

    def read(path):
        request = urllib.request.Request(base + path, headers={"X-aws-ec2-metadata-token": token})
        with opener.open(request, timeout=5) as response:
            return response.read().decode()

    return {"instance": read("meta-data/instance-id"),
            "profile": json.loads(read("meta-data/iam/info"))["InstanceProfileArn"]}


def approved_normal_account(args):
    role = re.fullmatch(r"arn:aws:iam::(\d{12}):role/" + re.escape(NORMAL_STAGING_ROLE_NAME),
                        args.normal_role_arn)
    profile = re.fullmatch(r"arn:aws:iam::(\d{12}):instance-profile/" + re.escape(NORMAL_STAGING_PROFILE_NAME),
                           args.normal_profile_arn)
    if not role or not profile or role.group(1) != profile.group(1):
        raise ResumeRefused("Approved normal staging role and profile in the same account required")
    return role.group(1)


def require_normal_identity(args, execute, identify):
    account = approved_normal_account(args)
    identity = identify()
    if identity != {"instance": args.instance_id, "profile": args.normal_profile_arn}:
        raise ResumeRefused("Expected staging instance and normal profile required")
    caller = json.loads(execute(["aws", "sts", "get-caller-identity", "--region", args.region,
                                 "--output", "json"]))["Arn"]
    if not caller.startswith(f"arn:aws:sts::{account}:assumed-role/{NORMAL_STAGING_ROLE_NAME}/"):
        raise ResumeRefused("Normal staging role is not active")


def inspect_containers(args, execute, identify, mounted):
    if not re.fullmatch(r"i-[a-f0-9]{8,17}", args.instance_id):
        raise ResumeRefused("An explicit staging instance ID is required")
    require_normal_identity(args, execute, identify)
    if (args.root / ".deploy/staging.pending-operation").exists():
        raise ResumeRefused("Pending staging deployment requires reconciliation")
    if mounted("/mnt/herfree-restore-drill"):
        raise ResumeRefused("Restore mount is still present")
    if execute(["docker", "ps", "-aq", "--filter", "name=herfree-restore-drill-"]).strip():
        raise ResumeRefused("Restore containers are still present")

    ids = []
    for service in ("mysql", "api"):
        values = execute(["docker", "ps", "-aq", "--filter", "label=com.docker.compose.project=herfree-staging",
                          "--filter", f"label=com.docker.compose.service={service}"]).split()
        if len(values) != 1 or not re.fullmatch(r"[a-f0-9]{12,64}", values[0]):
            raise ResumeRefused("Exactly one existing staging MySQL and API container required")
        ids.append(values[0])
    containers = json.loads(execute(["docker", "inspect", *ids]))
    if len(containers) != 2:
        raise ResumeRefused("Unexpected staging container inspection")
    by_id = {item["Id"]: item for item in containers}
    verified = []
    for service, container_id in zip(("mysql", "api"), ids):
        item = next((value for key, value in by_id.items() if key.startswith(container_id)), None)
        if item is None or item["Config"]["Labels"].get("com.docker.compose.project") != "herfree-staging" \
                or item["Config"]["Labels"].get("com.docker.compose.service") != service:
            raise ResumeRefused("Unexpected staging container labels")
        if item["State"]["Status"] not in {"created", "exited", "running"}:
            raise ResumeRefused("Staging container requires operator inspection")
        if any(str(mount.get("Source", "")).startswith("/mnt/herfree-restore-drill")
               or mount.get("Destination") == "/verification" for mount in item.get("Mounts", [])):
            raise ResumeRefused("Staging container references restored data")
        if service == "mysql":
            if any((item["HostConfig"].get("PortBindings") or {}).values()):
                raise ResumeRefused("Staging MySQL must have no published port")
            data_mounts = [mount for mount in item.get("Mounts", []) if mount.get("Destination") == "/var/lib/mysql"]
            if len(data_mounts) != 1 or data_mounts[0].get("Type") != "bind" \
                    or data_mounts[0].get("Source") != "/var/lib/herfree/mysql-staging":
                raise ResumeRefused("Existing staging database mount required")
        if service == "api":
            env = dict(value.split("=", 1) for value in item["Config"].get("Env", []) if "=" in value)
            if env.get("SPRING_PROFILES_ACTIVE") != "staging" or env.get("DB_RUNTIME") != "local" \
                    or not env.get("SPRING_DATASOURCE_URL", "").startswith("jdbc:mysql://mysql:3306/"):
                raise ResumeRefused("Existing API must use the staging profile and local MySQL")
        verified.append(item["Id"])
    return verified


def api_healthy():
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open("http://127.0.0.1:8080/actuator/health", timeout=3) as response:
            return response.status == 200
    except Exception:
        return False


def resume(args, execute=run, identify=metadata, mounted=os.path.ismount, sleep=time.sleep, health=api_healthy):
    mysql, api = inspect_containers(args, execute, identify, mounted)
    # Recheck immediately before each mutation. The helper is run only after the
    # restore workflow has finished cleanup, never concurrently with a drill.
    require_normal_identity(args, execute, identify)
    execute(["docker", "start", mysql])
    for _ in range(90):
        if execute(["docker", "inspect", "--format", "{{.State.Health.Status}}", mysql]).strip() == "healthy":
            break
        sleep(3)
    else:
        raise ResumeUnhealthy("Existing staging database did not become healthy")
    try:
        require_normal_identity(args, execute, identify)
    except Exception:
        # A role change during DB startup is an operational conflict. Keep the
        # normal workload stopped rather than leaving a partial resume behind.
        execute(["docker", "stop", mysql])
        raise
    execute(["docker", "start", api])
    for _ in range(160):
        if health():
            print("Existing staging database and API are healthy.")
            return
        sleep(3)
    raise ResumeUnhealthy("Existing staging API did not become healthy")


@contextmanager
def deployment_lock(root):
    import fcntl  # Linux host only; shares deploy-release.sh's advisory lock.
    with (root / ".deploy/staging.lock").open("a") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--instance-id", required=True)
    parser.add_argument("--normal-role-arn", required=True)
    parser.add_argument("--normal-profile-arn", required=True)
    parser.add_argument("--region", default="ap-northeast-2")
    parser.add_argument("--root", type=Path, default=Path("/opt/herfree"))
    args = parser.parse_args()
    try:
        with deployment_lock(args.root):
            resume(args)
    except (ResumeRefused, ResumeUnhealthy) as error:
        print(str(error))
        return 1
    except Exception:
        # Never echo environment values, credentials, container details or raw logs.
        print("Staging resume refused or unavailable; inspect identity, restore cleanup and deployment state.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
