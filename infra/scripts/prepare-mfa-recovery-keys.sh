#!/usr/bin/env bash
# Run with a trusted operator identity before the first MFA release. Never prints secret values.
set -euo pipefail
umask 077
DEPLOY_ENV="${1:-}"
[[ "${DEPLOY_ENV}" == staging || "${DEPLOY_ENV}" == production ]] || exit 2
[[ "${CONFIRM_MFA_KEY_PREPARATION:-}" == YES ]] || { echo 'Explicit key preparation confirmation required'; exit 2; }
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
WORK="$(mktemp -d)"
trap 'rm -rf -- "${WORK}"' EXIT
prefix="herfree/${DEPLOY_ENV}"
aws secretsmanager get-secret-value --region "${AWS_REGION}" --secret-id "${prefix}/app-config" --query SecretString --output text > "${WORK}/app.json"
aws secretsmanager get-secret-value --region "${AWS_REGION}" --secret-id "${prefix}/db-app" --query SecretString --output text > "${WORK}/db.json"
exists=false
if aws secretsmanager get-secret-value --region "${AWS_REGION}" --secret-id "${prefix}/health-data-recovery" --query SecretString --output text > "${WORK}/existing.json" 2> "${WORK}/error"; then
  exists=true
elif ! grep -q ResourceNotFoundException "${WORK}/error"; then
  echo 'Recovery secret lookup failed; no secrets changed'; exit 1
fi
changed=false
if ! jq -e '.adminMfaEncryptionKey | type=="string" and length>0' "${WORK}/app.json" >/dev/null; then
  key=""
  if [[ "${exists}" == true ]]; then key="$(jq -r '.adminMfaEncryptionKey // empty' "${WORK}/existing.json")"; fi
  if [[ -z "${key}" ]]; then key="$(openssl rand -base64 32)"; fi
  jq --arg key "${key}" '.adminMfaEncryptionKey=$key' "${WORK}/app.json" > "${WORK}/updated.json"
  mv "${WORK}/updated.json" "${WORK}/app.json"
  unset key
  changed=true
fi
jq -e '.adminMfaEncryptionKey | test("^[A-Za-z0-9+/]{43}=$")' "${WORK}/app.json" >/dev/null
jq -e '.healthDataEncryptionKey | test("^([A-Za-z0-9+/]{43}=|[a-fA-F0-9]{64})$")' "${WORK}/app.json" >/dev/null
jq -e '.adminMfaEncryptionKey != .healthDataEncryptionKey and .adminMfaEncryptionKey != .jwtSecret' "${WORK}/app.json" >/dev/null
# Preserve the established db-app database name; recovery contains no live DB password.
database="$(jq -er '.dbname // .database // .dbName' "${WORK}/db.json")"
[[ "${database}" =~ ^[A-Za-z0-9_]+$ ]] || exit 1
jq --arg database "${database}" '{healthDataEncryptionKey,adminMfaEncryptionKey,database:$database}' "${WORK}/app.json" > "${WORK}/recovery.json"
if [[ "${exists}" == true ]]; then
  jq -e --slurpfile old "${WORK}/existing.json" '.healthDataEncryptionKey==$old[0].healthDataEncryptionKey and .database==$old[0].database and ($old[0].adminMfaEncryptionKey==null or .adminMfaEncryptionKey==$old[0].adminMfaEncryptionKey)' "${WORK}/recovery.json" >/dev/null || { echo 'Existing recovery keys differ. Refusing rotation.'; exit 1; }
fi
if [[ "${exists}" == false ]]; then
  aws secretsmanager create-secret --region "${AWS_REGION}" --name "${prefix}/health-data-recovery" --secret-string "file://${WORK}/recovery.json" >/dev/null
elif ! jq -e --slurpfile old "${WORK}/existing.json" '.==$old[0]' "${WORK}/recovery.json" >/dev/null; then
  aws secretsmanager put-secret-value --region "${AWS_REGION}" --secret-id "${prefix}/health-data-recovery" --secret-string "file://${WORK}/recovery.json" >/dev/null
fi
if [[ "${changed}" == true ]]; then
  aws secretsmanager put-secret-value --region "${AWS_REGION}" --secret-id "${prefix}/app-config" --secret-string "file://${WORK}/app.json" >/dev/null
fi
echo "Independent MFA key and matching versioned recovery secret prepared for ${DEPLOY_ENV}; existing health key preserved."
