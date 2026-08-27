#!/usr/bin/env bash
set -euo pipefail
umask 077

[[ "${CONFIRM_RDS_LOCAL_PREFLIGHT:-}" == "YES" ]] || {
  echo "refusing preflight: set CONFIRM_RDS_LOCAL_PREFLIGHT=YES" >&2
  exit 2
}
DEPLOY_ENV="${1:-production}"
[[ "${DEPLOY_ENV}" == "production" || "${DEPLOY_ENV}" == "staging" ]] || exit 2
APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
APP_ENV_FILE="${CONFIG_DIR}/.env.${DEPLOY_ENV}"
[[ "${DEPLOY_ENV}" == "production" ]] && APP_ENV_FILE="${CONFIG_DIR}/.env.prod"
MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.${DEPLOY_ENV}"
CERT_FILE="${APP_DIR}/infra/certs/rds-global-bundle.pem"
for file in "${APP_ENV_FILE}" "${MYSQL_ENV_FILE}" "${CERT_FILE}"; do
  [[ -f "${file}" ]] || { echo "preflight prerequisite is missing: ${file}" >&2; exit 1; }
done
value_of() { sed -n "s/^${2}=//p" "$1" | tail -n 1 | tr -d '\r'; }
[[ "$(value_of "${APP_ENV_FILE}" DB_RUNTIME)" == "rds" ]] || {
  echo "preflight source must still be RDS" >&2
  exit 1
}

SOURCE_URL="$(value_of "${APP_ENV_FILE}" SPRING_DATASOURCE_URL)"
SOURCE_USER="$(value_of "${APP_ENV_FILE}" SPRING_DATASOURCE_USERNAME)"
SOURCE_PASSWORD="$(value_of "${APP_ENV_FILE}" SPRING_DATASOURCE_PASSWORD)"
MYSQL_DATABASE="$(value_of "${MYSQL_ENV_FILE}" MYSQL_DATABASE)"
AWS_REGION="$(value_of "${APP_ENV_FILE}" AWS_REGION)"
SOURCE_HOST="${SOURCE_URL#jdbc:mysql://}"
SOURCE_HOST="${SOURCE_HOST%%:*}"
[[ "${SOURCE_HOST}" =~ \.rds\.amazonaws\.com$ ]] || { echo "source is not RDS" >&2; exit 1; }
[[ "${MYSQL_DATABASE}" =~ ^[A-Za-z0-9_]+$ ]] || { echo "invalid database name" >&2; exit 1; }

WORK_DIR="$(mktemp -d /tmp/herfree-rds-preflight.XXXXXX)"
SOURCE_CNF="${WORK_DIR}/source.cnf"
DUMP_FILE="${WORK_DIR}/copy.sql.gz"
TARGET_CONTAINER="herfree-rds-preflight-$(date -u +%s)"
TARGET_PASSWORD="$(openssl rand -hex 32)"
cat > "${SOURCE_CNF}" <<EOF
[client]
user=${SOURCE_USER}
password=${SOURCE_PASSWORD}
ssl-mode=VERIFY_IDENTITY
ssl-ca=/certs/rds-global-bundle.pem
EOF
chmod 0600 "${SOURCE_CNF}"
cleanup() {
  docker rm -f "${TARGET_CONTAINER}" >/dev/null 2>&1 || true
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT
source_mysql() {
  docker run --rm --network host --memory 192m --pids-limit 128 \
    -v "${SOURCE_CNF}:/run/secrets/source.cnf:ro" \
    -v "${CERT_FILE}:/certs/rds-global-bundle.pem:ro" \
    mysql:8.4.10 mysql --defaults-extra-file=/run/secrets/source.cnf --host="${SOURCE_HOST}" "$@"
}

docker pull mysql:8.4.10 >/dev/null
source_mysql --batch --skip-column-names --execute="SELECT 1" >/dev/null
docker run -d --name "${TARGET_CONTAINER}" --network none --memory 512m --pids-limit 256 \
  -e "MYSQL_ROOT_PASSWORD=${TARGET_PASSWORD}" -e "MYSQL_DATABASE=${MYSQL_DATABASE}" mysql:8.4.10 >/dev/null
ready=false
for _ in {1..90}; do
  if docker exec -e "MYSQL_PWD=${TARGET_PASSWORD}" "${TARGET_CONTAINER}" \
      mysqladmin ping --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --silent; then
    ready=true
    break
  fi
  sleep 2
done
[[ "${ready}" == true ]] || { echo "preflight MySQL did not become ready" >&2; exit 1; }

docker run --rm --network host --memory 192m --pids-limit 128 \
  -v "${SOURCE_CNF}:/run/secrets/source.cnf:ro" \
  -v "${CERT_FILE}:/certs/rds-global-bundle.pem:ro" \
  mysql:8.4.10 mysqldump --defaults-extra-file=/run/secrets/source.cnf --host="${SOURCE_HOST}" \
    --single-transaction --quick --skip-lock-tables --no-tablespaces --set-gtid-purged=OFF \
    --triggers "${MYSQL_DATABASE}" | gzip -9 > "${DUMP_FILE}"
test -s "${DUMP_FILE}"
gzip -t "${DUMP_FILE}"
gzip -dc "${DUMP_FILE}" | docker exec -i -e "MYSQL_PWD=${TARGET_PASSWORD}" "${TARGET_CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root "${MYSQL_DATABASE}"

tables="$(source_mysql --batch --skip-column-names \
  --execute="SELECT table_name FROM information_schema.tables WHERE table_schema='${MYSQL_DATABASE}' AND table_type='BASE TABLE' ORDER BY table_name;")"
[[ -n "${tables}" ]] || { echo "source database has no tables" >&2; exit 1; }
verified=0
while IFS= read -r table; do
  [[ "${table}" =~ ^[A-Za-z0-9_]+$ ]] || exit 1
  source_count="$(source_mysql --database="${MYSQL_DATABASE}" --batch --skip-column-names \
    --execute="SELECT COUNT(*) FROM \`${table}\`;")"
  target_count="$(docker exec -e "MYSQL_PWD=${TARGET_PASSWORD}" "${TARGET_CONTAINER}" mysql \
    --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --database="${MYSQL_DATABASE}" \
    --batch --skip-column-names --execute="SELECT COUNT(*) FROM \`${table}\`;")"
  [[ "${source_count}" == "${target_count}" ]] || {
    echo "row-count mismatch for ${table}; retry when writes are quiet" >&2
    exit 1
  }
  verified=$((verified + 1))
done <<< "${tables}"
flyway_failures="$(docker exec -e "MYSQL_PWD=${TARGET_PASSWORD}" "${TARGET_CONTAINER}" mysql \
  --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --database="${MYSQL_DATABASE}" \
  --batch --skip-column-names --execute="SELECT COUNT(*) FROM flyway_schema_history WHERE success=0;")"
[[ "${flyway_failures}" == "0" ]] || { echo "failed Flyway history in restored copy" >&2; exit 1; }
aws cloudwatch put-metric-data --region "${AWS_REGION}" --namespace Herfree/Operations \
  --metric-name DatabaseMigrationPreflightSuccess --dimensions "Environment=${DEPLOY_ENV}" \
  --value 1 --unit Count >/dev/null
echo "RDS-to-local isolated restore preflight passed: tables=${verified}"
