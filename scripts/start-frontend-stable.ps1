# Herfree 프론트 안정 실행 (데모/검수용)
# 사용법: .\scripts\start-frontend-stable.ps1

$ErrorActionPreference = "Stop"
$Frontend = Join-Path $PSScriptRoot "..\frontend"
Set-Location $Frontend

Write-Host "1) 3000 포트 프로세스 종료..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Write-Host "2) 프로덕션 빌드..." -ForegroundColor Cyan
npm run build

Write-Host "3) 프로덕션 서버 시작 (npm run start)..." -ForegroundColor Green
Write-Host "   http://localhost:3000" -ForegroundColor Yellow
Write-Host "   종료: Ctrl+C" -ForegroundColor DarkGray
npm run start
