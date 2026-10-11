#!/usr/bin/env python3
"""Render account-specific reviewable IAM additions; never grants broad production secrets to staging."""
import argparse
import json
import re
from pathlib import Path


def statement(actions, resources, condition=None):
    value = {"Effect": "Allow", "Action": actions, "Resource": resources}
    if condition:
        value["Condition"] = condition
    return value


def policies(account, region, bucket, repository, staging_id, staging_role, restore_role):
    ec2 = f"arn:aws:ec2:{region}:{account}"
    backup = f"arn:aws:s3:::{bucket}"
    recovery = f"arn:aws:secretsmanager:{region}:{account}:secret:herfree/production/health-data-recovery-*"
    operations = f"{backup}/operations/production/restore-drill/*"
    namespace = {"StringEquals": {"cloudwatch:namespace": "Herfree/Operations"}}
    restore = [
        statement(["ecr:GetAuthorizationToken", "ec2:DescribeVolumes"], "*"),
        statement(["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"],
                  f"arn:aws:ecr:{region}:{account}:repository/{repository}"),
        statement("s3:ListBucket", backup, {"StringLike": {"s3:prefix": ["db-backups/production/frequent/*"]}}),
        statement("s3:GetObject", f"{backup}/db-backups/production/frequent/*"),
        statement(["s3:GetObject", "s3:PutObject"], operations),
        statement("secretsmanager:GetSecretValue", recovery),
    ]
    # Attach this narrowly scoped addition to the existing production instance role.
    production = [statement("secretsmanager:GetSecretValue", recovery),
                  statement("s3:GetObject", operations), statement("cloudwatch:PutMetricData", "*", namespace)]
    target = f"{ec2}:instance/{staging_id}"
    runner = [
        statement("iam:GetInstanceProfile", f"arn:aws:iam::{account}:instance-profile/{restore_role}"),
        statement(["ec2:DescribeInstances", "ec2:DescribeInstanceStatus", "ec2:DescribeVolumes",
                   "ec2:DescribeIamInstanceProfileAssociations", "ssm:DescribeInstanceInformation",
                   "ssm:GetCommandInvocation", "ssm:CancelCommand"], "*"),
        statement(["ec2:StartInstances", "ec2:StopInstances", "ec2:ReplaceIamInstanceProfileAssociation"], target),
        statement("iam:PassRole", [f"arn:aws:iam::{account}:role/{staging_role}",
                                  f"arn:aws:iam::{account}:role/{restore_role}"],
                  {"StringEquals": {"iam:PassedToService": "ec2.amazonaws.com"}}),
        statement("ssm:SendCommand", [target, f"arn:aws:ssm:{region}::document/AWS-RunShellScript"]),
        statement("ec2:CreateVolume", f"{ec2}:volume/*", {
            "StringEquals": {"aws:RequestTag/Environment": "staging", "ec2:VolumeType": "gp3"},
            "Bool": {"ec2:Encrypted": "true"}, "NumericLessThanEquals": {"ec2:VolumeSize": "10"},
            "Null": {"aws:RequestTag/HerfreeRestoreDrill": "false"}}),
        statement("ec2:CreateTags", f"{ec2}:volume/*", {"StringEquals": {"ec2:CreateAction": "CreateVolume"}}),
        statement(["ec2:AttachVolume", "ec2:DetachVolume"], target),
        statement(["ec2:AttachVolume", "ec2:DetachVolume", "ec2:DeleteVolume"], f"{ec2}:volume/*", {
            "StringEquals": {"ec2:ResourceTag/Environment": "staging"},
            "Null": {"ec2:ResourceTag/HerfreeRestoreDrill": "false"}}),
        statement("s3:PutObject", f"{backup}/operations/production/restore-drill/last-attempt.json"),
    ]
    return {"restore-instance": restore, "production-operations-addition": production, "restore-workflow": runner}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for arg in ["account", "region", "bucket", "repository", "staging-id", "staging-role", "restore-role", "output-dir"]:
        p.add_argument("--" + arg, required=True)
    args = p.parse_args()
    if not re.fullmatch(r"\d{12}", args.account) or not re.fullmatch(r"i-[a-f0-9]{8,17}", args.staging_id):
        p.error("Invalid AWS account or staging instance ID")
    for value in [args.bucket, args.repository, args.staging_role, args.restore_role, args.region]:
        if not re.fullmatch(r"[a-zA-Z0-9_./+=,@-]+", value) or "*" in value:
            p.error("Explicit resource names are required")
    folder = Path(args.output_dir)
    folder.mkdir(parents=True, exist_ok=True)
    for name, statements in policies(args.account, args.region, args.bucket, args.repository,
                                    args.staging_id, args.staging_role, args.restore_role).items():
        (folder / (name + ".json")).write_text(json.dumps({"Version": "2012-10-17", "Statement": statements}, indent=2), encoding="utf-8")
    (folder / "ec2-trust.json").write_text(json.dumps({"Version": "2012-10-17", "Statement": [
        {"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]}), encoding="utf-8")
    print("Review IAM policy files before applying. Attach AmazonSSMManagedInstanceCore to the temporary restore role.")


if __name__ == "__main__":
    main()
