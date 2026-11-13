#!/usr/bin/env bash
# Use only after a successful manual Release changed frontend run on this exact branch/commit.
set -euo pipefail
: "${AMPLIFY_APP_ID:?}" "${AMPLIFY_BRANCH:?}" "${VERIFIED_JOB_ID:?}" "${VERIFIED_COMMIT_SHA:?}"
[[ "${CONFIRM_PATH_RELEASE_WORKFLOW_READY:-}" == YES ]] || exit 2
[[ "${AMPLIFY_BRANCH}" == main || "${AMPLIFY_BRANCH}" == develop ]] || exit 2
[[ "${VERIFIED_COMMIT_SHA}" =~ ^[a-f0-9]{40}$ ]] || exit 2
aws amplify get-job --app-id "${AMPLIFY_APP_ID}" --branch-name "${AMPLIFY_BRANCH}" --job-id "${VERIFIED_JOB_ID}" \
  | jq -e --arg sha "${VERIFIED_COMMIT_SHA}" '.job.summary.status=="SUCCEED" and .job.summary.commitId==$sha' >/dev/null
aws amplify update-branch --app-id "${AMPLIFY_APP_ID}" --branch-name "${AMPLIFY_BRANCH}" --no-enable-auto-build >/dev/null
echo 'Amplify automatic builds disabled for this verified branch; frontend/config changes use the GitHub release workflow.'
