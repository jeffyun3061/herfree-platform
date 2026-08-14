#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV="${1:-}"
ENV_FILE="${2:-}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "environment file not found"
  exit 1
fi

# The release env contains credentials and must only be readable by its owner.
mode="$(stat -c '%a' "${ENV_FILE}")"
mode="${mode: -3}"
if (( (8#${mode} & 8#077) != 0 )); then
  echo "environment file permissions must be 600 or stricter: ${ENV_FILE} (current: ${mode})"
  exit 1
fi

value_of() {
  local key="$1"
  sed -n "s/^${key}=//p" "${ENV_FILE}" | tail -n 1 | tr -d '\r'
}

required=(
  AWS_REGION CLOUDWATCH_LOG_GROUP
  SPRING_PROFILES_ACTIVE DB_RUNTIME SPRING_DATASOURCE_URL SPRING_DATASOURCE_USERNAME
  SPRING_DATASOURCE_PASSWORD JWT_SECRET ANALYTICS_HASH_SALT HEALTH_DATA_ENCRYPTION_KEY CORS_ALLOWED_ORIGINS
  TRUSTED_PROXY_CIDRS ADMIN_ACCESS_ALLOWED_CIDRS S3_BUCKET S3_REGION APP_MAIL_MODE APP_MAIL_FROM
  SPRING_MAIL_HOST SPRING_MAIL_USERNAME SPRING_MAIL_PASSWORD
  PASSWORD_RESET_FRONTEND_BASE_URL OAUTH_KAKAO_CLIENT_ID OAUTH_KAKAO_CLIENT_SECRET
  OAUTH_KAKAO_REDIRECT_URI OAUTH_GOOGLE_CLIENT_ID OAUTH_GOOGLE_CLIENT_SECRET
  OAUTH_GOOGLE_REDIRECT_URI OAUTH_NAVER_CLIENT_ID OAUTH_NAVER_CLIENT_SECRET
  OAUTH_NAVER_REDIRECT_URI
)

for key in "${required[@]}"; do
  value="$(value_of "${key}")"
  if [[ -z "${value}" || "${value}" =~ ^\< || "${value}" =~ [Cc][Hh][Aa][Nn][Gg][Ee]_[Mm][Ee] ]]; then
    echo "invalid or missing environment variable: ${key}"
    exit 1
  fi
done

expected_profile="staging"
if [[ "${DEPLOY_ENV}" == "production" ]]; then
  expected_profile="prod"
fi
if [[ "$(value_of SPRING_PROFILES_ACTIVE)" != "${expected_profile}" ]]; then
  echo "SPRING_PROFILES_ACTIVE must be ${expected_profile}"
  exit 1
fi

jwt_secret="$(value_of JWT_SECRET)"
analytics_salt="$(value_of ANALYTICS_HASH_SALT)"
health_data_key="$(value_of HEALTH_DATA_ENCRYPTION_KEY)"
if [[ ${#jwt_secret} -lt 32 || ${#analytics_salt} -lt 32 ]]; then
  echo "JWT_SECRET and ANALYTICS_HASH_SALT must be at least 32 characters"
  exit 1
fi
if [[ ${#health_data_key} -ne 64 && ${#health_data_key} -lt 43 ]]; then
  echo "HEALTH_DATA_ENCRYPTION_KEY must be 32-byte base64 or 64-character hex"
  exit 1
fi
if [[ "${jwt_secret}" == "${analytics_salt}" ]]; then
  echo "JWT_SECRET and ANALYTICS_HASH_SALT must be different"
  exit 1
fi
if [[ "$(value_of TRUSTED_PROXY_CIDRS)" == *"0.0.0.0/0"* ]]; then
  echo "TRUSTED_PROXY_CIDRS must not trust the entire internet"
  exit 1
fi
admin_access_cidrs="$(value_of ADMIN_ACCESS_ALLOWED_CIDRS)"
if [[ "${admin_access_cidrs}" == *"0.0.0.0/0"* || "${admin_access_cidrs}" == *"::/0"* \
   || "${admin_access_cidrs}" =~ (^|,)[[:space:]]*[^,]+/[[:space:]]*0+[[:space:]]*(,|$) ]]; then
  echo "ADMIN_ACCESS_ALLOWED_CIDRS must be a restricted VPN/admin network"
  exit 1
fi
if [[ "$(value_of CORS_ALLOWED_ORIGINS)" != https://* ]]; then
  echo "CORS_ALLOWED_ORIGINS must use HTTPS"
  exit 1
fi
datasource_url="$(value_of SPRING_DATASOURCE_URL)"
db_runtime="$(value_of DB_RUNTIME)"
case "${db_runtime}" in
  rds)
    if [[ "${datasource_url}" != *"sslMode=VERIFY_IDENTITY"* \
       || "${datasource_url}" != *"trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12"* \
       || "${datasource_url}" != *"fallbackToSystemTrustStore=false"* ]]; then
      echo "RDS datasource must verify the certificate and hostname"
      exit 1
    fi
    ;;
  local)
    if [[ "${datasource_url}" != jdbc:mysql://mysql:3306/* \
       || "${datasource_url}" != *"sslMode=REQUIRED"* \
       || "${datasource_url}" == *"sslMode=DISABLED"* ]]; then
      echo "local datasource must use the private mysql service with required TLS"
      exit 1
    fi
    backup_bucket="$(value_of DB_BACKUP_S3_BUCKET)"
    if [[ ! "${backup_bucket}" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
      echo "local DB runtime requires a valid private backup bucket name"
      exit 1
    fi

    mysql_env_file="${HERFREE_MYSQL_ENV_FILE:-}"
    if [[ -z "${mysql_env_file}" || ! -f "${mysql_env_file}" ]]; then
      echo "local DB runtime requires a dedicated MySQL environment file"
      exit 1
    fi
    mysql_mode="$(stat -c '%a' "${mysql_env_file}")"
    mysql_mode="${mysql_mode: -3}"
    if (( (8#${mysql_mode} & 8#077) != 0 )); then
      echo "MySQL environment file permissions must be 600 or stricter"
      exit 1
    fi

    mysql_value_of() {
      local key="$1"
      sed -n "s/^${key}=//p" "${mysql_env_file}" | tail -n 1 | tr -d '\r'
    }
    for mysql_key in MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD MYSQL_ROOT_PASSWORD; do
      mysql_value="$(mysql_value_of "${mysql_key}")"
      if [[ -z "${mysql_value}" || "${mysql_value}" =~ ^\< || "${mysql_value}" =~ [Cc][Hh][Aa][Nn][Gg][Ee]_[Mm][Ee] ]]; then
        echo "invalid or missing MySQL environment variable: ${mysql_key}"
        exit 1
      fi
    done
    if [[ "$(mysql_value_of MYSQL_PASSWORD)" != "$(value_of SPRING_DATASOURCE_PASSWORD)" ]]; then
      echo "application and MySQL application passwords must match"
      exit 1
    fi
    mysql_root_password="$(mysql_value_of MYSQL_ROOT_PASSWORD)"
    if [[ "${mysql_root_password}" == "$(mysql_value_of MYSQL_PASSWORD)" \
       || ${#mysql_root_password} -lt 16 ]]; then
      echo "MySQL root password must be strong and distinct"
      exit 1
    fi
    ;;
  *)
    echo "DB_RUNTIME must be rds or local"
    exit 1
    ;;
esac
if [[ "$(value_of APP_MAIL_MODE)" != "smtp" ]]; then
  echo "APP_MAIL_MODE must be smtp"
  exit 1
fi
if [[ "$(value_of ADMIN_BOOTSTRAP_ENABLED)" != "false" ]]; then
  echo "ADMIN_BOOTSTRAP_ENABLED must be false for staging and production"
  exit 1
fi
if [[ -n "$(value_of S3_ACCESS_KEY)" || -n "$(value_of S3_SECRET_KEY)" ]]; then
  echo "release env must not contain static S3 credentials; use the instance IAM role"
  exit 1
fi
if [[ "${DEPLOY_ENV}" == "production" && "$(value_of HEALTH_DATA_REKEY_ON_STARTUP)" == "true" ]]; then
  echo "production must not enable HEALTH_DATA_REKEY_ON_STARTUP"
  exit 1
fi
if [[ "${DEPLOY_ENV}" == "production" && "${db_runtime}" == "rds" ]]; then
  datasource_password="$(value_of SPRING_DATASOURCE_PASSWORD)"
  if [[ "${datasource_url}" =~ (localhost|127\.0\.0\.1|herfree-mysql|jdbc:mysql://mysql:) ]]; then
    echo "production datasource must point to the private RDS endpoint, not local MySQL"
    exit 1
  fi
  if [[ "${datasource_password}" == "herfree_pass" || "${datasource_password}" == "root_pass" ]]; then
    echo "production datasource password must not use a local development password"
    exit 1
  fi
fi

echo "${DEPLOY_ENV} environment preflight passed"
