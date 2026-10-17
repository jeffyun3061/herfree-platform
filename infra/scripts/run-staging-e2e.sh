#!/usr/bin/env bash
set -euo pipefail

suite="${1:-}"
if [[ "${suite}" != "e2e:staging:smoke" && "${suite}" != "e2e:staging:mutation" ]]; then
  echo "usage: run-staging-e2e.sh <e2e:staging:smoke|e2e:staging:mutation>" >&2
  exit 2
fi

: "${STAGING_AMPLIFY_APP_ID:?}"
: "${PLAYWRIGHT_BASE_URL:?}"
if [[ "${PLAYWRIGHT_BASE_URL}" != "https://develop.${STAGING_AMPLIFY_APP_ID}.amplifyapp.com" ]]; then
  echo "staging frontend URL does not match the configured Amplify app" >&2
  exit 1
fi

# Read the credential already protecting Amplify instead of keeping an
# independent GitHub secret that silently becomes stale after a rotation.
credentials="$(aws amplify get-branch --app-id "${STAGING_AMPLIFY_APP_ID}" \
  --branch-name develop --query 'branch.basicAuthCredentials' --output text)"
if [[ -z "${credentials}" || "${credentials}" == "None" ]]; then
  credentials="$(aws amplify get-app --app-id "${STAGING_AMPLIFY_APP_ID}" \
    --query 'app.basicAuthCredentials' --output text)"
fi
if [[ -z "${credentials}" || "${credentials}" == "None" ]]; then
  echo "staging Amplify Basic auth credentials are unavailable" >&2
  exit 1
fi

decoded="$(printf '%s' "${credentials}" | base64 --decode)"
if [[ "${decoded}" != *:* ]]; then
  echo "staging Amplify Basic auth credentials are malformed" >&2
  exit 1
fi
export E2E_HTTP_USERNAME="${decoded%%:*}"
export E2E_HTTP_PASSWORD="${decoded#*:}"
if [[ -z "${E2E_HTTP_USERNAME}" || -z "${E2E_HTTP_PASSWORD}" ]]; then
  echo "staging Amplify Basic auth credentials are incomplete" >&2
  exit 1
fi

printf '::add-mask::%s\n' "${credentials}" "${E2E_HTTP_USERNAME}" "${E2E_HTTP_PASSWORD}"
status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --max-time 10 --header "Authorization: Basic ${credentials}" "${PLAYWRIGHT_BASE_URL}/")"
if [[ "${status}" != "200" ]]; then
  echo "staging frontend Basic auth preflight returned HTTP ${status}" >&2
  exit 1
fi

exec npm run "${suite}"
