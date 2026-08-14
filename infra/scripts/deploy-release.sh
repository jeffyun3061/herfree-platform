#!/usr/bin/env bash
set -euo pipefail

umask 077

DEPLOY_ENV="${1:-}"
NEW_IMAGE="${2:-}"
DEPLOY_MODE="${3:-deploy}"

if [[ "${DEPLOY_ENV}" != "staging" && "${DEPLOY_ENV}" != "production" ]]; then
  echo "usage: deploy-release.sh <staging|production> <ecr-image|pending> [deploy|rollback|reconcile]"
  exit 2
fi
if [[ -z "${NEW_IMAGE}" ]]; then
  echo "container image is required"
  exit 2
fi
if [[ "${DEPLOY_MODE}" != "deploy" && "${DEPLOY_MODE}" != "rollback" && "${DEPLOY_MODE}" != "reconcile" ]]; then
  echo "deployment mode must be deploy, rollback, or reconcile"
  exit 2
fi
if [[ "${NEW_IMAGE}" == *$'\n'* || "${NEW_IMAGE}" == *$'\r'* || "${NEW_IMAGE}" == *$'\t'* ]]; then
  echo "container image contains invalid control characters"
  exit 2
fi
if [[ ! "${NEW_IMAGE}" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[A-Za-z0-9._/-]+(@sha256:[0-9a-f]{64}|:[0-9a-f]{40})$ ]]; then
  echo "container image must be an immutable ECR image URI"
  exit 2
fi
if [[ "${DEPLOY_ENV}" == "production" && "${DEPLOY_MODE}" != "reconcile" && "${NEW_IMAGE}" != *@sha256:* ]]; then
  echo "production deployments require an image digest, not a mutable tag"
  exit 2
fi

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
if [[ "${DEPLOY_ENV}" == "production" ]]; then
  ENV_FILE="${CONFIG_DIR}/.env.prod"
else
  ENV_FILE="${CONFIG_DIR}/.env.staging"
fi
COMPOSE_FILE="${APP_DIR}/docker-compose.release.yml"
LOCAL_DB_COMPOSE_FILE="${APP_DIR}/docker-compose.release-local-db.yml"
STATE_DIR="${APP_DIR}/.deploy"
PROJECT="herfree-${DEPLOY_ENV}"

PORT=8080
BIND_HOST="127.0.0.1"
HEALTH_ATTEMPTS=60

if [[ ! -f "${ENV_FILE}" || ! -f "${COMPOSE_FILE}" ]]; then
  echo "release config missing for ${DEPLOY_ENV}"
  exit 1
fi

db_runtime="$(sed -n 's/^DB_RUNTIME=//p' "${ENV_FILE}" | tail -n 1 | tr -d '\r')"
MYSQL_ENV_FILE="${CONFIG_DIR}/.env.mysql.${DEPLOY_ENV}"
MYSQL_DATA_DIR="${HERFREE_MYSQL_DATA_DIR:-/var/lib/herfree/mysql-${DEPLOY_ENV}}"
compose_files=(-f "${COMPOSE_FILE}")
if [[ "${db_runtime}" == "local" ]]; then
  if [[ ! -f "${LOCAL_DB_COMPOSE_FILE}" ]]; then
    echo "local DB compose overlay is missing"
    exit 1
  fi
  compose_files+=(-f "${LOCAL_DB_COMPOSE_FILE}")
fi

if [[ "${DEPLOY_ENV}" == "production" ]]; then
  API_MEMORY_LIMIT="${API_MEMORY_LIMIT:-768m}"
  MYSQL_MEMORY_LIMIT="${MYSQL_MEMORY_LIMIT:-512m}"
else
  API_MEMORY_LIMIT="${API_MEMORY_LIMIT:-512m}"
  MYSQL_MEMORY_LIMIT="${MYSQL_MEMORY_LIMIT:-384m}"
fi

HERFREE_MYSQL_ENV_FILE="${MYSQL_ENV_FILE}" \
  "${APP_DIR}/infra/scripts/validate-release-env.sh" "${DEPLOY_ENV}" "${ENV_FILE}"

if [[ "${DEPLOY_ENV}" == "production" && "${db_runtime}" == "local" ]]; then
  if [[ ! -f "/var/lib/herfree/.production-db-ready" \
     || ! -f "${MYSQL_DATA_DIR}/auto.cnf" ]]; then
    echo "production local DB has not completed a verified migration or restore"
    exit 1
  fi
fi

