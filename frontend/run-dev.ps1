# 로컬 프론트 실행 — 3000 포트 점유 시 정리 후 npm run dev
# 사용: cd frontend && .\run-dev.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Port = 3000

function Get-PortListeners([int]$TargetPort) {
    $rows = @()
    $seen = @{}

    try {
        Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object {
                if (-not $seen.ContainsKey($_.OwningProcess)) {
                    $seen[$_.OwningProcess] = $true
                    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
                    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)" -ErrorAction SilentlyContinue).CommandLine
                    $rows += [PSCustomObject]@{
                        Port = $TargetPort
                        PID = $_.OwningProcess
                        Name = if ($proc) { $proc.ProcessName } else { 'unknown' }
                        CommandLine = $cmd
                    }
                }
            }
    } catch {
        netstat -ano | Select-String ":$TargetPort\s+.*LISTENING" | ForEach-Object {
            $parts = ($_ -split '\s+') | Where-Object { $_ -ne '' }
            $procId = [int]$parts[-1]
            if ($procId -gt 0 -and -not $seen.ContainsKey($procId)) {
                $seen[$procId] = $true
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue).CommandLine
                $rows += [PSCustomObject]@{
                    Port = $TargetPort
                    PID = $procId
                    Name = if ($proc) { $proc.ProcessName } else { 'unknown' }
                    CommandLine = $cmd
                }
            }
        }
    }

    return $rows
}

function Stop-PortListeners([int]$TargetPort) {
    $listeners = Get-PortListeners -TargetPort $TargetPort
    foreach ($item in $listeners) {
        Write-Host "[WARN] Port $TargetPort is already in use" -ForegroundColor Yellow
        Write-Host "       PID  : $($item.PID) ($($item.Name))" -ForegroundColor DarkYellow
        if ($item.CommandLine) {
            Write-Host "       CMD  : $($item.CommandLine)" -ForegroundColor DarkYellow
        }
        try {
            Stop-Process -Id $item.PID -Force
            Write-Host "       -> stopped" -ForegroundColor Green
        } catch {
            Write-Host "       -> failed: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    }
    if ($listeners.Count -gt 0) {
        Start-Sleep -Seconds 2
    }
}

Stop-PortListeners -TargetPort $Port

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..."
    npm install
}

Write-Host "Starting Next.js on http://localhost:$Port ..."
npm run dev
