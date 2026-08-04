param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipDocker,
    [switch]$SkipAudit,
    [switch]$RunLocalSmoke,
    [switch]$RequireAdminSmoke,
    [switch]$RunBrowserSmoke,
    [switch]$RunProductionOpsAudit,
    [switch]$RequireDockerIntegration,
    [string]$ReportPath = "artifacts/service-harness/latest.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$results = [System.Collections.Generic.List[object]]::new()
$startedAt = (Get-Date).ToUniversalTime()

function Invoke-HarnessStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [switch]$Optional
    )

    Write-Host "== $Name ==" -ForegroundColor Cyan
    $output = @()
    $exitCode = 0
    $global:LASTEXITCODE = 0
    try {
        # Capture the native command status before formatting output through a
        # PowerShell pipeline; the pipeline can otherwise overwrite LASTEXITCODE.
        $rawOutput = @(& $Action 2>&1)
        $nativeExitCode = $LASTEXITCODE
        $output = @($rawOutput | ForEach-Object { $_.ToString() })
        if ($nativeExitCode -ne $null) { $exitCode = $nativeExitCode }
    } catch {
        $output += $_.Exception.Message
        $exitCode = 1
    }

    $passed = $exitCode -eq 0
    $status = if ($passed) { "PASS" } elseif ($Optional) { "WARN" } else { "FAIL" }
    $results.Add([pscustomobject]@{
            Name = $Name
            Status = $status
            ExitCode = $exitCode
            Output = ($output -join [Environment]::NewLine)
        })
    Write-Host "[$status] $Name" -ForegroundColor $(if ($passed) { "Green" } elseif ($Optional) { "Yellow" } else { "Red" })
    if (-not $passed -and -not $Optional) {
        $output | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor DarkRed }
    }
}

Invoke-HarnessStep "Whitespace and conflict markers" { cmd.exe /d /c "git diff --check >nul 2>nul" }
Invoke-HarnessStep "Secret scan (tracked and untracked)" { node scripts/check-secrets.mjs --all }
Invoke-HarnessStep "Sensitive logging scan" { node scripts/check-sensitive-logging.mjs }
Invoke-HarnessStep "Production secret isolation" {
    $forbidden = @(rg -n "herfree/staging/(app-config|db-app|smtp)" scripts/setup-production-aws.ps1 2>$null)
    if ($forbidden.Count -gt 0) {
        throw "production setup must not copy staging Secrets Manager values"
    }
    $goLiveScript = Get-Content -LiteralPath "scripts/go-live-production.ps1" -Raw
    if ($goLiveScript -notmatch "check-staging-status\.ps1.*-Strict") {
        throw "production go-live must stop when staging has blocking checks"
    }
    $rollbackScript = Get-Content -LiteralPath "infra/scripts/rollback-release.sh" -Raw
    if ($rollbackScript -notmatch "deploy-release\.sh.*rollback") {
        throw "rollback wrapper must invoke deploy-release.sh in rollback mode"
    }
    $productionSetupScript = Get-Content -LiteralPath "scripts/setup-production-aws.ps1" -Raw
    if ($productionSetupScript -notmatch "put-bucket-encryption" -or
        $productionSetupScript -notmatch "put-public-access-block") {
        throw "production setup must enforce S3 encryption and public-access blocking"
    }
    if ($productionSetupScript -notmatch "put-retention-policy") {
        throw "production setup must enforce CloudWatch retention"
    }
    $restoreDrillScript = Get-Content -LiteralPath "infra/scripts/restore-rds-drill.sh" -Raw
    if ($restoreDrillScript -notmatch "CONFIRM_RESTORE_DRILL.*YES" -or
        $restoreDrillScript -notmatch "--no-publicly-accessible" -or
        $restoreDrillScript -notmatch "delete-db-instance") {
        throw "RDS restore drill must require approval, private networking, and cleanup"
    }
    $releaseEnvValidator = Get-Content -LiteralPath "infra/scripts/validate-release-env.sh" -Raw
    if ($releaseEnvValidator -notmatch "static S3 credentials" -or
        $releaseEnvValidator -notmatch "HEALTH_DATA_REKEY_ON_STARTUP") {
        throw "release env validator must reject static S3 keys and production re-key startup"
    }
    if ($releaseEnvValidator -notmatch "ADMIN_ACCESS_ALLOWED_CIDRS" -or
        (Get-Content -LiteralPath "backend/src/main/java/com/herfree/global/security/SecurityConfig.java" -Raw) -notmatch "AdminAccessGateFilter") {
        throw "public admin endpoints must have a configured CIDR gate"
    }
    $global:LASTEXITCODE = 0
}

if (-not $SkipBackend) {
    Push-Location backend
    try {
        Invoke-HarnessStep "Backend compile and tests" {
            $previousErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            try {
                & .\gradlew.bat test --no-daemon
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Gradle wrapper failed once; retrying the same test command." -ForegroundColor Yellow
                    & .\gradlew.bat test --no-daemon
                }
            }
            finally {
                $ErrorActionPreference = $previousErrorActionPreference
            }
        }
    }
    finally { Pop-Location }
}

