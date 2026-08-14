#!/usr/bin/env bash
set -euo pipefail

umask 077

if [[ "${CONFIRM_LOCAL_DB_PREP:-}" != "YES" ]]; then
  echo "refusing local DB preparation: set CONFIRM_LOCAL_DB_PREP=YES" >&2
  exit 2
fi

DEPLOY_ENV="${1:-production}"
if [[ "${DEPLOY_ENV}" != "production" && "${DEPLOY_ENV}" != "staging" ]]; then
  echo "usage: prepare-local-db-env.sh <production|staging>" >&2
  exit 2
fi

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
SECRET_ID="herfree/${DEPLOY_ENV}/db-app"
MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.${DEPLOY_ENV}"

DB_JSON="$(aws secretsmanager get-secret-value \
  --region "${AWS_REGION}" --secret-id "${SECRET_ID}" \
  --query SecretString --output text)"

json_value() {
  local path="$1"
  local value
  value="$(printf '%s' "${DB_JSON}" | jq -er "${path}")"
  if [[ -z "${value}" || "${value}" == *$'\n'* || "${value}" == *$'\r'* ]]; then
    echo "invalid local DB secret field: ${path}" >&2
    exit 1
  fi
  printf '%s' "${value}"
}

database="$(json_value '.database')"
username="$(json_value '.username')"
password="$(json_value '.password')"
root_password="$(json_value '.rootPassword')"
if [[ ! "${database}" =~ ^[A-Za-z0-9_]+$ || ! "${username}" =~ ^[A-Za-z0-9_.-]+$ \
   || ${#root_password} -lt 16 || "${root_password}" == "${password}" ]]; then
  echo "local DB secret fields failed validation" >&2
  exit 1
fi

install -d -m 0700 "${CONFIG_DIR}"
temporary_file="$(mktemp "${CONFIG_DIR}/.env.mysql.${DEPLOY_ENV}.XXXXXX")"
trap 'rm -f "${temporary_file}"' EXIT
cat > "${temporary_file}" <<EOF
MYSQL_DATABASE=${database}
MYSQL_USER=${username}
MYSQL_PASSWORD=${password}
MYSQL_ROOT_PASSWORD=${root_password}
EOF
chmod 0600 "${temporary_file}"
mv -f "${temporary_file}" "${MYSQL_ENV_FILE}"
trap - EXIT
unset DB_JSON password root_password

echo "local MySQL environment prepared for ${DEPLOY_ENV}"
