#!/usr/bin/env bash
# Called under the staging release lock. A durable isolation record must block
# unrelated deploys even after the process that created it has terminated.
set -euo pipefail
state_root="${1:?state directory required}"
config="${2:?staging configuration required}"
mode="${3:?deployment mode required}"
image="${4:?image required}"
shopt -s nullglob
records=("${state_root}"/isolated-????????)
(( ${#records[@]} > 0 )) || exit 0
# Reconciliation only quarantines an interrupted release; it never deploys an
# image. Keep that safety path available during an isolated run.
[[ "${mode}" != reconcile ]] || exit 0
run="${HERFREE_ISOLATED_QA_RUN:-}"
[[ "${run}" =~ ^[a-f0-9]{8}$ && ${#records[@]} -eq 1 ]] || { echo 'isolated staging run blocks unrelated deployment' >&2; exit 1; }
state="${state_root}/isolated-${run}"
[[ "${records[0]}" == "${state}" && -d "${state}" && ! -L "${state}" ]] || { echo 'isolated staging state mismatch' >&2; exit 1; }
if [[ -f "${state}/prepared" && -f "${state}/qa-env" ]] && cmp -s "${config}" "${state}/qa-env"; then
  exit 0
fi
if [[ -f "${state}/config-restored" && -f "${state}/original-env" ]] && cmp -s "${config}" "${state}/original-env"; then
  original_image="$(tr -d '\r\n' < "${state}/original-image")"
  [[ "${mode}" == rollback && -n "${original_image}" && "${image}" == "${original_image}" ]] || { echo 'restored staging configuration permits only its recorded rollback image' >&2; exit 1; }
  exit 0
fi
echo 'isolated staging configuration is not ready for deployment' >&2
exit 1
