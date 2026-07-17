# staging / GitHub Actions / AWS 배포 전 로컬에서 확인하는 검사
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
    Write-Host "[WARN] $Name — $Detail" -ForegroundColor Yellow
}

function Fail([string]$Name, [string]$Detail) {
    $failures.Add("${Name}: ${Detail}") | Out-Null
    Write-Host "[FAIL] $Name — $Detail" -ForegroundColor Red
}

Write-Host ""
Write-Host "== Herfree 배포 준비 검사 ==" -ForegroundColor Cyan
Write-Host "기준: docs/go-live-checklist.md 4~6절 + infra/workflow" -ForegroundColor DarkGray
Write-Host ""

# --- 저장소 / 워크플로 ---
$workflows = @(
    ".github/workflows/ci.yml",
    ".github/workflows/release-backend.yml",
    ".github/workflows/codeql.yml"
)
foreach ($wf in $workflows) {
    if (Test-Path (Join-Path $root $wf)) { Pass "워크플로 존재: $wf" }
    else { Fail "워크플로 누락" $wf }
}

foreach ($path in @(
    "infra/docker/Dockerfile.backend",
    "infra/scripts/deploy-release.sh",
    "infra/scripts/rollback-release.sh",
    ".env.staging.example",
    ".env.prod.example"
)) {
    if (Test-Path (Join-Path $root $path)) { Pass "인프라 파일: $path" }
    else { Fail "인프라 파일 누락" $path }
}

# --- Git 상태 ---
$dirty = git status --porcelain
if ([string]::IsNullOrWhiteSpace($dirty)) { Pass "Git working tree clean" }
else { Warn "Git 미커밋 변경" "배포 전 커밋·푸시 권장" }

$head = git rev-parse --short HEAD
Pass "현재 commit: $head"

# --- preflight ---
if (-not $SkipPreflight) {
    Write-Host ""
    Write-Host "== preflight 실행 ==" -ForegroundColor Cyan
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts/preflight-local.ps1")
    if ($LASTEXITCODE -eq 0) { Pass "preflight-local.ps1" }
    else { Fail "preflight-local.ps1" "exit $LASTEXITCODE" }
}

# --- Docker 이미지 빌드 (Release workflow와 동일 Dockerfile) ---
if (-not $SkipDocker) {
    Write-Host ""
    Write-Host "== Docker backend 이미지 빌드 ==" -ForegroundColor Cyan
    docker version *> $null
    if ($LASTEXITCODE -ne 0) {
        Fail "Docker" "docker CLI 없음 — Release workflow 로컬 검증 불가"
    }
    else {
        docker build --file infra/docker/Dockerfile.backend --tag "herfree-api:local-verify" .
        if ($LASTEXITCODE -eq 0) { Pass "Dockerfile.backend 빌드" }
        else { Fail "Dockerfile.backend 빌드" "release 이미지와 동일 경로 실패" }
    }
}

# --- GitHub CLI ---
Write-Host ""
Write-Host "== GitHub / AWS CLI ==" -ForegroundColor Cyan
$ghOk = $false
try {
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $ghOk = $true
        Pass "gh auth login"
        $remote = git remote get-url origin 2>$null
        if ($remote -match "github.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)") {
            Pass "origin remote: $remote"
        }
    }
}
catch { }

if (-not $ghOk) {
    Warn "gh auth" "미로그인 — `gh auth login` 후 Actions·Environment 확인 필요"
}

$awsOk = $false
try {
    aws sts get-caller-identity 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $awsOk = $true
        Pass "aws credentials"
    }
}
catch { }

if (-not $awsOk) {
    Warn "aws cli" "자격증명 없음 — ECR/EC2/SSM은 AWS 콘솔·IAM에서 1회 설정"
}

# --- Playwright E2E 목록 (CI와 동일) ---
Write-Host ""
Write-Host "== E2E 정의 ==" -ForegroundColor Cyan
Push-Location (Join-Path $root "frontend")
try {
    if (Test-Path node_modules) {
        npx playwright test --list 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Pass "Playwright 테스트 정의 (release.spec)" }
        else { Warn "Playwright" "npm ci 후 playwright install 필요할 수 있음" }
    }
    else {
        Warn "Playwright" "frontend/node_modules 없음 — preflight 또는 npm ci 후 재실행"
    }
}
finally {
    Pop-Location
}

# --- 요약 ---
Write-Host ""
Write-Host "== 요약 ==" -ForegroundColor Cyan
Write-Host "통과: $($passed.Count)  경고: $($warnings.Count)  실패: $($failures.Count)"
Write-Host ""

if ($warnings.Count -gt 0) {
    Write-Host "다음은 본인 PC/콘솔에서 진행:" -ForegroundColor Yellow
    Write-Host "  1. gh auth login"
    Write-Host "  2. GitHub Environments: staging, production + AWS_DEPLOY_ROLE_ARN"
    Write-Host "  3. Repository Variables: AWS_REGION, ECR_REPOSITORY, STAGING_INSTANCE_ID, STAGING_FRONTEND_URL ..."
    Write-Host "  4. EC2 /opt/herfree + .env.staging (chmod 600)"
    Write-Host "  5. Actions > Release backend > target=staging"
    Write-Host ""
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "로컬 코드·빌드 검증은 통과. AWS/GitHub 원격 설정 후 staging 배포 가능." -ForegroundColor Green
exit 0
