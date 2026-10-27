#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "${CONFIRM_RESTORE_DRILL:-}" == YES ]] || { echo 'Explicit restore-drill confirmation is required'; exit 2; }
: "${STAGING_INSTANCE_ID:?}" "${RESTORE_VOLUME_ID:?}" "${RESTORE_API_IMAGE:?}" "${BACKUP_BUCKET:?}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
DEPLOY_ENV=production
[[ "${RESTORE_API_IMAGE}" =~ ^[0-9]+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9/_-]+@sha256:[a-f0-9]{64}$ ]] || exit 2
imds_token="$(curl --fail --silent --max-time 5 -X PUT -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' http://169.254.169.254/latest/api/token)"
actual_instance="$(curl --fail --silent --max-time 5 -H "X-aws-ec2-metadata-token: ${imds_token}" http://169.254.169.254/latest/meta-data/instance-id)"
unset imds_token
[[ "${actual_instance}" == "${STAGING_INSTANCE_ID}" ]] || { echo 'Restore drills are forbidden on other instances'; exit 1; }
encrypted="$(aws ec2 describe-volumes --region "${AWS_REGION}" --volume-ids "${RESTORE_VOLUME_ID}" --query 'Volumes[0].Encrypted' --output text)"
[[ "${encrypted}" == True ]] || { echo 'Restore volume must be encrypted'; exit 1; }
WORK_ROOT="$(readlink -f "${RESTORE_WORK_ROOT:-/mnt/herfree-restore-drill}")"
[[ "${WORK_ROOT}" == /mnt/herfree-restore-drill ]] && mountpoint -q "${WORK_ROOT}" || { echo 'Dedicated restore mount required'; exit 1; }
WORK_DIR="$(mktemp -d "${WORK_ROOT}/drill.XXXXXX")"
START_EPOCH="${DRILL_START_EPOCH:-$(date -u +%s)}"
[[ "${START_EPOCH}" =~ ^[0-9]+$ ]] || exit 2
NAME="herfree-restore-drill-$(date -u +%s)"
MYSQL_CONTAINER="${NAME}-mysql"
API_CONTAINER="${NAME}-api"
NETWORK="${NAME}-internal"
[[ -z "$(docker ps --filter label=com.docker.compose.project=herfree-staging --format '{{.ID}}')" ]] \
  || { echo 'Normal staging apps must be stopped before temporary recovery access'; exit 1; }
SUCCESS=false
BACKUP_STARTED_EPOCH=0
finish() {
  exit_status=$?
  trap - EXIT
  set +e
  completed="$(date -u +%s)"
  duration=$((completed - START_EPOCH))
  [[ "${SUCCESS}" == true && ${duration} -le 14400 && ${BACKUP_STARTED_EPOCH} -gt 0 && $((START_EPOCH-BACKUP_STARTED_EPOCH)) -ge 0 && $((START_EPOCH-BACKUP_STARTED_EPOCH)) -le 21600 ]] || SUCCESS=false
  jq -n --argjson success "${SUCCESS}" --argjson completed "${completed}" --argjson duration "${duration}" \
    --argjson snapshot "${BACKUP_STARTED_EPOCH}" --argjson start "${START_EPOCH}" '{success:$success,completedEpoch:$completed,recoverySeconds:$duration,backupStartedEpoch:$snapshot,dataLossSeconds:($start-$snapshot)}' > "${WORK_DIR}/result.json"
  aws s3 cp "${WORK_DIR}/result.json" "s3://${BACKUP_BUCKET}/operations/production/restore-drill/last-attempt.json" \
    --region "${AWS_REGION}" --only-show-errors --sse AES256
  report_status=$?
  if [[ "${SUCCESS}" == true && ${report_status} -eq 0 ]]; then
    aws s3 cp "${WORK_DIR}/result.json" "s3://${BACKUP_BUCKET}/operations/production/restore-drill/last-success.json" \
      --region "${AWS_REGION}" --only-show-errors --sse AES256
    report_status=$?
  fi
  docker rm -f "${API_CONTAINER}" "${MYSQL_CONTAINER}" >/dev/null 2>&1
  docker network rm "${NETWORK}" >/dev/null 2>&1
  # WORK_DIR is a mktemp child of the verified dedicated encrypted mount.
  [[ "${WORK_DIR}" == "${WORK_ROOT}/drill."* ]] && rm -rf -- "${WORK_DIR}"
  [[ "${SUCCESS}" == true && ${exit_status} -eq 0 && ${report_status} -eq 0 ]] || exit 1
  echo "Isolated restore passed, including decryption/write-read verification; recoverySeconds=${duration}"
}
trap finish EXIT
key="$(aws s3api list-objects-v2 --region "${AWS_REGION}" --bucket "${BACKUP_BUCKET}" \
  --prefix db-backups/production/frequent/ --query 'sort_by(Contents[?ends_with(Key, `.sql.gz.metadata.json`)], &LastModified)[-1].Key' --output text)"
