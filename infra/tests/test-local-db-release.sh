#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK_DIR="$(mktemp -d)"
trap '[[ "${WORK_DIR}" == /tmp/* ]] && rm -rf "${WORK_DIR}"' EXIT

APP_ENV="${WORK_DIR}/app.env"
MYSQL_ENV="${WORK_DIR}/mysql.env"

write_common_env() {
  cat > "${APP_ENV}" <<'EOF'
SPRING_PROFILES_ACTIVE=prod
DB_RUNTIME=local
DB_BACKUP_S3_BUCKET=herfree-test-db-backups
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/herfree_db?serverTimezone=UTC&characterEncoding=UTF-8&sslMode=REQUIRED
SPRING_DATASOURCE_USERNAME=herfree_user
SPRING_DATASOURCE_PASSWORD=test-app-password-1234567890
JWT_SECRET=test-jwt-secret-that-is-at-least-32-characters
ANALYTICS_HASH_SALT=test-analytics-salt-that-is-at-least-32-characters
HEALTH_DATA_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
CORS_ALLOWED_ORIGINS=https://herpfree.co.kr
TRUSTED_PROXY_CIDRS=127.0.0.1/32
ADMIN_ACCESS_ALLOWED_CIDRS=10.0.0.0/24
AWS_REGION=ap-northeast-2
CLOUDWATCH_LOG_GROUP=/herfree/test
S3_BUCKET=herfree-test-uploads
S3_REGION=ap-northeast-2
S3_ACCESS_KEY=
S3_SECRET_KEY=
ADMIN_BOOTSTRAP_ENABLED=false
APP_MAIL_MODE=smtp
APP_MAIL_FROM=test@example.com
SPRING_MAIL_HOST=email-smtp.ap-northeast-2.amazonaws.com
SPRING_MAIL_USERNAME=test-smtp-user
SPRING_MAIL_PASSWORD=test-smtp-password
PASSWORD_RESET_FRONTEND_BASE_URL=https://herpfree.co.kr
OAUTH_KAKAO_CLIENT_ID=test-kakao-id
OAUTH_KAKAO_CLIENT_SECRET=test-kakao-secret
OAUTH_KAKAO_REDIRECT_URI=https://herpfree.co.kr/auth/callback/kakao
OAUTH_GOOGLE_CLIENT_ID=test-google-id
OAUTH_GOOGLE_CLIENT_SECRET=test-google-secret
OAUTH_GOOGLE_REDIRECT_URI=https://herpfree.co.kr/auth/callback/google
OAUTH_NAVER_CLIENT_ID=test-naver-id
OAUTH_NAVER_CLIENT_SECRET=test-naver-secret
OAUTH_NAVER_REDIRECT_URI=https://herpfree.co.kr/auth/callback/naver
HEALTH_DATA_REKEY_ON_STARTUP=false
EOF
  chmod 600 "${APP_ENV}"
  cat > "${MYSQL_ENV}" <<'EOF'
MYSQL_DATABASE=herfree_db
MYSQL_USER=herfree_user
MYSQL_PASSWORD=test-app-password-1234567890
MYSQL_ROOT_PASSWORD=test-root-password-abcdefghijklmnopqrstuvwxyz
EOF
  chmod 600 "${MYSQL_ENV}"
}

write_common_env
HERFREE_MYSQL_ENV_FILE="${MYSQL_ENV}" \
  "${ROOT}/infra/scripts/validate-release-env.sh" production "${APP_ENV}" >/dev/null

sed -i 's/sslMode=REQUIRED/sslMode=DISABLED/' "${APP_ENV}"
if HERFREE_MYSQL_ENV_FILE="${MYSQL_ENV}" \
    "${ROOT}/infra/scripts/validate-release-env.sh" production "${APP_ENV}" >/dev/null 2>&1; then
  echo "validator accepted disabled local MySQL TLS" >&2
  exit 1
fi

write_common_env
sed -i 's/DB_RUNTIME=local/DB_RUNTIME=rds/' "${APP_ENV}"
sed -i 's#DB_BACKUP_S3_BUCKET=herfree-test-db-backups#DB_BACKUP_S3_BUCKET=#' "${APP_ENV}"
sed -i 's#jdbc:mysql://mysql:3306/herfree_db?serverTimezone=UTC&characterEncoding=UTF-8&sslMode=REQUIRED#jdbc:mysql://example.ap-northeast-2.rds.amazonaws.com:3306/herfree_db?serverTimezone=UTC\&characterEncoding=UTF-8\&sslMode=VERIFY_IDENTITY\&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12\&fallbackToSystemTrustStore=false#' "${APP_ENV}"
HERFREE_MYSQL_ENV_FILE="${MYSQL_ENV}" \
  "${ROOT}/infra/scripts/validate-release-env.sh" production "${APP_ENV}" >/dev/null

write_common_env
sed -i 's/test-root-password-abcdefghijklmnopqrstuvwxyz/test-app-password-1234567890/' "${MYSQL_ENV}"
if HERFREE_MYSQL_ENV_FILE="${MYSQL_ENV}" \
    "${ROOT}/infra/scripts/validate-release-env.sh" production "${APP_ENV}" >/dev/null 2>&1; then
  echo "validator accepted a reused MySQL root password" >&2
  exit 1
fi

if "${ROOT}/infra/scripts/preflight-rds-local-restore.sh" production >/dev/null 2>&1; then
  echo "RDS restore preflight ran without explicit confirmation" >&2
  exit 1
fi

echo "local DB release validation tests passed"
