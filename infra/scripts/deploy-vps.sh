#!/usr/bin/env bash
# VPS 배포 — 저장소 루트에서 실행: ./infra/scripts/deploy-vps.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f .env.prod ]]; then
  echo ".env.prod 가 없습니다. .env.prod.example 을 복사해 값을 채워 주세요."
  exit 1
fi

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "waiting for health..."
for i in {1..30}; do
  if curl -sf http://127.0.0.1:8080/actuator/health >/dev/null; then
    echo "API healthy"
    exit 0
  fi
  sleep 2
done

echo "health check failed — docker logs herfree-api-prod 를 확인하세요."
exit 1
