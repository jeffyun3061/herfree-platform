#!/usr/bin/env bash
set -euo pipefail

# Production RDS restore drill. This script intentionally requires an explicit
# approval flag and never connects the restored instance to the production API SG.
# Run from an isolated operator host with AWS credentials and the RDS CA bundle.

: "${AWS_REGION:?AWS_REGION is required}"
: "${RDS_SNAPSHOT_ID:?RDS_SNAPSHOT_ID is required}"
: "${RESTORE_DB_INSTANCE_ID:?RESTORE_DB_INSTANCE_ID is required}"
: "${RESTORE_DB_SUBNET_GROUP:?RESTORE_DB_SUBNET_GROUP is required}"
: "${RESTORE_DB_SECURITY_GROUP_ID:?RESTORE_DB_SECURITY_GROUP_ID is required}"
if [[ "${CONFIRM_RESTORE_DRILL:-}" != "YES" ]]; then
  echo "Refusing restore: set CONFIRM_RESTORE_DRILL=YES after the change ticket is approved." >&2
  exit 2
fi

if [[ ! "${RESTORE_DB_INSTANCE_ID}" =~ ^[a-z][a-z0-9-]{0,62}$ ]]; then
  echo "RESTORE_DB_INSTANCE_ID must be a valid temporary RDS identifier" >&2
  exit 2
fi

if [[ "${RESTORE_DB_SECURITY_GROUP_ID}" != sg-* ]]; then
  echo "RESTORE_DB_SECURITY_GROUP_ID must be an EC2 security-group ID" >&2
  exit 2
fi

AWS_ARGS=(--region "${AWS_REGION}")
if [[ -n "${AWS_PROFILE:-}" ]]; then
  AWS_ARGS+=(--profile "${AWS_PROFILE}")
fi

created="false"
started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
started_epoch="$(date +%s)"
evidence_file="${DRILL_EVIDENCE_FILE:-}"

cleanup() {
  local exit_code=$?
  if [[ "${created}" == "true" ]]; then
    echo "Cleaning up restored RDS instance: ${RESTORE_DB_INSTANCE_ID}" >&2
    aws rds delete-db-instance "${AWS_ARGS[@]}" \
      --db-instance-identifier "${RESTORE_DB_INSTANCE_ID}" \
      --skip-final-snapshot --delete-automated-backups >/dev/null || true
    aws rds wait db-instance-deleted "${AWS_ARGS[@]}" \
      --db-instance-identifier "${RESTORE_DB_INSTANCE_ID}" || true
  fi
  exit "${exit_code}"
}
trap cleanup EXIT

echo "== RDS restore drill =="
echo "snapshot=${RDS_SNAPSHOT_ID} restore=${RESTORE_DB_INSTANCE_ID} started=${started_at}"

snapshot_json="$(aws rds describe-db-snapshots "${AWS_ARGS[@]}" \
  --db-snapshot-identifier "${RDS_SNAPSHOT_ID}" \
  --query 'DBSnapshots[0].{status:Status,encrypted:Encrypted,kms:KmsKeyId,engine:Engine}' \
  --output json)"
echo "${snapshot_json}" | jq -e \
  '.status == "available" and .encrypted == true and (.kms | type == "string" and length > 0) and .engine == "mysql"' >/dev/null

if aws rds describe-db-instances "${AWS_ARGS[@]}" \
  --db-instance-identifier "${RESTORE_DB_INSTANCE_ID}" >/dev/null 2>&1; then
  echo "temporary restore instance already exists; refusing to reuse it" >&2
  exit 1
fi

restore_args=(
  rds restore-db-instance-from-db-snapshot "${AWS_ARGS[@]}"
  --db-instance-identifier "${RESTORE_DB_INSTANCE_ID}"
  --db-snapshot-identifier "${RDS_SNAPSHOT_ID}"
  --db-instance-class "${RESTORE_DB_INSTANCE_CLASS:-db.t4g.micro}"
  --db-subnet-group-name "${RESTORE_DB_SUBNET_GROUP}"
  --vpc-security-group-ids "${RESTORE_DB_SECURITY_GROUP_ID}"
  --no-publicly-accessible
  --no-auto-minor-version-upgrade
  --copy-tags-to-snapshot
)
aws "${restore_args[@]}" >/dev/null
created="true"
aws rds wait db-instance-available "${AWS_ARGS[@]}" \
  --db-instance-identifier "${RESTORE_DB_INSTANCE_ID}"

endpoint="$(aws rds describe-db-instances "${AWS_ARGS[@]}" \
  --db-instance-identifier "${RESTORE_DB_INSTANCE_ID}" \
  --query 'DBInstances[0].Endpoint.Address' --output text)"
if [[ -z "${endpoint}" || "${endpoint}" == "None" ]]; then
  echo "restored RDS endpoint was not returned" >&2
  exit 1
fi

echo "[OK] encrypted snapshot restored into private RDS endpoint (endpoint omitted from evidence)"

# Optional read-only TLS smoke. It is enabled only when all values are supplied;
# password is written to a 0600 temporary mysql option file and never printed.
if [[ -n "${MYSQL_DATABASE:-}" && -n "${MYSQL_USERNAME:-}" && -n "${RESTORE_DB_PASSWORD:-}" && -n "${RDS_CA_BUNDLE:-}" ]]; then
  command -v mysql >/dev/null || { echo "mysql client is required for TLS smoke" >&2; exit 1; }
  [[ -f "${RDS_CA_BUNDLE}" ]] || { echo "RDS_CA_BUNDLE not found" >&2; exit 1; }
  mysql_defaults="$(mktemp)"
  chmod 600 "${mysql_defaults}"
  trap 'rm -f "${mysql_defaults}"' RETURN
  cat >"${mysql_defaults}" <<EOF
[client]
user=${MYSQL_USERNAME}
password=${RESTORE_DB_PASSWORD}
ssl-mode=VERIFY_IDENTITY
ssl-ca=${RDS_CA_BUNDLE}
EOF
  mysql --defaults-extra-file="${mysql_defaults}" \
    --host "${endpoint}" --port "${MYSQL_PORT:-3306}" \
    --database "${MYSQL_DATABASE}" --batch --skip-column-names \
    --execute='SELECT 1; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM journal_records;' >/dev/null
  rm -f "${mysql_defaults}"
  trap - RETURN
  echo "[OK] read-only MySQL TLS smoke passed"
else
  echo "[WARN] MySQL TLS smoke skipped; provide MYSQL_DATABASE, MYSQL_USERNAME, RESTORE_DB_PASSWORD, RDS_CA_BUNDLE" >&2
fi

finished_epoch="$(date +%s)"
restore_rto_seconds=$((finished_epoch - started_epoch))
echo "restore_rto_seconds=${restore_rto_seconds}"
if [[ -n "${evidence_file}" ]]; then
  umask 077
  mkdir -p "$(dirname -- "${evidence_file}")"
  jq -n \
    --arg snapshot "${RDS_SNAPSHOT_ID}" \
    --arg restore "${RESTORE_DB_INSTANCE_ID}" \
    --arg started "${started_at}" \
    --arg finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --argjson rto "${restore_rto_seconds}" \
    '{snapshotId:$snapshot,temporaryInstanceId:$restore,startedAt:$started,finishedAt:$finished,rtoSeconds:$rto,temporaryInstanceDeleted:true}' \
    >"${evidence_file}"
  chmod 600 "${evidence_file}"
  echo "evidence_file=${evidence_file}"
fi
echo "[OK] drill checks complete; cleanup will delete the temporary instance"