if ($RequireDockerIntegration) {
    Push-Location (Join-Path $root "backend")
    try {
        Invoke-HarnessStep "Docker-backed MySQL schema validation" {
            docker info *> $null
            if ($LASTEXITCODE -ne 0) { throw "Docker daemon is required for the MySQL Testcontainers gate" }
            $previousErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            try {
                & .\gradlew.bat test --tests com.herfree.schema.MySqlSchemaValidationIntegrationTest --no-daemon
            }
            finally {
                $ErrorActionPreference = $previousErrorActionPreference
            }
        }
    }
    finally { Pop-Location }
}

if (-not $SkipFrontend) {
    Push-Location frontend
    try {
        if (-not (Test-Path node_modules)) {
            Invoke-HarnessStep "Frontend dependency install" { npm.cmd ci }
        }
        Invoke-HarnessStep "Frontend security headers" { npm.cmd run check:security-headers }
        Invoke-HarnessStep "Frontend architecture boundaries" { npm.cmd run check:architecture }
        Invoke-HarnessStep "Frontend lint" { npm.cmd run lint }
        Invoke-HarnessStep "Frontend unit tests" { npm.cmd run test }
        $savedOauth = @{
            Origin = $env:NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN
            Required = $env:NEXT_PUBLIC_OAUTH_REQUIRED_PROVIDERS
            Kakao = $env:NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID
            Google = $env:NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID
            Naver = $env:NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID
        }
        try {
            $env:NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN = "http://localhost:3000"
            $env:NEXT_PUBLIC_OAUTH_REQUIRED_PROVIDERS = "kakao,google,naver"
            $env:NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID = "ci-kakao-client-id"
            $env:NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID = "ci-google-client-id.apps.googleusercontent.com"
            $env:NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID = "ci-naver-client-id"
            Invoke-HarnessStep "Frontend production build" { npm.cmd run build }
        } finally {
            $env:NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN = $savedOauth.Origin
            $env:NEXT_PUBLIC_OAUTH_REQUIRED_PROVIDERS = $savedOauth.Required
            $env:NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID = $savedOauth.Kakao
            $env:NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID = $savedOauth.Google
            $env:NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID = $savedOauth.Naver
        }
        if (-not $SkipAudit) {
            Invoke-HarnessStep "Frontend dependency audit" { npm.cmd audit --omit=dev --audit-level=high }
            Invoke-HarnessStep "Frontend development dependency critical audit" { npm.cmd audit --audit-level=critical }
        }
    } finally { Pop-Location }
}

if ($RunLocalSmoke) {
    Invoke-HarnessStep "Local API journal smoke" {
        $smokeArgs = @{}
        if ($RequireAdminSmoke) { $smokeArgs.RequireAdmin = $true }
        powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts/test-journal-api.ps1") @smokeArgs
    }
}

if ($RunBrowserSmoke) {
    Push-Location (Join-Path $root "frontend")
    try {
        Invoke-HarnessStep "Browser release smoke" { npm.cmd run e2e:staging:smoke }
    }
    finally { Pop-Location }
}

if ($RunProductionOpsAudit) {
    Invoke-HarnessStep "Production infrastructure audit" {
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts/check-production-ops.ps1") -Strict
    }
}

if (-not $SkipDocker) {
    # `docker compose config` is a static parser and does not require a
    # running daemon, so keep this gate useful on developer/CI workers where
    # the daemon is intentionally unavailable.
    Invoke-HarnessStep "Release compose syntax" {
        $env:API_IMAGE = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/herfree-api:0000000000000000000000000000000000000000"
        $env:APP_ENV_FILE = "frontend/.env.example"
        $env:AWS_REGION = "ap-northeast-2"
        $env:CLOUDWATCH_LOG_GROUP = "/herfree/harness"
        $env:DEPLOY_ENV = "staging"
        docker compose -f docker-compose.release.yml config --quiet
    }
}

$failed = @($results | Where-Object Status -eq "FAIL")
$warnings = @($results | Where-Object Status -eq "WARN")
$reportFile = Join-Path $root $ReportPath
$reportDir = Split-Path -Parent $reportFile
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Service harness report")
$lines.Add("")
$lines.Add("- Started (UTC): $($startedAt.ToString('o'))")
$lines.Add("- Finished (UTC): $((Get-Date).ToUniversalTime().ToString('o'))")
$lines.Add("- Result: **$(if ($failed.Count -eq 0) { 'PASS' } else { 'FAIL' })**")
$lines.Add("")
$lines.Add("| Check | Status | Exit |")
$lines.Add("| --- | --- | ---: |")
foreach ($result in $results) { $lines.Add("| $($result.Name) | $($result.Status) | $($result.ExitCode) |") }
$lines.Add("")
$lines.Add("## Release interpretation")
$lines.Add("")
$lines.Add("자동 검증 PASS는 staging 배포 허가가 아니라 코드 게이트 통과를 뜻한다. 실제 secret, private RDS/S3, TLS, 백업 복원, 관리자 강한 인증, 개인정보·건강정보 운영 승인은 별도 증적이 필요하다.")
Set-Content -LiteralPath $reportFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

Write-Host ""
Write-Host "Service harness: failed=$($failed.Count), warnings=$($warnings.Count)" -ForegroundColor $(if ($failed.Count -eq 0) { "Green" } else { "Red" })
Write-Host "Report: $reportFile" -ForegroundColor DarkGray
if ($failed.Count -gt 0) { exit 1 }
