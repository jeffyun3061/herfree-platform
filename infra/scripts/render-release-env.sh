#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV="${1:-}"
if [[ "${DEPLOY_ENV}" != "staging" && "${DEPLOY_ENV}" != "production" ]]; then
  echo "usage: render-release-env.sh <staging|production>"
  exit 2
fi

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONFIG_DIR="${HERFREE_CONFIG_DIR:-${APP_DIR}/config}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
SECRET_PREFIX="herfree/${DEPLOY_ENV}"

if [[ "${DEPLOY_ENV}" == "production" ]]; then
  PROFILE="prod"
  ENV_FILE="${CONFIG_DIR}/.env.prod"
else
  PROFILE="staging"
  ENV_FILE="${CONFIG_DIR}/.env.staging"
fi

# 원문 secret은 stdout이나 SSM 결과에 남기지 않고 메모리에서만 조합한다.
APP_JSON="$(aws secretsmanager get-secret-value \
  --region "${AWS_REGION}" --secret-id "${SECRET_PREFIX}/app-config" \
  --query SecretString --output text)"
DB_JSON="$(aws secretsmanager get-secret-value \
  --region "${AWS_REGION}" --secret-id "${SECRET_PREFIX}/db-app" \
  --query SecretString --output text)"
SMTP_JSON="$(aws secretsmanager get-secret-value \
  --region "${AWS_REGION}" --secret-id "${SECRET_PREFIX}/smtp" \
  --query SecretString --output text)"

json_value() {
  local json="$1"
  local path="$2"
  local value
  value="$(printf '%s' "${json}" | jq -er "${path}")"
  if [[ "${value}" == *$'\n'* || "${value}" == *$'\r'* ]]; then
    echo "secret value must be a single line: ${path}"
    exit 1
  fi
  printf '%s' "${value}"
}

DB_HOST="$(json_value "${APP_JSON}" '.dbHost')"
DB_NAME="$(json_value "${DB_JSON}" '.database')"
install -d -m 0700 "${CONFIG_DIR}"
umask 077
TMP_FILE="$(mktemp "${CONFIG_DIR}/.env.${DEPLOY_ENV}.XXXXXX")"
trap 'rm -f "${TMP_FILE}"' EXIT

cat > "${TMP_FILE}" <<EOF
SPRING_PROFILES_ACTIVE=${PROFILE}
SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME}?serverTimezone=UTC&characterEncoding=UTF-8&sslMode=VERIFY_IDENTITY&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12&trustCertificateKeyStoreType=PKCS12&trustCertificateKeyStorePassword=changeit&fallbackToSystemTrustStore=false
SPRING_DATASOURCE_USERNAME=$(json_value "${DB_JSON}" '.username')
SPRING_DATASOURCE_PASSWORD=$(json_value "${DB_JSON}" '.password')
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=5
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=1
SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=10000

JWT_SECRET=$(json_value "${APP_JSON}" '.jwtSecret')
ANALYTICS_HASH_SALT=$(json_value "${APP_JSON}" '.analyticsHashSalt')
HEALTH_DATA_ENCRYPTION_KEY=$(json_value "${APP_JSON}" '.healthDataEncryptionKey')
JWT_ACCESS_EXPIRATION=3600
JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=65.0 -XX:+ExitOnOutOfMemoryError

AWS_REGION=${AWS_REGION}
CLOUDWATCH_LOG_GROUP=$(json_value "${APP_JSON}" '.cloudWatchLogGroup')
CORS_ALLOWED_ORIGINS=$(json_value "${APP_JSON}" '.frontendOrigin')
TRUSTED_PROXY_CIDRS=127.0.0.1/32
ADMIN_ACCESS_ALLOWED_CIDRS=$(json_value "${APP_JSON}" '.adminAccessAllowedCidrs')

S3_BUCKET=$(json_value "${APP_JSON}" '.s3Bucket')
S3_REGION=${AWS_REGION}
S3_PUBLIC_BASE_URL=

APP_RETENTION_EVENT_DAYS=30
APP_RETENTION_RESET_TOKEN_GRACE_DAYS=7
APP_RETENTION_ADMIN_AUDIT_DAYS=90
APP_RETENTION_ROLE_AUDIT_DAYS=90
ADMIN_BOOTSTRAP_ENABLED=false
APP_AUTH_RATE_LIMIT_ENABLED=true

APP_MAIL_MODE=smtp
APP_MAIL_FROM=$(json_value "${SMTP_JSON}" '.from')
SPRING_MAIL_HOST=$(json_value "${SMTP_JSON}" '.host')
SPRING_MAIL_PORT=$(json_value "${SMTP_JSON}" '.port')
SPRING_MAIL_USERNAME=$(json_value "${SMTP_JSON}" '.username')
SPRING_MAIL_PASSWORD=$(json_value "${SMTP_JSON}" '.password')
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=true
PASSWORD_RESET_FRONTEND_BASE_URL=$(json_value "${APP_JSON}" '.frontendOrigin')

OAUTH_KAKAO_CLIENT_ID=$(json_value "${APP_JSON}" '.oauth.kakao.clientId')
OAUTH_KAKAO_CLIENT_SECRET=$(json_value "${APP_JSON}" '.oauth.kakao.clientSecret')
OAUTH_KAKAO_REDIRECT_URI=$(json_value "${APP_JSON}" '.oauth.kakao.redirectUri')
OAUTH_GOOGLE_CLIENT_ID=$(json_value "${APP_JSON}" '.oauth.google.clientId')
OAUTH_GOOGLE_CLIENT_SECRET=$(json_value "${APP_JSON}" '.oauth.google.clientSecret')
OAUTH_GOOGLE_REDIRECT_URI=$(json_value "${APP_JSON}" '.oauth.google.redirectUri')
OAUTH_NAVER_CLIENT_ID=$(json_value "${APP_JSON}" '.oauth.naver.clientId')
OAUTH_NAVER_CLIENT_SECRET=$(json_value "${APP_JSON}" '.oauth.naver.clientSecret')
OAUTH_NAVER_REDIRECT_URI=$(json_value "${APP_JSON}" '.oauth.naver.redirectUri')
EOF

chmod 0600 "${TMP_FILE}"
mv -f "${TMP_FILE}" "${ENV_FILE}"
trap - EXIT

unset APP_JSON DB_JSON SMTP_JSON
"${APP_DIR}/infra/scripts/validate-release-env.sh" "${DEPLOY_ENV}" "${ENV_FILE}"
echo "${DEPLOY_ENV} environment rendered"
