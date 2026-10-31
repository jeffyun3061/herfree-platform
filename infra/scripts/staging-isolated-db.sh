#!/usr/bin/env bash
# Prepare and reconcile a disposable staging database. This tool does not
# deploy, create promotion tags, start/stop instances, or touch production.
set -euo pipefail
umask 077

mode="${1:-}"
run="${2:-}"
if [[ ! "${mode}" =~ ^(prepare|restore-config|finalize)$ || ! "${run}" =~ ^[a-f0-9]{8}$ ]]; then
  echo 'usage: staging-isolated-db.sh <prepare|restore-config|finalize> <8 lowercase hex characters>' >&2
  exit 2
fi

app="${HERFREE_APP_DIR:-/opt/herfree}"
config="${app}/config/.env.staging"
mysql_env="${app}/config/.env.mysql.staging"
state_root="${app}/.deploy"
state="${state_root}/isolated-${run}"
database="hfqa_${run}"
current_image="${state_root}/staging.current-image"
pending="${state_root}/staging.pending-operation"
[[ -f "${config}" && -f "${mysql_env}" ]] || { echo 'staging configuration missing' >&2; exit 1; }
value_of() { sed -n "s/^${2}=//p" "$1" | tail -1 | tr -d '\r'; }
[[ "$(value_of "${config}" SPRING_PROFILES_ACTIVE)" == staging ]] || { echo 'staging profile required' >&2; exit 1; }
[[ "$(value_of "${config}" DB_RUNTIME)" == local ]] || { echo 'local staging database required' >&2; exit 1; }
for file in "${config}" "${mysql_env}"; do
  perm="$(stat -c '%a' "${file}")"; perm="${perm: -3}"
  (( (8#${perm} & 8#077) == 0 )) || { echo 'staging configuration permissions unsafe' >&2; exit 1; }
done

mkdir -p -m 700 "${state_root}"
[[ ! -L "${state_root}" && ! -L "${state}" ]] || { echo 'state path must not be a symlink' >&2; exit 1; }
exec 9>"${state_root}/staging.lock"
flock -n 9 || { echo 'staging release operation in progress' >&2; exit 1; }
[[ ! -e "${pending}" ]] || { echo 'unfinished staging deployment requires reconciliation' >&2; exit 1; }

mysql="$(docker ps --filter label=com.docker.compose.project=herfree-staging --filter label=com.docker.compose.service=mysql --format '{{.ID}}')"
[[ -n "${mysql}" && "$(printf '%s\n' "${mysql}" | wc -l)" -eq 1 ]] || { echo 'staging MySQL identity unconfirmed' >&2; exit 1; }
ports="$(docker inspect --format '{{json .HostConfig.PortBindings}}' "${mysql}")"
[[ "${ports}" == '{}' || "${ports}" == null ]] || { echo 'staging MySQL must not publish ports' >&2; exit 1; }
mysql_root() { docker exec -i "${mysql}" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --batch --skip-column-names'; }

if [[ "${mode}" == prepare ]]; then
  shopt -s nullglob
  active=("${state_root}"/isolated-????????)
  (( ${#active[@]} == 0 )) || { echo 'another isolated staging run requires reconciliation' >&2; exit 1; }
  api="$(docker ps --filter label=com.docker.compose.project=herfree-staging --filter label=com.docker.compose.service=api --format '{{.ID}}')"
  [[ -n "${api}" && "$(printf '%s\n' "${api}" | wc -l)" -eq 1 ]] || { echo 'staging API identity unconfirmed' >&2; exit 1; }
  api_env="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "${api}")"
  printf '%s\n' "${api_env}" | grep -qx 'SPRING_PROFILES_ACTIVE=staging' || { echo 'running API is not staging' >&2; exit 1; }
  printf '%s\n' "${api_env}" | grep -qx 'DB_RUNTIME=local' || { echo 'running API does not use local MySQL' >&2; exit 1; }
  printf '%s\n' "${api_env}" | grep -q '^SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/' || { echo 'running API datasource is not staging MySQL' >&2; exit 1; }
  unset api_env
  api_net="$(docker inspect --format '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "${api}" | sort)"
  mysql_net="$(docker inspect --format '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "${mysql}" | sort)"
  [[ -n "${mysql_net}" ]] && printf '%s\n' "${api_net}" | grep -Fx "${mysql_net}" >/dev/null || { echo 'staging API and MySQL networks differ' >&2; exit 1; }
  [[ ! -e "${state}" && -s "${current_image}" ]] || { echo 'run exists or current staging image is missing' >&2; exit 1; }
  user="$(value_of "${mysql_env}" MYSQL_USER)"
  [[ "${user}" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo 'invalid staging DB user' >&2; exit 1; }
  url="$(value_of "${config}" SPRING_DATASOURCE_URL)"
  [[ "${url}" == jdbc:mysql://mysql:3306/*sslMode=REQUIRED* ]] || { echo 'unsafe staging datasource' >&2; exit 1; }
  qa_url="$(printf '%s' "${url}" | sed "s@^\(jdbc:mysql://mysql:3306/\)[^?]*@\1${database}@")"
  [[ "${qa_url}" != "${url}" ]] || { echo 'cannot form isolated datasource' >&2; exit 1; }
  existing="$(printf "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='%s';\n" "${database}" | mysql_root)"
  [[ "${existing}" == 0 ]] || { echo 'isolated database name already exists' >&2; exit 1; }
  DEPLOY_ENV=staging HERFREE_APP_DIR="${app}" "${app}/infra/scripts/backup-db.sh" predeploy >/dev/null 2>&1 || { echo 'staging pre-deployment backup failed' >&2; exit 1; }
  mkdir -m 700 "${state}"
  cp "${config}" "${state}/original-env"
  cp "${current_image}" "${state}/original-image"
  chmod 600 "${state}/original-env" "${state}/original-image"
  printf '%s\n' "${user}" > "${state}/db-user"
  # Write intent before mutation. If interrupted before the created marker is
  # durable, automatic cleanup must refuse and require manual reconciliation.
  : > "${state}/create-intent"
  printf 'CREATE DATABASE `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n' "${database}" | mysql_root
  : > "${state}/db-created"
  printf "GRANT ALL PRIVILEGES ON \`%s\`.* TO '%s'@'%%';\n" "${database}" "${user}" | mysql_root
  : > "${state}/grant-created"
  cp "${state}/original-env" "${state}/qa-env"
  printf '\nSPRING_DATASOURCE_URL=%s\nADMIN_ACCESS_ALLOWED_CIDRS=127.0.0.1/32\n' "${qa_url}" >> "${state}/qa-env"
  chmod 600 "${state}/qa-env"
  # Refuse to overwrite a config edited concurrently after the initial copy.
  cmp -s "${config}" "${state}/original-env" || { echo 'staging configuration changed; reconciliation required' >&2; exit 1; }
  install -m 600 "${state}/qa-env" "${config}"
  : > "${state}/prepared"
  echo 'isolated staging DB prepared; promotion is not authorized'
  exit 0
fi

[[ -d "${state}" && -f "${state}/original-env" && -s "${state}/original-image" ]] || { echo 'matching staging isolation record missing' >&2; exit 1; }
if [[ "${mode}" == restore-config ]]; then
  if ! cmp -s "${config}" "${state}/original-env"; then
    [[ -f "${state}/qa-env" ]] && cmp -s "${config}" "${state}/qa-env" || { echo 'staging configuration changed; refusing overwrite' >&2; exit 1; }
    install -m 600 "${state}/original-env" "${config}"
  fi
  : > "${state}/config-restored"
  echo 'staging configuration restored; restore the recorded image before finalizing'
  exit 0
fi

[[ -f "${state}/config-restored" ]] && cmp -s "${config}" "${state}/original-env" || { echo 'restore original staging configuration first' >&2; exit 1; }
[[ -s "${current_image}" && "$(tr -d '\r\n' < "${current_image}")" == "$(tr -d '\r\n' < "${state}/original-image")" ]] || { echo 'original staging image has not been restored' >&2; exit 1; }
api="$(docker ps --filter label=com.docker.compose.project=herfree-staging --filter label=com.docker.compose.service=api --format '{{.ID}}')"
[[ -n "${api}" && "$(printf '%s\n' "${api}" | wc -l)" -eq 1 ]] || { echo 'restored staging API identity unconfirmed' >&2; exit 1; }
[[ "$(docker inspect --format '{{.Config.Image}}' "${api}")" == "$(tr -d '\r\n' < "${state}/original-image")" ]] || { echo 'running API is not the recorded image' >&2; exit 1; }
original_url="$(value_of "${state}/original-env" SPRING_DATASOURCE_URL)"
api_env="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "${api}")"
printf '%s\n' "${api_env}" | grep -Fx -- "SPRING_DATASOURCE_URL=${original_url}" >/dev/null || { echo 'running API is not using the original datasource' >&2; exit 1; }
printf '%s\n' "${api_env}" | grep -qx 'SPRING_PROFILES_ACTIVE=staging' || { echo 'running API is not staging' >&2; exit 1; }
unset api_env
curl --fail --silent --max-time 3 http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || { echo 'restored staging service is not healthy' >&2; exit 1; }
if [[ -f "${state}/create-intent" && ! -f "${state}/db-created" ]]; then
  echo 'database creation outcome unknown; manual reconciliation required' >&2
  exit 1
fi
if [[ -f "${state}/db-created" ]]; then
  user="$(tr -d '\r\n' < "${state}/db-user")"
  [[ "${user}" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo 'recorded DB user invalid' >&2; exit 1; }
  # The name was checked absent immediately before creation; never target any
  # other database or global privilege. A partial revoke is safe to retry.
  grants="$(printf "SELECT COUNT(*) FROM information_schema.schema_privileges WHERE table_schema='%s' AND grantee=CONCAT(CHAR(39),'%s',CHAR(39),'@',CHAR(39),'%%',CHAR(39));\n" "${database}" "${user}" | mysql_root)"
  [[ "${grants}" =~ ^[0-9]+$ ]] || { echo 'schema grant state unknown' >&2; exit 1; }
  if (( grants > 0 )); then
    printf "REVOKE ALL PRIVILEGES ON \`%s\`.* FROM '%s'@'%%';\n" "${database}" "${user}" | mysql_root
  fi
  printf 'DROP DATABASE IF EXISTS `%s`;\n' "${database}" | mysql_root
fi
rm -f "${state}/original-env" "${state}/original-image" "${state}/db-user" "${state}/create-intent" "${state}/db-created" "${state}/grant-created" "${state}/qa-env" "${state}/prepared" "${state}/config-restored"
rmdir "${state}"
echo 'isolated staging DB and grant removed; promotion is not authorized'
