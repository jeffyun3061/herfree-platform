#!/usr/bin/env bash
# Read-only smoke checks only. This script does not establish database
# isolation, authorize mutation tests, or issue release evidence.
set -euo pipefail
[[ $# -eq 0 ]] || { echo 'arguments are not accepted' >&2; exit 2; }
: "${ISOLATED_QA_BRANCH:?}"
: "${ISOLATED_QA_COMMIT:?}"
: "${ISOLATED_QA_BASIC_USERNAME:?}"
: "${ISOLATED_QA_BASIC_PASSWORD:?}"
[[ "${E2E_ALLOW_MUTATION:-false}" != true ]] || { echo 'mutation tests are forbidden in this smoke runner' >&2; exit 1; }

root="$(git rev-parse --show-toplevel)"
expected="https://${ISOLATED_QA_BRANCH}.d2bcg3vnlv5hkh.amplifyapp.com"
[[ "${PLAYWRIGHT_BASE_URL:-}" == "${expected}" ]] || { echo 'isolated frontend URL mismatch' >&2; exit 1; }
python3 "${root}/infra/scripts/verify-isolated-frontend.py" \
  --account 439777528445 --app d2bcg3vnlv5hkh --branch "${ISOLATED_QA_BRANCH}" \
  --sha "${ISOLATED_QA_COMMIT}" --api https://api-staging.herpfree.co.kr --repo "${root}" >/dev/null

export E2E_HTTP_USERNAME="${ISOLATED_QA_BASIC_USERNAME}"
export E2E_HTTP_PASSWORD="${ISOLATED_QA_BASIC_PASSWORD}"
export E2E_ALLOW_MUTATION=false
export STAGING_API_URL=https://api-staging.herpfree.co.kr
cd "${root}/frontend"
exec npm run e2e:staging:smoke
