# Herfree 로컬 실행 안내 (원본: C:\dev\herfree-platform)
# 사용법: .\scripts\start-local.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host ""
Write-Host "=== Herfree 로컬 실행 ===" -ForegroundColor Cyan
Write-Host "원본 경로: $RepoRoot" -ForegroundColor Green
Write-Host ""
Write-Host "터미널 1 — MySQL" -ForegroundColor Yellow
Write-Host "  cd $RepoRoot"
Write-Host "  docker compose -f docker-compose.local.yml up -d"
Write-Host ""
Write-Host "터미널 2 — Backend (:8080)" -ForegroundColor Yellow
Write-Host "  cd $RepoRoot\backend"
Write-Host "  .\gradlew bootRun"
Write-Host ""
Write-Host "터미널 3 — Frontend (:3000)" -ForegroundColor Yellow
Write-Host "  cd $RepoRoot\frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "데모/검수용 안정 실행:" -ForegroundColor DarkGray
Write-Host "  cd $RepoRoot"
Write-Host "  .\scripts\start-frontend-stable.ps1"
Write-Host ""
Write-Host "ngrok 모바일 데모:" -ForegroundColor DarkGray
Write-Host "  cd $RepoRoot"
Write-Host "  .\scripts\ngrok-demo.ps1"
Write-Host ""
