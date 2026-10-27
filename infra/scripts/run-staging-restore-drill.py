#!/usr/bin/env python3
"""Monthly isolated restore on the existing stopped staging EC2; always clean up owned resources."""
import argparse
import base64
import json
import re
import shlex
import subprocess
import tempfile
import time
import uuid
from pathlib import Path


class RestoreCommandError(RuntimeError):
    def __init__(self, phase, category):
        super().__init__("Restore command failed")
        self.phase = phase
        self.category = category


def classify_ssm_failure(response):
    # SSM output may contain health information. Return only fixed labels.
    output = (response.get("StandardOutputContent") or "") + (response.get("StandardErrorContent") or "")
    phases = {
        "Temporary restore role not active": "role",
        "New restore volume not found": "volume",
        "Backup checksum mismatch": "backup-integrity",
        "Backup exceeds the six-hour recovery target": "backup-age",
        "Restore database startup failed": "database-startup",
        "Backup import failed": "database-import",
        "Restored application verification failed": "app-verification",
    }
    phase = next((label for marker, label in phases.items() if marker in output), "unknown")
    allowed = {"OutOfMemoryError", "BeanCreationException", "BeanInstantiationException",
               "SQLSyntaxErrorException", "SQLIntegrityConstraintViolationException",
               "CommunicationsException", "JdbcSQLSyntaxErrorException", "HibernateException",
               "IllegalStateException", "AccessDeniedException"}
    match = re.search(r"category=([A-Za-z]+(?:Error|Exception)|unknown)", output)
    category = match.group(1) if match and match.group(1) in allowed else "unknown"
    return phase, category


def aws(region, *args):
    result = subprocess.run(["aws", *args, "--region", region, "--output", "json", "--no-cli-pager"],
                            capture_output=True, text=True, check=True)
    return json.loads(result.stdout or "{}")


def instance(region, instance_id):
    return aws(region, "ec2", "describe-instances", "--instance-ids", instance_id)["Reservations"][0]["Instances"][0]


def require_staging(value, stopped=False):
    tags = {t["Key"]: t["Value"] for t in value.get("Tags", [])}
    if (tags.get("Environment") and tags["Environment"] != "staging") or "production" in tags.get("Name", "").lower():
        raise ValueError("Production restore target refused")
    if tags.get("Environment") != "staging" and tags.get("Name") != "herfree-staging":
        raise ValueError("An explicitly identified staging instance is required")
    if stopped and value["State"]["Name"] != "stopped":
        raise ValueError("Staging must be stopped before the drill; existing active tests are not interrupted")


