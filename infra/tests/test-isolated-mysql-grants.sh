#!/usr/bin/env bash
# Verify MySQL's actual grant semantics using a throwaway, network-isolated container.
set -euo pipefail
cid="$(docker run -d --network none -e MYSQL_ROOT_PASSWORD=test-root-password-for-ci mysql:8.4.10)"
cleanup() { docker rm -f "${cid}" >/dev/null 2>&1 || true; }
trap cleanup EXIT
ready=false
for ((attempt=0; attempt<60; attempt++)); do
  # The image briefly runs a socket-only initialization server. Wait for the
  # final TCP listener so it cannot disappear between readiness and setup.
  if docker exec "${cid}" mysqladmin --protocol=TCP -h127.0.0.1 ping -uroot --password=test-root-password-for-ci --silent >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done
[[ "${ready}" == true ]] || { echo 'temporary MySQL did not start' >&2; exit 1; }
docker exec -i "${cid}" mysql -uroot --password=test-root-password-for-ci <<'SQL'
CREATE DATABASE hfqaa1b2c3d4;
CREATE DATABASE hfqaXa1b2c3d4;
CREATE USER 'hfqaa1b2c3d4'@'%' IDENTIFIED BY 'test-qa-only-password';
GRANT ALL PRIVILEGES ON `hfqaa1b2c3d4`.* TO 'hfqaa1b2c3d4'@'%';
SQL
docker exec "${cid}" mysql -h127.0.0.1 -uhfqaa1b2c3d4 --password=test-qa-only-password \
  -e 'CREATE TABLE hfqaa1b2c3d4.allowed (id INT)'
if docker exec "${cid}" mysql -h127.0.0.1 -uhfqaa1b2c3d4 --password=test-qa-only-password \
    -e 'CREATE TABLE hfqaXa1b2c3d4.forbidden (id INT)' >/dev/null 2>&1; then
  echo 'QA account unexpectedly accessed another schema' >&2
  exit 1
fi
echo 'isolated MySQL grant checks passed'
