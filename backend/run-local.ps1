# 로컬 백엔드 실행 — MySQL·8080 확인 후 bootRun
# 사용: cd backend && .\run-local.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Assert-DockerReady {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker CLI를 찾을 수 없습니다. Docker Desktop을 설치하고 다시 실행해 주세요."
    }

    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop이 실행 중이지 않습니다. Docker Desktop을 켠 뒤 다시 실행해 주세요."
    }
}

function Ensure-LocalMysql {
    $composeFile = Join-Path $PSScriptRoot "..\docker-compose.local.yml"
    if (-not (Test-Path $composeFile)) {
        Write-Host "[WARN] docker-compose.local.yml not found — skip MySQL auto-start"
        return
    }

    $healthy = $false
    try {
        $status = docker inspect --format='{{.State.Health.Status}}' herfree-mysql 2>$null
        if ($status -eq "healthy") { $healthy = $true }
    } catch { }

    if (-not $healthy) {
        Write-Host "Starting local MySQL (docker compose)..."
        Push-Location (Split-Path $composeFile -Parent)
        docker compose -f docker-compose.local.yml up -d
        if ($LASTEXITCODE -ne 0) {
            Pop-Location
            throw "로컬 MySQL 컨테이너를 시작하지 못했습니다. Docker Desktop 상태를 확인해 주세요."
        }
        Pop-Location
        Write-Host "Waiting for MySQL healthcheck..."
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 2
            $status = docker inspect --format='{{.State.Health.Status}}' herfree-mysql 2>$null
            if ($status -eq "healthy") {
                Write-Host "MySQL is healthy."
                return
            }
        }
        Write-Host "[WARN] MySQL may still be starting — bootRun can fail with Communications link failure"
    } else {
        Write-Host "MySQL already running (healthy)."
    }
}

function Assert-NoFlywayFailures {
    # 컨테이너 환경변수를 사용해 비밀번호가 명령줄과 경고 로그에 노출되지 않게 한다.
    $mysqlCommand = 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names'
    $query = 'SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0;'
    $previousErrorActionPreference = $ErrorActionPreference

    try {
        # 네이티브 명령의 stderr 경고와 실제 종료 실패를 구분하기 위해 종료 코드를 직접 확인한다.
        $ErrorActionPreference = "Continue"
        $output = $query | docker exec -i herfree-mysql sh -c $mysqlCommand 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    $outputText = (@($output) | ForEach-Object { "$_" }) -join [Environment]::NewLine
    if ($exitCode -ne 0) {
        throw "Flyway 상태 확인 실패: $($outputText.Trim())"
    }

    $failed = 0
    if (-not [int]::TryParse($outputText.Trim(), [ref]$failed)) {
        throw "Flyway 상태 확인 결과를 해석할 수 없습니다: $($outputText.Trim())"
    }

    if ($failed -gt 0) {
        throw "실패한 Flyway 이력이 $failed 건 있습니다. 원인을 확인한 뒤 수동으로 repair해 주세요."
    }

    Write-Host "Flyway migration history is clean."
}

function Stop-ListenerOnPort([int]$Port) {
    $pids = [System.Collections.Generic.HashSet[int]]::new()

    try {
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { [void]$pids.Add($_.OwningProcess) }
    } catch {
        # Get-NetTCPConnection unavailable on some environments
    }

    if ($pids.Count -eq 0) {
        netstat -ano | Select-String ":$Port\s+.*LISTENING" | ForEach-Object {
            $parts = ($_ -split '\s+') | Where-Object { $_ -ne '' }
            if ($parts.Length -ge 1) {
                $procId = 0
                if ([int]::TryParse($parts[-1], [ref]$procId) -and $procId -gt 0) {
                    [void]$pids.Add($procId)
                }
            }
        }
    }

    foreach ($procId in $pids) {
        if ($procId -le 0) { continue }
        try {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Stopping port $Port listener: $($proc.ProcessName) (PID $procId)"
                Stop-Process -Id $procId -Force
            }
        } catch {
            Write-Host "Could not stop PID $procId : $($_.Exception.Message)"
        }
    }

    if ($pids.Count -gt 0) {
        Start-Sleep -Seconds 2
    }
}

Assert-DockerReady
Ensure-LocalMysql
Assert-NoFlywayFailures

Stop-ListenerOnPort -Port 8080

if (-not (Test-Path "./local-secrets.yml")) {
    Write-Host ""
    Write-Host "[WARN] backend/local-secrets.yml not found."
    Write-Host "       copy local-secrets.yml.example -> local-secrets.yml"
    Write-Host "       (사진 업로드 테스트 시 S3 키 필요)"
    Write-Host ""
}

Write-Host "Starting Spring Boot on http://localhost:8080 ..."
./gradlew bootRun --no-daemon
