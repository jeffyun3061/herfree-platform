#!/usr/bin/env python3
"""Read-only AWS cost audit, guarded ECR cleanup, and notification-only budgets."""
import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path


def aws(*args, region="ap-northeast-2"):
    result = subprocess.run(["aws", *args, "--region", region, "--output", "json", "--no-cli-pager"],
                            check=True, capture_output=True, text=True)
    return json.loads(result.stdout or "{}")


def cleanup_candidates(images, protected, now):
    cutoff = now - dt.timedelta(days=30)
    result = []
    for image in images:
        digest = image.get("imageDigest")
        if not digest or digest in protected:
            continue
        tags = image.get("imageTags", [])
        # Unknown tags are retained. Only immutable commit tags or untagged images are eligible.
        if any(not re.fullmatch(r"[0-9a-f]{40}", tag) for tag in tags):
            continue
        times = [image.get("imagePushedAt"), image.get("lastRecordedPullTime")]
        parsed = []
        for value in times:
            if value is None:
                continue
            parsed.append(dt.datetime.fromtimestamp(value, dt.timezone.utc) if isinstance(value, (int, float))
                          else dt.datetime.fromisoformat(value.replace("Z", "+00:00")))
        if not parsed or max(parsed) > cutoff:
            continue
        result.append({"imageDigest": digest})
    return result