def save(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def report_failure(region, bucket):
    if not bucket:
        return
    with tempfile.TemporaryDirectory() as directory:
        evidence = Path(directory) / "failure.json"
        evidence.write_text(json.dumps({"success": False, "completedEpoch": int(time.time()),
                                        "phase": "orchestration-or-cleanup"}), encoding="utf-8")
        aws(region, "s3", "cp", str(evidence), f"s3://{bucket}/operations/production/restore-drill/last-attempt.json",
            "--sse", "AES256", "--only-show-errors")


def ssm(region, instance_id, source, timeout=1200):
    result = aws(region, "ssm", "send-command", "--instance-ids", instance_id,
                 "--document-name", "AWS-RunShellScript", "--timeout-seconds", "300",
                 "--parameters", json.dumps({"commands": ["/bin/bash -c " + shlex.quote(source)],
                                               "executionTimeout": [str(timeout)]}))
    command_id = result["Command"]["CommandId"]
    deadline = time.monotonic() + timeout + 120
    while time.monotonic() < deadline:
        time.sleep(5)
        try:
            response = aws(region, "ssm", "get-command-invocation", "--command-id", command_id,
                           "--instance-id", instance_id)
        except subprocess.CalledProcessError as error:
            if "InvocationDoesNotExist" in error.stderr:
                continue
            raise
        if response["Status"] == "Success":
            return
        if response["Status"] in {"Failed", "Cancelled", "TimedOut"}:
            # Never publish SSM standard output/errors: a restored database can contain personal information.
            raise RestoreCommandError(*classify_ssm_failure(response))
    aws(region, "ssm", "cancel-command", "--command-id", command_id)
    raise RuntimeError("Restore command timed out")


def cleanup(path):
    if not path.exists():
        return
    state = json.loads(path.read_text(encoding="utf-8"))
    if state.get("cleaned"):
        return
    region, target = state["region"], state["instance"]
    require_staging(instance(region, target))
    # Stopping first terminates any interrupted SSM job and releases all restored file handles.
    if state.get("started"):
        aws(region, "ec2", "stop-instances", "--instance-ids", target)
        aws(region, "ec2", "wait", "instance-stopped", "--instance-ids", target)
    # Recover a create-volume response interrupted before its ID could be saved locally.
    if not state.get("volume"):
        owned = aws(region, "ec2", "describe-volumes", "--filters",
                    f"Name=tag:HerfreeRestoreDrill,Values={state['run']}")["Volumes"]
        if len(owned) > 1:
            raise ValueError("Multiple restore volumes require operator inspection")
        if owned:
            state["volume"] = owned[0]["VolumeId"]
            save(path, state)
    if state.get("volume"):
        volume_id = state["volume"]
        try:
            volume = aws(region, "ec2", "describe-volumes", "--volume-ids", volume_id)["Volumes"][0]
        except subprocess.CalledProcessError as error:
            if "InvalidVolume.NotFound" not in error.stderr:
                raise
            volume = None
        if volume:
            tags = {t["Key"]: t["Value"] for t in volume.get("Tags", [])}
            if tags.get("HerfreeRestoreDrill") != state["run"] or not volume["Encrypted"]:
                raise ValueError("Refusing cleanup of an unowned or unencrypted volume")
            if any(a["InstanceId"] != target for a in volume["Attachments"]):
                raise ValueError("Restore volume attached to an unexpected instance")
            if volume["Attachments"]:
                aws(region, "ec2", "detach-volume", "--volume-id", volume_id, "--instance-id", target)
                aws(region, "ec2", "wait", "volume-available", "--volume-ids", volume_id)
            aws(region, "ec2", "delete-volume", "--volume-id", volume_id)
            aws(region, "ec2", "wait", "volume-deleted", "--volume-ids", volume_id)
    if state.get("profileChanged"):
        # EC2 rejects replace-iam-instance-profile-association after the instance is
        # stopped. Disassociate and then associate work on a stopped instance and
        # keep interrupted cleanup safe to retry.
        association_requested = False
        for _ in range(30):
            associations = aws(region, "ec2", "describe-iam-instance-profile-associations",
                               "--filters", f"Name=instance-id,Values={target}")["IamInstanceProfileAssociations"]
            attached = [a for a in associations if a["State"] in {"associated", "associating"}]
            if len(attached) > 1:
                raise ValueError("Multiple instance profiles require operator inspection")
            if attached:
                active = attached[0]
                current = active["IamInstanceProfile"]["Arn"]
                if current == state["originalProfile"]:
                    # A profile associated while EC2 is stopped can remain in
                    # "associating" until the next start. The restore profile is
                    # already detached and the normal profile is the sole target.
                    break
                elif current == state["restoreProfile"]:
                    if active["State"] == "associated":
                        aws(region, "ec2", "disassociate-iam-instance-profile",
                            "--association-id", active["AssociationId"])
                else:
                    raise ValueError("Unexpected profile change; refusing to overwrite it")
            elif not association_requested and not any(a["State"] == "disassociating" for a in associations):
                aws(region, "ec2", "associate-iam-instance-profile", "--instance-id", target,
                    "--iam-instance-profile", f"Arn={state['originalProfile']}")
                association_requested = True
            time.sleep(2)
        else:
            raise RuntimeError("Original staging instance profile was not restored")
    state["cleaned"] = True
    save(path, state)
    print("Restore volume deleted, original staging profile restored, staging stopped.")


def run(args):
    path = Path(args.state)
    if path.exists() and not json.loads(path.read_text(encoding="utf-8")).get("cleaned"):
        raise ValueError("Unfinished drill state exists; run cleanup before starting another drill")
    target = instance(args.region, args.instance)
    require_staging(target, stopped=True)
    if not re.fullmatch(r"\d{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9/_-]+@sha256:[a-f0-9]{64}", args.image):
        raise ValueError("An immutable, staging-tested ECR image digest is required")
    associations = aws(args.region, "ec2", "describe-iam-instance-profile-associations",
                       "--filters", f"Name=instance-id,Values={args.instance}")["IamInstanceProfileAssociations"]
    active = next(a for a in associations if a["State"] in {"associated", "associating"})
    original = active["IamInstanceProfile"]["Arn"]
    if args.profile == original:
        raise ValueError("Restore requires a dedicated temporary instance profile, distinct from normal staging")
    profile = aws(args.region, "iam", "get-instance-profile", "--instance-profile-name", args.profile.rsplit("/", 1)[-1])["InstanceProfile"]
    if profile["Arn"] != args.profile or len(profile["Roles"]) != 1:
        raise ValueError("Unexpected restore instance profile")
    role = profile["Roles"][0]
    account = role["Arn"].split(":")[4]
    state = {"run": uuid.uuid4().hex, "region": args.region, "instance": args.instance,
             "restoreProfile": args.profile, "originalProfile": original, "started": False,
             "profileChanged": False, "startedEpoch": int(time.time()), "bucket": args.bucket}
    save(path, state)
    try:
        # Persist intent before mutations so the workflow's always-cleanup step can reconcile interruptions.
        state["started"] = True
        save(path, state)
        aws(args.region, "ec2", "start-instances", "--instance-ids", args.instance)
        aws(args.region, "ec2", "wait", "instance-running", "--instance-ids", args.instance)
        aws(args.region, "ec2", "wait", "instance-status-ok", "--instance-ids", args.instance)
        # A normal profile restored during the previous stopped cleanup may only
        # become active now. Never swap it for the temporary role until confirmed.
        for _ in range(30):
            current = aws(args.region, "ec2", "describe-iam-instance-profile-associations",
                          "--filters", f"Name=instance-id,Values={args.instance}")["IamInstanceProfileAssociations"]
            if any(a["AssociationId"] == active["AssociationId"] and a["State"] == "associated"
                   and a["IamInstanceProfile"]["Arn"] == original for a in current):
                break
            time.sleep(2)
        else:
            raise RuntimeError("Normal staging instance profile did not become active")
        # Retry SSM registration after the stopped instance starts, without publishing command contents.
        ready = False
        for _ in range(60):
            nodes = aws(args.region, "ssm", "describe-instance-information", "--filters",
                        f"Key=InstanceIds,Values={args.instance}")["InstanceInformationList"]
            if nodes and nodes[0]["PingStatus"] == "Online":
                ready = True
                break
            time.sleep(5)
        if not ready:
            raise RuntimeError("Staging SSM agent did not become available")
        # Staging boots with its normal role. Stop normal apps before granting temporary recovery access.
        ssm(args.region, args.instance, r'''set -euo pipefail
containers="$(docker ps --filter label=com.docker.compose.project=herfree-staging --format '{{.ID}}')"
for container in $containers; do docker stop "$container" >/dev/null; done
''', timeout=180)
        state["profileChanged"] = True
        save(path, state)
        aws(args.region, "ec2", "replace-iam-instance-profile-association", "--association-id", active["AssociationId"],
            "--iam-instance-profile", f"Arn={args.profile}")
        volume = aws(args.region, "ec2", "create-volume", "--availability-zone", target["Placement"]["AvailabilityZone"],
                     "--size", "10", "--volume-type", "gp3", "--encrypted", "--client-token", state["run"],
                     "--tag-specifications", json.dumps([{"ResourceType": "volume", "Tags": [
                         {"Key": "HerfreeRestoreDrill", "Value": state["run"]},
                         {"Key": "Environment", "Value": "staging"}]}]))
        state["volume"] = volume["VolumeId"]
        save(path, state)
        aws(args.region, "ec2", "wait", "volume-available", "--volume-ids", state["volume"])
        aws(args.region, "ec2", "attach-volume", "--instance-id", args.instance, "--volume-id", state["volume"], "--device", "/dev/sdg")
        aws(args.region, "ec2", "wait", "volume-in-use", "--volume-ids", state["volume"])
        worker = base64.b64encode(Path(__file__).with_name("restore-local-db-drill.sh").read_bytes()).decode()
        exports = {"CONFIRM_RESTORE_DRILL": "YES", "STAGING_INSTANCE_ID": args.instance,
                   "RESTORE_VOLUME_ID": state["volume"], "RESTORE_API_IMAGE": args.image,
                   "BACKUP_BUCKET": args.bucket, "AWS_REGION": args.region,
                   "RESTORE_EXPECTED_ROLE_PREFIX": f"arn:aws:sts::{account}:assumed-role/{role['RoleName']}/",
                   "DRILL_START_EPOCH": str(state["startedEpoch"])}
        source = "set -euo pipefail\numask 077\n" + "\n".join(f"export {k}={shlex.quote(v)}" for k, v in exports.items())
        source += r'''
role_ready=false
for _ in {1..60}; do
  caller="$(aws sts get-caller-identity --query Arn --output text 2>/dev/null || true)"
  if [[ "$caller" == "${RESTORE_EXPECTED_ROLE_PREFIX}"* ]]; then role_ready=true; break; fi
  sleep 5
done
[[ "$role_ready" == true ]] || { echo 'Temporary restore role not active'; exit 1; }
device=''
for _ in {1..60}; do
  device="$(lsblk -dn -o PATH,SERIAL | awk -v serial="${RESTORE_VOLUME_ID//-/}" '$2==serial {print $1}')"
  [[ -n "$device" ]] && break
  # t3 uses NVMe. Do not guess a device path or format existing staging disks.
  sleep 2
done
[[ "$device" =~ ^/dev/nvme[0-9]+n1$ ]] || { echo 'New restore volume not found'; exit 1; }
[[ -z "$(lsblk -n -o FSTYPE "$device" | tr -d '[:space:]')" ]] || { echo 'Refusing to format an existing filesystem'; exit 1; }
mkdir -p /mnt/herfree-restore-drill
! mountpoint -q /mnt/herfree-restore-drill || exit 1
mkfs.ext4 -q "$device"
mount "$device" /mnt/herfree-restore-drill
trap 'umount /mnt/herfree-restore-drill' EXIT
'''
        source += "\nprintf %s " + shlex.quote(worker) + " | base64 -d > /mnt/herfree-restore-drill/worker.sh\n"
        source += "bash /mnt/herfree-restore-drill/worker.sh\n"
        ssm(args.region, args.instance, source)
    finally:
        cleanup(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["run", "cleanup"])
    parser.add_argument("--state", required=True)
    parser.add_argument("--region", default="ap-northeast-2")
    parser.add_argument("--instance")
    parser.add_argument("--profile")
    parser.add_argument("--image")
    parser.add_argument("--bucket")
    args = parser.parse_args()
    if args.command == "run" and not all([args.instance, args.profile, args.image, args.bucket]):
        parser.error("run requires --instance, --profile, --image and --bucket")
    try:
        cleanup(Path(args.state)) if args.command == "cleanup" else run(args)
    except (ValueError, RuntimeError, subprocess.CalledProcessError, StopIteration, KeyError) as error:
        bucket = args.bucket
        if not bucket and Path(args.state).exists():
            bucket = json.loads(Path(args.state).read_text(encoding="utf-8")).get("bucket")
        try:
            report_failure(args.region, bucket)
        except subprocess.CalledProcessError:
            print("Failure evidence upload unavailable; inspect GitHub job and restore-age/missing-metric alarms.")
        # CLI stderr and SSM output may contain sensitive values. Emit only a
        # bounded AWS error code or the known local exception class.
        detail = type(error).__name__
        if isinstance(error, RestoreCommandError):
            detail += f"/{error.phase}/{error.category}"
        if isinstance(error, subprocess.CalledProcessError):
            code = re.search(r"\(([A-Za-z0-9.]+)\) when calling", error.stderr or "")
            if code:
                detail += f"/{code.group(1)}"
        print(f"Drill failed ({detail}). Check retained state; run cleanup if unfinished.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
