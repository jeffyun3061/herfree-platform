#!/usr/bin/env bash
# All AWS/Git calls below are fakes; this never contacts AWS or a remote Git server.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
mkdir -p "$tmp/bin"
export TEST_LOG="$tmp/calls" TESTED_DIGEST="sha256:$(printf 'a%.0s' {1..64})"
export GITHUB_SHA="$(printf 'b%.0s' {1..40})" GITHUB_REF=refs/heads/main
export GITHUB_ACTIONS=true GITHUB_REPOSITORY=jeffyun3061/herfree-platform
cat > "$tmp/bin/aws" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
case "$1:$2" in
  sts:get-caller-identity) echo "${FAKE_ACCOUNT:-439777528445}" ;;
  ecr:describe-repositories) echo "${FAKE_MUTABILITY:-IMMUTABLE}" ;;
  ecr:describe-images) echo "${FAKE_DIGEST:-$TESTED_DIGEST}" ;;
  ecr:batch-get-image)
    if [[ " $* " == *" imageDigest="* ]]; then
      jq -n --arg d "$TESTED_DIGEST" '{images:[{imageId:{imageDigest:$d},imageManifest:"{}"}],failures:[]}'
    elif [[ "${FAKE_EXISTING:-missing}" == same ]]; then
      jq -n --arg d "$TESTED_DIGEST" '{images:[{imageId:{imageDigest:$d}}],failures:[]}'
    elif [[ "${FAKE_EXISTING:-missing}" == other ]]; then
      jq -n --arg d "sha256:$(printf 'f%.0s' {1..64})" '{images:[{imageId:{imageDigest:$d}}],failures:[]}'
    else
      echo '{"images":[],"failures":[{"failureCode":"ImageNotFound"}]}'
    fi ;;
  ecr:put-image)
    [[ " $* " == *" --image-digest $TESTED_DIGEST "* ]] || exit 9
    [[ " $* " == *" --image-tag $GITHUB_SHA "* || " $* " == *" --image-tag staging-passed-$GITHUB_SHA "* ]] || exit 9
    echo put >> "$TEST_LOG" ;;
  *) echo 'unexpected AWS call' >&2; exit 9 ;;
esac
EOF
cat > "$tmp/bin/git" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == ls-remote && "$2" == origin && "$3" == refs/heads/main ]] || exit 9
printf '%s\trefs/heads/main\n' "${FAKE_MAIN:-$GITHUB_SHA}"
EOF
chmod +x "$tmp/bin/aws" "$tmp/bin/git"
export PATH="$tmp/bin:$PATH"
script="$root/infra/scripts/promote-tested-pr206.sh"
: > "$TEST_LOG"
bash "$script" >/dev/null
[[ "$(wc -l < "$TEST_LOG")" -eq 2 ]]
: > "$TEST_LOG"
FAKE_EXISTING=same bash "$script" >/dev/null
[[ ! -s "$TEST_LOG" ]]
for setting in 'FAKE_ACCOUNT=000000000000' 'FAKE_MUTABILITY=MUTABLE' \
  "FAKE_DIGEST=sha256:$(printf 'c%.0s' {1..64})" "FAKE_MAIN=$(printf 'd%.0s' {1..40})" \
  'GITHUB_REF=refs/heads/other' 'FAKE_EXISTING=other'; do
  : > "$TEST_LOG"
  if env "$setting" bash "$script" >/dev/null 2>&1; then
    echo "unexpected success: $setting" >&2; exit 1
  fi
  [[ ! -s "$TEST_LOG" ]]
done
echo 'promotion refuses unsafe targets and preserves the tested digest'
