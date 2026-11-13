#!/usr/bin/env bash
# Called only by the protected production workflow after evidence verification.
set -euo pipefail
: "${TESTED_DIGEST:?}" "${GITHUB_SHA:?}" "${GITHUB_REF:?}" "${GITHUB_REPOSITORY:?}" "${GITHUB_ACTIONS:?}"
[[ "$GITHUB_ACTIONS" == true && "$GITHUB_REPOSITORY" == jeffyun3061/herfree-platform && "$GITHUB_REF" == refs/heads/main ]]
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ && "$TESTED_DIGEST" =~ ^sha256:[a-f0-9]{64}$ ]]
test "$(aws sts get-caller-identity --query Account --output text)" = 439777528445
test "$(aws ecr describe-repositories --repository-names herfree-api --query 'repositories[0].imageTagMutability' --output text)" = IMMUTABLE
candidate="$(aws ecr describe-images --repository-name herfree-api --image-ids imageTag=108abbd0ad5515f4f190bfdadf86c980f132742e --query 'imageDetails[0].imageDigest' --output text)"
test "$candidate" = "$TESTED_DIGEST"
result="$(aws ecr batch-get-image --repository-name herfree-api --image-ids imageDigest="$TESTED_DIGEST" --output json)"
manifest="$(mktemp)"
trap 'rm -f "$manifest"' EXIT
jq -er --arg digest "$TESTED_DIGEST" 'select((.images|length)==1 and (.failures|length)==0 and .images[0].imageId.imageDigest==$digest) | .images[0].imageManifest' <<<"$result" > "$manifest"
for tag in "$GITHUB_SHA" "staging-passed-$GITHUB_SHA"; do
  test "$GITHUB_SHA" = "$(git ls-remote origin refs/heads/main | cut -f1)"
  existing="$(aws ecr batch-get-image --repository-name herfree-api --image-ids imageTag="$tag" --output json)"
  if jq -e --arg digest "$TESTED_DIGEST" '(.images|length)==1 and (.failures|length)==0 and .images[0].imageId.imageDigest==$digest' <<<"$existing" >/dev/null; then
    continue
  fi
  jq -e '(.images|length)==0 and (.failures|length)==1 and .failures[0].failureCode=="ImageNotFound"' <<<"$existing" >/dev/null
  aws ecr put-image --repository-name herfree-api --image-tag "$tag" --image-digest "$TESTED_DIGEST" --image-manifest "file://$manifest" >/dev/null
done
echo 'The exact tested image is marked. Production deployment has not started.'
