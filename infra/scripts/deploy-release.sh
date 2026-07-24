#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV="${1:-}"
NEW_IMAGE="${2:-}"

if [[ "${DEPLOY_ENV}" != "staging" && "${DEPLOY_ENV}" != "production" ]]; then
  echo "usage: deploy-release.sh <staging|production> <ecr-image>"
  exit 2
fi
if [[ -z "${NEW_IMAGE}" ]]; then
  echo "container image is required"
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
STATE_DIR="${APP_DIR}/.deploy"
PROJECT="herfree-${DEPLOY_ENV}"

PORT=8080
BIND_HOST="127.0.0.1"

if [[ ! -f "${ENV_FILE}" || ! -f "${COMPOSE_FILE}" ]]; then
  echo "release config missing for ${DEPLOY_ENV}"
  exit 1
fi

"${APP_DIR}/infra/scripts/validate-release-env.sh" "${DEPLOY_ENV}" "${ENV_FILE}"

mkdir -p "${STATE_DIR}"
chmod 700 "${STATE_DIR}"
CURRENT_IMAGE_FILE="${STATE_DIR}/${DEPLOY_ENV}.current-image"
PREVIOUS_IMAGE=""
if [[ -s "${CURRENT_IMAGE_FILE}" ]]; then
  PREVIOUS_IMAGE="$(<"${CURRENT_IMAGE_FILE}")"
elif curl --fail --silent --max-time 3 "http://127.0.0.1:${PORT}/actuator/health" \
    | grep -q '"status":"UP"'; then
  PREVIOUS_IMAGE="$(docker inspect "${PROJECT}-api-1" --format '{{.Config.Image}}' 2>/dev/null || true)"
fi

deploy_image() {
  local image="$1"
  API_IMAGE="${image}" APP_ENV_FILE="${ENV_FILE}" API_BIND_PORT="${PORT}" API_BIND_HOST="${BIND_HOST}" DEPLOY_ENV="${DEPLOY_ENV}" \
    docker compose --env-file "${ENV_FILE}" -p "${PROJECT}" -f "${COMPOSE_FILE}" \
      up -d --pull always --no-build --remove-orphans
}

show_logs() {
  API_IMAGE="${NEW_IMAGE}" APP_ENV_FILE="${ENV_FILE}" API_BIND_PORT="${PORT}" API_BIND_HOST="${BIND_HOST}" DEPLOY_ENV="${DEPLOY_ENV}" \
    docker compose --env-file "${ENV_FILE}" -p "${PROJECT}" -f "${COMPOSE_FILE}" \
      logs --tail=120 api || true
}

echo "deploying ${DEPLOY_ENV} image"
deploy_image "${NEW_IMAGE}"

if [[ "${DEPLOY_ENV}" == "staging" && -x "${APP_DIR}/infra/scripts/setup-staging-tls.sh" ]]; then
  "${APP_DIR}/infra/scripts/setup-staging-tls.sh"
fi

if [[ "${DEPLOY_ENV}" == "production" && -x "${APP_DIR}/infra/scripts/setup-production-tls.sh" ]]; then
  "${APP_DIR}/infra/scripts/setup-production-tls.sh"
fi

healthy=false
for _ in {1..150}; do
  if curl --fail --silent --show-error "http://127.0.0.1:${PORT}/actuator/health" \
      | grep -q '"status":"UP"'; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "${healthy}" == "true" ]]; then
  printf '%s' "${NEW_IMAGE}" > "${CURRENT_IMAGE_FILE}"
  if [[ -n "${PREVIOUS_IMAGE}" && "${PREVIOUS_IMAGE}" != "${NEW_IMAGE}" ]]; then
    printf '%s' "${PREVIOUS_IMAGE}" > "${STATE_DIR}/${DEPLOY_ENV}.previous-image"
  fi
  echo "${DEPLOY_ENV} deployment healthy"
  exit 0
fi

echo "health check failed"
show_logs

if [[ -n "${PREVIOUS_IMAGE}" && "${PREVIOUS_IMAGE}" != "${NEW_IMAGE}" ]]; then
  echo "rolling back to previous image"
  deploy_image "${PREVIOUS_IMAGE}"
else
  echo "previous image unavailable; manual recovery required"
fi
exit 1