key="${key%.metadata.json}"
[[ "${key}" == db-backups/production/frequent/*.sql.gz ]] || { echo 'A six-hour production backup is required'; exit 1; }
aws s3 cp "s3://${BACKUP_BUCKET}/${key}" "${WORK_DIR}/backup.sql.gz" --region "${AWS_REGION}" --only-show-errors
aws s3 cp "s3://${BACKUP_BUCKET}/${key}.sha256" "${WORK_DIR}/backup.sql.gz.sha256" --region "${AWS_REGION}" --only-show-errors
aws s3 cp "s3://${BACKUP_BUCKET}/${key}.metadata.json" "${WORK_DIR}/metadata.json" --region "${AWS_REGION}" --only-show-errors
expected_hash="$(awk 'NR==1 {print $1}' "${WORK_DIR}/backup.sql.gz.sha256")"
[[ "${expected_hash}" =~ ^[a-f0-9]{64}$ && "$(sha256sum "${WORK_DIR}/backup.sql.gz" | cut -d ' ' -f 1)" == "${expected_hash}" ]] || { echo 'Backup checksum mismatch'; exit 1; }
gzip -t "${WORK_DIR}/backup.sql.gz"
BACKUP_STARTED_EPOCH="$(jq -er '.backupStartedEpoch | select(type=="number" and .>0)' "${WORK_DIR}/metadata.json")"
KEY_VERSION="$(jq -er '.healthRecoveryVersionId | select(type=="string" and length>0)' "${WORK_DIR}/metadata.json")"
age=$(( START_EPOCH - BACKUP_STARTED_EPOCH ))
(( age >= 0 && age <= 21600 )) || { echo 'Backup exceeds the six-hour recovery target'; exit 1; }
aws secretsmanager get-secret-value --region "${AWS_REGION}" --secret-id herfree/production/health-data-recovery \
  --version-id "${KEY_VERSION}" --query SecretString --output text > "${WORK_DIR}/key.json"
HEALTH_KEY="$(jq -er '.healthDataEncryptionKey' "${WORK_DIR}/key.json")"
MFA_KEY="$(jq -er '.adminMfaEncryptionKey' "${WORK_DIR}/key.json")"
MYSQL_DATABASE="$(jq -er '.database' "${WORK_DIR}/key.json")"
[[ "${MYSQL_DATABASE}" =~ ^[A-Za-z0-9_]+$ && "${MFA_KEY}" =~ ^[A-Za-z0-9+/]{43}=$ ]] || exit 1
[[ "${HEALTH_KEY}" =~ ^[A-Za-z0-9+/]{43}=$ || "${HEALTH_KEY}" =~ ^[a-fA-F0-9]{64}$ ]] || exit 1
ROOT_PASSWORD="$(openssl rand -hex 32)"
DOCKER_CONFIG="${WORK_DIR}/docker-auth"
export DOCKER_CONFIG
registry="${RESTORE_API_IMAGE%%/*}"
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${registry}" >/dev/null 2>&1
docker pull "${RESTORE_API_IMAGE}" >/dev/null
docker pull mysql:8.4.10 >/dev/null
docker network create --internal "${NETWORK}" >/dev/null
mkdir -m 0700 "${WORK_DIR}/mysql" "${WORK_DIR}/verification"
chown 65532:65532 "${WORK_DIR}/verification"
printf 'MYSQL_ROOT_PASSWORD=%s\nMYSQL_DATABASE=%s\n' "${ROOT_PASSWORD}" "${MYSQL_DATABASE}" > "${WORK_DIR}/mysql.env"
docker run -d --name "${MYSQL_CONTAINER}" --network "${NETWORK}" --memory 512m --pids-limit 256 \
  --log-driver none --env-file "${WORK_DIR}/mysql.env" --mount "type=bind,source=${WORK_DIR}/mysql,target=/var/lib/mysql" \
  mysql:8.4.10 --require-secure-transport=ON --innodb-buffer-pool-size=128M --max-connections=10 >/dev/null
ready=false
for _ in {1..90}; do
  if docker exec -e "MYSQL_PWD=${ROOT_PASSWORD}" "${MYSQL_CONTAINER}" mysqladmin ping --host=127.0.0.1 --ssl-mode=REQUIRED --user=root --silent >/dev/null 2>&1; then ready=true; break; fi
  sleep 2
done
[[ "${ready}" == true ]] || { echo 'Restore database startup failed'; exit 1; }
if ! gzip -dc "${WORK_DIR}/backup.sql.gz" | docker exec -i -e "MYSQL_PWD=${ROOT_PASSWORD}" "${MYSQL_CONTAINER}" \
  mysql --host=127.0.0.1 --ssl-mode=REQUIRED --user=root "${MYSQL_DATABASE}" > "${WORK_DIR}/import.log" 2>&1; then
  echo 'Backup import failed; sensitive diagnostic output was not published'; exit 1
fi
# The candidate migrates only the isolated copy of the current production
# backup before Hibernate validates its schema. The container has no route to
# production, and the restored database is destroyed after the drill.
cat > "${WORK_DIR}/verify.env" <<EOF
SPRING_PROFILES_ACTIVE=restore-drill
SPRING_DATASOURCE_URL=jdbc:mysql://${MYSQL_CONTAINER}:3306/${MYSQL_DATABASE}?sslMode=REQUIRED
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=${ROOT_PASSWORD}
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=1
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=1
SPRING_FLYWAY_ENABLED=true
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
HEALTH_DATA_ENCRYPTION_KEY=${HEALTH_KEY}
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_MFA_REQUIRED=true
ADMIN_MFA_ENCRYPTION_KEY=${MFA_KEY}
ADMIN_BOOTSTRAP_ENABLED=false
APP_MAIL_MODE=console
AWS_REGION=${AWS_REGION}
JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=65.0
EOF
unset HEALTH_KEY MFA_KEY ROOT_PASSWORD
docker run -d --name "${API_CONTAINER}" --network "${NETWORK}" --memory 768m --pids-limit 256 \
  --read-only --cap-drop ALL --security-opt no-new-privileges:true --log-driver none \
  --tmpfs /tmp:size=64m,mode=1777 --env-file "${WORK_DIR}/verify.env" \
  --mount "type=bind,source=${WORK_DIR}/verification,target=/verification" \
  --entrypoint /bin/sh "${RESTORE_API_IMAGE}" \
  -c 'exec java -Duser.timezone=UTC -jar /app/app.jar > /verification/app.log 2>&1' >/dev/null
status="$(timeout 600 docker wait "${API_CONTAINER}")" || status=timeout
if [[ "${status}" != 0 || ! -f "${WORK_DIR}/verification/success" ]]; then
  # JVM logs exist only on the dedicated encrypted mount and are deleted during
  # cleanup. Publish only fixed labels, never restored data or exception messages.
  reason=unknown
  for item in OutOfMemoryError BeanCreationException BeanInstantiationException \
      SQLSyntaxErrorException SQLIntegrityConstraintViolationException CommunicationsException \
      JdbcSQLSyntaxErrorException HibernateException IllegalStateException AccessDeniedException; do
    if [[ -f "${WORK_DIR}/verification/app.log" ]] && \
        grep -Fq "$item" "${WORK_DIR}/verification/app.log"; then reason="$item"; break; fi
  done
  echo "Restored application verification failed; exit=${status}; category=${reason}"
  exit 1
fi
SUCCESS=true