def cleanup(args):
    manifest = json.loads(Path(args.protected_manifest).read_text(encoding="utf-8"))
    rollbacks = manifest.get("rollbackDigests", [])
    protected = {manifest.get("currentDigest"), *rollbacks, *manifest.get("stagingDigests", [])}
    if len(set(rollbacks)) < 3 or not manifest.get("currentDigest") or manifest["currentDigest"] in rollbacks \
            or "stagingDigests" not in manifest:
        raise ValueError("A current image and three distinct known-good rollback images are required")
    if any(not isinstance(x, str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", x) for x in protected):
        raise ValueError("Invalid protected digest manifest")
    images = aws("ecr", "describe-images", "--repository-name", args.repository, region=args.region)["imageDetails"]
    candidates = cleanup_candidates(images, protected, dt.datetime.now(dt.timezone.utc))
    print(json.dumps({"apply": args.apply, "protected": sorted(protected), "candidates": candidates}, indent=2))
    if args.apply:
        for offset in range(0, len(candidates), 100):
            outcome = aws("ecr", "batch-delete-image", "--repository-name", args.repository,
                          "--image-ids", json.dumps(candidates[offset:offset+100]), region=args.region)
            if outcome.get("failures"):
                raise RuntimeError("ECR cleanup returned failures; inspect the repository before retrying")


def budget(args):
    account = aws("sts", "get-caller-identity", region=args.region)["Account"]
    if not args.topic.startswith(f"arn:aws:sns:{args.region}:{account}:"):
        raise ValueError("Budget notifications must use the existing topic in this account and region")
    subscriptions = aws("sns", "list-subscriptions-by-topic", "--topic-arn", args.topic, region=args.region)
    if not any(s.get("SubscriptionArn", "") not in {"PendingConfirmation", "Deleted", ""}
               for s in subscriptions.get("Subscriptions", [])):
        raise ValueError("A confirmed subscription is required for budget alerts")
    # Merge the Budgets publisher statement while retaining existing topic permissions.
    attrs = aws("sns", "get-topic-attributes", "--topic-arn", args.topic, region=args.region)["Attributes"]
    policy = json.loads(attrs["Policy"])
    statements = policy.get("Statement", [])
    if isinstance(statements, dict): statements = [statements]
    statements = [s for s in statements if s.get("Sid") != "HerfreeBudgetNotifications"]
    statements.append({"Sid": "HerfreeBudgetNotifications", "Effect": "Allow",
                       "Principal": {"Service": "budgets.amazonaws.com"}, "Action": "SNS:Publish",
                       "Resource": args.topic, "Condition": {"StringEquals": {"aws:SourceAccount": account},
                       "ArnLike": {"aws:SourceArn": f"arn:aws:budgets::{account}:*"}}})
    policy["Statement"] = statements
    aws("sns", "set-topic-attributes", "--topic-arn", args.topic, "--attribute-name", "Policy",
        "--attribute-value", json.dumps(policy), region=args.region)
    desired = {"BudgetName": "herfree-monthly-50-usd", "BudgetLimit": {"Amount": "50", "Unit": "USD"},
               "TimeUnit": "MONTHLY", "BudgetType": "COST"}
    response = aws("budgets", "describe-budgets", "--account-id", account, region="us-east-1")
    exists = any(b["BudgetName"] == desired["BudgetName"] for b in response.get("Budgets", []))
    if not exists:
        aws("budgets", "create-budget", "--account-id", account, "--budget", json.dumps(desired), region="us-east-1")
    else:
        aws("budgets", "update-budget", "--account-id", account, "--new-budget", json.dumps(desired), region="us-east-1")
    existing = aws("budgets", "describe-notifications-for-budget", "--account-id", account,
                   "--budget-name", desired["BudgetName"], region="us-east-1").get("Notifications", [])
    for kind, threshold in [("ACTUAL", 80), ("ACTUAL", 100), ("FORECASTED", 100)]:
        notification = {"NotificationType": kind, "ComparisonOperator": "GREATER_THAN", "Threshold": threshold,
                        "ThresholdType": "PERCENTAGE"}
        matched = next((n for n in existing if all(n.get(k) == v for k, v in notification.items())), None)
        if not matched:
            aws("budgets", "create-notification", "--account-id", account, "--budget-name", desired["BudgetName"],
                "--notification", json.dumps(notification), "--subscribers",
                json.dumps([{"SubscriptionType": "SNS", "Address": args.topic}]), region="us-east-1")
        else:
            subscribers = aws("budgets", "describe-subscribers-for-notification", "--account-id", account,
                              "--budget-name", desired["BudgetName"], "--notification", json.dumps(notification), region="us-east-1")["Subscribers"]
            if not any(s.get("Address") == args.topic for s in subscribers):
                aws("budgets", "create-subscriber", "--account-id", account, "--budget-name", desired["BudgetName"],
                    "--notification", json.dumps(notification), "--subscriber",
                    json.dumps({"SubscriptionType": "SNS", "Address": args.topic}), region="us-east-1")
    print("Monthly USD 50 budget configured with notification thresholds; no stop or purchasing actions added.")


def audit(args):
    now = dt.datetime.now(dt.timezone.utc).date()
    report = {"verifiedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "checks": {}, "unavailable": {}}
    checks = {
        "identity": ("sts", "get-caller-identity"),
        "ec2": ("ec2", "describe-instances"),
        "securityGroups": ("ec2", "describe-security-groups"),
        "rds": ("rds", "describe-db-instances"),
        "alarms": ("cloudwatch", "describe-alarms"),
        "accountSecurity": ("iam", "get-account-summary"),
        "assignedVirtualMfa": ("iam", "list-virtual-mfa-devices", "--assignment-status", "Assigned",
            "--query", "VirtualMFADevices[].{SerialNumber:SerialNumber,UserArn:User.Arn,EnableDate:EnableDate}"),
        "alertSubscriptions": ("sns", "list-subscriptions"),
        "costByService30Days": ("ce", "get-cost-and-usage", "--time-period",
            f"Start={now-dt.timedelta(days=30)},End={now}", "--granularity", "DAILY", "--metrics", "UnblendedCost",
            "--group-by", "Type=DIMENSION,Key=SERVICE"),
    }
    start = (dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=30)).isoformat()
    end = dt.datetime.now(dt.timezone.utc).isoformat()
    for metric in ["HostMemoryUsedPercent", "RootDiskUsedPercent", "LocalDatabaseDiskUsedPercent"]:
        checks[metric+"30Days"] = ("cloudwatch", "get-metric-statistics", "--namespace", "Herfree/Operations",
            "--metric-name", metric, "--dimensions", "Name=Environment,Value=production",
            "--start-time", start, "--end-time", end, "--period", "3600", "--statistics", "Average", "Maximum")
    if args.backup_bucket:
        checks["completedFrequentBackups"] = ("s3api", "list-objects-v2", "--bucket", args.backup_bucket,
            "--prefix", "db-backups/production/frequent/", "--query", "Contents[?ends_with(Key, `.metadata.json`)]")
        checks["restoreDrillEvidence"] = ("s3api", "list-objects-v2", "--bucket", args.backup_bucket,
            "--prefix", "operations/production/restore-drill/")
    for name, command in checks.items():
        try: report["checks"][name] = aws(*command, region="us-east-1" if name == "costByService30Days" else args.region)
        except subprocess.CalledProcessError: report["unavailable"][name] = "AWS authorization or connection unavailable"
    for reservation in report["checks"].get("ec2", {}).get("Reservations", []):
        for item in reservation["Instances"]:
            try:
                report["checks"]["terminationProtection-"+item["InstanceId"]] = aws("ec2", "describe-instance-attribute",
                    "--instance-id", item["InstanceId"], "--attribute", "disableApiTermination", region=args.region)
            except subprocess.CalledProcessError:
                report["unavailable"]["terminationProtection-"+item["InstanceId"]] = "AWS authorization or connection unavailable"
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Audit written to {args.output}; {len(report['unavailable'])} checks unavailable")
    if report["unavailable"]: return 1
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region", default="ap-northeast-2")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("audit"); p.add_argument("--output", required=True); p.add_argument("--backup-bucket")
    p = sub.add_parser("budget"); p.add_argument("--topic", required=True)
    p = sub.add_parser("ecr-cleanup"); p.add_argument("--repository", required=True)
    p.add_argument("--protected-manifest", required=True); p.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    return {"audit": audit, "budget": budget, "ecr-cleanup": cleanup}[args.command](args)


if __name__ == "__main__":
    try: sys.exit(main() or 0)
    except (ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(str(error) if not isinstance(error, subprocess.CalledProcessError) else "AWS operation failed; no credentials printed", file=sys.stderr)
        sys.exit(1)