mkdir -p "${STATE_DIR}"
chmod 700 "${STATE_DIR}"
CURRENT_IMAGE_FILE="${STATE_DIR}/${DEPLOY_ENV}.current-image"
PREVIOUS_IMAGE_FILE="${STATE_DIR}/${DEPLOY_ENV}.previous-image"
REJECTED_IMAGE_FILE="${STATE_DIR}/${DEPLOY_ENV}.rejected-image"
FAILED_FALLBACK_IMAGE_FILE="${STATE_DIR}/${DEPLOY_ENV}.failed-fallback-image"
PENDING_OPERATION_FILE="${STATE_DIR}/${DEPLOY_ENV}.pending-operation"
LOCK_FILE="${STATE_DIR}/${DEPLOY_ENV}.lock"

if ! command -v flock >/dev/null 2>&1; then
  echo "flock is required to serialize release state changes"
  exit 1
fi
exec 9>"${LOCK_FILE}"
if [[ "${DEPLOY_MODE}" == "reconcile" ]]; then
  if ! flock -w 60 9; then
    echo "timed out waiting to reconcile the active release operation"
    exit 1
  fi
elif ! flock -n 9; then
  echo "another ${DEPLOY_ENV} release operation is already running"
  exit 1
fi

read_state() {
  local file="$1"
  if [[ -s "${file}" ]]; then
    <"${file}" tr -d '\r\n'
  fi
}

write_state() {
  local file="$1"
  local value="$2"
  local temporary_file="${file}.tmp.$$"
  printf '%s' "${value}" > "${temporary_file}"
  chmod 600 "${temporary_file}"
  mv -f "${temporary_file}" "${file}"
}

remove_state_if_matches() {
  local file="$1"
  local image="$2"
  if [[ -s "${file}" && "$(read_state "${file}")" == "${image}" ]]; then
    rm -f "${file}"
  fi
}

deploy_image() {
  local image="$1"
  API_IMAGE="${image}" APP_ENV_FILE="${ENV_FILE}" API_BIND_PORT="${PORT}" API_BIND_HOST="${BIND_HOST}" DEPLOY_ENV="${DEPLOY_ENV}" \
    MYSQL_ENV_FILE="${MYSQL_ENV_FILE}" MYSQL_DATA_DIR="${MYSQL_DATA_DIR}" \
    API_MEMORY_LIMIT="${API_MEMORY_LIMIT}" MYSQL_MEMORY_LIMIT="${MYSQL_MEMORY_LIMIT}" \
    docker compose --env-file "${ENV_FILE}" -p "${PROJECT}" "${compose_files[@]}" \
      up -d --pull always --no-build --remove-orphans
}

show_logs() {
  local image="$1"
  API_IMAGE="${image}" APP_ENV_FILE="${ENV_FILE}" API_BIND_PORT="${PORT}" API_BIND_HOST="${BIND_HOST}" DEPLOY_ENV="${DEPLOY_ENV}" \
    MYSQL_ENV_FILE="${MYSQL_ENV_FILE}" MYSQL_DATA_DIR="${MYSQL_DATA_DIR}" \
    API_MEMORY_LIMIT="${API_MEMORY_LIMIT}" MYSQL_MEMORY_LIMIT="${MYSQL_MEMORY_LIMIT}" \
    docker compose --env-file "${ENV_FILE}" -p "${PROJECT}" "${compose_files[@]}" \
      logs --tail=120 api || true
}

stop_service() {
  local image="$1"
  API_IMAGE="${image}" APP_ENV_FILE="${ENV_FILE}" API_BIND_PORT="${PORT}" API_BIND_HOST="${BIND_HOST}" DEPLOY_ENV="${DEPLOY_ENV}" \
    MYSQL_ENV_FILE="${MYSQL_ENV_FILE}" MYSQL_DATA_DIR="${MYSQL_DATA_DIR}" \
    API_MEMORY_LIMIT="${API_MEMORY_LIMIT}" MYSQL_MEMORY_LIMIT="${MYSQL_MEMORY_LIMIT}" \
    docker compose --env-file "${ENV_FILE}" -p "${PROJECT}" "${compose_files[@]}" \
      stop api || true
}

wait_until_healthy() {
  local attempts="${1:-${HEALTH_ATTEMPTS}}"
  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if curl --fail --silent --show-error --max-time 3 \
        "http://127.0.0.1:${PORT}/actuator/health" \
        | grep -q '"status":"UP"'; then
      return 0
    fi
    sleep 2
  done
  return 1
}

configure_tls() {
  case "${DEPLOY_ENV}" in
    staging)
      if [[ -x "${APP_DIR}/infra/scripts/setup-staging-tls.sh" ]]; then
        "${APP_DIR}/infra/scripts/setup-staging-tls.sh" || return $?
      fi
      ;;
    production)
      if [[ -x "${APP_DIR}/infra/scripts/setup-production-tls.sh" ]]; then
        "${APP_DIR}/infra/scripts/setup-production-tls.sh" || return $?
      fi
      ;;
  esac
  return 0
}

