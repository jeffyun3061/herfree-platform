#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV="${1:-}"
APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
STATE_FILE="${APP_DIR}/.deploy/${DEPLOY_ENV}.previous-image"

if [[ "${DEPLOY_ENV}" != "staging" && "${DEPLOY_ENV}" != "production" ]]; then
  echo "usage: rollback-release.sh <staging|production>"
  exit 2
fi
if [[ ! -s "${STATE_FILE}" ]]; then
  echo "previous image is not recorded for ${DEPLOY_ENV}"
  exit 1
fi

exec "${APP_DIR}/infra/scripts/deploy-release.sh" "${DEPLOY_ENV}" "$(cat "${STATE_FILE}")" rollback
