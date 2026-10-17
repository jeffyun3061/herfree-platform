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

# Amplify returns an encrypted password from GetBranch, not a reusable
# credential. The staging environment secrets must match the branch password.
: "${E2E_HTTP_USERNAME:?staging Basic auth username is required}"
: "${E2E_HTTP_PASSWORD:?staging Basic auth password is required}"
enabled="$(aws amplify get-branch --app-id "${STAGING_AMPLIFY_APP_ID}" \
  --branch-name develop --query 'branch.enableBasicAuth' --output text)"
if [[ "${enabled}" != "True" ]]; then
  echo "staging branch Basic auth must remain enabled" >&2
  exit 1
fi

credentials="$(printf '%s:%s' "${E2E_HTTP_USERNAME}" "${E2E_HTTP_PASSWORD}" | base64 --wrap=0)"
printf '::add-mask::%s\n' "${credentials}" "${E2E_HTTP_USERNAME}" "${E2E_HTTP_PASSWORD}"
status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --max-time 10 --header "Authorization: Basic ${credentials}" "${PLAYWRIGHT_BASE_URL}/")"
if [[ "${status}" != "200" ]]; then
  echo "staging frontend Basic auth preflight returned HTTP ${status}" >&2
  exit 1
fi

exec npm run "${suite}"
