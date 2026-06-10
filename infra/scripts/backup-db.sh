#!/usr/bin/env bash
# MySQL 일일 백업 — cron 예: 0 3 * * * /opt/herfree/infra/scripts/backup-db.sh
set -euo pipefail

CONTAINER="${HERFREE_MYSQL_CONTAINER:-herfree-mysql-prod}"
BACKUP_DIR="${HERFREE_BACKUP_DIR:-/opt/herfree/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/herfree_db_${STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

docker exec "${CONTAINER}" mysqldump \
  -u"${MYSQL_USER:-herfree_user}" \
  -p"${MYSQL_PASSWORD}" \
  --single-transaction \
  "${MYSQL_DATABASE:-herfree_db}" | gzip > "${FILE}"

find "${BACKUP_DIR}" -name 'herfree_db_*.sql.gz' -mtime +7 -delete

echo "backup saved: ${FILE}"
