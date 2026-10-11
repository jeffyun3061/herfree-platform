#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "${CONFIRM_MFA_IDENTITY_VERIFIED:-}" == YES ]] || { echo 'Independent identity verification is required'; exit 2; }
USER_ID="${1:-}"
[[ "${USER_ID}" =~ ^[1-9][0-9]*$ ]] || { echo 'usage: approve-admin-mfa-enrollment.sh <user-id>'; exit 2; }
DEPLOY_ENV="${DEPLOY_ENV:-staging}"
[[ "${DEPLOY_ENV}" == production || "${DEPLOY_ENV}" == staging ]] || exit 2
APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
MYSQL_ENV_FILE="${HERFREE_MYSQL_ENV_FILE:-${CONFIG_DIR}/.env.mysql.$([[ "${DEPLOY_ENV}" == production ]] && echo prod || echo staging)}"
[[ -f "${MYSQL_ENV_FILE}" && "$(stat -c '%a' "${MYSQL_ENV_FILE}")" == 600 ]] || { echo 'A protected MySQL configuration is required'; exit 1; }
value_of() { sed -n "s/^$1=//p" "${MYSQL_ENV_FILE}" | tail -n 1 | tr -d '\r'; }
DB_NAME="$(value_of MYSQL_DATABASE)"
DB_PASSWORD="$(value_of MYSQL_ROOT_PASSWORD)"
[[ "${DB_NAME}" =~ ^[A-Za-z0-9_]+$ && -n "${DB_PASSWORD}" ]] || exit 1
CONTAINER="$(docker ps --filter "label=com.docker.compose.project=herfree-${DEPLOY_ENV}" --filter label=com.docker.compose.service=mysql --format '{{.ID}}')"
[[ "${CONTAINER}" =~ ^[a-f0-9]{12,64}$ ]] || { echo 'Exactly one active database is required'; exit 1; }
TOKEN="$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n')"
HASH="$(printf '%s' "${TOKEN}" | sha256sum | cut -d ' ' -f 1)"
sql="INSERT INTO admin_mfa_enrollment_approvals(token_hash,user_id,expires_at)
SELECT '${HASH}',id,DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 15 MINUTE) FROM users
WHERE id=${USER_ID} AND status='ACTIVE' AND role IN ('ADMIN','SUPER_ADMIN','MODERATOR','DOCTOR','CREATOR','DEVELOPER'); SELECT ROW_COUNT();"
result="$(printf '%s' "${sql}" | docker exec -i -e "MYSQL_PWD=${DB_PASSWORD}" "${CONTAINER}" mysql --ssl-mode=REQUIRED --host=127.0.0.1 --user=root --batch --skip-column-names "${DB_NAME}")"
[[ "${result}" == 1 ]] || { echo 'Active authorized account not found'; exit 1; }
APPROVAL_FILE="$(mktemp "${CONFIG_DIR}/mfa-enrollment-${USER_ID}.XXXXXX")"
printf '%s\n' "${TOKEN}" > "${APPROVAL_FILE}"
unset TOKEN DB_PASSWORD sql
echo "Single-use approval written to owner-only file: ${APPROVAL_FILE}; expires in 15 minutes. Deliver privately, then remove the file."
