# Herfree ngrok demo — prints public URL clearly
# Usage: .\scripts\ngrok-demo.ps1

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
    Write-Host "Stop ngrok: close its window or Ctrl+C in that terminal" -ForegroundColor DarkGray
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

Start-Process -FilePath $ngrokExe -ArgumentList @("http", "3000") -WindowStyle Normal

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
