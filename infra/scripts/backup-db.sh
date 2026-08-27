#!/usr/bin/env bash
set -euo pipefail

umask 077

BACKUP_CLASS="${1:-manual}"
case "${BACKUP_CLASS}" in
  frequent|daily|predeploy|manual) ;;
  *)
    echo "usage: backup-db.sh [frequent|daily|predeploy|manual]" >&2
    exit 2
    ;;
esac

DEPLOY_ENV="${DEPLOY_ENV:-production}"
APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
if [[ "${DEPLOY_ENV}" == "production" ]]; then
  APP_ENV_FILE="${CONFIG_DIR}/.env.prod"
  MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.production"
else
  APP_ENV_FILE="${CONFIG_DIR}/.env.staging"
  MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.staging"
fi

value_of() {
  local file="$1"
  local key="$2"
  sed -n "s/^${key}=//p" "${file}" | tail -n 1 | tr -d '\r'
}

for required_file in "${APP_ENV_FILE}" "${MYSQL_ENV_FILE}"; do
  if [[ ! -f "${required_file}" ]]; then
    echo "backup configuration is missing" >&2
    exit 1
  fi
  mode="$(stat -c '%a' "${required_file}")"
  mode="${mode: -3}"
  if (( (8#${mode} & 8#077) != 0 )); then
    echo "backup configuration permissions must be 600 or stricter" >&2
    exit 1
  fi
done

if [[ "$(value_of "${APP_ENV_FILE}" DB_RUNTIME)" != "local" ]]; then
  echo "local database backup refused because DB_RUNTIME is not local" >&2
  exit 1
fi

AWS_REGION="$(value_of "${APP_ENV_FILE}" AWS_REGION)"
BACKUP_BUCKET="$(value_of "${APP_ENV_FILE}" DB_BACKUP_S3_BUCKET)"
MYSQL_DATABASE="$(value_of "${MYSQL_ENV_FILE}" MYSQL_DATABASE)"
MYSQL_USER="$(value_of "${MYSQL_ENV_FILE}" MYSQL_USER)"
MYSQL_PASSWORD="$(value_of "${MYSQL_ENV_FILE}" MYSQL_PASSWORD)"
if [[ -z "${AWS_REGION}" || -z "${BACKUP_BUCKET}" || -z "${MYSQL_DATABASE}" \
   || -z "${MYSQL_USER}" || -z "${MYSQL_PASSWORD}" ]]; then
  echo "backup configuration contains an empty required value" >&2
  exit 1
fi
if [[ ! "${MYSQL_DATABASE}" =~ ^[A-Za-z0-9_]+$ || ! "${MYSQL_USER}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  echo "database or user name contains unsupported characters" >&2
  exit 1
fi

PROJECT="herfree-${DEPLOY_ENV}"
MYSQL_CONTAINER="$(docker ps \
  --filter "label=com.docker.compose.project=${PROJECT}" \
  --filter "label=com.docker.compose.service=mysql" \
  --format '{{.ID}}' | head -n 1)"
if [[ -z "${MYSQL_CONTAINER}" ]]; then
  echo "running local MySQL container was not found" >&2
  exit 1
fi

BACKUP_DIR="${HERFREE_BACKUP_DIR:-/var/lib/herfree/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NAME="herfree-${DEPLOY_ENV}-${STAMP}.sql.gz"
TEMP_FILE="${BACKUP_DIR}/.${NAME}.partial"
BACKUP_FILE="${BACKUP_DIR}/${NAME}"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
S3_PREFIX="db-backups/${DEPLOY_ENV}/${BACKUP_CLASS}"
S3_URI="s3://${BACKUP_BUCKET}/${S3_PREFIX}/${NAME}"

install -d -m 0700 "${BACKUP_DIR}"

metric_failure() {
  if command -v aws >/dev/null 2>&1; then
    aws cloudwatch put-metric-data \
      --region "${AWS_REGION}" \
      --namespace Herfree/Operations \
      --metric-name DatabaseBackupSuccess \
      --dimensions "Environment=${DEPLOY_ENV},Class=${BACKUP_CLASS}" \
      --value 0 --unit Count >/dev/null 2>&1 || true
  fi
}
trap 'rm -f "${TEMP_FILE}"; metric_failure' EXIT

docker exec -e "MYSQL_PWD=${MYSQL_PASSWORD}" "${MYSQL_CONTAINER}" \
  mysqldump \
    --host=127.0.0.1 \
    --ssl-mode=REQUIRED \
    --user="${MYSQL_USER}" \
    --single-transaction \
    --quick \
    --skip-lock-tables \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --triggers \
    "${MYSQL_DATABASE}" \
  | gzip -9 > "${TEMP_FILE}"

test -s "${TEMP_FILE}"
gzip -t "${TEMP_FILE}"
mv -f "${TEMP_FILE}" "${BACKUP_FILE}"
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

aws s3 cp "${BACKUP_FILE}" "${S3_URI}" \
  --region "${AWS_REGION}" --only-show-errors --sse AES256
aws s3 cp "${CHECKSUM_FILE}" "${S3_URI}.sha256" \
  --region "${AWS_REGION}" --only-show-errors --sse AES256

remote_size="$(aws s3api head-object \
  --region "${AWS_REGION}" \
  --bucket "${BACKUP_BUCKET}" \
  --key "${S3_PREFIX}/${NAME}" \
  --query ContentLength --output text)"
if [[ ! "${remote_size}" =~ ^[0-9]+$ || "${remote_size}" -le 0 ]]; then
  echo "uploaded backup could not be verified" >&2
  exit 1
fi

aws cloudwatch put-metric-data \
  --region "${AWS_REGION}" \
  --namespace Herfree/Operations \
  --metric-name DatabaseBackupSuccess \
  --dimensions "Environment=${DEPLOY_ENV},Class=${BACKUP_CLASS}" \
  --value 1 --unit Count >/dev/null

find "${BACKUP_DIR}" -maxdepth 1 -type f \
  \( -name 'herfree-*.sql.gz' -o -name 'herfree-*.sql.gz.sha256' \) \
  -mtime +2 -delete

trap - EXIT
echo "verified encrypted S3 backup created: ${BACKUP_CLASS}/${NAME}"
