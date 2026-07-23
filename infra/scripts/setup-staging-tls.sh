#!/usr/bin/env bash
# Idempotent: nginx reverse proxy + Let's Encrypt for api-staging.herpfree.co.kr
set -euo pipefail

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
CONF_SRC="${APP_DIR}/infra/nginx/herfree-staging.conf"
CONF_NAME="herfree-staging-api"
DOMAIN="api-staging.herpfree.co.kr"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
CONTACT_EMAIL="${HERFREE_TLS_CONTACT_EMAIL:-herpfree3@gmail.com}"

if [[ ! -f "${CONF_SRC}" ]]; then
  echo "nginx config missing: ${CONF_SRC}"
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx
fi

install -d -m 0755 /etc/nginx/sites-available /etc/nginx/sites-enabled
cp "${CONF_SRC}" "/etc/nginx/sites-available/${CONF_NAME}"
ln -sf "/etc/nginx/sites-available/${CONF_NAME}" "/etc/nginx/sites-enabled/${CONF_NAME}"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl start nginx

if [[ ! -f "${CERT_PATH}" ]]; then
  certbot --nginx -d "${DOMAIN}" \
    --non-interactive --agree-tos --email "${CONTACT_EMAIL}" --redirect --no-eff-email
else
  certbot renew --quiet || true
fi

nginx -t
systemctl reload nginx
echo "staging TLS ready for ${DOMAIN}"
