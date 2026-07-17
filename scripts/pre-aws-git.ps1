# AWS staging 직전 Git 작업 (한 번 실행)
#
# Usage:
#   .\scripts\pre-aws-git.ps1
#   .\scripts\pre-aws-git.ps1 -Push

param(
    [switch]$Push
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host "=== Herfree pre-AWS Git checklist ===" -ForegroundColor Cyan

$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Host "[WARN] current branch is $branch (expected main for deploy baseline)"
}

$status = git status --porcelain
if ($status) {
    Write-Host "[FAIL] uncommitted changes:" -ForegroundColor Red
    Write-Host $status
    exit 1
}
Write-Host "[OK] working tree clean"

$ahead = git rev-list --count origin/main..main 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] cannot compare with origin/main (first push?)"
    $ahead = "?"
} elseif ([int]$ahead -gt 0) {
    Write-Host "[INFO] main is $ahead commit(s) ahead of origin/main"
} else {
    Write-Host "[OK] main synced with origin/main"
}

if (-not (git show-ref --verify --quiet refs/heads/develop)) {
    Write-Host "[INFO] creating develop from main"
    git branch develop main
}
$developSha = git rev-parse develop
$mainSha = git rev-parse main
if ($developSha -ne $mainSha) {
    Write-Host "[INFO] syncing develop with main"
    git checkout develop
    git merge main --no-edit
    git checkout main
} else {
    Write-Host "[OK] develop matches main ($mainSha.Substring(0,7))"
}

Write-Host ""
Write-Host "Next (manual on GitHub):"
Write-Host "  Settings -> Branches -> protect main + develop (CI: backend, frontend)"
Write-Host "  Settings -> Environments -> staging (+ AWS_DEPLOY_ROLE_ARN)"
Write-Host ""
Write-Host "After AWS EC2 ready:"
Write-Host "  Actions -> Release backend -> target=staging"
Write-Host ""
Write-Host "Docs: docs/go-live-checklist.md section 4-B"

if ($Push) {
    Write-Host ""
    Write-Host "Pushing main and develop..." -ForegroundColor Cyan
    git push origin main
    git push -u origin develop
    Write-Host "[OK] push complete. Watch CI: gh run watch -R jeffyun3061/herfree-platform"
} else {
    Write-Host ""
    Write-Host "Push when ready:"
    Write-Host "  .\scripts\pre-aws-git.ps1 -Push"
    Write-Host "  or: git push origin main; git push -u origin develop"
}
