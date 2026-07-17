# Sync develop branch with main and optionally push to origin.
#
# Usage:
#   .\scripts\setup-develop-branch.ps1
#   .\scripts\setup-develop-branch.ps1 -Push

param(
    [switch]$Push
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$current = git branch --show-current
if ($current -ne "main") {
    Write-Host "Checking out main (was: $current)"
    git checkout main
}

git pull origin main

if (git show-ref --verify --quiet refs/heads/develop) {
    Write-Host "Local develop exists; merging main"
    git checkout develop
    git merge main --no-edit
} else {
    Write-Host "Creating develop from main ($(git rev-parse --short main))"
    git branch develop main
    git checkout develop
}

Write-Host ""
Write-Host "develop HEAD = $(git rev-parse --short HEAD)"
Write-Host "Workflow: feature/* -> PR -> develop -> PR -> main -> Release backend"
Write-Host "Branch protection: docs/git-workflow.md"

if ($Push) {
    git push -u origin develop
    Write-Host "Pushed origin/develop"
} else {
    Write-Host ""
    Write-Host "Push when ready: git push -u origin develop"
    Write-Host "Or run: .\scripts\setup-develop-branch.ps1 -Push"
}

git checkout main