begin_pending_operation() {
  local mode="$1"
  local candidate_image="$2"
  local fallback_image="$3"
  local temporary_file="${PENDING_OPERATION_FILE}.tmp.$$"
  printf '%s\t%s\t%s\n' "${mode}" "${candidate_image}" "${fallback_image}" > "${temporary_file}"
  chmod 600 "${temporary_file}"
  mv -f "${temporary_file}" "${PENDING_OPERATION_FILE}"
}

clear_pending_operation() {
  rm -f "${PENDING_OPERATION_FILE}"
}

quarantine_operation() {
  local mode="$1"
  local candidate_image="$2"
  local fallback_image="$3"
  local rejected_image="${candidate_image}"
  local failed_fallback_image="${fallback_image}"

  if [[ "${mode}" == "rollback" ]]; then
    rejected_image="${fallback_image}"
    failed_fallback_image="${candidate_image}"
  fi

  if [[ -n "${rejected_image}" ]]; then
    write_state "${REJECTED_IMAGE_FILE}" "${rejected_image}"
  fi
  if [[ -n "${failed_fallback_image}" ]]; then
    write_state "${FAILED_FALLBACK_IMAGE_FILE}" "${failed_fallback_image}"
  fi

  rm -f "${CURRENT_IMAGE_FILE}" "${PREVIOUS_IMAGE_FILE}"
  stop_service "${candidate_image:-pending}"
  clear_pending_operation
  echo "release state quarantined; manual recovery is required"
}

reconcile_pending_operation() {
  local pending_mode=""
  local pending_candidate=""
  local pending_fallback=""

  if [[ ! -s "${PENDING_OPERATION_FILE}" ]]; then
    echo "no pending ${DEPLOY_ENV} release operation to reconcile"
    return 0
  fi

  IFS=$'\t' read -r pending_mode pending_candidate pending_fallback < "${PENDING_OPERATION_FILE}" || true
  if [[ "${pending_mode}" != "deploy" && "${pending_mode}" != "rollback" ]]; then
    echo "pending release state is malformed; applying fail-closed quarantine"
    pending_mode="deploy"
  fi

  quarantine_operation "${pending_mode}" "${pending_candidate:-pending}" "${pending_fallback}"
}

if [[ "${DEPLOY_MODE}" == "reconcile" ]]; then
  reconcile_pending_operation
  exit 0
fi

if [[ -e "${PENDING_OPERATION_FILE}" ]]; then
  echo "an unfinished ${DEPLOY_ENV} release operation must be reconciled before another deployment"
  exit 1
fi

PREVIOUS_IMAGE=""
if [[ -s "${CURRENT_IMAGE_FILE}" ]]; then
  PREVIOUS_IMAGE="$(read_state "${CURRENT_IMAGE_FILE}")"
elif [[ -s "${PREVIOUS_IMAGE_FILE}" ]]; then
  PREVIOUS_IMAGE="$(read_state "${PREVIOUS_IMAGE_FILE}")"
elif curl --fail --silent --max-time 3 "http://127.0.0.1:${PORT}/actuator/health" \
    | grep -q '"status":"UP"'; then
  PREVIOUS_IMAGE="$(docker inspect "${PROJECT}-api-1" --format '{{.Config.Image}}' 2>/dev/null || true)"
fi

if [[ "${DEPLOY_MODE}" == "deploy" && -n "${PREVIOUS_IMAGE}" && -s "${FAILED_FALLBACK_IMAGE_FILE}" \
      && "${PREVIOUS_IMAGE}" == "$(read_state "${FAILED_FALLBACK_IMAGE_FILE}")" ]]; then
  echo "refusing to reuse a previously failed fallback image"
  rm -f "${CURRENT_IMAGE_FILE}" "${PREVIOUS_IMAGE_FILE}"
  PREVIOUS_IMAGE=""
fi

if [[ "${DEPLOY_ENV}" == "production"
      && "${DEPLOY_MODE}" == "deploy"
      && -z "${PREVIOUS_IMAGE}"
      && "${HERFREE_ALLOW_PRODUCTION_BOOTSTRAP:-false}" != "true" ]]; then
  echo "production deployment requires an existing healthy fallback image"
  echo "use a separately approved bootstrap procedure for the first production deployment"
  exit 1
fi

if [[ "${DEPLOY_ENV}" == "production" && "${db_runtime}" == "local" \
      && "${DEPLOY_MODE}" == "deploy" ]]; then
  echo "creating verified local DB backup before deployment"
  DEPLOY_ENV="${DEPLOY_ENV}" HERFREE_APP_DIR="${APP_DIR}" \
    "${APP_DIR}/infra/scripts/backup-db.sh" predeploy
