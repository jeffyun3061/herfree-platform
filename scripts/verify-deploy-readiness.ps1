param(
    [switch]$SkipPreflight,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$passed = New-Object System.Collections.Generic.List[string]

function Pass([string]$Name) {
    $passed.Add($Name) | Out-Null
    Write-Host "[OK] $Name" -ForegroundColor Green
}

function Warn([string]$Name, [string]$Detail) {
    $warnings.Add("${Name}: ${Detail}") | Out-Null
    Write-Host "[WARN] $Name - $Detail" -ForegroundColor Yellow
}

function Fail([string]$Name, [string]$Detail) {
    $failures.Add("${Name}: ${Detail}") | Out-Null
    Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red
}

Write-Host ""
Write-Host "== Herfree deployment readiness ==" -ForegroundColor Cyan

$requiredFiles = @(
    ".github/workflows/ci.yml",
    ".github/workflows/release-backend.yml",
    ".github/workflows/codeql.yml",
    "amplify.yml",
    "infra/docker/Dockerfile.backend",
    "infra/scripts/deploy-release.sh",
    "infra/scripts/rollback-release.sh",
    "infra/scripts/validate-release-env.sh",
    ".env.staging.example",
    ".env.prod.example"
)
foreach ($path in $requiredFiles) {
    if (Test-Path (Join-Path $root $path)) { Pass "file: $path" }
    else { Fail "missing file" $path }
}

$dirty = git status --porcelain
if ([string]::IsNullOrWhiteSpace($dirty)) { Pass "Git working tree clean" }
else { Warn "Git working tree dirty" "commit the reviewed deployment candidate before release" }
Pass "current commit: $(git rev-parse --short HEAD)"

if (-not $SkipPreflight) {
    Write-Host ""
    Write-Host "== Local preflight ==" -ForegroundColor Cyan
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts/preflight-local.ps1")
    if ($LASTEXITCODE -eq 0) { Pass "preflight-local.ps1" }
    else { Fail "preflight-local.ps1" "exit $LASTEXITCODE" }
}

if (-not $SkipDocker) {
    Write-Host ""
    Write-Host "== Backend container ==" -ForegroundColor Cyan
    docker version *> $null
    if ($LASTEXITCODE -ne 0) {
        Fail "Docker" "daemon unavailable"
    } else {
        docker build --file infra/docker/Dockerfile.backend --tag "herfree-api:local-verify" .
        if ($LASTEXITCODE -eq 0) { Pass "Dockerfile.backend build" }
        else { Fail "Dockerfile.backend build" "image build failed" }
    }
}

Write-Host ""
Write-Host "== GitHub and AWS identity ==" -ForegroundColor Cyan
gh auth status *> $null
if ($LASTEXITCODE -eq 0) { Pass "GitHub CLI authentication" }
else { Warn "GitHub CLI authentication" "run gh auth login -h github.com" }

aws sts get-caller-identity *> $null
if ($LASTEXITCODE -eq 0) { Pass "AWS credentials" }
else { Warn "AWS credentials" "configure an authorized deployment identity" }

Write-Host ""
Write-Host "== Summary ==" -ForegroundColor Cyan
Write-Host "passed=$($passed.Count) warnings=$($warnings.Count) failures=$($failures.Count)"

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

if ($warnings.Count -gt 0) {
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host "Local deployment structure is ready. External credentials and environment evidence are separate gates." -ForegroundColor Green
exit 0
