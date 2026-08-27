#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV="${DEPLOY_ENV:-production}"
APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
if [[ "${DEPLOY_ENV}" == "production" ]]; then
  APP_ENV_FILE="${CONFIG_DIR}/.env.prod"
else
  APP_ENV_FILE="${CONFIG_DIR}/.env.staging"
fi

value_of() {
  local key="$1"
  sed -n "s/^${key}=//p" "${APP_ENV_FILE}" | tail -n 1 | tr -d '\r'
}

AWS_REGION="$(value_of AWS_REGION)"
BACKUP_BUCKET="$(value_of DB_BACKUP_S3_BUCKET)"
PROJECT="herfree-${DEPLOY_ENV}"
MYSQL_CONTAINER="$(docker ps \
  --filter "label=com.docker.compose.project=${PROJECT}" \
  --filter "label=com.docker.compose.service=mysql" \
  --format '{{.ID}}' | head -n 1)"

database_healthy=0
if [[ -n "${MYSQL_CONTAINER}" \
   && "$(docker inspect "${MYSQL_CONTAINER}" --format '{{.State.Health.Status}}' 2>/dev/null || true)" == "healthy" \
   && "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 5 http://127.0.0.1:8080/actuator/health || true)" == "200" ]]; then
  database_healthy=1
fi

disk_used_percent="$(df -P /var/lib/herfree | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
[[ "${disk_used_percent}" =~ ^[0-9]+$ ]] || disk_used_percent=100

latest_backup="$(aws s3api list-objects-v2 \
  --region "${AWS_REGION}" \
  --bucket "${BACKUP_BUCKET}" \
  --prefix "db-backups/${DEPLOY_ENV}/frequent/" \
  --query 'sort_by(Contents[?ends_with(Key, `.sql.gz`)], &LastModified)[-1].LastModified' \
  --output text 2>/dev/null || true)"
backup_age_hours=999
if [[ -n "${latest_backup}" && "${latest_backup}" != "None" ]]; then
  now_epoch="$(date -u +%s)"
  backup_epoch="$(date -u -d "${latest_backup}" +%s)"
  backup_age_hours=$(( (now_epoch - backup_epoch) / 3600 ))
fi

aws cloudwatch put-metric-data --region "${AWS_REGION}" \
  --namespace Herfree/Operations --metric-name LocalDatabaseHealthy \
  --dimensions "Environment=${DEPLOY_ENV}" --value "${database_healthy}" --unit Count
aws cloudwatch put-metric-data --region "${AWS_REGION}" \
  --namespace Herfree/Operations --metric-name LocalDatabaseDiskUsedPercent \
  --dimensions "Environment=${DEPLOY_ENV}" --value "${disk_used_percent}" --unit Percent
aws cloudwatch put-metric-data --region "${AWS_REGION}" \
  --namespace Herfree/Operations --metric-name DatabaseBackupAgeHours \
  --dimensions "Environment=${DEPLOY_ENV}" --value "${backup_age_hours}" --unit Count

if [[ "${database_healthy}" -ne 1 || "${disk_used_percent}" -ge 80 || "${backup_age_hours}" -gt 8 ]]; then
  echo "local DB operations check failed: healthy=${database_healthy} disk=${disk_used_percent}% backupAge=${backup_age_hours}h" >&2
  exit 1
fi

echo "local DB operations healthy: disk=${disk_used_percent}% backupAge=${backup_age_hours}h"
