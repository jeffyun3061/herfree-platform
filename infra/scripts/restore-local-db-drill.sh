#!/usr/bin/env bash
set -euo pipefail

umask 077

if [[ "${CONFIRM_RESTORE_DRILL:-}" != "YES" ]]; then
  echo "refusing restore drill: set CONFIRM_RESTORE_DRILL=YES" >&2
  exit 2
fi

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

AWS_REGION="$(value_of "${APP_ENV_FILE}" AWS_REGION)"
BACKUP_BUCKET="$(value_of "${APP_ENV_FILE}" DB_BACKUP_S3_BUCKET)"
MYSQL_DATABASE="$(value_of "${MYSQL_ENV_FILE}" MYSQL_DATABASE)"
for value in "${AWS_REGION}" "${BACKUP_BUCKET}" "${MYSQL_DATABASE}"; do
  [[ -n "${value}" ]] || { echo "restore drill configuration is incomplete" >&2; exit 1; }
done

BACKUP_S3_URI="${BACKUP_S3_URI:-}"
if [[ -z "${BACKUP_S3_URI}" ]]; then
  latest_key="$(aws s3api list-objects-v2 \
    --region "${AWS_REGION}" \
    --bucket "${BACKUP_BUCKET}" \
    --prefix "db-backups/${DEPLOY_ENV}/daily/" \
    --query 'sort_by(Contents[?ends_with(Key, `.sql.gz`)], &LastModified)[-1].Key' \
    --output text)"
  if [[ -z "${latest_key}" || "${latest_key}" == "None" ]]; then
    echo "no daily backup is available for restore drill" >&2
    exit 1
  fi
  BACKUP_S3_URI="s3://${BACKUP_BUCKET}/${latest_key}"
fi
if [[ "${BACKUP_S3_URI}" != "s3://${BACKUP_BUCKET}/db-backups/${DEPLOY_ENV}/"*.sql.gz ]]; then
  echo "restore drill backup URI is outside the approved prefix" >&2
  exit 1
fi

WORK_DIR="$(mktemp -d /tmp/herfree-restore-drill.XXXXXX)"
CONTAINER="herfree-restore-drill-$(date -u +%s)"
ROOT_PASSWORD="$(openssl rand -hex 32)"
BACKUP_FILE="${WORK_DIR}/backup.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

cleanup() {
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

aws s3 cp "${BACKUP_S3_URI}" "${BACKUP_FILE}" \
  --region "${AWS_REGION}" --only-show-errors
aws s3 cp "${BACKUP_S3_URI}.sha256" "${CHECKSUM_FILE}" \
  --region "${AWS_REGION}" --only-show-errors
sed -i "s#  .*#  ${BACKUP_FILE}#" "${CHECKSUM_FILE}"
sha256sum -c "${CHECKSUM_FILE}" >/dev/null
gzip -t "${BACKUP_FILE}"

docker run -d --name "${CONTAINER}" --network none \
  --memory 512m --pids-limit 256 \
  -e "MYSQL_ROOT_PASSWORD=${ROOT_PASSWORD}" \
  -e "MYSQL_DATABASE=${MYSQL_DATABASE}" \
  mysql:8.4.10 >/dev/null

ready="false"
for _ in {1..90}; do
  if docker exec -e "MYSQL_PWD=${ROOT_PASSWORD}" "${CONTAINER}" \
      mysqladmin ping --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --silent; then
    ready="true"
    break
  fi
  sleep 2
done
[[ "${ready}" == "true" ]] || { echo "restore drill MySQL did not become ready" >&2; exit 1; }

gzip -dc "${BACKUP_FILE}" | docker exec -i -e "MYSQL_PWD=${ROOT_PASSWORD}" "${CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root "${MYSQL_DATABASE}"

table_count="$(docker exec -e "MYSQL_PWD=${ROOT_PASSWORD}" "${CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root \
    --batch --skip-column-names \
    --execute="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${MYSQL_DATABASE}' AND table_type='BASE TABLE';")"
flyway_count="$(docker exec -e "MYSQL_PWD=${ROOT_PASSWORD}" "${CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root "${MYSQL_DATABASE}" \
    --batch --skip-column-names \
    --execute="SELECT COUNT(*) FROM flyway_schema_history WHERE success=1;")"
if [[ ! "${table_count}" =~ ^[0-9]+$ || "${table_count}" -lt 1 \
   || ! "${flyway_count}" =~ ^[0-9]+$ || "${flyway_count}" -lt 1 ]]; then
  echo "restore drill schema verification failed" >&2
  exit 1
fi

aws cloudwatch put-metric-data \
  --region "${AWS_REGION}" \
  --namespace Herfree/Operations \
  --metric-name DatabaseRestoreDrillSuccess \
  --dimensions "Environment=${DEPLOY_ENV}" \
  --value 1 --unit Count >/dev/null

echo "restore drill passed: tables=${table_count}, flyway_migrations=${flyway_count}"
