# Herfree ngrok demo — prints public URL clearly
# Usage:
#   .\scripts\ngrok-demo.ps1           # start ngrok in a new window (keep that window open)
#   .\scripts\ngrok-demo.ps1 -Foreground  # run ngrok in THIS terminal (Ctrl+C to stop)

param(
    [switch]$Foreground
)

$ErrorActionPreference = "Stop"

try {
    chcp 65001 | Out-Null
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    # ignore encoding setup failures
}

Write-Host ""
Write-Host "=== Herfree ngrok demo ===" -ForegroundColor Cyan
Write-Host ""

function Test-PortListening([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Resolve-NgrokExe {
    $candidates = @(
        (Get-Command ngrok -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ngrok.exe",
        "$env:USERPROFILE\scoop\shims\ngrok.exe",
        "C:\Program Files\ngrok\ngrok.exe",
        "$env:LOCALAPPDATA\ngrok\ngrok.exe",
        "$env:USERPROFILE\Downloads\ngrok.exe",
        "$env:USERPROFILE\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }

    return $candidates | Select-Object -First 1
}

function Get-NgrokPublicUrl {
    try {
        $tunnels = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 3).tunnels
        return ($tunnels | Where-Object { $_.public_url -match '^https://' } | Select-Object -First 1).public_url
    } catch {
        return $null
    }
}

function Show-NgrokUrl([string]$Url) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " NGROK URL (share this):" -ForegroundColor Green
    Write-Host " $Url" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Local dashboard: http://127.0.0.1:4040" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Why ngrok stops working (localhost:3000 still works):" -ForegroundColor Cyan
    Write-Host "  - ngrok is a separate tunnel process, not part of Next.js." -ForegroundColor DarkGray
    Write-Host "  - When ngrok exits, the public URL dies immediately (ERR_NGROK_3200 / 404)." -ForegroundColor DarkGray
    Write-Host "  - Each restart gets a NEW URL on the free plan — old links/bookmarks will not work." -ForegroundColor DarkGray
    Write-Host "  - Closing the ngrok window, reboot, sleep, or killing the process stops the tunnel." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Keep it alive:" -ForegroundColor Yellow
    Write-Host "  - Leave the ngrok window open, OR run in a dedicated terminal:" -ForegroundColor DarkGray
    Write-Host "      ngrok http 3000" -ForegroundColor White
    Write-Host "  - To re-check URL later: http://127.0.0.1:4040 or run this script again." -ForegroundColor DarkGray
    Write-Host ""
}

$checks = @(
    @{ Name = "MySQL (Docker)"; Ok = [bool](docker ps --format "{{.Names}}" 2>$null | Select-String "herfree-mysql") }
    @{ Name = "Backend :8080"; Ok = (Test-PortListening 8080) }
    @{ Name = "Frontend :3000"; Ok = (Test-PortListening 3000) }
)

if ((Test-PortListening 3001) -and -not (Test-PortListening 3000)) {
    Write-Host "  [!!] Frontend is on 3001 only. Run: cd frontend; npm run dev" -ForegroundColor Red
}

foreach ($c in $checks) {
    if ($c.Ok) {
        Write-Host ("  [OK] " + $c.Name) -ForegroundColor Green
    } else {
        Write-Host ("  [!!] " + $c.Name + " — start this first") -ForegroundColor Red
    }
}

if (($checks | Where-Object { -not $_.Ok }).Count -gt 0) {
    Write-Host ""
    Write-Host "Start services first, then run this script again." -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.local.yml up -d" -ForegroundColor DarkGray
    Write-Host "  cd backend; .\gradlew bootRun" -ForegroundColor DarkGray
    Write-Host "  cd frontend; npm run dev" -ForegroundColor DarkGray
    exit 1
}

Write-Host ""
Write-Host "Local stack ready." -ForegroundColor Green

$existingUrl = Get-NgrokPublicUrl
if ($existingUrl) {
    Write-Host "ngrok is already running." -ForegroundColor Cyan
    Show-NgrokUrl $existingUrl
    exit 0
}

$ngrokExe = Resolve-NgrokExe
if (-not $ngrokExe) {
    Write-Host ""
    Write-Host "ngrok.exe not found." -ForegroundColor Red
    Write-Host "Download: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "Or place ngrok.exe in Downloads folder." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting ngrok -> http://localhost:3000" -ForegroundColor Cyan
Write-Host "Using: $ngrokExe" -ForegroundColor DarkGray

if ($Foreground) {
    Write-Host ""
    Write-Host "Running in this terminal. Press Ctrl+C to stop the tunnel." -ForegroundColor Yellow
    Write-Host ""
    & $ngrokExe http 3000
    exit $LASTEXITCODE
}

Start-Process -FilePath $ngrokExe -ArgumentList @("http", "3000") -WindowStyle Normal
Write-Host ""
Write-Host "A separate ngrok window was opened — do NOT close it while testing on your phone." -ForegroundColor Yellow

$publicUrl = $null
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    $publicUrl = Get-NgrokPublicUrl
    if ($publicUrl) { break }
}

if (-not $publicUrl) {
    Write-Host ""
    Write-Host "ngrok started but URL not ready yet." -ForegroundColor Yellow
    Write-Host "Open http://127.0.0.1:4040 in browser to see the URL." -ForegroundColor Yellow
    exit 1
}

Show-NgrokUrl $publicUrl