fi

OPERATION_STARTED="false"
handle_unexpected_exit() {
  local exit_status=$?
  trap - EXIT HUP INT TERM
  if [[ "${exit_status}" -ne 0 && "${OPERATION_STARTED}" == "true" && -s "${PENDING_OPERATION_FILE}" ]]; then
    echo "release operation interrupted; quarantining unverified state"
    reconcile_pending_operation || true
  fi
  exit "${exit_status}"
}
trap handle_unexpected_exit EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

rollback_to_previous() {
  if [[ -z "${PREVIOUS_IMAGE}" || "${PREVIOUS_IMAGE}" == "${NEW_IMAGE}" ]]; then
    echo "previous image unavailable; manual recovery required"
    return 1
  fi

  echo "rolling back to previous image"
  if ! deploy_image "${PREVIOUS_IMAGE}"; then
    echo "rollback container start failed"
    show_logs "${PREVIOUS_IMAGE}"
    stop_service "${PREVIOUS_IMAGE}"
    return 1
  fi

  if ! wait_until_healthy; then
    echo "rollback image failed health verification"
    show_logs "${PREVIOUS_IMAGE}"
    stop_service "${PREVIOUS_IMAGE}"
    return 1
  fi

  write_state "${CURRENT_IMAGE_FILE}" "${PREVIOUS_IMAGE}"
  write_state "${PREVIOUS_IMAGE_FILE}" "${PREVIOUS_IMAGE}"
  remove_state_if_matches "${FAILED_FALLBACK_IMAGE_FILE}" "${PREVIOUS_IMAGE}"
  echo "rollback image healthy"
  return 0
}

recover_failed_release() {
  if [[ "${DEPLOY_MODE}" == "rollback" ]]; then
    echo "rollback target failed; refusing to reactivate the rejected release"
    quarantine_operation "rollback" "${NEW_IMAGE}" "${PREVIOUS_IMAGE}"
    OPERATION_STARTED="false"
    return 1
  fi

  if rollback_to_previous; then
    write_state "${REJECTED_IMAGE_FILE}" "${NEW_IMAGE}"
    clear_pending_operation
    OPERATION_STARTED="false"
    return 0
  fi

  quarantine_operation "deploy" "${NEW_IMAGE}" "${PREVIOUS_IMAGE}"
  OPERATION_STARTED="false"
  return 1
}

begin_pending_operation "${DEPLOY_MODE}" "${NEW_IMAGE}" "${PREVIOUS_IMAGE}"
OPERATION_STARTED="true"

echo "deploying ${DEPLOY_ENV} image"
if ! deploy_image "${NEW_IMAGE}"; then
  echo "new image container start failed"
  show_logs "${NEW_IMAGE}"
  if ! recover_failed_release; then
    echo "automatic rollback failed"
  fi
  exit 1
fi

if ! configure_tls; then
  echo "TLS configuration failed"
  if ! recover_failed_release; then
    echo "automatic rollback failed"
  fi
  exit 1
fi

if wait_until_healthy; then
  write_state "${CURRENT_IMAGE_FILE}" "${NEW_IMAGE}"
  remove_state_if_matches "${FAILED_FALLBACK_IMAGE_FILE}" "${NEW_IMAGE}"
  remove_state_if_matches "${REJECTED_IMAGE_FILE}" "${NEW_IMAGE}"

  if [[ "${DEPLOY_MODE}" == "deploy" && -n "${PREVIOUS_IMAGE}" && "${PREVIOUS_IMAGE}" != "${NEW_IMAGE}" ]]; then
    write_state "${PREVIOUS_IMAGE_FILE}" "${PREVIOUS_IMAGE}"
  elif [[ "${DEPLOY_MODE}" == "rollback" ]]; then
    write_state "${PREVIOUS_IMAGE_FILE}" "${NEW_IMAGE}"
    if [[ -n "${PREVIOUS_IMAGE}" && "${PREVIOUS_IMAGE}" != "${NEW_IMAGE}" ]]; then
      write_state "${REJECTED_IMAGE_FILE}" "${PREVIOUS_IMAGE}"
    fi
  fi

  clear_pending_operation
  OPERATION_STARTED="false"
  trap - EXIT HUP INT TERM
  echo "${DEPLOY_ENV} ${DEPLOY_MODE} healthy"
  exit 0
fi

echo "health check failed"
show_logs "${NEW_IMAGE}"
if ! recover_failed_release; then
  echo "automatic rollback failed"
fi
exit 1
