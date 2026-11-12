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
test_path='frontend/e2e/isolated-share-qa.spec.ts'
[[ "$(git -C "${root}" hash-object "${test_path}")" == "$(git -C "${root}" rev-parse "${RELEASE_SHA}:${test_path}")" ]] || { echo 'browser test differs from release' >&2; exit 1; }
export ISOLATED_QA_BRANCH="${RELEASE_QA_BRANCH}" ISOLATED_QA_COMMIT="${RELEASE_SHA}" ISOLATED_QA_IMAGE="${RELEASE_IMAGE}"
export E2E_HTTP_USERNAME="${ISOLATED_QA_BASIC_USERNAME}" E2E_HTTP_PASSWORD="${ISOLATED_QA_BASIC_PASSWORD}"
export ISOLATED_SHARE_QA=true
verify() {
  python3 "${root}/infra/scripts/verify-live-release-qa.py" --sha "${RELEASE_SHA}" --branch "${RELEASE_QA_BRANCH}" --image "${RELEASE_IMAGE}" >/dev/null
  python3 "${root}/infra/scripts/verify-isolated-staging.py" --run "${ISOLATED_QA_RUN}" --image "${RELEASE_IMAGE}" >/dev/null
  python3 "${root}/infra/scripts/verify-isolated-frontend.py" --account 439777528445 --app d2bcg3vnlv5hkh \
    --branch "${RELEASE_QA_BRANCH}" --sha "${RELEASE_SHA}" --api https://api-staging.herpfree.co.kr --repo "${root}" >/dev/null
}
verify
cd "${root}/frontend"
status=0
npm exec -- playwright test e2e/isolated-share-qa.spec.ts --project=chromium --project=mobile-chromium --project=iphone-webkit --workers=1 || status=$?
verify || { echo 'post-test verification failed; reconcile staging' >&2; exit 1; }
(( status == 0 )) || exit "${status}"
echo 'isolated release browser checks passed; cleanup and promotion remain unverified'
