#!/usr/bin/env bash
set -euo pipefail

umask 077

if [[ "${CONFIRM_RDS_TO_LOCAL_MIGRATION:-}" != "YES" ]]; then
  echo "refusing migration: set CONFIRM_RDS_TO_LOCAL_MIGRATION=YES" >&2
  exit 2
fi

DEPLOY_ENV="${1:-production}"
if [[ "${DEPLOY_ENV}" != "production" && "${DEPLOY_ENV}" != "staging" ]]; then
  echo "usage: migrate-rds-to-local.sh <production|staging>" >&2
  exit 2
fi

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
if [[ "${DEPLOY_ENV}" == "production" ]]; then
  APP_ENV_FILE="${CONFIG_DIR}/.env.prod"
  MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.production"
  MYSQL_DATA_DIR="${HERFREE_MYSQL_DATA_DIR:-/var/lib/herfree/mysql-production}"
  READY_MARKER="/var/lib/herfree/.production-db-ready"
else
  APP_ENV_FILE="${CONFIG_DIR}/.env.staging"
  MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.staging"
  MYSQL_DATA_DIR="${HERFREE_MYSQL_DATA_DIR:-/var/lib/herfree/mysql-staging}"
  READY_MARKER="/var/lib/herfree/.staging-db-ready"
fi

BASE_COMPOSE="${APP_DIR}/docker-compose.release.yml"
LOCAL_COMPOSE="${APP_DIR}/docker-compose.release-local-db.yml"
for required_file in "${APP_ENV_FILE}" "${MYSQL_ENV_FILE}" "${BASE_COMPOSE}" "${LOCAL_COMPOSE}" \
  "${APP_DIR}/infra/certs/rds-global-bundle.pem"; do
  [[ -f "${required_file}" ]] || { echo "migration prerequisite is missing: ${required_file}" >&2; exit 1; }
done

value_of() {
  local file="$1"
  local key="$2"
  sed -n "s/^${key}=//p" "${file}" | tail -n 1 | tr -d '\r'
}

if [[ "$(value_of "${APP_ENV_FILE}" DB_RUNTIME)" != "rds" ]]; then
  echo "source environment must still use RDS" >&2
  exit 1
fi
if [[ -e "${READY_MARKER}" ]]; then
  echo "a completed local migration marker already exists" >&2
  exit 1
fi

install -d -m 0750 -o 999 -g 999 "${MYSQL_DATA_DIR}"
mount_target="$(findmnt -T "${MYSQL_DATA_DIR}" -n -o TARGET 2>/dev/null || true)"
if [[ "${DEPLOY_ENV}" == "production" && "${mount_target}" != "/var/lib/herfree" ]]; then
  echo "production MySQL must be placed on the dedicated /var/lib/herfree volume" >&2
  exit 1
fi

if find "${MYSQL_DATA_DIR}" -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then
  echo "target MySQL data directory is not empty" >&2
  exit 1
fi

SOURCE_URL="$(value_of "${APP_ENV_FILE}" SPRING_DATASOURCE_URL)"
SOURCE_USER="$(value_of "${APP_ENV_FILE}" SPRING_DATASOURCE_USERNAME)"
SOURCE_PASSWORD="$(value_of "${APP_ENV_FILE}" SPRING_DATASOURCE_PASSWORD)"
MYSQL_DATABASE="$(value_of "${MYSQL_ENV_FILE}" MYSQL_DATABASE)"
MYSQL_ROOT_PASSWORD="$(value_of "${MYSQL_ENV_FILE}" MYSQL_ROOT_PASSWORD)"
AWS_REGION="$(value_of "${APP_ENV_FILE}" AWS_REGION)"
CLOUDWATCH_LOG_GROUP="$(value_of "${APP_ENV_FILE}" CLOUDWATCH_LOG_GROUP)"

SOURCE_ADDRESS="${SOURCE_URL#jdbc:mysql://}"
SOURCE_HOST="${SOURCE_ADDRESS%%:*}"
if [[ -z "${SOURCE_HOST}" || "${SOURCE_HOST}" == "${SOURCE_ADDRESS}" \
   || ! "${SOURCE_HOST}" =~ \.rds\.amazonaws\.com$ ]]; then
  echo "source JDBC URL is not an RDS endpoint" >&2
  exit 1
