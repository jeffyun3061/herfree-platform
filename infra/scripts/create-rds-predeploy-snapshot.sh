#!/usr/bin/env bash
set -euo pipefail

: "${RDS_INSTANCE_ID:?RDS_INSTANCE_ID is required}"
: "${RELEASE_ID:?RELEASE_ID is required}"

snapshot_id="herfree-${RDS_INSTANCE_ID}-${RELEASE_ID}"
aws rds create-db-snapshot \
  --db-instance-identifier "${RDS_INSTANCE_ID}" \
  --db-snapshot-identifier "${snapshot_id}"
aws rds wait db-snapshot-available --db-snapshot-identifier "${snapshot_id}"
snapshot_json="$(aws rds describe-db-snapshots \
  --db-snapshot-identifier "${snapshot_id}" \
  --query 'DBSnapshots[0].{id:DBSnapshotIdentifier,status:Status,encrypted:Encrypted,kms:KmsKeyId,created:SnapshotCreateTime}' \
  --output json)"
jq -e '.status == "available" and .encrypted == true and (.kms | length > 0)' <<<"${snapshot_json}" >/dev/null
printf '%s\n' "${snapshot_json}"
