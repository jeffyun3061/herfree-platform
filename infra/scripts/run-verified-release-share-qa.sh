#!/usr/bin/env bash
# Read-only identity checks and browser tests for a prepared isolated run.
# The caller must serialize staging, prepare it, and independently verify cleanup.
# Passing this script alone does not authorize image promotion.
set -euo pipefail
[[ $# -eq 0 ]] || { echo 'arguments are not accepted' >&2; exit 2; }
: "${RELEASE_SHA:?}"
: "${RELEASE_QA_BRANCH:?}"
: "${RELEASE_IMAGE:?}"
: "${ISOLATED_QA_RUN:?}"
: "${ISOLATED_QA_BASIC_USERNAME:?}"
: "${ISOLATED_QA_BASIC_PASSWORD:?}"
: "${PLAYWRIGHT_BASE_URL:?}"
[[ "${RELEASE_SHA}" =~ ^[a-f0-9]{40}$ && "${RELEASE_QA_BRANCH}" =~ ^qa-[a-f0-9]{12}-[a-f0-9]{8}$ && "${ISOLATED_QA_RUN}" =~ ^[a-f0-9]{8}$ ]] || { echo 'invalid release identity' >&2; exit 1; }
[[ "${RELEASE_QA_BRANCH:3:12}" == "${RELEASE_SHA:0:12}" ]] || { echo 'release branch mismatch' >&2; exit 1; }
origin="https://${RELEASE_QA_BRANCH}.d2bcg3vnlv5hkh.amplifyapp.com"
[[ "${PLAYWRIGHT_BASE_URL}" == "${origin}" ]] || { echo 'isolated frontend URL mismatch' >&2; exit 1; }
root="$(git rev-parse --show-toplevel)"
[[ "$(git -C "${root}" rev-parse HEAD)" == "${RELEASE_SHA}" ]] || { echo 'checkout does not match release' >&2; exit 1; }
# The test must be from this checkout, not a modified local replacement.
for test_path in frontend/e2e/isolated-release-share-qa.spec.ts frontend/e2e/release.spec.ts \
  frontend/e2e/bff-session.spec.ts frontend/e2e/support/isolated-release-target.ts \
  frontend/e2e/support/mutation-environment.ts infra/scripts/verify-release-playwright-results.py; do
  [[ "$(git -C "${root}" hash-object "${test_path}")" == "$(git -C "${root}" rev-parse "${RELEASE_SHA}:${test_path}")" ]] || { echo 'browser test differs from release' >&2; exit 1; }
done
export ISOLATED_QA_BRANCH="${RELEASE_QA_BRANCH}" ISOLATED_QA_COMMIT="${RELEASE_SHA}" ISOLATED_QA_IMAGE="${RELEASE_IMAGE}"
export E2E_HTTP_USERNAME="${ISOLATED_QA_BASIC_USERNAME}" E2E_HTTP_PASSWORD="${ISOLATED_QA_BASIC_PASSWORD}"
export ISOLATED_RELEASE_SHARE_QA=true ISOLATED_QA_CANDIDATE_DIR="${root}"
verify() {
  python3 "${root}/infra/scripts/verify-live-release-qa.py" --sha "${RELEASE_SHA}" --branch "${RELEASE_QA_BRANCH}" --image "${RELEASE_IMAGE}" >/dev/null || return 1
  python3 "${root}/infra/scripts/verify-isolated-staging.py" --run "${ISOLATED_QA_RUN}" --image "${RELEASE_IMAGE}" >/dev/null || return 1
  python3 "${root}/infra/scripts/verify-isolated-frontend.py" --account 439777528445 --app d2bcg3vnlv5hkh \
    --branch "${RELEASE_QA_BRANCH}" --sha "${RELEASE_SHA}" --api https://api-staging.herpfree.co.kr --repo "${root}" >/dev/null || return 1
}
verify
cd "${root}/frontend"
sharing_report="$(mktemp "${TMPDIR:-/tmp}/herfree-sharing-report.XXXXXXXX")"
regression_report=''
trap 'rm -f -- "${sharing_report}" "${regression_report}"' EXIT
regression_report="$(mktemp "${TMPDIR:-/tmp}/herfree-regression-report.XXXXXXXX")"
status=0
PLAYWRIGHT_JSON_OUTPUT_NAME="${sharing_report}" npm exec -- playwright test e2e/isolated-release-share-qa.spec.ts \
  --project=chromium --project=mobile-chromium --project=iphone-webkit --workers=1 --reporter=line,json || status=$?
if (( status == 0 )); then
  python3 "${root}/infra/scripts/verify-release-playwright-results.py" sharing "${sharing_report}" || status=$?
fi
if (( status == 0 )); then
  PLAYWRIGHT_JSON_OUTPUT_NAME="${regression_report}" E2E_ALLOW_MUTATION=true E2E_EXPECTED_BASE_URL="${origin}" STAGING_API_URL=https://api-staging.herpfree.co.kr \
    npm exec -- playwright test e2e/release.spec.ts e2e/bff-session.spec.ts --project=chromium \
      --grep 'release smoke|staging data flow' --workers=1 --reporter=line,json || status=$?
fi
if (( status == 0 )); then
  python3 "${root}/infra/scripts/verify-release-playwright-results.py" regression "${regression_report}" || status=$?
fi
verify || { echo 'post-test verification failed; reconcile staging' >&2; exit 1; }
(( status == 0 )) || exit "${status}"
echo 'isolated release browser checks passed; cleanup and promotion remain unverified'
