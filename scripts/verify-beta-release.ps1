param(
    [switch]$SkipHarness,
    [switch]$SkipCleanTree,
    [switch]$SkipDocker,
    [switch]$SkipAudit,
    [switch]$RunLocalSmoke,
    [switch]$RequireAdminSmoke,
    [switch]$RequireDockerIntegration,
    [string]$ReportPath = "artifacts/service-harness/beta-release.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$failures = [System.Collections.Generic.List[string]]::new()
$passes = [System.Collections.Generic.List[string]]::new()

function Pass([string]$Name) {
    $passes.Add($Name) | Out-Null
    Write-Host "[OK] $Name" -ForegroundColor Green
}

function Fail([string]$Name, [string]$Detail) {
    $failures.Add("${Name}: ${Detail}") | Out-Null
    Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red
}

Write-Host "== Herfree beta release gate ==" -ForegroundColor Cyan

if (-not $SkipCleanTree) {
    $dirty = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($dirty)) { Pass "Git working tree clean" }
    else { Fail "Git working tree" "commit the reviewed beta candidate before release" }
}

$requiredFiles = @(
    "docs/beta-release-control-plane.md",
    "docs/go-live-checklist.md",
    "docs/production-service-operations.md",
    "scripts/service-harness.ps1",
    "scripts/test-journal-api.ps1",
    "infra/scripts/deploy-release.sh",
    "infra/scripts/rollback-release.sh",
    "infra/scripts/validate-release-env.sh"
)
foreach ($path in $requiredFiles) {
    if (Test-Path (Join-Path $root $path)) { Pass "required file: $path" }
    else { Fail "required file" $path }
}

$featureFlags = Get-Content -LiteralPath "frontend/src/domain/featureFlags.ts" -Raw
if ($featureFlags -match "FEATURE_PRODUCTS_ENABLED\s*=\s*false") {
    Pass "product curation UI remains disabled for beta"
} else {
    Fail "product curation UI" "FEATURE_PRODUCTS_ENABLED must remain false"
}

$consultPage = Get-Content -LiteralPath "frontend/src/components/consult/ConsultIntroPage.tsx" -Raw
if ($consultPage -match "KAKAO_CONSULT_URL" -and
    $consultPage -notmatch "1:1|100%") {
    Pass "consult flow is service inquiry only"
} else {
    Fail "consult flow" "remove legacy 1:1/absolute-privacy marketing copy"
}

$privateBoard = Get-Content -LiteralPath "frontend/src/domain/board/privateBoard.ts" -Raw
if ($privateBoard -match "PRIVATE_CONSULT" -and
    $privateBoard -match "writeLabel") {
    Pass "private board is labeled and constrained as inquiry"
} else {
    Fail "private board copy" "private inquiry metadata is missing"
}

$alignmentArgs = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
    (Join-Path $root "scripts/verify-legal-policy-alignment.ps1")
)
powershell.exe @alignmentArgs
if ($LASTEXITCODE -eq 0) { Pass "public operator contact and free beta boundary" }
else { Fail "public operator/legal wording" "run the legal/data-flow alignment report and fix the reported mismatch" }

$application = Get-Content -LiteralPath "backend/src/main/resources/application.yml" -Raw
if ($application -match "ANALYTICS_HASH_SALT" -and
    $application -match "HEALTH_DATA_ENCRYPTION_KEY") {
    Pass "health-data encryption and analytics separation are configured"
} else {
    Fail "runtime policy" "health data encryption or analytics salt wiring is missing"
}

if (-not $SkipHarness) {
    $harnessArgs = @(
        "-File", (Join-Path $root "scripts/service-harness.ps1"),
        "-ReportPath", $ReportPath
    )
    if ($SkipDocker) { $harnessArgs += "-SkipDocker" }
    if ($SkipAudit) { $harnessArgs += "-SkipAudit" }
    if ($RunLocalSmoke) { $harnessArgs += "-RunLocalSmoke" }
    if ($RequireAdminSmoke) { $harnessArgs += "-RequireAdminSmoke" }
    if ($RequireDockerIntegration) { $harnessArgs += "-RequireDockerIntegration" }
    powershell.exe -NoProfile -ExecutionPolicy Bypass @harnessArgs
    if ($LASTEXITCODE -eq 0) { Pass "service harness" }
    else { Fail "service harness" "see $ReportPath" }
}

$reportFile = Join-Path $root $ReportPath
$reportDir = Split-Path -Parent $reportFile
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Herfree beta release gate")
$lines.Add("")
$lines.Add("- Generated (UTC): $((Get-Date).ToUniversalTime().ToString('o'))")
$lines.Add("- Result: **$(if ($failures.Count -eq 0) { 'PASS' } else { 'FAIL' })**")
$lines.Add("")
$lines.Add("## Passed")
$lines.Add("")
foreach ($item in $passes) { $lines.Add("- [x] $item") }
$lines.Add("")
$lines.Add("## Failures")
$lines.Add("")
if ($failures.Count -eq 0) { $lines.Add("- None") }
else { foreach ($item in $failures) { $lines.Add("- [ ] $item") } }
$lines.Add("")
$lines.Add("Legal wording can change later, but actual behavior and user-facing notices must remain consistent.")
Set-Content -LiteralPath $reportFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

Write-Host "Report: $reportFile" -ForegroundColor DarkGray
if ($failures.Count -gt 0) { exit 1 }
Write-Host "Beta release gate passed. Run the AWS/staging external gates before public access." -ForegroundColor Green
exit 0