fi
if [[ ! "${MYSQL_DATABASE}" =~ ^[A-Za-z0-9_]+$ || ! "${SOURCE_USER}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  echo "database or user name contains unsupported characters" >&2
  exit 1
fi

PROJECT="herfree-${DEPLOY_ENV}"
API_CONTAINER="$(docker ps \
  --filter "label=com.docker.compose.project=${PROJECT}" \
  --filter "label=com.docker.compose.service=api" \
  --format '{{.ID}}' | head -n 1)"
[[ -n "${API_CONTAINER}" ]] || { echo "running API container was not found" >&2; exit 1; }

MIGRATION_DIR="/var/lib/herfree/migration"
install -d -m 0700 "${MIGRATION_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${MIGRATION_DIR}/rds-to-local-${DEPLOY_ENV}-${STAMP}.sql.gz"
SOURCE_CLIENT="herfree-${DEPLOY_ENV}-rds-migration-client"
SOURCE_CNF="$(mktemp "${CONFIG_DIR}/.rds-migration.XXXXXX.cnf")"
chmod 0600 "${SOURCE_CNF}"
cat > "${SOURCE_CNF}" <<EOF
[client]
user=${SOURCE_USER}
password=${SOURCE_PASSWORD}
ssl-mode=VERIFY_IDENTITY
ssl-ca=/certs/rds-global-bundle.pem
EOF

api_stopped="false"
migration_complete="false"
cleanup() {
  docker rm -f "${SOURCE_CLIENT}" >/dev/null 2>&1 || true
  rm -f "${SOURCE_CNF}"
  if [[ "${migration_complete}" != "true" ]]; then
    rm -f "${READY_MARKER}"
    if [[ "${api_stopped}" == "true" ]]; then
      docker start "${API_CONTAINER}" >/dev/null 2>&1 || true
    fi
  fi
}
trap cleanup EXIT

docker pull mysql:8.4.10 >/dev/null
docker rm -f "${SOURCE_CLIENT}" >/dev/null 2>&1 || true
docker run -d --name "${SOURCE_CLIENT}" --network host \
  --memory 256m --pids-limit 128 \
  -v "${SOURCE_CNF}:/run/secrets/source.cnf:ro" \
  -v "${APP_DIR}/infra/certs/rds-global-bundle.pem:/certs/rds-global-bundle.pem:ro" \
  mysql:8.4.10 sleep infinity >/dev/null

docker exec "${SOURCE_CLIENT}" mysql \
  --defaults-extra-file=/run/secrets/source.cnf \
  --host="${SOURCE_HOST}" --batch --skip-column-names \
  --execute="SELECT 1" >/dev/null

API_IMAGE="mysql:8.4.10" APP_ENV_FILE="${APP_ENV_FILE}" \
MYSQL_ENV_FILE="${MYSQL_ENV_FILE}" MYSQL_DATA_DIR="${MYSQL_DATA_DIR}" \
AWS_REGION="${AWS_REGION}" CLOUDWATCH_LOG_GROUP="${CLOUDWATCH_LOG_GROUP}" \
DEPLOY_ENV="${DEPLOY_ENV}" \
  docker compose --env-file "${APP_ENV_FILE}" -p "${PROJECT}" \
    -f "${BASE_COMPOSE}" -f "${LOCAL_COMPOSE}" \
    up -d mysql

MYSQL_CONTAINER="$(docker ps \
  --filter "label=com.docker.compose.project=${PROJECT}" \
  --filter "label=com.docker.compose.service=mysql" \
  --format '{{.ID}}' | head -n 1)"
[[ -n "${MYSQL_CONTAINER}" ]] || { echo "target MySQL container did not start" >&2; exit 1; }

target_ready="false"
for _ in {1..90}; do
  if docker exec -e "MYSQL_PWD=${MYSQL_ROOT_PASSWORD}" "${MYSQL_CONTAINER}" \
      mysqladmin ping --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --silent; then
    target_ready="true"
    break
  fi
  sleep 2
done
[[ "${target_ready}" == "true" ]] || { echo "target MySQL did not become ready" >&2; exit 1; }

echo "stopping API writes for final consistent copy"
docker stop --time 30 "${API_CONTAINER}" >/dev/null
api_stopped="true"

docker exec "${SOURCE_CLIENT}" mysqldump \
  --defaults-extra-file=/run/secrets/source.cnf \
  --host="${SOURCE_HOST}" \
  --single-transaction --quick --skip-lock-tables \
  --no-tablespaces --set-gtid-purged=OFF --triggers \
  "${MYSQL_DATABASE}" | gzip -9 > "${DUMP_FILE}"
test -s "${DUMP_FILE}"
gzip -t "${DUMP_FILE}"
chmod 0600 "${DUMP_FILE}"

gzip -dc "${DUMP_FILE}" | docker exec -i -e "MYSQL_PWD=${MYSQL_ROOT_PASSWORD}" "${MYSQL_CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root "${MYSQL_DATABASE}"

tables="$(docker exec "${SOURCE_CLIENT}" mysql \
  --defaults-extra-file=/run/secrets/source.cnf \
  --host="${SOURCE_HOST}" --batch --skip-column-names \
  --execute="SELECT table_name FROM information_schema.tables WHERE table_schema='${MYSQL_DATABASE}' AND table_type='BASE TABLE' ORDER BY table_name;")"
[[ -n "${tables}" ]] || { echo "source database has no tables" >&2; exit 1; }

verified_tables=0
while IFS= read -r table; do
  [[ "${table}" =~ ^[A-Za-z0-9_]+$ ]] || { echo "unsupported table name" >&2; exit 1; }
  source_count="$(docker exec "${SOURCE_CLIENT}" mysql \
    --defaults-extra-file=/run/secrets/source.cnf \
    --host="${SOURCE_HOST}" --database="${MYSQL_DATABASE}" \
    --batch --skip-column-names --execute="SELECT COUNT(*) FROM \`${table}\`;")"
  target_count="$(docker exec -e "MYSQL_PWD=${MYSQL_ROOT_PASSWORD}" "${MYSQL_CONTAINER}" \
    mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --database="${MYSQL_DATABASE}" \
    --batch --skip-column-names --execute="SELECT COUNT(*) FROM \`${table}\`;")"
  if [[ "${source_count}" != "${target_count}" ]]; then
    echo "row-count verification failed for table ${table}" >&2
    exit 1
  fi
  verified_tables=$((verified_tables + 1))
done <<< "${tables}"

flyway_failures="$(docker exec -e "MYSQL_PWD=${MYSQL_ROOT_PASSWORD}" "${MYSQL_CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --database="${MYSQL_DATABASE}" \
  --batch --skip-column-names \
  --execute="SELECT COUNT(*) FROM flyway_schema_history WHERE success=0;")"
[[ "${flyway_failures}" == "0" ]] || { echo "failed Flyway history exists in target" >&2; exit 1; }

printf 'completed_at=%s\nsource=rds\nverified_tables=%s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${verified_tables}" > "${READY_MARKER}"
chmod 0600 "${READY_MARKER}"
migration_complete="true"

echo "migration copy verified: tables=${verified_tables}"
echo "API remains stopped until dbMode=local is rendered and the release health check passes"
