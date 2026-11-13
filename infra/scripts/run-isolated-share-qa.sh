#!/usr/bin/env bash
# Draft runner: point-in-time checks only. Caller must serialize staging,
# create the isolated run and protected frontend, and verify cleanup.
set -euo pipefail
[[ $# -eq 0 ]] || { echo 'arguments are not accepted' >&2; exit 2; }
branch=qa-aaad889901ab-aaad8899
sha=aaad889901ab1a085c2d5dbd10d58b47f8edc38f
image=439777528445.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api@sha256:3f876060daf7d065f6279087b8d181ef3135485f467893f83daa10548d0d054c
origin="https://${branch}.d2bcg3vnlv5hkh.amplifyapp.com"
: "${ISOLATED_QA_RUN:?}"
: "${ISOLATED_QA_CANDIDATE_DIR:?}"
: "${ISOLATED_QA_BASIC_USERNAME:?}"
: "${ISOLATED_QA_BASIC_PASSWORD:?}"
[[ "${ISOLATED_QA_RUN}" =~ ^[a-f0-9]{8}$ && -d "${ISOLATED_QA_CANDIDATE_DIR}" ]] || { echo 'invalid isolated run or candidate checkout' >&2; exit 1; }
[[ "${PLAYWRIGHT_BASE_URL:-}" == "${origin}" ]] || { echo 'isolated frontend URL mismatch' >&2; exit 1; }
root="$(git rev-parse --show-toplevel)"
export ISOLATED_QA_BRANCH="${branch}" ISOLATED_QA_COMMIT="${sha}" ISOLATED_QA_IMAGE="${image}"
export E2E_HTTP_USERNAME="${ISOLATED_QA_BASIC_USERNAME}" E2E_HTTP_PASSWORD="${ISOLATED_QA_BASIC_PASSWORD}"
export ISOLATED_SHARE_QA=true
verify() {
  python3 "${root}/infra/scripts/verify-isolated-staging.py" --run "${ISOLATED_QA_RUN}" --image "${image}" >/dev/null || return 1
  python3 "${root}/infra/scripts/verify-isolated-frontend.py" \
    --account 439777528445 --app d2bcg3vnlv5hkh --branch "${branch}" --sha "${sha}" \
    --api https://api-staging.herpfree.co.kr --repo "${ISOLATED_QA_CANDIDATE_DIR}" --candidate-pr 195 >/dev/null || return 1
}
verify
cd "${root}/frontend"
status=0
npm exec -- playwright test e2e/isolated-share-qa.spec.ts --project=chromium --project=mobile-chromium --project=iphone-webkit --workers=1 || status=$?
# A failed final verification must never be turned into success, even when the
# browser suite passed. Cleanup remains the coordinator's responsibility.
verify || { echo 'post-test isolation verification failed; reconcile staging' >&2; exit 1; }
(( status == 0 )) || exit "${status}"
echo 'isolated share browser checks passed; cleanup and promotion remain unverified'
