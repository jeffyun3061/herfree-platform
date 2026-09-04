#!/usr/bin/env bash
# Idempotent production TLS: repo-owned nginx config + certbot certonly (webroot).
set -euo pipefail

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONF_SRC="${APP_DIR}/infra/nginx/herfree-production.conf"
BOOTSTRAP_SRC="${APP_DIR}/infra/nginx/herfree-production-bootstrap.conf"
CONF_NAME="herfree-production-api"
DOMAIN="api.herpfree.co.kr"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
WEBROOT="/var/www/certbot"
CONTACT_EMAIL="${HERFREE_TLS_CONTACT_EMAIL:-herpfree3@gmail.com}"

if [[ ! -f "${CONF_SRC}" || ! -f "${BOOTSTRAP_SRC}" ]]; then
  echo "nginx config missing under ${APP_DIR}/infra/nginx/"
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot
fi

install -d -m 0755 /etc/nginx/sites-available /etc/nginx/sites-enabled "${WEBROOT}"

rm -f /etc/nginx/sites-enabled/default

install_nginx_config() {
  local source_path="$1"
  cp "${source_path}" "/etc/nginx/sites-available/${CONF_NAME}"
  ln -sf "/etc/nginx/sites-available/${CONF_NAME}" "/etc/nginx/sites-enabled/${CONF_NAME}"
}

systemctl enable nginx
systemctl start nginx

if [[ ! -f "${CERT_PATH}" ]]; then
  install_nginx_config "${BOOTSTRAP_SRC}"
  nginx -t
  systemctl reload nginx

  certbot certonly --webroot -w "${WEBROOT}" -d "${DOMAIN}" \
    --non-interactive --agree-tos --email "${CONTACT_EMAIL}" --no-eff-email
fi

install_nginx_config "${CONF_SRC}"
nginx -t
systemctl reload nginx

# The host's certbot timer may already be renewing the certificate while a
# release is being deployed.  Lock contention is safe to ignore because the
# existing certificate remains valid; genuine renewal failures must still
# fail the deployment so they are not hidden.
renew_output="$(mktemp)"
if certbot renew --quiet >"${renew_output}" 2>&1; then
  :
elif grep -qi "Another instance of Certbot is already running" "${renew_output}"; then
  echo "certbot renewal already running; keeping the existing certificate"
else
  cat "${renew_output}" >&2
  rm -f "${renew_output}"
  exit 1
fi
rm -f "${renew_output}"

nginx -t
systemctl reload nginx
echo "production TLS ready for ${DOMAIN} (repo nginx + certonly webroot)"
