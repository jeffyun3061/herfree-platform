# Herfree 프론트 dev 서버 — 3000 포트 고정 (중복 Next.js 자동 정리)
# 사용법: cd frontend && npm run dev

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Frontend = Join-Path $RepoRoot "frontend"

function Stop-HerfreeFrontendListeners {
    foreach ($port in @(3000, 3001)) {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($conn.OwningProcess)" -ErrorAction SilentlyContinue
            if ($null -eq $proc) { continue }

            $cmd = [string]$proc.CommandLine
            $isNext =
                $cmd -match 'next\\dist\\server\\lib\\start-server' -or
                $cmd -match 'next dev' -or
                $cmd -match 'herfree-platform[\\/]frontend'

            if ($isNext) {
                Write-Host "종료: PID $($conn.OwningProcess) (포트 $port)" -ForegroundColor Yellow
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "=== Herfree frontend dev (:3000) ===" -ForegroundColor Cyan
Stop-HerfreeFrontendListeners
Start-Sleep -Seconds 1

$blocked = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($blocked) {
    Write-Host ""
    Write-Host "[오류] 3000 포트가 다른 프로그램에 점유되어 있습니다." -ForegroundColor Red
    foreach ($conn in $blocked) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($conn.OwningProcess)" -ErrorAction SilentlyContinue
        Write-Host "  PID $($conn.OwningProcess): $($proc.CommandLine)" -ForegroundColor DarkYellow
    }
    Write-Host ""
    Write-Host "위 프로세스를 종료한 뒤 다시 npm run dev 를 실행하세요." -ForegroundColor Yellow
    exit 1
}

Set-Location $Frontend
Write-Host "시작: http://localhost:3000" -ForegroundColor Green
Write-Host "API 프록시: /api/* -> http://127.0.0.1:8080" -ForegroundColor DarkGray
Write-Host ""
npm run dev:next
