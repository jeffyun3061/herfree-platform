#!/usr/bin/env bash
# Staging-only QA coordinator. No production promotion or instance lifecycle.
set -euo pipefail
umask 077
mode="${1:-}"
run="${2:-}"
image="${3:-}"
[[ "${mode}" =~ ^(start|verify|cleanup)$ && "${run}" =~ ^[a-f0-9]{8}$ ]] || { echo 'invalid QA operation' >&2; exit 2; }
if [[ "${mode}" == start ]]; then
  [[ "${image}" =~ ^439777528445\.dkr\.ecr\.ap-northeast-2\.amazonaws\.com/herfree-api@sha256:[a-f0-9]{64}$ ]] || { echo 'pinned staging ECR digest required' >&2; exit 2; }
else
  [[ -z "${image}" ]] || { echo 'unexpected image argument' >&2; exit 2; }
fi

app="${HERFREE_APP_DIR:-/opt/herfree}"
state_root="${app}/.deploy"
helper="${app}/infra/scripts/staging-isolated-db.sh"
deploy="${app}/infra/scripts/deploy-release.sh"
guard="${app}/infra/scripts/guard-staging-isolation.sh"
[[ -x "${helper}" && -x "${deploy}" && -x "${guard}" && -d "${state_root}" && ! -L "${state_root}" ]] || { echo 'staging QA prerequisites missing' >&2; exit 1; }
grep -q 'guard-staging-isolation.sh' "${deploy}" || { echo 'staging deployment guard not installed' >&2; exit 1; }

# Refuse all other hosts before touching configuration or databases.
token="$(curl --fail --silent --show-error --max-time 3 -X PUT -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' http://169.254.169.254/latest/api/token)"
identity="$(curl --fail --silent --show-error --max-time 3 -H "X-aws-ec2-metadata-token: ${token}" http://169.254.169.254/latest/dynamic/instance-identity/document)"
unset token
printf '%s' "${identity}" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("accountId")=="439777528445" and d.get("instanceId")=="i-02cf5b8f3a7aa32da" and d.get("region")=="ap-northeast-2" else 1)' || { echo 'staging instance identity mismatch' >&2; exit 1; }
unset identity

exec 8>"${state_root}/isolated-qa-coordinator.lock"
flock -n 8 || { echo 'another QA operation is active' >&2; exit 1; }
state="${state_root}/isolated-${run}"
export HERFREE_ISOLATED_QA_RUN="${run}"
case "${mode}" in
  start)
    "${helper}" prepare "${run}"
    "${helper}" pin "${run}" "${image}"
    # Deployment logs may contain private information; keep them on the host.
    if ! "${deploy}" staging "${image}" >"${state}/candidate-deploy.log" 2>&1; then
      echo 'candidate deployment failed; inspect and reconcile staging before retrying' >&2
      exit 1
    fi
    "${helper}" verify "${run}"
    ;;
  verify)
    "${helper}" verify "${run}"
    ;;
  cleanup)
    [[ -d "${state}" && ! -L "${state}" && -s "${state}/original-image" ]] || { echo 'matching QA recovery record missing' >&2; exit 1; }
    original="$(tr -d '\r\n' < "${state}/original-image")"
    "${helper}" restore-config "${run}"
    if ! "${deploy}" staging "${original}" rollback >"${state}/restore-deploy.log" 2>&1; then
      echo 'staging recovery failed; leave the QA database in place for reconciliation' >&2
      exit 1
    fi
    # Remove coordinator-owned diagnostic logs only after the original service
    # is healthy. The helper still checks image, datasource and health itself.
    rm -f "${state}/candidate-deploy.log" "${state}/restore-deploy.log"
    "${helper}" finalize "${run}"
    ;;
esac
