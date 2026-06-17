# Herfree 모바일 데모용 ngrok 안내 스크립트
# 사용법: PowerShell에서 .\scripts\ngrok-demo.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Herfree ngrok 데모 ===" -ForegroundColor Cyan
Write-Host ""

function Test-PortListening([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

$checks = @(
    @{ Name = "MySQL (Docker)"; Ok = (docker ps --format "{{.Names}}" 2>$null | Select-String "herfree-mysql") }
    @{ Name = "백엔드 :8080"; Ok = (Test-PortListening 8080) }
    @{ Name = "프론트 :3000"; Ok = (Test-PortListening 3000) }
)

foreach ($c in $checks) {
    if ($c.Ok) {
        Write-Host ("  [OK] " + $c.Name) -ForegroundColor Green
    } else {
        Write-Host ("  [!!] " + $c.Name + " — 먼저 실행 필요") -ForegroundColor Red
    }
}

$allOk = ($checks | Where-Object { -not $_.Ok }).Count -eq 0

Write-Host ""
if (-not $allOk) {
    Write-Host "아래를 각각 다른 터미널에서 실행하세요:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  cd C:\dev\herfree-platform"
    Write-Host "  docker compose -f docker-compose.local.yml up -d"
    Write-Host ""
    Write-Host "  cd C:\dev\herfree-platform\backend"
    Write-Host "  .\gradlew bootRun"
    Write-Host ""
    Write-Host "  cd C:\dev\herfree-platform\frontend"
    Write-Host "  npm run dev"
    Write-Host ""
    Write-Host "준비되면 이 스크립트를 다시 실행하세요."
    exit 1
}

Write-Host "로컬 서비스 준비 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "이제 ngrok 터미널에서 딱 이 명령만 실행:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ngrok http 3000" -ForegroundColor White
Write-Host ""
Write-Host "폰에서 ngrok https 주소로 접속 (localhost 말고!)" -ForegroundColor Yellow
Write-Host "백엔드+프론트 둘 다 PC에서 실행 중이어야 합니다." -ForegroundColor Yellow
Write-Host "주의: ngrok http 80  (X) — 502 에러 남" -ForegroundColor Red
Write-Host "      ngrok http 3000 (O) — 이게 맞음" -ForegroundColor Green
Write-Host ""
Write-Host "나오는 https://....ngrok-free.dev 주소를" -ForegroundColor Yellow
Write-Host "클라이언트/폰에 그대로내면 됩니다." -ForegroundColor Yellow
Write-Host ""
Write-Host "API는 따로 안 열어도 됨 (Next.js가 /api 를 백엔드로 연결)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "브라우저에서 로컬 확인:" -ForegroundColor DarkGray
Write-Host "  http://localhost:3000"
Write-Host ""

if (Get-Command ngrok -ErrorAction SilentlyContinue) {
    Write-Host "ngrok을 지금 이 창에서 실행합니다... (종료: Ctrl+C)" -ForegroundColor Cyan
    Write-Host ""
    ngrok http 3000
} else {
    Write-Host "이 PowerShell에는 ngrok이 PATH에 없습니다." -ForegroundColor Yellow
    Write-Host "ngrok 되는 터미널에서 위 명령을 직접 실행하세요." -ForegroundColor Yellow
}
