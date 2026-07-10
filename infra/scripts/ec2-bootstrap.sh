#!/usr/bin/env bash
# EC2 Ubuntu 22.04 초기 세팅 — Docker, Compose, Nginx
# 저장소 루트에서: ./infra/scripts/ec2-bootstrap.sh
set -euo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  echo "root 로 실행하지 마세요. ubuntu 사용자로 실행합니다."
  exit 1
fi

echo "==> 패키지 업데이트"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Docker 설치"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "${USER}"
  echo "Docker 그룹 적용을 위해 재로그인이 필요할 수 있습니다."
fi

echo "==> Docker Compose plugin"
if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get install -y docker-compose-plugin
fi

echo "==> Nginx + certbot"
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "==> UFW (SSH + HTTP/HTTPS만)"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw --force enable || true
fi

echo "==> EC2 호스트 타임존 (운영 로그·cron 가독성 — API/DB는 UTC)"
if command -v timedatectl >/dev/null 2>&1; then
  sudo timedatectl set-timezone Asia/Seoul || true
  timedatectl status || true
fi

echo "==> 백업 디렉터리"
mkdir -p infra/scripts/backup

echo ""
echo "다음 단계:"
echo "  1. cp .env.prod.example .env.prod  &&  값 채우기"
echo "  2. ./infra/scripts/deploy-vps.sh"
echo "  3. sudo cp infra/nginx/herfree.conf /etc/nginx/sites-available/herfree-api"
echo "  4. sudo certbot --nginx -d api.도메인"
echo ""
echo "EC2 bootstrap 완료."
