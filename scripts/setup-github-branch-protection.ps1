# GitHub branch protection for main + develop (run after CI job names are stable).
#
# Requires: gh auth login (repo admin)
# Usage:
#   .\scripts\setup-github-branch-protection.ps1
#   .\scripts\setup-github-branch-protection.ps1 -DryRun

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$owner = "jeffyun3061"
$repo = "herfree-platform"

function Set-BranchProtection {
    param(
        [string]$Branch,
        [bool]$Strict
    )

    Write-Host "Branch: $Branch (require up-to-date with base: $Strict)"
    if ($DryRun) {
        Write-Host "[DryRun] would protect $Branch with checks: secret-scan, backend, frontend"
        return
    }

    $body = @{
        required_status_checks = @{
            strict   = $Strict
            contexts = @("secret-scan", "backend", "frontend")
        }
        enforce_admins = $false
        required_pull_request_reviews = @{
            required_approving_review_count = 0
            dismiss_stale_reviews           = $false
            require_code_owner_reviews      = $false
            require_last_push_approval      = $false
        }
        restrictions                     = $null
        required_linear_history          = $true
        allow_force_pushes               = $false
        allow_deletions                  = $false
        required_conversation_resolution = $true
    }
    $temp = Join-Path $env:TEMP "herfree-$Branch-protection.json"
    try {
        [System.IO.File]::WriteAllText(
            $temp,
            ($body | ConvertTo-Json -Depth 8),
            (New-Object System.Text.UTF8Encoding($false))
        )
        gh api -X PUT "repos/$owner/$repo/branches/$Branch/protection" --input $temp | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to protect $Branch"
        }
    }
    finally {
        Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    }

    Write-Host "[OK] $Branch protected"
}

Write-Host "=== GitHub branch protection ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Meaning:"
Write-Host "  - main/develop cannot receive direct push (must use Pull Request)"
Write-Host "  - backend + frontend CI must pass before merge"
Write-Host "  - Solo dev: 0 reviewers = you open PR and merge yourself"
Write-Host "  - NOT deleting or freezing the repo; feature/* branches still work"
Write-Host ""

Set-BranchProtection -Branch "main" -Strict $true
Set-BranchProtection -Branch "develop" -Strict $false

Write-Host ""
Write-Host "Verify: https://github.com/$owner/$repo/settings/branches"
